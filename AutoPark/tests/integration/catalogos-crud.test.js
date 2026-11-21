/** Integración: CRUD de catálogos de apoyo, pagos, vehículos, páginas y clima. */
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

describe('Espacios de parqueo (RF-57)', () => {
  test('lectura con sesión, escritura solo admin', async () => {
    expect((await request(app).get('/api/espacios_parqueo')).status).toBe(401)
    const nuevo = { name: 'Anexo', address: 'Facultad', espacio_total: 5, tiempo_abierto: 7, tiempo_cerrado: 21 }
    expect((await request(app).post('/api/espacios_parqueo').set(op()).send(nuevo)).status).toBe(403)
    const c = await request(app).post('/api/espacios_parqueo').set(adm()).send(nuevo)
    expect(c.status).toBe(201)
    expect((await request(app).post('/api/espacios_parqueo').set(adm()).send({})).status).toBe(400)
    expect((await request(app).get('/api/espacios_parqueo').set(op())).body.count).toBe(2)
    expect((await request(app).put(`/api/espacios_parqueo/${c.body.id}`).set(adm()).send({ ...nuevo, espacio_total: 6 })).status).toBe(200)
    expect((await request(app).get(`/api/espacios_parqueo/${c.body.id}`).set(op())).body.data.espacio_total).toBe(6)
    expect((await request(app).delete(`/api/espacios_parqueo/${c.body.id}`).set(adm())).status).toBe(200)
  })
})

describe('Espacios disponibles y cambios de puesto', () => {
  test('CRUD con control de acceso', async () => {
    const d = await request(app).post('/api/espacios_disponibles').set(adm()).send({ espacio_id: ctx.espacioId, disponible: true })
    expect(d.status).toBe(201)
    expect((await request(app).post('/api/espacios_disponibles').set(op()).send({})).status).toBe(403)
    expect((await request(app).get('/api/espacios_disponibles').set(op())).body.count).toBe(1)
    expect((await request(app).get(`/api/espacios_disponibles/${d.body.id}`).set(op())).status).toBe(200)
    expect((await request(app).put(`/api/espacios_disponibles/${d.body.id}`).set(adm()).send({ espacio_id: ctx.espacioId, disponible: false })).status).toBe(200)
    expect((await request(app).delete(`/api/espacios_disponibles/${d.body.id}`).set(adm())).status).toBe(200)

    const cambio = { usuario_id: ctx.operador.id, espacio_id: ctx.espacioId, fecha_de_entrada: '2026-11-18 10:00:00' }
    const c = await request(app).post('/api/cambios_puestos').set(adm()).send(cambio)
    expect(c.status).toBe(201)
    expect((await request(app).get('/api/cambios_puestos').set(adm())).body.count).toBe(1)
    expect((await request(app).get(`/api/cambios_puestos/usuario/${ctx.operador.id}`).set(op())).body.count).toBe(1)
    expect((await request(app).get(`/api/cambios_puestos/${c.body.id}`).set(op())).status).toBe(200)
    expect((await request(app).put(`/api/cambios_puestos/${c.body.id}`).set(adm()).send({ ...cambio, fecha_de_salida: '2026-11-18 11:00:00' })).status).toBe(200)
    expect((await request(app).delete(`/api/cambios_puestos/${c.body.id}`).set(adm())).status).toBe(200)
  })
})

describe('Vehículos', () => {
  test('alta, consulta, edición y baja', async () => {
    const c = await request(app).post('/api/vehiculos').set(op()).send({ placa: 'V123456', tipo: 'carro', marca: 'Toyota' })
    expect(c.status).toBe(201)
    expect((await request(app).post('/api/vehiculos').send({ placa: 'X1' })).status).toBe(401)
    expect((await request(app).get('/api/vehiculos')).body.count).toBe(1)
    expect((await request(app).get(`/api/vehiculos/${c.body.id}`)).body.data.placa).toBe('V123456')
    expect((await request(app).put(`/api/vehiculos/${c.body.id}`).set(op()).send({ color: 'Rojo' })).status).toBe(200)
    expect((await request(app).delete(`/api/vehiculos/${c.body.id}`).set(op())).status).toBe(200)
    expect((await request(app).delete(`/api/vehiculos/${c.body.id}`).set(op())).status).toBe(404)
  })
})

describe('Pagos', () => {
  test('pago manual del admin queda en la bitácora; lectura con sesión', async () => {
    const e = await request(app).post('/api/tickets/entrada').set(op()).send({ placa: 'P123456' })
    const p = await request(app).post('/api/pagos').set(adm())
      .send({ usuario_id: ctx.operador.id, ticket_id: e.body.ticket_id, monto: 25, fecha_de_pago: '2026-11-18 10:00:00' })
    expect(p.status).toBe(201)
    expect((await request(app).post('/api/pagos').set(op()).send({})).status).toBe(403)
    expect((await request(app).get('/api/pagos').set(op())).body.count).toBe(1)
    expect((await request(app).get(`/api/pagos/${p.body.id}`).set(op())).status).toBe(200)
    expect((await request(app).put(`/api/pagos/${p.body.id}`).set(adm()).send({ monto: 30 })).status).toBe(200)
    const log = await db('audit_logs').where('accion', 'pago.registrar').first()
    expect(JSON.parse(log.detalle)).toMatchObject({ monto: 25, manual: true })
    expect((await request(app).delete(`/api/pagos/${p.body.id}`).set(adm())).status).toBe(200)
  })
})

describe('Páginas y clima', () => {
  test('las páginas se sirven y / redirige al dashboard', async () => {
    expect((await request(app).get('/')).status).toBe(302)
    const r = await request(app).get('/salida')
    expect(r.status).toBe(200)
    expect(r.text).toMatch(/Tiempo cobrado/)
  })

  test('el clima responde 502 si la API externa falla', async () => {
    const original = global.fetch
    global.fetch = jest.fn().mockRejectedValue(new Error('sin red'))
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect((await request(app).get('/api/clima')).status).toBe(502)
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ current: { temperature_2m: 29 } }) })
    expect((await request(app).get('/api/clima')).body.data.temperatura).toBe(29)
    global.fetch = original
    spy.mockRestore()
  })
})
