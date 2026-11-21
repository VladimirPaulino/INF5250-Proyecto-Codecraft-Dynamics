/**
 * Integración: control de acceso (M1, RNF-01 a RNF-03), catálogo de tarifas (M10),
 * secciones (M9), notificaciones (M11), bitácora (M12) y usuarios.
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

describe('Login y usuarios (RF-05, RF-51, RF-52, RNF-01, RNF-02)', () => {
  test('login correcto devuelve token y nunca la contraseña', async () => {
    const res = await request(app).post('/api/usuarios/login').send({ nombre: 'operador', contrasena: 'Clave123!' })
    expect(res.status).toBe(200)
    expect(res.body.data.token).toBeDefined()
    expect(res.body.data.contrasena).toBeUndefined()
  })

  test('contraseña incorrecta, usuario inexistente o campos vacíos', async () => {
    expect((await request(app).post('/api/usuarios/login').send({ nombre: 'operador', contrasena: 'x' })).status).toBe(401)
    expect((await request(app).post('/api/usuarios/login').send({ nombre: 'nadie', contrasena: 'x' })).status).toBe(401)
    expect((await request(app).post('/api/usuarios/login').send({})).status).toBe(400)
  })

  test('una cuenta inactiva no puede iniciar sesión', async () => {
    await db('usuarios').where('id', ctx.operador.id).update({ estado: 'inactivo' })
    const res = await request(app).post('/api/usuarios/login').send({ nombre: 'operador', contrasena: 'Clave123!' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Usuario inactivo')
  })

  test('una contraseña antigua en texto plano se migra a bcrypt al entrar', async () => {
    await db('usuarios').where('id', ctx.operador.id).update({ contrasena: 'vieja' })
    expect((await request(app).post('/api/usuarios/login').send({ nombre: 'operador', contrasena: 'vieja' })).status).toBe(200)
    const u = await db('usuarios').where('id', ctx.operador.id).first()
    expect(u.contrasena).toMatch(/^\$2[aby]\$/)
  })

  test('el listado de usuarios es solo para admin y no expone contraseñas', async () => {
    expect((await request(app).get('/api/usuarios').set(op())).status).toBe(403)
    const res = await request(app).get('/api/usuarios').set(adm())
    expect(res.body.data.every((u) => u.contrasena === undefined)).toBe(true)
  })

  test('un operador ve su perfil pero no el de otro', async () => {
    expect((await request(app).get(`/api/usuarios/${ctx.operador.id}`).set(op())).status).toBe(200)
    expect((await request(app).get(`/api/usuarios/${ctx.admin.id}`).set(op())).status).toBe(403)
    expect((await request(app).get('/api/usuarios/9999').set(adm())).status).toBe(404)
  })

  test('crear, editar y eliminar usuario quedan en la bitácora sin contraseña (RF-61)', async () => {
    const c = await request(app).post('/api/usuarios').set(adm())
      .send({ nombre: 'nuevo', email: 'n@test.do', telefono: '8091112222', contrasena: 'Secreta99', role: 'usuario' })
    expect(c.status).toBe(201)
    await request(app).put(`/api/usuarios/${c.body.id}`).set(adm()).send({ telefono: '8093334444', contrasena: 'Otra123' })
    await request(app).delete(`/api/usuarios/${c.body.id}`).set(adm())

    const logs = await db('audit_logs').where('accion', 'like', 'usuario.%').orderBy('id')
    expect(logs.map((l) => l.accion)).toEqual(['usuario.crear', 'usuario.editar', 'usuario.eliminar'])
    logs.forEach((l) => {
      expect(l.detalle).not.toMatch(/Secreta99|Otra123|\$2[aby]\$/)
      expect(l.usuario_id).toBe(ctx.admin.id)
    })
  })

  test('el admin no puede eliminar su propia cuenta (RF-51)', async () => {
    expect((await request(app).delete(`/api/usuarios/${ctx.admin.id}`).set(adm())).status).toBe(409)
  })

  test('un operador no puede cambiarse el rol ni crear usuarios', async () => {
    expect((await request(app).put(`/api/usuarios/${ctx.operador.id}`).set(op()).send({ role: 'admin' })).status).toBe(400)
    expect((await request(app).put(`/api/usuarios/${ctx.admin.id}`).set(op()).send({ nombre: 'x' })).status).toBe(403)
    expect((await request(app).post('/api/usuarios').set(op()).send({})).status).toBe(403)
  })

  test('role o estado no válidos responden 400', async () => {
    expect((await request(app).post('/api/usuarios').set(adm())
      .send({ nombre: 'z', email: 'z@t.do', telefono: '1', contrasena: 'a', role: 'root' })).status).toBe(400)
    expect((await request(app).put(`/api/usuarios/${ctx.operador.id}`).set(adm()).send({ estado: 'borrado' })).status).toBe(400)
  })
})

describe('Bitácora (M12): solo admin e inmutable', () => {
  test('el operador no puede leerla (403) y sin sesión 401', async () => {
    expect((await request(app).get('/api/audit_logs').set(op())).status).toBe(403)
    expect((await request(app).get('/api/audit_logs')).status).toBe(401)
  })

  test('el admin la lee y puede agregar una nota, pero no editar ni borrar (405)', async () => {
    const c = await request(app).post('/api/audit_logs').set(adm()).send({ accion: 'nota', detalle: 'revisión' })
    expect(c.status).toBe(201)
    expect((await request(app).get('/api/audit_logs').set(adm())).body.count).toBe(1)
    expect((await request(app).get(`/api/audit_logs/${c.body.id}`).set(adm())).status).toBe(200)
    expect((await request(app).put(`/api/audit_logs/${c.body.id}`).set(adm()).send({})).status).toBe(405)
    expect((await request(app).delete(`/api/audit_logs/${c.body.id}`).set(adm())).status).toBe(405)
  })
})

describe('Catálogo de tarifas (M10, RF-28)', () => {
  const tarifa = { nombre: 'Minuto', monto: 3, unidad: 'minuto', tipo_vehiculo: 'carro', activa: true }

  test('solo el admin crea tarifas', async () => {
    expect((await request(app).post('/api/rates').set(op()).send(tarifa)).status).toBe(403)
    expect((await request(app).post('/api/rates').set(adm()).send(tarifa)).status).toBe(201)
  })

  test('activar una tarifa desactiva la anterior del mismo tipo', async () => {
    const a = await request(app).post('/api/rates').set(adm()).send(tarifa)
    const b = await request(app).post('/api/rates').set(adm()).send({ ...tarifa, nombre: 'Nueva', monto: 4 })
    const filas = await db('rates').orderBy('id')
    expect(filas.map((f) => f.activa)).toEqual([0, 1])
    await request(app).put(`/api/rates/${a.body.id}`).set(adm()).send({ activa: true })
    const vig = await request(app).get('/api/rates/vigente').set(op())
    expect(vig.body.data.carro).toMatchObject({ nombre: 'Minuto', origen: 'catalogo' })
    expect(vig.body.data.motocicleta.origen).toBe('defecto')
    expect((await request(app).get(`/api/rates/${b.body.id}`).set(op())).body.data.activa).toBe(0)
  })

  test.each([
    [{ monto: 0 }],
    [{ monto: 'abc' }],
    [{ unidad: 'dia' }],
    [{ tipo_vehiculo: 'bus' }]
  ])('datos inválidos %j responden 400', async (extra) => {
    expect((await request(app).post('/api/rates').set(adm()).send({ ...tarifa, ...extra })).status).toBe(400)
  })

  test('editar, listar y eliminar tarifas; 404 si no existe', async () => {
    const a = await request(app).post('/api/rates').set(adm()).send({ ...tarifa, activa: false })
    expect((await request(app).put(`/api/rates/${a.body.id}`).set(adm()).send({ monto: 5 })).status).toBe(200)
    expect((await request(app).put(`/api/rates/${a.body.id}`).set(adm()).send({})).status).toBe(200)
    expect((await request(app).put('/api/rates/9999').set(adm()).send({ monto: 5 })).status).toBe(404)
    expect((await request(app).get('/api/rates').set(op())).body.count).toBe(1)
    expect((await request(app).delete(`/api/rates/${a.body.id}`).set(adm())).status).toBe(200)
  })
})

describe('Secciones y disponibilidad (M9, RF-58)', () => {
  test('disponibilidad por espacio', async () => {
    const res = await request(app).get('/api/secciones_parqueo/disponibilidad').set(op())
    expect(res.body.data[0]).toMatchObject({ total: 2, ocupadas: 0, disponibles: 2 })
    await request(app).post('/api/tickets/entrada').set(op()).send({ placa: 'A111111' })
    const res2 = await request(app).get('/api/secciones_parqueo/disponibilidad').set(op())
    expect(res2.body.data[0]).toMatchObject({ ocupadas: 1, disponibles: 1 })
  })

  test('CRUD de secciones: escritura solo admin y estado válido', async () => {
    expect((await request(app).post('/api/secciones_parqueo').set(op()).send({ espacio_id: ctx.espacioId })).status).toBe(403)
    const c = await request(app).post('/api/secciones_parqueo').set(adm()).send({ espacio_id: ctx.espacioId, codigo: 'P-3' })
    expect(c.status).toBe(201)
    expect((await request(app).post('/api/secciones_parqueo').set(adm()).send({ espacio_id: ctx.espacioId, estado: 'roto' })).status).toBe(400)
    expect((await request(app).put(`/api/secciones_parqueo/${c.body.id}`).set(adm()).send({ estado: 'roto' })).status).toBe(400)
    expect((await request(app).put(`/api/secciones_parqueo/${c.body.id}`).set(adm()).send({ codigo: 'P-9' })).status).toBe(200)
    expect((await request(app).get(`/api/secciones_parqueo/${c.body.id}`).set(op())).body.data.codigo).toBe('P-9')
    expect((await request(app).get('/api/secciones_parqueo').set(op())).body.count).toBe(3)
    expect((await request(app).delete(`/api/secciones_parqueo/${c.body.id}`).set(adm())).status).toBe(200)
  })
})

describe('Notificaciones (M11, RF-60)', () => {
  test('el admin crea y gestiona avisos; el tipo debe ser válido', async () => {
    expect((await request(app).post('/api/notificaciones').set(adm())
      .send({ usuario_id: ctx.operador.id, mensaje: 'x', tipo: 'alerta' })).status).toBe(400)
    const c = await request(app).post('/api/notificaciones').set(adm())
      .send({ usuario_id: ctx.operador.id, mensaje: 'Parqueo cerrado mañana', tipo: 'emergencia' })
    expect(c.status).toBe(201)
    expect((await request(app).get('/api/notificaciones').set(adm())).body.count).toBe(1)
    expect((await request(app).get('/api/notificaciones').set(op())).status).toBe(403)
    expect((await request(app).get(`/api/notificaciones/${c.body.id}`).set(op())).status).toBe(200)
    expect((await request(app).get(`/api/notificaciones/${c.body.id}`).set(adm())).status).toBe(200)
    expect((await request(app).put(`/api/notificaciones/${c.body.id}`).set(adm()).send({ tipo: 'nada' })).status).toBe(400)
    expect((await request(app).put(`/api/notificaciones/${c.body.id}`).set(adm()).send({ tipo: 'info' })).status).toBe(200)
    expect((await request(app).delete(`/api/notificaciones/${c.body.id}`).set(adm())).status).toBe(200)
  })

  test('un operador no ve avisos de otro usuario', async () => {
    const c = await request(app).post('/api/notificaciones').set(adm()).send({ usuario_id: ctx.admin.id, mensaje: 'solo admin' })
    expect((await request(app).get(`/api/notificaciones/${c.body.id}`).set(op())).status).toBe(403)
  })
})

describe('Errores hacia el navegador (RNF-03)', () => {
  test('un error de base de datos devuelve 500 genérico sin SQL', async () => {
    const res = await request(app).post('/api/pagos').set(adm())
      .send({ usuario_id: ctx.admin.id, ticket_id: 9999, monto: 10, fecha_de_pago: '2026-11-18 10:00:00' })
    expect(res.status).toBe(500)
    expect(res.body.error).toBe('Error interno del servidor')
    expect(JSON.stringify(res.body)).not.toMatch(/ER_|foreign key|sql/i)
  })

  test('JSON mal formado responde 400 y no 500', async () => {
    const res = await request(app).post('/api/usuarios/login')
      .set('Content-Type', 'application/json').send('{"nombre": ')
    expect(res.status).toBe(400)
  })
})
