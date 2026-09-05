const express = require('express')
const router = express.Router()

module.exports = (db) => {
  // GET all tickets
  router.get('/', async (req, res) => {
    try {
      const tickets = await db('tickets').select('*')
      res.json({ success: true, data: tickets, count: tickets.length })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // GET single ticket by ID
  router.get('/:id', async (req, res) => {
    try {
      const ticket = await db('tickets').where('id', req.params.id).first()
      if (!ticket) {
        return res.status(404).json({ success: false, error: 'Ticket not found' })
      }
      res.json({ success: true, data: ticket })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // POST create new ticket
  router.post('/', async (req, res) => {
    try {
      const { vehiculo_id, fecha_hora_entrada, fecha_hora_salida, total_pagar, status_de_pago } = req.body

      if (!vehiculo_id || !fecha_hora_entrada) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: vehiculo_id, fecha_hora_entrada'
        })
      }

      const newTicket = await db('tickets').insert({
        vehiculo_id,
        fecha_hora_entrada,
        fecha_hora_salida: fecha_hora_salida || null,
        total_pagar: total_pagar || 0,
        status_de_pago: status_de_pago || 'pendiente'
      })

      res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        id: newTicket[0]
      })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // PUT update existing ticket
  router.put('/:id', async (req, res) => {
    try {
      const { vehiculo_id, fecha_hora_entrada, fecha_hora_salida, total_pagar, status_de_pago } = req.body;

      const updatedTicket = await db('tickets')
        .where('id', req.params.id)
        .update({
          vehiculo_id,
          fecha_hora_entrada,
          fecha_hora_salida,
          total_pagar,
          status_de_pago
        })

      if (!updatedTicket) {
        return res.status(404).json({ success: false, error: 'Ticket not found' })
      }

      res.json({ success: true, message: 'Ticket updated successfully' })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // Delete a ticket
  router.delete('/:id', async (req, res) => {
    try {
      const deleted = await db('tickets').where('id', req.params.id).del()
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Ticket not found' })
      }

      res.json({ success: true, message: 'Ticket deleted successfully' })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  return router
}
