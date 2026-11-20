/**
 * Integración: entrada → ocupación de puesto → salida con tarifa → pago,
 * con notificaciones y bitácora (M9, M10, M11, M12).
 */
const request = require('supertest')
const AutoParkApp = require('../../classes/AutoParkApp')
const { crearDb, reiniciar } = require('../helpers/db')

let db
let app
let ctx

beforeAll(async () => {
  db = await crearDb()
  app = new AutoParkApp(db).app
})
afterAll(async () => { await db.destroy() })
beforeEach(async () => { ctx = await reiniciar(db) })

const op = () => ({ Authorization: `Bearer ${ctx.tokenOperador}` })
const adm = () => ({ Authorization: `Bearer ${ctx.tokenAdmin}` })

function haceMinutos(min) {
  const d = new Date(Date.now() - min * 60 * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

async function entrada(placa, extra = {}) {
  return request(app).post('/api/tickets/entrada').set(op()).send({ placa, tipo: 'carro', ...extra })
}

describe('Entrada de vehículo (RF-18, RF-21, RF-59, RF-60, RF-61)', () => {
  test('ocupa un puesto, notifica y deja rastro en la bitácora', async () => {
    const res = await entrada('A111111')
    expect(res.status).toBe(201)
    expect(res.body.seccion_id).toBeDefined()

    const seccion = await db('secciones_parqueo').where('id', res.body.seccion_id).first()
    expect(seccion.estado).toBe('ocupado')
    expect(seccion.vehiculo_id).toBe(res.body.vehiculo_id)

    const avisos = await db('notificaciones').where('usuario_id', ctx.operador.id)
    expect(avisos).toHaveLength(1)
    expect(avisos[0].mensaje).toMatch(/Entrada registrada: A111111/)

    const log = await db('audit_logs').where('accion', 'ticket.crear').first()
    expect(log.usuario_id).toBe(ctx.operador.id)
    expect(JSON.parse(log.detalle).placa).toBe('A111111')
  })

  test('rechaza un segundo ticket abierto para la misma placa (409)', async () => {
    await entrada('A111111')
    const res = await entrada('a111111')
    expect(res.status).toBe(409)
  })

  test('sin puestos libres responde 409 y no crea ticket', async () => {
    await entrada('A111111')
    await entrada('B222222')
    const res = await entrada('C333333')
    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/No hay puestos disponibles/)
    expect(await db('tickets').count({ n: '*' }).first()).toEqual({ n: 2 })
  })

  test('sin sesión responde 401', async () => {
    const res = await request(app).post('/api/tickets/entrada').send({ placa: 'A111111' })
    expect(res.status).toBe(401)
  })

  test('placa con guion responde 400', async () => {
    expect((await entrada('A-1111')).status).toBe(400)
  })

  test('crea puestos si el espacio no tiene secciones', async () => {
    await db('secciones_parqueo').del()
    const res = await entrada('D444444')
    expect(res.status).toBe(201)
    expect(await db('secciones_parqueo').count({ n: '*' }).first()).toEqual({ n: 2 })
  })

  test('crea el espacio por defecto si no existe ninguno', async () => {
    await db.raw('SET FOREIGN_KEY_CHECKS = 0')
    await db('secciones_parqueo').truncate()
    await db('espacios_parqueo').truncate()
    await db.raw('SET FOREIGN_KEY_CHECKS = 1')
    const res = await entrada('E555555')
    expect(res.status).toBe(201)
    expect(await db('espacios_parqueo').count({ n: '*' }).first()).toEqual({ n: 1 })
  })
})

describe('Salida y cobro (RF-26 a RF-30, RF-59 a RF-61)', () => {
  test('cobra por minuto con la regla por defecto y libera el puesto', async () => {
    const e = await entrada('A111111', { fecha_hora_entrada: haceMinutos(30) })
    const cot = await request(app).get('/api/tickets/salida/cotizar?placa=A111111').set(op())
    expect(cot.status).toBe(200)
    expect(cot.body.data.unidad).toBe('minuto')

    const res = await request(app).post('/api/tickets/salida').set(op()).send({ placa: 'A111111' })
    expect(res.status).toBe(201)
    expect(res.body.minutos).toBeGreaterThanOrEqual(30)
    expect(res.body.minutos).toBeLessThanOrEqual(31)
    expect(res.body.total_pagar).toBe(res.body.minutos * 2)

    const seccion = await db('secciones_parqueo').where('id', e.body.seccion_id).first()
    expect(seccion.estado).toBe('disponible')
    expect(seccion.vehiculo_id).toBeNull()

    const pago = await db('pagos').where('ticket_id', e.body.ticket_id).first()
    expect(Number(pago.monto)).toBe(res.body.total_pagar)

    const avisos = await db('notificaciones').where('mensaje', 'like', 'Pago registrado%')
    expect(avisos).toHaveLength(1)
    expect(await db('audit_logs').where('accion', 'pago.registrar').count({ n: '*' }).first()).toEqual({ n: 1 })
  })

  test('motocicleta cobra RD$1 por minuto', async () => {
    await request(app).post('/api/tickets/entrada').set(op())
      .send({ placa: 'M100000', tipo: 'motocicleta', fecha_hora_entrada: haceMinutos(10) })
    const res = await request(app).post('/api/tickets/salida').set(op()).send({ placa: 'M100000' })
    expect(res.body.total_pagar).toBe(res.body.minutos * 1)
  })

  test('usa la tarifa activa del catálogo cuando el admin la configura (RF-28)', async () => {
    const t = await request(app).post('/api/rates').set(adm())
      .send({ nombre: 'Hora campus', monto: 60, unidad: 'hora', tipo_vehiculo: 'carro', activa: true })
    expect(t.status).toBe(201)
    const e = await entrada('A111111', { fecha_hora_entrada: haceMinutos(90) })
    const res = await request(app).post('/api/tickets/salida').set(op()).send({ ticket_id: e.body.ticket_id })
    expect(res.body.total_pagar).toBe(120)
    expect(res.body.detalle).toBe('2 horas × RD$ 60.00')
  })

  test('cotizar sin datos responde 400 y con placa desconocida 404', async () => {
    expect((await request(app).get('/api/tickets/salida/cotizar').set(op())).status).toBe(400)
    expect((await request(app).get('/api/tickets/salida/cotizar?placa=ZZZ999').set(op())).status).toBe(404)
  })

  test('cotizar por ticket_id funciona y un ticket cerrado da 409', async () => {
    const e = await entrada('A111111')
    const cot = await request(app).get(`/api/tickets/salida/cotizar?ticket_id=${e.body.ticket_id}`).set(op())
    expect(cot.body.data.placa).toBe('A111111')
    await request(app).post('/api/tickets/salida').set(op()).send({ ticket_id: e.body.ticket_id })
    expect((await request(app).get(`/api/tickets/salida/cotizar?ticket_id=${e.body.ticket_id}`).set(op())).status).toBe(409)
    expect((await request(app).post('/api/tickets/salida').set(op()).send({ ticket_id: e.body.ticket_id })).status).toBe(409)
  })

  test('salida de un vehículo sin ticket abierto responde 404', async () => {
    expect((await request(app).post('/api/tickets/salida').set(op()).send({ placa: 'NOEXISTE1' })).status).toBe(404)
    expect((await request(app).post('/api/tickets/salida').set(op()).send({})).status).toBe(404)
  })

  test('después de la salida el puesto vuelve a estar disponible para otro vehículo', async () => {
    await entrada('A111111')
    await entrada('B222222')
    await request(app).post('/api/tickets/salida').set(op()).send({ placa: 'A111111' })
    expect((await entrada('C333333')).status).toBe(201)
  })
})

describe('Anular ticket (RF-59, RF-61)', () => {
  test('anular un ticket abierto libera el puesto y queda en la bitácora', async () => {
    const e = await entrada('A111111')
    const res = await request(app).delete(`/api/tickets/${e.body.ticket_id}`).set(adm())
    expect(res.status).toBe(200)
    const seccion = await db('secciones_parqueo').where('id', e.body.seccion_id).first()
    expect(seccion.estado).toBe('disponible')
    expect(await db('audit_logs').where('accion', 'ticket.anular').count({ n: '*' }).first()).toEqual({ n: 1 })
  })

  test('no se puede anular un ticket pagado (409) ni uno inexistente (404)', async () => {
    const e = await entrada('A111111')
    await request(app).post('/api/tickets/salida').set(op()).send({ placa: 'A111111' })
    expect((await request(app).delete(`/api/tickets/${e.body.ticket_id}`).set(adm())).status).toBe(409)
    expect((await request(app).delete('/api/tickets/9999').set(adm())).status).toBe(404)
  })
})

describe('Tickets: lectura y compatibilidad', () => {
  test('lista y detalle de tickets', async () => {
    const e = await entrada('A111111')
    expect((await request(app).get('/api/tickets')).body.count).toBe(1)
    expect((await request(app).get(`/api/tickets/${e.body.ticket_id}`)).body.data.id).toBe(e.body.ticket_id)
  })

  test('POST /api/tickets con placa usa el flujo de entrada', async () => {
    const res = await request(app).post('/api/tickets').set(op()).send({ placa: 'F666666' })
    expect(res.status).toBe(201)
  })

  test('POST /api/tickets con vehiculo_id valida existencia y ticket abierto', async () => {
    expect((await request(app).post('/api/tickets').set(op())
      .send({ vehiculo_id: 999, fecha_hora_entrada: haceMinutos(1) })).status).toBe(404)
    const e = await entrada('A111111')
    expect((await request(app).post('/api/tickets').set(op())
      .send({ vehiculo_id: e.body.vehiculo_id, fecha_hora_entrada: haceMinutos(1) })).status).toBe(409)
    await request(app).post('/api/tickets/salida').set(op()).send({ placa: 'A111111' })
    const res = await request(app).post('/api/tickets').set(op())
      .send({ vehiculo_id: e.body.vehiculo_id, fecha_hora_entrada: haceMinutos(1) })
    expect(res.status).toBe(201)
    // Defecto D-04: esta vía creaba el ticket sin ocupar puesto.
    const ticket = await db('tickets').where('id', res.body.id).first()
    expect(ticket.seccion_id).not.toBeNull()
  })

  test('PUT /api/tickets/:id actualiza y 404 si no existe', async () => {
    const e = await entrada('A111111')
    expect((await request(app).put(`/api/tickets/${e.body.ticket_id}`).set(adm()).send({ total_pagar: 5 })).status).toBe(200)
    expect((await request(app).put('/api/tickets/9999').set(adm()).send({ total_pagar: 5 })).status).toBe(404)
  })
})
