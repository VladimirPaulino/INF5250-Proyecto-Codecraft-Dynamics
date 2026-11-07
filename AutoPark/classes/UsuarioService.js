const bcrypt = require('bcryptjs')
const BaseService = require('./BaseService')
const { UnauthorizedError, ValidationError, NotFoundError } = require('./errors')
const { createSessionToken } = require('./auth')

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

    let valido = false
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

    const hash = await bcrypt.hash(contrasena, SALT_ROUNDS)
    return this.create({
      nombre,
      email,
      telefono,
      contrasena: hash,
      role: roleFinal,
      estado: estadoFinal
    })
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

    return this.update(id, data)
  }
}

module.exports = UsuarioService
