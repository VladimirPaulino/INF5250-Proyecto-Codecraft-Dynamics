const BaseService = require('./BaseService')
const { NotFoundError, ValidationError } = require('./errors')

const TIPOS = ['carro', 'motocicleta']
const UNIDADES = ['minuto', 'hora']

/** M10 · Catálogo de tarifas (RF-28). Solo una tarifa activa por tipo de vehículo. */
class RateService extends BaseService {
  constructor(db) {
    super(db, 'rates', 'Rate')
  }

  validar(datos, parcial = false) {
    const { monto, unidad, tipo_vehiculo: tipo } = datos
    if (!parcial || monto !== undefined) {
      const valor = Number(monto)
      if (!Number.isFinite(valor) || valor <= 0) {
        throw new ValidationError('El monto debe ser un número mayor que cero')
      }
    }
    if ((!parcial || unidad !== undefined) && !UNIDADES.includes(unidad)) {
      throw new ValidationError('La unidad debe ser minuto u hora')
    }
    if ((!parcial || tipo !== undefined) && !TIPOS.includes(tipo)) {
      throw new ValidationError('El tipo de vehículo debe ser carro o motocicleta')
    }
  }

  async createFromBody(body) {
    this.requireFields(body, ['nombre', 'monto', 'unidad', 'tipo_vehiculo'])
    this.validar(body)
    const activa = Boolean(body.activa)

    return this.db.transaction(async (trx) => {
      if (activa) {
        await trx('rates').where({ tipo_vehiculo: body.tipo_vehiculo }).update({ activa: false })
      }
      const [id] = await trx('rates').insert({
        nombre: body.nombre,
        descripcion: body.descripcion || null,
        monto: Number(body.monto),
        unidad: body.unidad,
        tipo_vehiculo: body.tipo_vehiculo,
        activa
      })
      return id
    })
  }

  async updateFromBody(id, body) {
    this.validar(body, true)
    const { nombre, descripcion, monto, unidad, tipo_vehiculo, activa } = body

    return this.db.transaction(async (trx) => {
      const actual = await trx('rates').where('id', id).forUpdate().first()
      if (!actual) throw new NotFoundError(this.entityName)
      const tipo = tipo_vehiculo || actual.tipo_vehiculo
      if (activa) {
        await trx('rates').where({ tipo_vehiculo: tipo }).whereNot('id', id).update({ activa: false })
      }
      const datos = { nombre, descripcion, monto, unidad, tipo_vehiculo }
      if (activa !== undefined) datos.activa = Boolean(activa)
      Object.keys(datos).forEach((k) => datos[k] === undefined && delete datos[k])
      if (Object.keys(datos).length) {
        await trx('rates').where('id', id).update(datos)
      }
      return 1
    })
  }
}

module.exports = RateService
