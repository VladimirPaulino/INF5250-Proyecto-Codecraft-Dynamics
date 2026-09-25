const BaseService = require('./BaseService')

class EspacioDisponibleService extends BaseService {
  constructor(db) {
    super(db, 'espacios_disponibles', 'Espacio disponible')
  }

  async createFromBody(body) {
    const { espacio_id, disponible } = body
    this.requireFields(body, ['espacio_id', 'disponible'])

    return this.create({ espacio_id, disponible })
  }

  async updateFromBody(id, body) {
    const { espacio_id, disponible } = body
    this.requireFields(body, ['espacio_id', 'disponible'])

    return this.update(id, { espacio_id, disponible })
  }
}

module.exports = EspacioDisponibleService
