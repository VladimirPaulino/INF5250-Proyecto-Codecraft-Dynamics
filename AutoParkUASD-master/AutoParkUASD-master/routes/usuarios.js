//usuario.html
//datos nuevos cambio routes
const express = require('express')
const router = express.Router()

module.exports = (db) => {
  // GET all usuarios
  router.get('/', async (req, res) => {
    try {
      const usuarios = await db('usuarios').select('*')
      res.json({ success: true, data: usuarios, count: usuarios.length })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // POST login usuario
  router.post('/login', async (req, res) => {
    try {
      const { nombre, contrasena } = req.body

      if (!nombre || !contrasena) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: nombre, contrasena'
        })
      }

      const usuario = await db('usuarios')
        .where({ nombre, contrasena })
        .first()

      if (!usuario) {
        return res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos' })
      }

      res.json({
        success: true,
        data: {
          id: usuario.id,
          nombre: usuario.nombre,
          role: usuario.role,
          estado: usuario.estado
        }
      })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // GET single usuario by ID
  router.get('/:id', async (req, res) => {
    try {
      const usuario = await db('usuarios').where('id', req.params.id).first()
      if (!usuario) {
        return res.status(404).json({ success: false, error: 'Usuario not found' })
      }
      res.json({ success: true, data: usuario })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // POST create new usuario
  router.post('/', async (req, res) => {
    try {
      const { nombre, email, telefono, contrasena, role, estado } = req.body

      if (!nombre || !email || !telefono || !contrasena) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: nombre, email, telefono, contrasena'
        })
      }

      const newUsuario = await db('usuarios').insert({
        nombre,
        email,
        telefono,
        contrasena,
        role: role || 'usuario',
        estado: estado || 'activo'
      })

      res.status(201).json({
        success: true,
        message: 'Usuario created successfully',
        id: newUsuario[0]
      })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // PUT update existing usuario
  router.put('/:id', async (req, res) => {
    try {
      const { nombre, email, telefono, contrasena, role, estado } = req.body

      const updatedUsuario = await db('usuarios')
        .where('id', req.params.id)
        .update({
          nombre,
          email,
          telefono,
          contrasena,
          role,
          estado
        })

      if (!updatedUsuario) {
        return res.status(404).json({ success: false, error: 'Usuario not found' })
      }

      res.json({ success: true, message: 'Usuario updated successfully' })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })


  // Delete usuario
  router.delete('/:id', async (req, res) => {
    try {
      const deleted = await db('usuarios').where('id', req.params.id).del()

      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Usuario not found' })
      }

      res.json({ success: true, message: 'Usuario deleted successfully' })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  return router
}

