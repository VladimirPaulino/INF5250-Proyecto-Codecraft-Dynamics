/**
 * Revisión QA del PR #17 (E4-A4): autorización sobre tickets, reservaciones y
 * cambios de puesto; bitácora sin datos sensibles; migración y disponibilidad.
 */
const path = require('path')
const request = require('supertest')
const bcrypt = require('bcryptjs')
const AutoParkApp = require('../../classes/AutoParkApp')
const { createSessionToken } = require('../../classes/auth')
const { crearDb, reiniciar } = require('../helpers/db')

let db
let app
let ctx
let otro

beforeAll(async () => {
  db = await crearDb()
  app = new AutoParkApp(db).app
})
afterAll(async () => { await db.destroy() })
beforeEach(async () => {
  ctx = await reiniciar(db)
  const [id] = await db('usuarios').insert({
    nombre: 'operador2', email: 'op2@test.do', telefono: '8090000002',
    contrasena: await bcrypt.hash('Clave123!', 4), role: 'usuario', estado: 'activo'
  })
  otro = { id, token: createSessionToken({ id, nombre: 'operador2', role: 'usuario' }) }
})

const op = () => ({ Authorization: `Bearer ${ctx.tokenOperador}` })
const adm = () => ({ Authorization: `Bearer ${ctx.tokenAdmin}` })
const op2 = () => ({ Authorization: `Bearer ${otro.token}` })

