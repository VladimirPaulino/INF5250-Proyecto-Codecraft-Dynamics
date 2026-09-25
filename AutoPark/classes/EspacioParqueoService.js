const BaseService = require('./BaseService')

class EspacioParqueoService extends BaseService {
  constructor(db) {
    super(db, 'espacios_parqueo', 'Espacio')
  }

  async createFromBody(body) {
    const { name, address, espacio_total, tiempo_abierto, tiempo_cerrado } = body
    this.requireFields(body, ['name', 'address', 'espacio_total', 'tiempo_abierto', 'tiempo_cerrado'])

    return this.create({
      name,
      address,
      espacio_total,
      tiempo_abierto,
      tiempo_cerrado
    })
  }

  async updateFromBody(id, body) {
    const { name, address, espacio_total, tiempo_abierto, tiempo_cerrado } = body
    return this.update(id, {
      name,
      address,
      espacio_total,
      tiempo_abierto,
      tiempo_cerrado
    })
  }
}

module.exports = EspacioParqueoService
