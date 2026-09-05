const express = require('express')
const router = express.Router()

module.exports = (db) => {
  // GET all pagos
  router.get('/', async (req, res) => {
    try {
      const pagos = await db('pagos').select('*')
      res.json({ success: true, data: pagos, count: pagos.length })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // GET single pago by ID
  router.get('/:id', async (req, res) => {
    try {
      const pago = await db('pagos').where('id', req.params.id).first()
      if (!pago) {
        return res.status(404).json({ success: false, error: 'Pago not found' })
      }
      res.json({ success: true, data: pago })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // POST create new pago
  router.post('/', async (req, res) => {
    try {
      const { usuario_id, ticket_id, monto, fecha_de_pago } = req.body

      if (!usuario_id || !ticket_id || !monto || !fecha_de_pago) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: usuario_id, ticket_id, monto, fecha_de_pago'
        })
      }

      const newPago = await db('pagos').insert({
        usuario_id,
        ticket_id,
        monto,
        fecha_de_pago
      })

      res.status(201).json({
        success: true,
        message: 'Pago created successfully',
        id: newPago[0]
      })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // Delete pago by ID
  router.delete('/:id', async (req, res) => {
    try {
      const deleted = await db('pagos').where('id', req.params.id).del()
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Pago not found' })
      }
      res.json({ success: true, message: 'Pago deleted successfully' })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    } });


  // PUT update existing pago
  router.put('/:id', async (req, res) => {
    try {
      const { usuario_id, ticket_id, monto, fecha_de_pago } = req.body;

      const updated = await db('pagos')
        .where('id', req.params.id)
        .update({
          usuario_id,
          ticket_id,
          monto,
          fecha_de_pago
        });

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Pago not found' });
      }

      res.json({ success: true, message: 'Pago updated successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
