const { createSessionToken, verifyToken, requireAuth, requireAdmin, optionalAuth } = require('../../classes/auth')
const { handle } = require('../../classes/routeHelpers')
const { AppError, ValidationError } = require('../../classes/errors')

function resMock() {
  const res = { statusCode: 200, body: null }
  res.status = (c) => { res.statusCode = c; return res }
  res.json = (b) => { res.body = b; return res }
  return res
}

describe('auth (M1, RF-05, RNF-02)', () => {
  const usuario = { id: 7, role: 'usuario', nombre: 'op' }

  test('un token firmado se verifica', () => {
    const payload = verifyToken(createSessionToken(usuario))
    expect(payload.id).toBe(7)
  })

  test('un token alterado o mal formado se rechaza', () => {
    const token = createSessionToken(usuario)
    const [body] = token.split('.')
    expect(verifyToken(`${body}.firmaFalsa`)).toBeNull()
    expect(verifyToken('sin-punto')).toBeNull()
    expect(verifyToken(null)).toBeNull()
  })

  test('requireAuth responde 401 sin token', () => {
    const res = resMock()
    const next = jest.fn()
    requireAuth({ headers: {} }, res, next)
    expect(res.statusCode).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  test('requireAuth acepta Bearer y x-auth-token', () => {
    const token = createSessionToken(usuario)
    const next = jest.fn()
    const req1 = { headers: { authorization: `Bearer ${token}` } }
    requireAuth(req1, resMock(), next)
    const req2 = { headers: { 'x-auth-token': token } }
    requireAuth(req2, resMock(), next)
    expect(next).toHaveBeenCalledTimes(2)
    expect(req2.user.id).toBe(7)
  })

  test('requireAdmin responde 403 a un operador y deja pasar al admin', () => {
    const res = resMock()
    const next = jest.fn()
    requireAdmin({ headers: { authorization: `Bearer ${createSessionToken(usuario)}` } }, res, next)
    expect(res.statusCode).toBe(403)
    const admin = createSessionToken({ id: 1, role: 'admin' })
    requireAdmin({ headers: { authorization: `Bearer ${admin}` } }, resMock(), next)
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('optionalAuth nunca bloquea', () => {
    const next = jest.fn()
    const req = { headers: {} }
    optionalAuth(req, resMock(), next)
    expect(next).toHaveBeenCalled()
    expect(req.user).toBeUndefined()
  })
})

describe('routeHelpers.handle (RNF-03)', () => {
  test('un error 4xx devuelve su mensaje', async () => {
    const res = resMock()
    await handle(async () => { throw new ValidationError('Falta la placa') })({}, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBe('Falta la placa')
  })

  test('un error 500 no expone el detalle interno', async () => {
    const res = resMock()
    await handle(async () => { throw new Error("ER_NO_SUCH_TABLE: Table 'sistema_parqueos.x' doesn't exist") })({}, res)
    expect(res.statusCode).toBe(500)
    expect(res.body.error).toBe('Error interno del servidor')
    const res2 = resMock()
    await handle(async () => { throw new AppError('SELECT * FROM usuarios') })({}, res2)
    expect(res2.body.error).not.toMatch(/SELECT/)
  })
})
