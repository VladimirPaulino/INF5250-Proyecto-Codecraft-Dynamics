const BaseService = require('./BaseService')
const { ConflictError, ValidationError, NotFoundError } = require('./errors')
const { aDatetime, parsearFecha } = require('./dateUtils')
const { calcularTarifa, obtenerTarifaActiva } = require('./TarifaService')
const { validarPlaca } = require('./placaUtils')
const SeccionParqueoService = require('./SeccionParqueoService')
const NotificacionService = require('./NotificacionService')
const AuditLogService = require('./AuditLogService')

const TIPOS_VEHICULO = ['carro', 'motocicleta']

class TicketService extends BaseService {
  constructor(db) {
    super(db, 'tickets', 'Ticket')
  }

  async createFromBody(body) {
    // Compatibilidad: si envían placa, usar el flujo seguro de entrada.
    if (body.placa) {
      const result = await this.registrarEntrada(body)
      return result.ticket_id
    }

    const { vehiculo_id, fecha_hora_entrada, fecha_hora_salida, total_pagar, status_de_pago } = body
    this.requireFields(body, ['vehiculo_id', 'fecha_hora_entrada'])

    return this.db.transaction(async (trx) => {
      const vehiculo = await trx('vehiculos').where('id', vehiculo_id).forUpdate().first()
      if (!vehiculo) throw new NotFoundError('Vehiculo')

      const abierto = await trx('tickets')
        .where({ vehiculo_id })
        .whereNull('fecha_hora_salida')
        .forUpdate()
        .first()
      if (abierto) {
        throw new ConflictError('ya tiene un ticket abierto')
      }

      // M9: un ticket abierto también ocupa un puesto por esta vía.
      const seccion = fecha_hora_salida ? null : await SeccionParqueoService.ocupar(trx, vehiculo.id)
      const [id] = await trx('tickets').insert({
        vehiculo_id,
        seccion_id: seccion ? seccion.id : null,
        fecha_hora_entrada,
        fecha_hora_salida: fecha_hora_salida || null,
        total_pagar: total_pagar || 0,
        status_de_pago: status_de_pago || 'pendiente'
      })
      await AuditLogService.registrar(trx, body.usuario_id, 'ticket.crear', {
        ticket_id: id, vehiculo_id, seccion_id: seccion ? seccion.id : null
      })
      return id
    })
  }

  async updateFromBody(id, body) {
    const { vehiculo_id, fecha_hora_entrada, fecha_hora_salida, total_pagar, status_de_pago } = body
    return this.update(id, {
      vehiculo_id,
      fecha_hora_entrada,
      fecha_hora_salida,
      total_pagar,
      status_de_pago
    })
  }

  /**
   * Registra la entrada de un vehículo (RF-18, RF-20, RF-21).
   * Siempre corre en transacción para que FOR UPDATE sea efectivo.
   */
  async registrarEntrada({ placa, tipo, usuario_id, fecha_hora_entrada }, trxExterna = null) {
    const ejecutar = async (trx) => {
      const placaNormalizada = validarPlaca(placa)
      const tipoVehiculo = TIPOS_VEHICULO.includes(tipo) ? tipo : 'carro'
      const entrada = parsearFecha(fecha_hora_entrada) || new Date()

      if (!usuario_id) {
        throw new ValidationError('Debe iniciar sesión para registrar la entrada')
      }

      let vehiculo = await trx('vehiculos').where('placa', placaNormalizada).forUpdate().first()
      if (!vehiculo) {
        try {
          const [vehiculoId] = await trx('vehiculos').insert({
            usuario_id,
            placa: placaNormalizada,
            tipo: tipoVehiculo
          })
          vehiculo = { id: vehiculoId, tipo: tipoVehiculo }
        } catch (err) {
          // Carrera: otra petición insertó la misma placa
          if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) {
            vehiculo = await trx('vehiculos').where('placa', placaNormalizada).forUpdate().first()
          } else if (err && err.code === 'ER_NO_REFERENCED_ROW_2') {
            throw new ValidationError('usuario_id inválido; inicie sesión de nuevo')
          } else {
            throw err
          }
        }
      }

      if (!vehiculo) {
        throw new ConflictError(`No se pudo registrar el vehículo con placa ${placaNormalizada}`)
      }

      // Bloquea filas de tickets abiertos de este vehículo (RF-21).
      const abierto = await trx('tickets')
        .where({ vehiculo_id: vehiculo.id })
        .whereNull('fecha_hora_salida')
        .forUpdate()
        .first()
      if (abierto) {
        throw new ConflictError('ya tiene un ticket abierto')
      }

      // M9 · RF-59: la entrada ocupa un puesto libre.
      const seccion = await SeccionParqueoService.ocupar(trx, vehiculo.id)

      const [ticketId] = await trx('tickets').insert({
        vehiculo_id: vehiculo.id,
        seccion_id: seccion.id,
        fecha_hora_entrada: aDatetime(entrada),
        fecha_hora_salida: null,
        total_pagar: 0,
        status_de_pago: 'pendiente'
      })

      // M11 · RF-60 y M12 · RF-61
      await NotificacionService.notificar(
        trx, usuario_id,
        `Entrada registrada: ${placaNormalizada} en el puesto ${seccion.codigo || seccion.id} (ticket #${ticketId})`
      )
      await AuditLogService.registrar(trx, usuario_id, 'ticket.crear', {
        ticket_id: ticketId, placa: placaNormalizada, seccion_id: seccion.id
      })

      return { ticket_id: ticketId, vehiculo_id: vehiculo.id, seccion_id: seccion.id }
    }

