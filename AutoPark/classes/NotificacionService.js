const BaseService = require('./BaseService')

class NotificacionService extends BaseService {
  constructor(db) {
    super(db, 'notificaciones', 'Notificacion')
  }

  async createFromBody(body) {
    const { usuario_id, mensaje, tipo } = body
    this.requireFields(body, ['usuario_id', 'mensaje'])

    return this.create({
      usuario_id,
      mensaje,
      tipo: tipo || 'info'
    })
  }

  async updateFromBody(id, body) {
    const { usuario_id, mensaje, tipo } = body
    return this.update(id, { usuario_id, mensaje, tipo })
  }
}

module.exports = NotificacionService
