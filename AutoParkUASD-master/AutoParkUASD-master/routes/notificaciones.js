const express = require('express')
const router = express.Router()

module.exports = (db) => {
  // GET all notificaciones
  router.get('/', async (req, res) => {
    try {
      const notificaciones = await db('notificaciones').select('*')
      res.json({ success: true, data: notificaciones, count: notificaciones.length })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // GET single notificacion by ID
  router.get('/:id', async (req, res) => {
    try {
      const notificacion = await db('notificaciones').where('id', req.params.id).first()
      if (!notificacion) {
        return res.status(404).json({ success: false, error: 'Notificacion not found' })
      }
      res.json({ success: true, data: notificacion })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // POST create new notificacion
  router.post('/', async (req, res) => {
    try {
      const { usuario_id, mensaje, tipo } = req.body

      if (!usuario_id || !mensaje) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: usuario_id, mensaje'
        })
      }

      const newNotificacion = await db('notificaciones').insert({
        usuario_id,
        mensaje,
        tipo: tipo || 'info'
      })

      res.status(201).json({
        success: true,
        message: 'Notificacion created successfully',
        id: newNotificacion[0]
      })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // Delete notificacion by ID
  router.delete('/:id', async (req, res) => {
    try {
      const deleted = await db('notificaciones').where('id', req.params.id).del()
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Notificacion not found' })
      }
      res.json({ success: true, message: 'Notificacion deleted successfully' })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // PUT update existing notificacion
  router.put('/:id', async (req, res) => {
    try {
      const { usuario_id, mensaje, tipo } = req.body

      const updated = await db('notificaciones')
        .where('id', req.params.id)
        .update({
          usuario_id,
          mensaje,
          tipo
        })

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Notificacion not found' })
      }

      res.json({ success: true, message: 'Notificacion updated successfully' })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })


  return router
}
