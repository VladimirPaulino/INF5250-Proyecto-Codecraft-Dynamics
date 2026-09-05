const express = require('express')
const router = express.Router()

module.exports = (db) => {
  // GET all espacios_disponibles
  router.get('/', async (req, res) => {
    try {
      const disponibles = await db('espacios_disponibles').select('*')
      res.json({ success: true, data: disponibles, count: disponibles.length })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // GET single espacio_disponible by ID
  router.get('/:id', async (req, res) => {
    try {
      const disponible = await db('espacios_disponibles').where('id', req.params.id).first()
      if (!disponible) {
        return res.status(404).json({ success: false, error: 'Espacio disponible not found' })
      }
      res.json({ success: true, data: disponible })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // POST create new espacio_disponible
  router.post('/', async (req, res) => {
    try {
      const { espacio_id, disponible } = req.body

      if (!espacio_id || disponible === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: espacio_id, disponible'
        })
      }

      const newDisponible = await db('espacios_disponibles').insert({
        espacio_id,
        disponible
      })

      res.status(201).json({
        success: true,
        message: 'Espacio disponible created successfully',
        id: newDisponible[0]
      })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // PUT update existing espacio_disponible
  router.put('/:id', async (req, res) => {
    try {
      const { espacio_id, disponible } = req.body
      if (!espacio_id || disponible === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: espacio_id, disponible'
        })
      }

      const updated = await db('espacios_disponibles')
        .where('id', req.params.id)
        .update({
          espacio_id,
          disponible
        })

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Espacio disponible not found' })
      }

      res.json({ success: true, message: 'Espacio disponible updated successfully' })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // DELETE delete existing espacio_disponible
  router.delete('/:id', async (req, res) => {
    try {
      const deleted = await db('espacios_disponibles').where('id', req.params.id).del()
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Espacio disponible not found' })
      }
      res.json({ success: true, message: 'Espacio disponible deleted successfully' })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })


  return router
}
