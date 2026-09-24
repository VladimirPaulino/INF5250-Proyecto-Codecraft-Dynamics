const BaseService = require('./BaseService')

class AuditLogService extends BaseService {
  constructor(db) {
    super(db, 'audit_logs', 'Audit log')
  }

  async createFromBody(body) {
    const { usuario_id, accion, detalle } = body
    this.requireFields(body, ['usuario_id', 'accion', 'detalle'])

    return this.create({ usuario_id, accion, detalle })
  }

  async updateFromBody(id, body) {
    const { usuario_id, accion, detalle } = body
    this.requireFields(body, ['usuario_id', 'accion', 'detalle'])

    return this.update(id, { usuario_id, accion, detalle })
  }
}

module.exports = AuditLogService
