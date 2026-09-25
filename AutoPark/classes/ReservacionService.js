const BaseService = require('./BaseService')

class ReservacionService extends BaseService {
  constructor(db) {
    super(db, 'reservaciones', 'Reservacion')
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
    return this.update(id, {
      usuario_id,
      espacio_id,
      fecha_de_entrada,
      fecha_de_salida
    })
  }
}

module.exports = ReservacionService
