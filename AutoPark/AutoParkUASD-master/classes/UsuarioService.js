const BaseService = require('./BaseService')
const { UnauthorizedError } = require('./errors')

class UsuarioService extends BaseService {
  constructor(db) {
    super(db, 'usuarios', 'Usuario')
  }

  async login({ nombre, contrasena }) {
    this.requireFields({ nombre, contrasena }, ['nombre', 'contrasena'])

    const usuario = await this.query().where({ nombre, contrasena }).first()
    if (!usuario) {
      throw new UnauthorizedError('Usuario o contraseña incorrectos')
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      role: usuario.role,
      estado: usuario.estado
    }
  }

  async createFromBody(body) {
    const { nombre, email, telefono, contrasena, role, estado } = body
    this.requireFields(body, ['nombre', 'email', 'telefono', 'contrasena'])

    return this.create({
      nombre,
      email,
      telefono,
      contrasena,
      role: role || 'usuario',
      estado: estado || 'activo'
    })
  }

  async updateFromBody(id, body) {
    const { nombre, email, telefono, contrasena, role, estado } = body
    return this.update(id, { nombre, email, telefono, contrasena, role, estado })
  }
}

module.exports = UsuarioService
