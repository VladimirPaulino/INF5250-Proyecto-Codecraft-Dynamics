const BaseService = require('./BaseService')
const AuditLogService = require('./AuditLogService')

class PagoService extends BaseService {
  constructor(db) {
    super(db, 'pagos', 'Pago')
  }

  async createFromBody(body, actor = null) {
    const { usuario_id, ticket_id, monto, fecha_de_pago } = body
    this.requireFields(body, ['usuario_id', 'ticket_id', 'monto', 'fecha_de_pago'])

    const id = await this.create({ usuario_id, ticket_id, monto, fecha_de_pago })
    await AuditLogService.registrar(this.db, actor?.id || usuario_id, 'pago.registrar', {
      pago_id: id, ticket_id, monto, manual: true
    })
    return id
  }

  async updateFromBody(id, body) {
    const { usuario_id, ticket_id, monto, fecha_de_pago } = body
    return this.update(id, { usuario_id, ticket_id, monto, fecha_de_pago })
  }
}

module.exports = PagoService
