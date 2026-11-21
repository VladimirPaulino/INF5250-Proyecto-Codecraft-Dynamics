const BaseService = require('./BaseService')
const { ValidationError } = require('./errors')

const TIPOS = ['info', 'error', 'emergencia']

/** M11 · Notificaciones (RF-60). */
class NotificacionService extends BaseService {
  constructor(db) {
    super(db, 'notificaciones', 'Notificacion')
  }

  validarTipo(tipo) {
    if (tipo !== undefined && !TIPOS.includes(tipo)) {
      throw new ValidationError('El tipo debe ser info, error o emergencia')
    }
  }

  async createFromBody(body) {
    const { usuario_id, mensaje, tipo } = body
    this.requireFields(body, ['usuario_id', 'mensaje'])
    this.validarTipo(tipo)

    return this.create({
      usuario_id,
      mensaje,
      tipo: tipo || 'info'
    })
  }

  async updateFromBody(id, body) {
    const { usuario_id, mensaje, tipo } = body
    this.validarTipo(tipo)
    return this.update(id, { usuario_id, mensaje, tipo })
  }

  /** Avisos del usuario de la sesión, del más reciente al más antiguo. */
  async listarDeUsuario(usuarioId, limite = 20) {
    return this.query()
      .where('usuario_id', usuarioId)
      .orderBy('id', 'desc')
      .limit(limite)
  }

  /**
   * Crea un aviso dentro de la transacción del flujo que lo origina,
   * para que no quede un aviso de una operación que se revirtió.
   */
  static async notificar(trx, usuarioId, mensaje, tipo = 'info') {
    if (!usuarioId) return null
    const [id] = await trx('notificaciones').insert({
      usuario_id: usuarioId,
      mensaje,
      tipo: TIPOS.includes(tipo) ? tipo : 'info'
    })
    return id
  }
}

NotificacionService.TIPOS = TIPOS

module.exports = NotificacionService
