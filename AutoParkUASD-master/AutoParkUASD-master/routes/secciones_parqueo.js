const express = require('express')
const router = express.Router()

module.exports = (db) => {
  // GET all secciones_parqueo
  router.get('/', async (req, res) => {
    try {
      const secciones = await db('secciones_parqueo').select('*')
      res.json({ success: true, data: secciones, count: secciones.length })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // GET single seccion by ID
  router.get('/:id', async (req, res) => {
    try {
      const seccion = await db('secciones_parqueo').where('id', req.params.id).first()
      if (!seccion) {
        return res.status(404).json({ success: false, error: 'Seccion parqueo not found' })
      }
      res.json({ success: true, data: seccion })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // POST create new seccion_parqueo
  router.post('/', async (req, res) => {
    try {
      const { vehiculo_id, espacio_id, estado } = req.body

      if (!vehiculo_id || !espacio_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: vehiculo_id, espacio_id'
        })
      }

      const newSeccion = await db('secciones_parqueo').insert({
        vehiculo_id,
        espacio_id,
        estado: estado || 'disponible'
      })

      res.status(201).json({
        success: true,
        message: 'Seccion parqueo created successfully',
        id: newSeccion[0]
      })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // PUT update existing seccion_parqueo
  router.put('/:id', async (req, res) => {
    try {
      const { vehiculo_id, espacio_id, estado } = req.body

      const updated = await db('secciones_parqueo')
        .where('id', req.params.id)
        .update({
          vehiculo_id,
          espacio_id,
          estado
        })

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Seccion parqueo not found' })
      }

      res.json({ success: true, message: 'Seccion parqueo updated successfully' })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })


  // Delete a seccion_parqueo
  router.delete('/:id', async (req, res) => {
    try {
      const deleted = await db('secciones_parqueo')
        .where('id', req.params.id)
        .del()

      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Seccion parqueo not found' })
      }

      res.json({ success: true, message: 'Seccion parqueo deleted successfully' })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  return router
}
