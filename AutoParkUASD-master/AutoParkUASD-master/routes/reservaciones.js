const express = require('express')
const router = express.Router()

module.exports = (db) => {
  // GET all reservaciones
  router.get('/', async (req, res) => {
    try {
      const reservaciones = await db('reservaciones').select('*')
      res.json({ success: true, data: reservaciones, count: reservaciones.length })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // GET single reservacion by ID
  router.get('/:id', async (req, res) => {
    try {
      const reservacion = await db('reservaciones').where('id', req.params.id).first()
      if (!reservacion) {
        return res.status(404).json({ success: false, error: 'Reservacion not found' })
      }
      res.json({ success: true, data: reservacion })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // POST create new reservacion
  router.post('/', async (req, res) => {
    try {
      const { usuario_id, espacio_id, fecha_de_entrada, fecha_de_salida } = req.body

      if (!usuario_id || !espacio_id || !fecha_de_entrada) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: usuario_id, espacio_id, fecha_de_entrada'
        })
      }

      const newReservacion = await db('reservaciones').insert({
        usuario_id,
        espacio_id,
        fecha_de_entrada,
        fecha_de_salida: fecha_de_salida || null
      })

      res.status(201).json({
        success: true,
        message: 'Reservacion created successfully',
        id: newReservacion[0]
      })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // Delete reservacion by ID
  router.delete('/:id', async (req, res) => {
    try {
      const deleted = await db('reservaciones').where('id', req.params.id).del()
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Reservacion not found' })
      }
      res.json({ success: true, message: 'Reservacion deleted successfully' })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // PUT update existing reservacion
  router.put('/:id', async (req, res) => {
    try {
      const { usuario_id, espacio_id, fecha_de_entrada, fecha_de_salida } = req.body

      const updated = await db('reservaciones')
        .where('id', req.params.id)
        .update({
          usuario_id,
          espacio_id,
          fecha_de_entrada,
          fecha_de_salida
        })

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Reservacion not found' })
      }

      res.json({ success: true, message: 'Reservacion updated successfully' })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  return router
}