function enMinutos(min) {
  const d = new Date(Date.now() + min * 60 * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

describe('QA 1 · Tickets: solo el administrador edita o anula', () => {
  test('un operador recibe 403 al anular o editar, y el ticket sigue abierto', async () => {
    const e = await request(app).post('/api/tickets/entrada').set(op()).send({ placa: 'Q100000' })
    expect((await request(app).delete(`/api/tickets/${e.body.ticket_id}`).set(op())).status).toBe(403)
    expect((await request(app).delete(`/api/tickets/${e.body.ticket_id}`).set(op2())).status).toBe(403)
    expect((await request(app).put(`/api/tickets/${e.body.ticket_id}`).set(op()).send({ total_pagar: 0 })).status).toBe(403)
    const ticket = await db('tickets').where('id', e.body.ticket_id).first()
    expect(ticket).toBeDefined()
    expect(await db('audit_logs').where('accion', 'ticket.anular').count({ n: '*' }).first()).toEqual({ n: 0 })
  })

  test('sin sesión responde 401', async () => {
    expect((await request(app).delete('/api/tickets/1')).status).toBe(401)
  })
})

describe('QA 1 · Reservaciones: solo quien la creó o un administrador la cancela', () => {
  const reservar = (headers, placa) => request(app).post('/api/reservaciones').set(headers)
    .send({ cliente: 'Cliente QA', placa, fecha_de_entrada: enMinutos(24 * 60), duracion_horas: 1 })

  test('otro operador recibe 403 por PATCH y por DELETE, y la reserva sigue confirmada', async () => {
    const r = await reservar(op(), 'Q200000')
    expect((await request(app).patch(`/api/reservaciones/${r.body.id}/cancelar`).set(op2())).status).toBe(403)
    expect((await request(app).delete(`/api/reservaciones/${r.body.id}`).set(op2())).status).toBe(403)
    expect((await db('reservaciones').where('id', r.body.id).first()).estado).toBe('confirmada')
  })

  test('el dueño puede cancelar su reserva', async () => {
    const r = await reservar(op(), 'Q300000')
    expect((await request(app).patch(`/api/reservaciones/${r.body.id}/cancelar`).set(op())).status).toBe(200)
  })

  test('el administrador puede cancelar la reserva de cualquiera', async () => {
    const r = await reservar(op(), 'Q400000')
    expect((await request(app).patch(`/api/reservaciones/${r.body.id}/cancelar`).set(adm())).status).toBe(200)
    const log = await db('audit_logs').where('accion', 'reserva.cancelar').first()
    expect(log.usuario_id).toBe(ctx.admin.id)
  })
})

describe('QA 2 · Cambios de puesto: solo administrador o el propio usuario', () => {
  let cambioId
  beforeEach(async () => {
    const c = await request(app).post('/api/cambios_puestos').set(adm())
      .send({ usuario_id: ctx.operador.id, espacio_id: ctx.espacioId, fecha_de_entrada: '2026-11-20 10:00:00' })
    cambioId = c.body.id
  })

  test('el listado completo es solo para admin', async () => {
    expect((await request(app).get('/api/cambios_puestos').set(op())).status).toBe(403)
    expect((await request(app).get('/api/cambios_puestos')).status).toBe(401)
    expect((await request(app).get('/api/cambios_puestos').set(adm())).body.count).toBe(1)
  })

  test('cada usuario ve solo sus propios cambios', async () => {
    expect((await request(app).get(`/api/cambios_puestos/usuario/${ctx.operador.id}`).set(op())).body.count).toBe(1)
    expect((await request(app).get(`/api/cambios_puestos/usuario/${ctx.operador.id}`).set(op2())).status).toBe(403)
    expect((await request(app).get(`/api/cambios_puestos/${cambioId}`).set(op())).status).toBe(200)
    expect((await request(app).get(`/api/cambios_puestos/${cambioId}`).set(op2())).status).toBe(403)
    expect((await request(app).get(`/api/cambios_puestos/${cambioId}`).set(adm())).status).toBe(200)
  })

  test('crear, editar o borrar sigue siendo solo admin', async () => {
    expect((await request(app).put(`/api/cambios_puestos/${cambioId}`).set(op()).send({})).status).toBe(403)
    expect((await request(app).delete(`/api/cambios_puestos/${cambioId}`).set(op())).status).toBe(403)
  })
})

describe('QA 3 · La bitácora no guarda datos sensibles', () => {
  test('después de todos los flujos, ningún registro contiene contraseñas, hashes ni tokens', async () => {
    const login = await request(app).post('/api/usuarios/login').send({ nombre: 'operador', contrasena: 'Clave123!' })
    const token = login.body.data.token
    const c = await request(app).post('/api/usuarios').set(adm())
      .send({ nombre: 'qa', email: 'qa@test.do', telefono: '1', contrasena: 'SuperSecreta1', token: 'x.y' })
    await request(app).put(`/api/usuarios/${c.body.id}`).set(adm()).send({ contrasena: 'OtraSecreta2' })
    await request(app).post('/api/tickets/entrada').set(op()).send({ placa: 'Q500000' })
    await request(app).post('/api/tickets/salida').set(op()).send({ placa: 'Q500000' })
    await request(app).post('/api/audit_logs').set(adm()).send({ accion: 'nota', detalle: { contrasena: 'NoDebeQuedar', ok: 1 } })
    await request(app).delete(`/api/usuarios/${c.body.id}`).set(adm())

    const logs = await db('audit_logs').select('detalle')
    expect(logs.length).toBeGreaterThanOrEqual(6)
    const todo = logs.map((l) => l.detalle).join('\n')
    expect(todo).not.toMatch(/SuperSecreta1|OtraSecreta2|NoDebeQuedar|Clave123/)
    expect(todo).not.toMatch(/\$2[aby]\$\d{2}\$/)
    expect(todo).not.toContain(token)
    expect(todo).not.toMatch(/"(contrasena|password|token)"/)
  })
})

describe('QA 5 · Migración E4 y disponibilidad de puestos', () => {
  const dir = path.join(__dirname, '../../database/knex/migrations')

  test('la migración se revierte y se vuelve a aplicar, y crea un puesto por cada espacio_total', async () => {
    await db.migrate.down({ directory: dir })
    const columnas = await db('rates').columnInfo()
    expect(columnas.monto).toBeUndefined()

    await db('espacios_parqueo').where('id', ctx.espacioId).update({ espacio_total: 4 })
    await db.migrate.latest({ directory: dir })
    expect(Object.keys(await db('rates').columnInfo())).toEqual(
      expect.arrayContaining(['monto', 'unidad', 'tipo_vehiculo', 'activa'])
    )
    expect(Object.keys(await db('tickets').columnInfo())).toContain('seccion_id')
    const secciones = await db('secciones_parqueo').where('espacio_id', ctx.espacioId)
    expect(secciones).toHaveLength(4)
    expect(secciones.every((s) => s.estado === 'disponible' && s.vehiculo_id === null)).toBe(true)
  })

  test('la disponibilidad baja con cada entrada y sube con cada salida', async () => {
    const libres = async () => (await request(app).get('/api/secciones_parqueo/disponibilidad').set(op())).body.data[0].disponibles
    expect(await libres()).toBe(2)
    await request(app).post('/api/tickets/entrada').set(op()).send({ placa: 'Q600000' })
    expect(await libres()).toBe(1)
    await request(app).post('/api/tickets/entrada').set(op()).send({ placa: 'Q700000' })
    expect(await libres()).toBe(0)
    expect((await request(app).post('/api/tickets/entrada').set(op()).send({ placa: 'Q800000' })).status).toBe(409)
    await request(app).post('/api/tickets/salida').set(op()).send({ placa: 'Q600000' })
    expect(await libres()).toBe(1)
  })
})
