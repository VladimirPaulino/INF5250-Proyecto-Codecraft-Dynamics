const express = require('express')
const router = express.Router()

module.exports = (db) => {
  // GET all espacios_parqueo
  router.get('/', async (req, res) => {
    try {
      const espacios = await db('espacios_parqueo').select('*')
      res.json({ success: true, data: espacios, count: espacios.length })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // GET single espacio by ID
  router.get('/:id', async (req, res) => {
    try {
      const espacio = await db('espacios_parqueo').where('id', req.params.id).first()
      if (!espacio) {
        return res.status(404).json({ success: false, error: 'Espacio not found' })
      }
      res.json({ success: true, data: espacio })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // POST create new espacio_parqueo
  router.post('/', async (req, res) => {
    try {
      const { name, address, espacio_total, tiempo_abierto, tiempo_cerrado } = req.body

      if (!name || !address || espacio_total === undefined || tiempo_abierto === undefined || tiempo_cerrado === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, address, espacio_total, tiempo_abierto, tiempo_cerrado'
        })
      }

      const newEspacio = await db('espacios_parqueo').insert({
        name,
        address,
        espacio_total,
        tiempo_abierto,
        tiempo_cerrado
      })

      res.status(201).json({
        success: true,
        message: 'Espacio parqueo created successfully',
        id: newEspacio[0]
      })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })


  router.delete('/:id', async (req, res) => {
    try {
      const deleted = await db('espacios_parqueo').where('id', req.params.id).del()
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Espacio not found' })
      }
      res.json({ success: true, message: 'Espacio deleted successfully' })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // PUT update existing espacio_parqueo
  router.put('/:id', async (req, res) => {
    try {
      const { name, address, espacio_total, tiempo_abierto, tiempo_cerrado } = req.body

      const updated = await db('espacios_parqueo')
        .where('id', req.params.id)
        .update({
          name,
          address,
          espacio_total,
          tiempo_abierto,
          tiempo_cerrado
        })

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Espacio not found' })
      }

      res.json({ success: true, message: 'Espacio updated successfully' })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })


  return router
}
