const express = require('express')
const router = express.Router()

module.exports = (db) => {
  // GET all vehiculos
  router.get('/', async (req, res) => {
    try {
      const vehiculos = await db('vehiculos').select('*')
      res.json({ success: true, data: vehiculos, count: vehiculos.length })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // GET single vehiculo by ID
  router.get('/:id', async (req, res) => {
    try {
      const vehiculo = await db('vehiculos').where('id', req.params.id).first()
      if (!vehiculo) {
        return res.status(404).json({ success: false, error: 'Vehiculo not found' })
      }
      res.json({ success: true, data: vehiculo })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // POST create new vehiculo
  router.post('/', async (req, res) => {
    try {
      const { usuario_id, placa, marca, modelo, color, tipo } = req.body

      if (!usuario_id || !placa) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: usuario_id, placa'
        })
      }

      const newVehiculo = await db('vehiculos').insert({
        usuario_id,
        placa,
        marca: marca || null,
        modelo: modelo || null,
        color: color || null,
        tipo: tipo || 'carro'
      })

      res.status(201).json({
        success: true,
        message: 'Vehiculo created successfully',
        id: newVehiculo[0]
      })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })


  // Delete vehiculo by ID
  router.delete('/:id', async (req, res) => {
    try {
      const deleted = await db('vehiculos').where('id', req.params.id).del()
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Vehiculo not found' })
      }
      res.json({ success: true, message: 'Vehiculo deleted successfully' })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // PUT update existing vehiculo
  router.put('/:id', async (req, res) => {
    try {
      const { usuario_id, placa, marca, modelo, color, tipo } = req.body

      const updated = await db('vehiculos')
        .where('id', req.params.id)
        .update({
          usuario_id,
          placa,
          marca,
          modelo,
          color,
          tipo
        })

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Vehiculo not found' })
      }

      res.json({ success: true, message: 'Vehiculo updated successfully' })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  return router
}
