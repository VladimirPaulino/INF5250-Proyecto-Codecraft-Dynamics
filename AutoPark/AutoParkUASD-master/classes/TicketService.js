const BaseService = require('./BaseService')

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
}

module.exports = TicketService
