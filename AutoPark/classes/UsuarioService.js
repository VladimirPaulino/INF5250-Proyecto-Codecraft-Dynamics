const bcrypt = require('bcryptjs')
const BaseService = require('./BaseService')
const { UnauthorizedError, ValidationError, NotFoundError, ConflictError } = require('./errors')
const { createSessionToken } = require('./auth')
const AuditLogService = require('./AuditLogService')

const ROLES = ['admin', 'usuario']
const ESTADOS = ['activo', 'inactivo']

const SALT_ROUNDS = 10
const SAFE_COLUMNS = ['id', 'nombre', 'email', 'telefono', 'role', 'estado', 'created_at', 'updated_at']

function pareceHash(valor) {
  return typeof valor === 'string' && /^\$2[aby]\$\d{2}\$/.test(valor)
}

class UsuarioService extends BaseService {
  constructor(db) {
    super(db, 'usuarios', 'Usuario')
  }

  async findAll() {
    return this.query().select(SAFE_COLUMNS)
  }

  async findById(id) {
    const row = await this.query().select(SAFE_COLUMNS).where('id', id).first()
    if (!row) {
      throw new NotFoundError(this.entityName)
    }
    return row
  }

  async login({ nombre, contrasena }) {
    this.requireFields({ nombre, contrasena }, ['nombre', 'contrasena'])

    const usuario = await this.query().where({ nombre }).first()
    if (!usuario) {
      throw new UnauthorizedError('Usuario o contraseña incorrectos')
    }

    let valido
    if (pareceHash(usuario.contrasena)) {
      valido = await bcrypt.compare(contrasena, usuario.contrasena)
    } else {
      // Migración: contraseñas antiguas en texto plano
      valido = usuario.contrasena === contrasena
      if (valido) {
        const hash = await bcrypt.hash(contrasena, SALT_ROUNDS)
        await this.query().where('id', usuario.id).update({ contrasena: hash })
      }
    }

    if (!valido) {
      throw new UnauthorizedError('Usuario o contraseña incorrectos')
    }
    if (usuario.estado !== 'activo') {
      throw new UnauthorizedError('Usuario inactivo')
    }

    const data = {
      id: usuario.id,
      nombre: usuario.nombre,
      role: usuario.role,
      estado: usuario.estado
    }
    return { ...data, token: createSessionToken(data) }
  }

  async createFromBody(body, actor = null) {
    const { nombre, email, telefono, contrasena, role, estado } = body
    this.requireFields(body, ['nombre', 'email', 'telefono', 'contrasena'])

    let roleFinal = 'usuario'
    let estadoFinal = 'activo'
    if (actor?.role === 'admin') {
      if (role) roleFinal = role
      if (estado) estadoFinal = estado
    }

    if (!ROLES.includes(roleFinal) || !ESTADOS.includes(estadoFinal)) {
      throw new ValidationError('Role o estado no válido')
    }

    const hash = await bcrypt.hash(contrasena, SALT_ROUNDS)
    const id = await this.create({
      nombre,
      email,
      telefono,
      contrasena: hash,
      role: roleFinal,
      estado: estadoFinal
    })
    // M12 · RF-61: la bitácora nunca guarda la contraseña.
    await AuditLogService.registrar(this.db, actor?.id || id, 'usuario.crear', {
      usuario_id: id, nombre, email, role: roleFinal, estado: estadoFinal
    })
    return id
  }

  async updateFromBody(id, body, actor = null) {
    const { nombre, email, telefono, contrasena, role, estado } = body
    const data = { nombre, email, telefono }

    if (contrasena) {
      data.contrasena = await bcrypt.hash(contrasena, SALT_ROUNDS)
    }

    if (actor?.role === 'admin') {
      if (role !== undefined) data.role = role
      if (estado !== undefined) data.estado = estado
    } else if (role !== undefined || estado !== undefined) {
      throw new ValidationError('No puede cambiar role o estado')
    }
    if ((data.role !== undefined && !ROLES.includes(data.role)) ||
        (data.estado !== undefined && !ESTADOS.includes(data.estado))) {
      throw new ValidationError('Role o estado no válido')
    }

    const updated = await this.update(id, data)
    const cambios = Object.keys(data).filter((k) => data[k] !== undefined)
      .map((k) => (k === 'contrasena' ? 'contrasena(cambiada)' : k))
    await AuditLogService.registrar(this.db, actor?.id || id, 'usuario.editar', {
      usuario_id: Number(id), campos: cambios
    })
    return updated
  }

  /** RF-51: no se puede eliminar la cuenta de la sesión abierta. */
  async eliminar(id, actor = null) {
    if (actor && String(actor.id) === String(id)) {
      throw new ConflictError('No puede eliminar su propia cuenta mientras tiene la sesión abierta')
    }
    const usuario = await this.findById(id)
    await this.delete(id)
    await AuditLogService.registrar(this.db, actor?.id, 'usuario.eliminar', {
      usuario_id: usuario.id, nombre: usuario.nombre, email: usuario.email
    })
    return 1
  }
}

module.exports = UsuarioService
