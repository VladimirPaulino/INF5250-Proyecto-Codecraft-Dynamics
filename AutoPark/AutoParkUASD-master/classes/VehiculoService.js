const BaseService = require('./BaseService')

class VehiculoService extends BaseService {
  constructor(db) {
    super(db, 'vehiculos', 'Vehiculo')
  }

  async createFromBody(body) {
    const { usuario_id, placa, marca, modelo, color, tipo } = body
    this.requireFields(body, ['usuario_id', 'placa'])

    return this.create({
      usuario_id,
      placa,
      marca: marca || null,
      modelo: modelo || null,
      color: color || null,
      tipo: tipo || 'carro'
    })
  }

  async updateFromBody(id, body) {
    const { usuario_id, placa, marca, modelo, color, tipo } = body
    return this.update(id, { usuario_id, placa, marca, modelo, color, tipo })
  }
}

module.exports = VehiculoService
