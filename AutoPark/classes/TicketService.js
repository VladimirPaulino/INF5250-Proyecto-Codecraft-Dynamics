const BaseService = require('./BaseService')
const { ConflictError, ValidationError, NotFoundError } = require('./errors')
const { aDatetime, parsearFecha } = require('./dateUtils')
const { calcularTarifa } = require('./TarifaService')
const { validarPlaca } = require('./placaUtils')

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

    const vehiculo = await this.db('vehiculos').where('id', vehiculo_id).first()
    if (!vehiculo) throw new NotFoundError('Vehiculo')

    const abierto = await this.query()
      .where({ vehiculo_id })
      .whereNull('fecha_hora_salida')
      .first()
    if (abierto) {
      throw new ConflictError('ya tiene un ticket abierto')
    }

    return this.create({
      vehiculo_id,
      fecha_hora_entrada,
      fecha_hora_salida: fecha_hora_salida || null,
      total_pagar: total_pagar || 0,
      status_de_pago: status_de_pago || 'pendiente'
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

      const [ticketId] = await trx('tickets').insert({
        vehiculo_id: vehiculo.id,
        fecha_hora_entrada: aDatetime(entrada),
        fecha_hora_salida: null,
        total_pagar: 0,
        status_de_pago: 'pendiente'
      })

      return { ticket_id: ticketId, vehiculo_id: vehiculo.id }
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
      const { horas, monto } = calcularTarifa(ticket.fecha_hora_entrada, salida, vehiculo?.tipo)

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

      return {
        ticket_id: ticket.id,
        pago_id: pagoId,
        total_pagar: monto,
        horas,
        placa: vehiculo?.placa,
        tipo: vehiculo?.tipo
      }
    })
  }

  async cotizarSalida({ ticket_id, placa }) {
    let ticket = null
    let vehiculo = null

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
    const tarifa = calcularTarifa(ticket.fecha_hora_entrada, ahora, vehiculo?.tipo)
    return {
      ticket_id: ticket.id,
      vehiculo_id: ticket.vehiculo_id,
      placa: vehiculo?.placa,
      tipo: vehiculo?.tipo,
      fecha_hora_entrada: ticket.fecha_hora_entrada,
      ...tarifa
    }
  }
}

module.exports = TicketService
