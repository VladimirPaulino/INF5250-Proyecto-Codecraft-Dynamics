const BaseService = require('./BaseService')

// Campos que nunca deben quedar en la bitácora (RF-61, RNF-01).
const CAMPOS_PROHIBIDOS = ['contrasena', 'password', 'token']

function limpiar(detalle) {
  if (!detalle || typeof detalle !== 'object') return String(detalle ?? '')
  const copia = { ...detalle }
  CAMPOS_PROHIBIDOS.forEach((campo) => delete copia[campo])
  return JSON.stringify(copia)
}

/** M12 · Bitácora de auditoría (RF-61). Los registros no se editan ni se borran por la API. */
class AuditLogService extends BaseService {
  constructor(db) {
    super(db, 'audit_logs', 'Audit log')
  }

  async findAll() {
    return this.query().select('*').orderBy('id', 'desc')
  }

  async createFromBody(body) {
    const { usuario_id, accion, detalle } = body
    this.requireFields(body, ['usuario_id', 'accion', 'detalle'])

    return this.create({ usuario_id, accion, detalle: limpiar(detalle) })
  }

  /** Escribe en la bitácora dentro de la transacción del flujo auditado. */
  static async registrar(trx, usuarioId, accion, detalle) {
    if (!usuarioId) return null
    const [id] = await trx('audit_logs').insert({
      usuario_id: usuarioId,
      accion,
      detalle: limpiar(detalle)
    })
    return id
  }
}

AuditLogService.limpiar = limpiar

module.exports = AuditLogService
