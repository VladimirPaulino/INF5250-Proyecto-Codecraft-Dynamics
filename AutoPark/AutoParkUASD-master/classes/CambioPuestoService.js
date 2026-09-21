const BaseService = require('./BaseService')

class CambioPuestoService extends BaseService {
  constructor(db) {
    super(db, 'cambios_puestos', 'Cambio de puesto')
  }

  async findByUsuarioId(usuarioId) {
    return this.query().where('usuario_id', usuarioId).select('*')
  }

  async createFromBody(body) {
    const { usuario_id, espacio_id, fecha_de_entrada, fecha_de_salida } = body
    this.requireFields(body, ['usuario_id', 'espacio_id', 'fecha_de_entrada'])

    return this.create({
      usuario_id,
      espacio_id,
      fecha_de_entrada,
      fecha_de_salida: fecha_de_salida || null
    })
  }

  async updateFromBody(id, body) {
    const { usuario_id, espacio_id, fecha_de_entrada, fecha_de_salida } = body
    this.requireFields(body, ['usuario_id', 'espacio_id', 'fecha_de_entrada'])

    return this.update(id, {
      usuario_id,
      espacio_id,
      fecha_de_entrada,
      fecha_de_salida: fecha_de_salida || null
    })
  }
}

module.exports = CambioPuestoService
