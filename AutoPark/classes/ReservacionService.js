const BaseService = require('./BaseService')
const TicketService = require('./TicketService')
const { ConflictError, NotFoundError, ValidationError } = require('./errors')

const DURACIONES = [1, 2, 4, 8]
const TIPOS = ['carro', 'motocicleta']
const ESTADOS = ['confirmada', 'completada', 'cancelada']

function pad(n) {
  return String(n).padStart(2, '0')
}

// Formato DATETIME de MySQL en hora local del servidor.
function aDatetime(fecha) {
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())} ` +
    `${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}`
}

// Acepta "YYYY-MM-DDTHH:mm" (input datetime-local) o "YYYY-MM-DD HH:mm[:ss]".
function parsearFecha(valor) {
  if (!valor) return null
  const texto = String(valor).trim().replace(' ', 'T')
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(texto)) return null
  const fecha = new Date(texto)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

class ReservacionService extends BaseService {
  constructor(db) {
    super(db, 'reservaciones', 'Reservacion')
    this.tickets = new TicketService(db)
  }

  /** RF-37 y RF-38: listado con filtros por texto (cliente o placa) y estado. */
  async listar({ q, estado } = {}) {
    const query = this.query().select('*').orderBy('fecha_de_entrada', 'desc')
    if (estado && estado !== 'todas') {
      if (!ESTADOS.includes(estado)) {
        throw new ValidationError(`Estado no válido: ${estado}`)
      }
      query.where('estado', estado)
    }
    if (q && String(q).trim()) {
      const texto = `%${String(q).trim()}%`
      query.where((w) => w.where('cliente', 'like', texto).orWhere('placa', 'like', texto))
    }
    return query
  }

  /** RF-32 a RF-36 y RF-41. */
  async createFromBody(body) {
    const cliente = String(body.cliente || '').trim()
    const placa = String(body.placa || '').trim().toUpperCase()
    const faltan = []
    if (!cliente) faltan.push('cliente')
    if (!placa) faltan.push('placa')
    if (!body.fecha_de_entrada) faltan.push('fecha_de_entrada')
    if (faltan.length) {
      throw new ValidationError(`Faltan campos obligatorios: ${faltan.join(', ')}`)
    }

    const inicio = parsearFecha(body.fecha_de_entrada)
    if (!inicio) {
      throw new ValidationError('La fecha de la reservación no es válida')
    }
    if (inicio.getTime() <= Date.now()) {
      throw new ValidationError('No se puede reservar en una fecha pasada')
    }

    const duracion = Number.parseInt(body.duracion_horas ?? 1, 10)
    if (!DURACIONES.includes(duracion)) {
      throw new ValidationError('La duración debe ser 1, 2, 4 u 8 horas')
    }
    const tipo = body.tipo || 'carro'
    if (!TIPOS.includes(tipo)) {
      throw new ValidationError('El tipo debe ser carro o motocicleta')
    }
    const fin = new Date(inicio.getTime() + duracion * 60 * 60 * 1000)

    return this.db.transaction(async (trx) => {
      const espacio = await this.obtenerEspacio(trx, body.espacio_id)
      await this.verificarCupo(trx, espacio, inicio, fin)

      const [id] = await trx('reservaciones').insert({
        usuario_id: body.usuario_id || 1,
        espacio_id: espacio.id,
        cliente,
        placa,
        tipo,
        duracion_horas: duracion,
        fecha_de_entrada: aDatetime(inicio),
        fecha_de_salida: aDatetime(fin),
        estado: 'confirmada'
      })
      return id
    })
  }

  async obtenerEspacio(trx, espacioId) {
    const query = trx('espacios_parqueo').forUpdate()
    const espacio = espacioId
      ? await query.where('id', espacioId).first()
      : await query.orderBy('id').first()
    if (!espacio) {
      throw new ValidationError('No hay un espacio de parqueo registrado para reservar')
    }
    return espacio
  }

  /** RF-41: solo cuentan las reservas confirmadas que se cruzan con el intervalo. */
  async verificarCupo(trx, espacio, inicio, fin) {
    const fila = await trx('reservaciones')
      .where({ espacio_id: espacio.id, estado: 'confirmada' })
      .where('fecha_de_entrada', '<', aDatetime(fin))
      .where('fecha_de_salida', '>', aDatetime(inicio))
      .count({ total: 'id' })
      .first()
    const ocupadas = Number(fila.total)
    if (ocupadas >= Number(espacio.espacio_total)) {
      throw new ConflictError('No hay cupo disponible en ese horario')
    }
  }

  async obtenerConfirmada(trx, id) {
    const reserva = await trx('reservaciones').where('id', id).forUpdate().first()
    if (!reserva) throw new NotFoundError(this.entityName)
    if (reserva.estado !== 'confirmada') {
      throw new ConflictError(`La reservación ya está ${reserva.estado}`)
    }
    return reserva
  }

  /** RF-40: cancelar libera el cupo porque deja de contar como confirmada. */
  async cancelar(id) {
    return this.db.transaction(async (trx) => {
      await this.obtenerConfirmada(trx, id)
      await trx('reservaciones').where('id', id).update({ estado: 'cancelada' })
    })
  }

  /** RF-39: la llegada completa la reserva y abre un solo ticket (RF-18, RF-21). */
  async registrarLlegada(id) {
    return this.db.transaction(async (trx) => {
      const reserva = await this.obtenerConfirmada(trx, id)
      const { ticket_id } = await this.tickets.registrarEntrada({
        placa: reserva.placa,
        tipo: reserva.tipo,
        usuario_id: reserva.usuario_id,
        fecha_hora_entrada: aDatetime(new Date())
      }, trx)
      await trx('reservaciones').where('id', id).update({ estado: 'completada', ticket_id })
      return ticket_id
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
