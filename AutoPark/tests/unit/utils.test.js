const { validarPlaca, normalizarPlaca } = require('../../classes/placaUtils')
const { aDatetime, parsearFecha } = require('../../classes/dateUtils')
const errors = require('../../classes/errors')
const AuditLogService = require('../../classes/AuditLogService')

describe('placaUtils (RF-18)', () => {
  test('normaliza a mayúsculas y quita espacios externos', () => {
    expect(normalizarPlaca('  mcx5585 ')).toBe('MCX5585')
    expect(validarPlaca('a123456')).toBe('A123456')
  })
  test.each([
    ['', 'obligatoria'],
    ['MCX-5585', 'guiones'],
    ['MCX 5585', 'guiones'],
    ['MCX#55', 'letras y números']
  ])('rechaza "%s"', (placa, mensaje) => {
    expect(() => validarPlaca(placa)).toThrow(mensaje)
  })
})

describe('dateUtils', () => {
  test('aDatetime da formato DATETIME local', () => {
    expect(aDatetime(new Date(2026, 0, 5, 7, 8, 9))).toBe('2026-01-05 07:08:09')
    expect(aDatetime('no-fecha')).toBeNull()
  })
  test('parsearFecha acepta formatos locales, Date y texto ISO', () => {
    expect(parsearFecha('2026-11-18T10:30').getHours()).toBe(10)
    expect(parsearFecha('2026-11-18 10:30:15').getSeconds()).toBe(15)
    const d = new Date()
    expect(parsearFecha(d)).toBe(d)
    expect(parsearFecha('2026-11-18T10:30:00Z')).toBeInstanceOf(Date)
  })
  test('parsearFecha devuelve null en valores inválidos', () => {
    expect(parsearFecha(null)).toBeNull()
    expect(parsearFecha('mañana')).toBeNull()
    expect(parsearFecha(new Date('x'))).toBeNull()
  })
})

describe('errors', () => {
  test('cada error lleva su código HTTP', () => {
    expect(new errors.ValidationError('x').statusCode).toBe(400)
    expect(new errors.UnauthorizedError().statusCode).toBe(401)
    expect(new errors.NotFoundError('Ticket').message).toBe('Ticket not found')
    expect(new errors.ConflictError('x').statusCode).toBe(409)
    expect(new errors.AppError('x').statusCode).toBe(500)
  })
})

describe('AuditLogService.limpiar (RF-61, RNF-01)', () => {
  test('nunca guarda contraseña ni token', () => {
    const texto = AuditLogService.limpiar({ nombre: 'ana', contrasena: 'secreta', token: 't', password: 'p' })
    expect(texto).toBe('{"nombre":"ana"}')
  })
  test('convierte texto simple', () => {
    expect(AuditLogService.limpiar('hola')).toBe('hola')
    expect(AuditLogService.limpiar(null)).toBe('')
  })
})
