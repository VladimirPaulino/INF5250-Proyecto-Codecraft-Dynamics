/** Integración: reservaciones con notificación y bitácora (M8, RF-40, RF-41, RF-60, RF-61). */
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

function enMinutos(min) {
  const d = new Date(Date.now() + min * 60 * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

const reservar = (placa, extra = {}) => request(app).post('/api/reservaciones').set(op())
  .send({ cliente: 'Ana Pérez', placa, tipo: 'carro', duracion_horas: 2, fecha_de_entrada: enMinutos(24 * 60), ...extra })

describe('Reservaciones', () => {
  test('confirmar una reserva notifica al usuario y escribe la bitácora', async () => {
    const res = await reservar('R100000')
    expect(res.status).toBe(201)
    const aviso = await db('notificaciones').where('usuario_id', ctx.operador.id).first()
    expect(aviso.mensaje).toMatch(/Reserva #\d+ confirmada para R100000/)
    const log = await db('audit_logs').where('accion', 'reserva.confirmar').first()
    expect(JSON.parse(log.detalle).cliente).toBe('Ana Pérez')
  })

  test('el aviso aparece en /api/notificaciones/mias', async () => {
    await reservar('R100000')
    const res = await request(app).get('/api/notificaciones/mias').set(op())
    expect(res.body.count).toBe(1)
  })

  test('cancelar libera el cupo y queda en la bitácora', async () => {
    const a = await reservar('R100000')
    await reservar('R200000')
    expect((await reservar('R300000')).status).toBe(409)

    const c = await request(app).patch(`/api/reservaciones/${a.body.id}/cancelar`).set(op())
    expect(c.status).toBe(200)
    expect(await db('audit_logs').where('accion', 'reserva.cancelar').count({ n: '*' }).first()).toEqual({ n: 1 })
    expect((await reservar('R300000')).status).toBe(201)
  })

  test('cancelar dos veces responde 409; DELETE también cancela', async () => {
    const a = await reservar('R100000')
    await request(app).delete(`/api/reservaciones/${a.body.id}`).set(op())
    expect((await request(app).patch(`/api/reservaciones/${a.body.id}/cancelar`).set(op())).status).toBe(409)
    expect((await request(app).patch('/api/reservaciones/9999/cancelar').set(op())).status).toBe(404)
  })

  test.each([
    [{ cliente: '' }, 400],
    [{ fecha_de_entrada: 'no-es-fecha' }, 400],
    [{ fecha_de_entrada: enMinutos(-60) }, 400],
    [{ duracion_horas: 3 }, 400],
    [{ tipo: 'camion' }, 400],
    [{ espacio_id: 9999 }, 400]
  ])('validación %j responde %i', async (extra, codigo) => {
    expect((await reservar('R100000', extra)).status).toBe(codigo)
  })

  test('un espacio sin capacidad responde 400', async () => {
    const [id] = await db('espacios_parqueo').insert({ name: 'X', address: 'Y', espacio_total: 0, tiempo_abierto: 6, tiempo_cerrado: 22 })
    expect((await reservar('R100000', { espacio_id: id })).status).toBe(400)
  })

  test('sin espacios configurados crea el lote por defecto', async () => {
    await db.raw('SET FOREIGN_KEY_CHECKS = 0')
    await db('secciones_parqueo').truncate()
    await db('espacios_parqueo').truncate()
    await db.raw('SET FOREIGN_KEY_CHECKS = 1')
    expect((await reservar('R100000')).status).toBe(201)
  })

  test('listado con filtros y detalle', async () => {
    const a = await reservar('R100000')
    await reservar('R200000', { cliente: 'Luis' })
    expect((await request(app).get('/api/reservaciones?q=Luis').set(op())).body.count).toBe(1)
    expect((await request(app).get('/api/reservaciones?estado=confirmada').set(op())).body.count).toBe(2)
    expect((await request(app).get('/api/reservaciones?estado=todas').set(op())).body.count).toBe(2)
    expect((await request(app).get('/api/reservaciones?estado=rara').set(op())).status).toBe(400)
    expect((await request(app).get(`/api/reservaciones/${a.body.id}`).set(op())).body.data.placa).toBe('R100000')
  })

  test('no se puede editar una reserva (400)', async () => {
    const a = await reservar('R100000')
    expect((await request(app).put(`/api/reservaciones/${a.body.id}`).set(op()).send({})).status).toBe(400)
  })

  test('llegada fuera de la ventana responde 400', async () => {
    const a = await reservar('R100000')
    expect((await request(app).patch(`/api/reservaciones/${a.body.id}/llegada`).set(op())).status).toBe(400)
  })

  test('llegada dentro de la ventana abre ticket y ocupa un puesto (RF-39 + RF-59)', async () => {
    const a = await reservar('R100000', { fecha_de_entrada: enMinutos(10) })
    const res = await request(app).patch(`/api/reservaciones/${a.body.id}/llegada`).set(op())
    expect(res.status).toBe(200)
    const ticket = await db('tickets').where('id', res.body.ticket_id).first()
    const seccion = await db('secciones_parqueo').where('id', ticket.seccion_id).first()
    expect(seccion.estado).toBe('ocupado')
    const reserva = await db('reservaciones').where('id', a.body.id).first()
    expect(reserva.estado).toBe('completada')
  })
})
