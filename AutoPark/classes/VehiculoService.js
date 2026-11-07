const BaseService = require('./BaseService')
const { validarPlaca } = require('./placaUtils')

class VehiculoService extends BaseService {
  constructor(db) {
    super(db, 'vehiculos', 'Vehiculo')
  }

  async createFromBody(body) {
    const { usuario_id, marca, modelo, color, tipo } = body
    this.requireFields(body, ['usuario_id', 'placa'])
    const placa = validarPlaca(body.placa)

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
    const { usuario_id, marca, modelo, color, tipo } = body
    const data = { usuario_id, marca, modelo, color, tipo }
    if (body.placa !== undefined) {
      data.placa = validarPlaca(body.placa)
    }
    return this.update(id, data)
  }
}

module.exports = VehiculoService
