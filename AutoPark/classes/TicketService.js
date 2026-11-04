const BaseService = require('./BaseService')
const { ConflictError, ValidationError } = require('./errors')

const TIPOS_VEHICULO = ['carro', 'motocicleta']

function normalizarPlaca(placa) {
  return String(placa || '').trim().toUpperCase()
}

class TicketService extends BaseService {
  constructor(db) {
    super(db, 'tickets', 'Ticket')
  }

  async createFromBody(body) {
    const { vehiculo_id, fecha_hora_entrada, fecha_hora_salida, total_pagar, status_de_pago } = body
    this.requireFields(body, ['vehiculo_id', 'fecha_hora_entrada'])

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
   * Reutiliza el vehículo si la placa ya existe y rechaza la entrada
   * si ese vehículo ya tiene un ticket pendiente sin salida.
   * Acepta una transacción para que la llegada de una reserva sea atómica.
   */
  async registrarEntrada({ placa, tipo, usuario_id, fecha_hora_entrada }, trx = null) {
    const db = trx || this.db
    const placaNormalizada = normalizarPlaca(placa)
    if (!placaNormalizada) {
      throw new ValidationError('La placa es obligatoria')
    }
    const tipoVehiculo = TIPOS_VEHICULO.includes(tipo) ? tipo : 'carro'

    let vehiculo = await db('vehiculos').where('placa', placaNormalizada).forUpdate().first()
    if (!vehiculo) {
      const [vehiculoId] = await db('vehiculos').insert({
        usuario_id: usuario_id || 1,
        placa: placaNormalizada,
        tipo: tipoVehiculo
      })
      vehiculo = { id: vehiculoId }
    }

    const abierto = await db('tickets')
      .where({ vehiculo_id: vehiculo.id, status_de_pago: 'pendiente' })
      .whereNull('fecha_hora_salida')
      .first()
    if (abierto) {
      throw new ConflictError(`La placa ${placaNormalizada} ya tiene un ticket abierto (#${abierto.id})`)
    }

    const [ticketId] = await db('tickets').insert({
      vehiculo_id: vehiculo.id,
      fecha_hora_entrada: fecha_hora_entrada || db.fn.now(),
      fecha_hora_salida: null,
      total_pagar: 0,
      status_de_pago: 'pendiente'
    })

    return { ticket_id: ticketId, vehiculo_id: vehiculo.id }
  }
}

module.exports = TicketService
