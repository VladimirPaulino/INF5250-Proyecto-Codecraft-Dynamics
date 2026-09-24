const BaseService = require('./BaseService')

class PagoService extends BaseService {
  constructor(db) {
    super(db, 'pagos', 'Pago')
  }

  async createFromBody(body) {
    const { usuario_id, ticket_id, monto, fecha_de_pago } = body
    this.requireFields(body, ['usuario_id', 'ticket_id', 'monto', 'fecha_de_pago'])

    return this.create({ usuario_id, ticket_id, monto, fecha_de_pago })
  }

  async updateFromBody(id, body) {
    const { usuario_id, ticket_id, monto, fecha_de_pago } = body
    return this.update(id, { usuario_id, ticket_id, monto, fecha_de_pago })
  }
}

module.exports = PagoService
