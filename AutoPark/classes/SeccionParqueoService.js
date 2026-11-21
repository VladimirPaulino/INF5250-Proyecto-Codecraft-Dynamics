const BaseService = require('./BaseService')
const { ConflictError, ValidationError } = require('./errors')

const ESTADOS = ['disponible', 'ocupado']

const ESPACIO_DEFAULT = {
  name: 'AutoPark Principal',
  address: 'Campus UASD',
  espacio_total: 2,
  tiempo_abierto: 6,
  tiempo_cerrado: 22
}

/** M9 · Espacios y secciones (RF-57, RF-58, RF-59). */
class SeccionParqueoService extends BaseService {
  constructor(db) {
    super(db, 'secciones_parqueo', 'Seccion parqueo')
  }

  async createFromBody(body) {
    const { vehiculo_id, espacio_id, estado, codigo } = body
    this.requireFields(body, ['espacio_id'])
    if (estado !== undefined && !ESTADOS.includes(estado)) {
      throw new ValidationError('El estado debe ser disponible u ocupado')
    }

    return this.create({
      vehiculo_id: vehiculo_id || null,
      espacio_id,
      codigo: codigo || null,
      estado: estado || 'disponible'
    })
  }

  async updateFromBody(id, body) {
    const { vehiculo_id, espacio_id, estado, codigo } = body
    if (estado !== undefined && !ESTADOS.includes(estado)) {
      throw new ValidationError('El estado debe ser disponible u ocupado')
    }
    return this.update(id, { vehiculo_id, espacio_id, estado, codigo })
  }

  /** RF-58: disponibilidad por espacio. */
  async disponibilidad() {
    const espacios = await this.db('espacios_parqueo').select('id', 'name', 'espacio_total')
    const conteo = await this.query()
      .select('espacio_id', 'estado')
      .count({ n: '*' })
      .groupBy('espacio_id', 'estado')
    return espacios.map((e) => {
      const fila = (estado) => conteo.find((c) => c.espacio_id === e.id && c.estado === estado)
      const ocupadas = Number(fila('ocupado')?.n || 0)
      const libres = Number(fila('disponible')?.n || 0)
      return { espacio_id: e.id, nombre: e.name, total: ocupadas + libres, ocupadas, disponibles: libres }
    })
  }

  /**
   * RF-59: toma una sección libre y la marca como ocupada por el vehículo.
   * Si el espacio aún no tiene secciones, las crea según espacio_total.
   */
  static async ocupar(trx, vehiculoId, espacioId = null) {
    let espacio = espacioId
      ? await trx('espacios_parqueo').where('id', espacioId).first()
      : await trx('espacios_parqueo').orderBy('id').first()
    if (!espacio) {
      const [id] = await trx('espacios_parqueo').insert(ESPACIO_DEFAULT)
      espacio = await trx('espacios_parqueo').where('id', id).first()
    }

    const existentes = await trx('secciones_parqueo').where('espacio_id', espacio.id).count({ n: '*' }).first()
    const faltan = Number(espacio.espacio_total) - Number(existentes.n)
    for (let i = 1; i <= faltan; i += 1) {
      await trx('secciones_parqueo').insert({
        espacio_id: espacio.id,
        vehiculo_id: null,
        estado: 'disponible',
        codigo: `P-${Number(existentes.n) + i}`
      })
    }

    const seccion = await trx('secciones_parqueo')
      .where({ espacio_id: espacio.id, estado: 'disponible' })
      .orderBy('id')
      .forUpdate()
      .first()
    if (!seccion) {
      throw new ConflictError('No hay puestos disponibles en el parqueo')
    }

    await trx('secciones_parqueo')
      .where('id', seccion.id)
      .update({ estado: 'ocupado', vehiculo_id: vehiculoId })
    return { ...seccion, estado: 'ocupado', vehiculo_id: vehiculoId }
  }

  /** RF-59: al cerrar el ticket la sección vuelve a disponible. */
  static async liberar(trx, seccionId) {
    if (!seccionId) return 0
    return trx('secciones_parqueo')
      .where('id', seccionId)
      .update({ estado: 'disponible', vehiculo_id: null })
  }
}

module.exports = SeccionParqueoService
