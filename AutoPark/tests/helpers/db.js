/**
 * Base de datos de prueba aislada (por defecto autopark_test).
 * Usa las mismas variables DB_HOST, DB_PORT, DB_USER y DB_PASSWORD que la app.
 */
process.env.NODE_ENV = 'test'
const path = require('path')
const knexFactory = require('knex')
const bcrypt = require('bcryptjs')
const baseConfig = require('../../database/db.config')
const { createSessionToken } = require('../../classes/auth')

const DB_TEST = process.env.DB_TEST_NAME || 'autopark_test'

const TABLAS = [
  'audit_logs', 'notificaciones', 'cambios_puestos', 'pagos', 'reservaciones',
  'tickets', 'secciones_parqueo', 'espacios_disponibles', 'vehiculos',
  'espacios_parqueo', 'rates', 'usuarios'
]

async function crearDb() {
  const { database, ...sinDb } = baseConfig // eslint-disable-line no-unused-vars
  const admin = knexFactory({ client: 'mysql2', connection: sinDb })
  try {
    await admin.raw('CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', [DB_TEST])
  } finally {
    await admin.destroy()
  }
  const db = knexFactory({ client: 'mysql2', connection: { ...baseConfig, database: DB_TEST } })
  await db.migrate.latest({ directory: path.join(__dirname, '../../database/knex/migrations') })
  return db
}

/** Vacía las tablas y deja un estado conocido: 1 espacio con 2 puestos, un admin y un operador. */
async function reiniciar(db) {
  await db.raw('SET FOREIGN_KEY_CHECKS = 0')
  for (const tabla of TABLAS) {
    await db(tabla).truncate()
  }
  await db.raw('SET FOREIGN_KEY_CHECKS = 1')

  const hash = await bcrypt.hash('Clave123!', 4)
  const [adminId] = await db('usuarios').insert({
    nombre: 'admin', email: 'admin@test.do', telefono: '8090000000', contrasena: hash, role: 'admin', estado: 'activo'
  })
  const [operadorId] = await db('usuarios').insert({
    nombre: 'operador', email: 'op@test.do', telefono: '8090000001', contrasena: hash, role: 'usuario', estado: 'activo'
  })
  const [espacioId] = await db('espacios_parqueo').insert({
    name: 'AutoPark Principal', address: 'Campus UASD', espacio_total: 2, tiempo_abierto: 6, tiempo_cerrado: 22
  })
  await db('secciones_parqueo').insert([
    { espacio_id: espacioId, vehiculo_id: null, estado: 'disponible', codigo: 'P-1' },
    { espacio_id: espacioId, vehiculo_id: null, estado: 'disponible', codigo: 'P-2' }
  ])

  const admin = { id: adminId, nombre: 'admin', role: 'admin' }
  const operador = { id: operadorId, nombre: 'operador', role: 'usuario' }
  return {
    admin,
    operador,
    espacioId,
    tokenAdmin: createSessionToken(admin),
    tokenOperador: createSessionToken(operador)
  }
}

module.exports = { crearDb, reiniciar, DB_TEST }