    if (trxExterna) return ejecutar(trxExterna)
    return this.db.transaction(ejecutar)
  }

  /**
   * Cierra el ticket y registra el pago en una sola transacción.
   */
  async registrarSalida({ ticket_id, placa, usuario_id, fecha_hora_salida }) {
    return this.db.transaction(async (trx) => {
      let ticket = null
      if (ticket_id) {
        ticket = await trx('tickets').where('id', ticket_id).forUpdate().first()
      } else if (placa) {
        const vehiculo = await trx('vehiculos').where('placa', validarPlaca(placa)).first()
        if (!vehiculo) throw new NotFoundError('Vehiculo')
        ticket = await trx('tickets')
          .where({ vehiculo_id: vehiculo.id })
          .whereNull('fecha_hora_salida')
          .forUpdate()
          .first()
      }

      if (!ticket) throw new NotFoundError('Ticket abierto')
      if (ticket.fecha_hora_salida) {
        throw new ConflictError('Este ticket ya tiene salida registrada')
      }

      const vehiculo = await trx('vehiculos').where('id', ticket.vehiculo_id).first()
      const salida = parsearFecha(fecha_hora_salida) || new Date()
      // M10 · RF-26 a RF-28: tarifa activa del catálogo o la regla por defecto.
      const tarifaActiva = await obtenerTarifaActiva(trx, vehiculo?.tipo)
      const cobro = calcularTarifa(ticket.fecha_hora_entrada, salida, vehiculo?.tipo, tarifaActiva)
      const { horas, monto } = cobro

      await trx('tickets').where('id', ticket.id).update({
        fecha_hora_salida: aDatetime(salida),
        total_pagar: monto,
        status_de_pago: 'pagado'
      })

      const pagoUsuario = usuario_id || vehiculo?.usuario_id
      if (!pagoUsuario) {
        throw new ValidationError('usuario_id es obligatorio para registrar el pago')
      }

      const pagoExistente = await trx('pagos').where('ticket_id', ticket.id).first()
      let pagoId = pagoExistente?.id
      if (!pagoExistente) {
        const [id] = await trx('pagos').insert({
          usuario_id: pagoUsuario,
          ticket_id: ticket.id,
          monto,
          fecha_de_pago: aDatetime(salida)
        })
        pagoId = id
      }

      // M9 · RF-59: la salida libera el puesto.
      await SeccionParqueoService.liberar(trx, ticket.seccion_id)

      // M11 · RF-60 y M12 · RF-61
      await NotificacionService.notificar(
        trx, pagoUsuario,
        `Pago registrado: RD$ ${monto.toFixed(2)} por el ticket #${ticket.id} (${vehiculo?.placa || ''})`
      )
      await AuditLogService.registrar(trx, pagoUsuario, 'pago.registrar', {
        ticket_id: ticket.id, pago_id: pagoId, monto
      })

      return {
        ticket_id: ticket.id,
        pago_id: pagoId,
        total_pagar: monto,
        horas,
        minutos: cobro.minutos,
        detalle: cobro.detalle,
        placa: vehiculo?.placa,
        tipo: vehiculo?.tipo
      }
    })
  }

  async cotizarSalida({ ticket_id, placa }) {
    let ticket
    let vehiculo

    if (ticket_id) {
      ticket = await this.findById(ticket_id)
      vehiculo = await this.db('vehiculos').where('id', ticket.vehiculo_id).first()
    } else if (placa) {
      vehiculo = await this.db('vehiculos').where('placa', validarPlaca(placa)).first()
      if (!vehiculo) throw new NotFoundError('Vehiculo')
      ticket = await this.query()
        .where({ vehiculo_id: vehiculo.id })
        .whereNull('fecha_hora_salida')
        .first()
      if (!ticket) throw new NotFoundError('Ticket abierto')
    } else {
      throw new ValidationError('Indique ticket_id o placa')
    }

    if (ticket.fecha_hora_salida) {
      throw new ConflictError('Este ticket ya tiene salida registrada')
    }

    const ahora = new Date()
    const tarifaActiva = await obtenerTarifaActiva(this.db, vehiculo?.tipo)
    const tarifa = calcularTarifa(ticket.fecha_hora_entrada, ahora, vehiculo?.tipo, tarifaActiva)
    return {
      ticket_id: ticket.id,
      vehiculo_id: ticket.vehiculo_id,
      placa: vehiculo?.placa,
      tipo: vehiculo?.tipo,
      fecha_hora_entrada: ticket.fecha_hora_entrada,
      ...tarifa
    }
  }

  /** Anular un ticket: libera su puesto y queda en la bitácora (RF-59, RF-61). */
  async anular(id, actor = null) {
    return this.db.transaction(async (trx) => {
      const ticket = await trx('tickets').where('id', id).forUpdate().first()
      if (!ticket) throw new NotFoundError(this.entityName)
      if (ticket.fecha_hora_salida || ticket.status_de_pago === 'pagado') {
        throw new ConflictError('No se puede anular un ticket que ya tiene salida y pago')
      }
      await SeccionParqueoService.liberar(trx, ticket.seccion_id)
      await trx('reservaciones').where('ticket_id', ticket.id).update({ ticket_id: null })
      await trx('tickets').where('id', id).del()
      await AuditLogService.registrar(trx, actor?.id, 'ticket.anular', {
        ticket_id: ticket.id, vehiculo_id: ticket.vehiculo_id
      })
      return 1
    })
  }
}

module.exports = TicketService
