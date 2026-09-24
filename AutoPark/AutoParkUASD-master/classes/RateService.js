const BaseService = require('./BaseService')

class RateService extends BaseService {
  constructor(db) {
    super(db, 'rates', 'Rate')
  }

  async createFromBody(body) {
    const { nombre, descripcion } = body
    this.requireFields(body, ['nombre'])

    return this.create({
      nombre,
      descripcion: descripcion || null
    })
  }

  async updateFromBody(id, body) {
    const { nombre, descripcion } = body
    return this.update(id, { nombre, descripcion })
  }
}

module.exports = RateService
