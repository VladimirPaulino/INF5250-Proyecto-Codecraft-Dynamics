const BaseService = require('./BaseService')
const TicketService = require('./TicketService')
const { ConflictError, NotFoundError, ValidationError } = require('./errors')
const { aDatetime, parsearFecha } = require('./dateUtils')
const { validarPlaca } = require('./placaUtils')

const DURACIONES = [1, 2, 4, 8]
const TIPOS = ['carro', 'motocicleta']
const ESTADOS = ['confirmada', 'completada', 'cancelada']
const GRACIA_LLEGADA_MS = 30 * 60 * 1000

const ESPACIO_DEFAULT = {
  name: 'AutoPark Principal',
  address: 'Campus UASD',
  // Cupo bajo para poder probar RF-41 manualmente (llenar el horario).
  espacio_total: 2,
  tiempo_abierto: 6,
  tiempo_cerrado: 22
}

class ReservacionService extends BaseService {
  constructor(db) {
    super(db, 'reservaciones', 'Reservacion')
    this.tickets = new TicketService(db)
  }

  /** RF-37 y RF-38: listado con filtros por texto (cliente o placa) y estado. */
  async listar({ q, estado } = {}) {
    const query = this.query().select('*').orderBy('fecha_de_entrada', 'desc')
    if (estado && estado !== 'todas') {
      if (!ESTADOS.includes(estado)) {
        throw new ValidationError(`Estado no válido: ${estado}`)
      }
      query.where('estado', estado)
    }
    if (q && String(q).trim()) {
      const texto = `%${String(q).trim()}%`
      query.where((w) => w.where('cliente', 'like', texto).orWhere('placa', 'like', texto))
    }
    return query
  }

  /** RF-32 a RF-36 y RF-41. */
  async createFromBody(body) {
    const cliente = String(body.cliente || '').trim()
    const faltan = []
    if (!cliente) faltan.push('cliente')
    if (!body.placa) faltan.push('placa')
    if (!body.fecha_de_entrada) faltan.push('fecha_de_entrada')
    if (faltan.length) {
      throw new ValidationError(`Faltan campos obligatorios: ${faltan.join(', ')}`)
    }
    const placa = validarPlaca(body.placa)

    const inicio = parsearFecha(body.fecha_de_entrada)
    if (!inicio) {
      throw new ValidationError('La fecha de la reservación no es válida')
    }
    if (inicio.getTime() <= Date.now()) {
      throw new ValidationError('No se puede reservar en una fecha pasada')
    }

    const duracion = Number.parseInt(body.duracion_horas ?? 1, 10)
    if (!DURACIONES.includes(duracion)) {
      throw new ValidationError('La duración debe ser 1, 2, 4 u 8 horas')
    }
    const tipo = body.tipo || 'carro'
    if (!TIPOS.includes(tipo)) {
      throw new ValidationError('El tipo debe ser carro o motocicleta')
    }
    if (!body.usuario_id) {
      throw new ValidationError('Debe iniciar sesión para reservar')
    }
    const fin = new Date(inicio.getTime() + duracion * 60 * 60 * 1000)

    return this.db.transaction(async (trx) => {
      const espacio = await this.obtenerEspacio(trx, body.espacio_id)
      await this.verificarCupo(trx, espacio, inicio, fin)

      const [id] = await trx('reservaciones').insert({
        usuario_id: body.usuario_id,
        espacio_id: espacio.id,
        cliente,
        placa,
        tipo,
        duracion_horas: duracion,
        fecha_de_entrada: aDatetime(inicio),
        fecha_de_salida: aDatetime(fin),
        estado: 'confirmada'
      })
      return id
    })
  }

  async obtenerEspacio(trx, espacioId) {
    if (espacioId) {
      const espacio = await trx('espacios_parqueo').where('id', espacioId).forUpdate().first()
      if (!espacio) {
        throw new ValidationError('El espacio de parqueo indicado no existe')
      }
      return this.validarCapacidad(espacio)
    }

    let espacio = await trx('espacios_parqueo').orderBy('id').forUpdate().first()
    if (!espacio) {
      // Sin lote configurado las reservas siempre fallaban; crea uno por defecto.
      const [id] = await trx('espacios_parqueo').insert(ESPACIO_DEFAULT)
      espacio = await trx('espacios_parqueo').where('id', id).forUpdate().first()
    }
    return this.validarCapacidad(espacio)
  }

  validarCapacidad(espacio) {
    const total = Number(espacio.espacio_total)
    if (!Number.isFinite(total) || total <= 0) {
      throw new ValidationError(
        `El espacio "${espacio.name}" no tiene capacidad configurada (espacio_total debe ser > 0)`
      )
    }
    return espacio
  }

  /** RF-41: solo cuentan las reservas confirmadas que se cruzan con el intervalo. */
  async verificarCupo(trx, espacio, inicio, fin) {
    // FOR UPDATE evita que dos reservas concurrentes sobrepasen el cupo.
    const solapadas = await trx('reservaciones')
      .where({ espacio_id: espacio.id, estado: 'confirmada' })
      .where('fecha_de_entrada', '<', aDatetime(fin))
      .where('fecha_de_salida', '>', aDatetime(inicio))
      .forUpdate()
      .select('id')
    const ocupadas = solapadas.length
    const capacidad = Number(espacio.espacio_total)
    if (ocupadas >= capacidad) {
      throw new ConflictError('No hay cupo disponible en ese horario')
    }
  }

  async obtenerConfirmada(trx, id) {
    const reserva = await trx('reservaciones').where('id', id).forUpdate().first()
    if (!reserva) throw new NotFoundError(this.entityName)
    if (reserva.estado !== 'confirmada') {
      throw new ConflictError(`La reservación ya está ${reserva.estado}`)
    }
    return reserva
  }

  /** RF-40: cancelar libera el cupo porque deja de contar como confirmada. */
  async cancelar(id) {
    return this.db.transaction(async (trx) => {
      await this.obtenerConfirmada(trx, id)
      await trx('reservaciones').where('id', id).update({ estado: 'cancelada' })
    })
  }

  /** RF-39: la llegada completa la reserva y abre un solo ticket (RF-18, RF-21). */
  async registrarLlegada(id) {
    return this.db.transaction(async (trx) => {
      const reserva = await this.obtenerConfirmada(trx, id)
      const ahora = Date.now()
      const inicio = new Date(reserva.fecha_de_entrada).getTime() - GRACIA_LLEGADA_MS
      const fin = new Date(reserva.fecha_de_salida).getTime() + GRACIA_LLEGADA_MS
      if (ahora < inicio || ahora > fin) {
        throw new ValidationError(
          'Solo puede registrar la llegada dentro de la ventana de la reservación (±30 min)'
        )
      }

      const { ticket_id } = await this.tickets.registrarEntrada({
        placa: reserva.placa,
        tipo: reserva.tipo,
        usuario_id: reserva.usuario_id,
        fecha_hora_entrada: aDatetime(new Date())
      }, trx)
      await trx('reservaciones').where('id', id).update({ estado: 'completada', ticket_id })
      return ticket_id
    })
  }

  async updateFromBody() {
    throw new ValidationError(
      'No se puede editar una reservación directamente. Cancele y cree una nueva.'
    )
  }
}

module.exports = ReservacionService
