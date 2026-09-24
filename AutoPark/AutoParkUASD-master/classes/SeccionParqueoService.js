const BaseService = require('./BaseService')

class SeccionParqueoService extends BaseService {
  constructor(db) {
    super(db, 'secciones_parqueo', 'Seccion parqueo')
  }

  async createFromBody(body) {
    const { vehiculo_id, espacio_id, estado } = body
    this.requireFields(body, ['vehiculo_id', 'espacio_id'])

    return this.create({
      vehiculo_id,
      espacio_id,
      estado: estado || 'disponible'
    })
  }

  async updateFromBody(id, body) {
    const { vehiculo_id, espacio_id, estado } = body
    return this.update(id, { vehiculo_id, espacio_id, estado })
  }
}

module.exports = SeccionParqueoService
