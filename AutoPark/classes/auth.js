const crypto = require('crypto')

const SECRET = process.env.APP_SECRET || 'autopark-dev-secret-change-me'
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!payload || !payload.exp || Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

function createSessionToken(usuario) {
  return signToken({
    id: usuario.id,
    role: usuario.role,
    nombre: usuario.nombre,
    exp: Date.now() + TOKEN_TTL_MS
  })
}

function extractToken(req) {
  const header = req.headers.authorization || ''
  if (header.startsWith('Bearer ')) return header.slice(7).trim()
  return req.headers['x-auth-token'] || null
}

function requireAuth(req, res, next) {
  const payload = verifyToken(extractToken(req))
  if (!payload) {
    return res.status(401).json({ success: false, error: 'Debe iniciar sesión' })
  }
  req.user = payload
  next()
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Se requieren permisos de administrador' })
    }
    next()
  })
}

function optionalAuth(req, res, next) {
  const payload = verifyToken(extractToken(req))
  if (payload) req.user = payload
  next()
}

module.exports = {
  createSessionToken,
  verifyToken,
  requireAuth,
  requireAdmin,
  optionalAuth
}
