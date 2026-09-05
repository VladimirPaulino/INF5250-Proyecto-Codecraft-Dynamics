const express = require('express')
const router = express.Router()

module.exports = (db) => {
  // GET all audit_logs
  router.get('/', async (req, res) => {
    try {
      const logs = await db('audit_logs').select('*')
      res.json({ success: true, data: logs, count: logs.length })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // GET single audit_log by ID
  router.get('/:id', async (req, res) => {
    try {
      const log = await db('audit_logs').where('id', req.params.id).first()
      if (!log) {
        return res.status(404).json({ success: false, error: 'Audit log not found' })
      }
      res.json({ success: true, data: log })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // POST create new audit_log
  router.post('/', async (req, res) => {
    try {
      const { usuario_id, accion, detalle } = req.body

      if (!usuario_id || !accion || !detalle) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: usuario_id, accion, detalle'
        })
      }

      const newLog = await db('audit_logs').insert({
        usuario_id,
        accion,
        detalle
      })

      res.status(201).json({
        success: true,
        message: 'Audit log created successfully',
        id: newLog[0]
      })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // Delete audit_log by ID
  router.delete('/:id', async (req, res) => {
    try {
      const deleted = await db('audit_logs').where('id', req.params.id).del();
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Audit log not found' })
      }
      res.json({ success: true, message: 'Audit log deleted successfully' })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // Update audit_log by ID
  router.put('/:id', async (req, res) => {
    try {
      const { usuario_id, accion, detalle } = req.body

      if (!usuario_id || !accion || !detalle) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: usuario_id, accion, detalle'
        })
      }

      const updated = await db('audit_logs')
        .where('id', req.params.id)
        .update({
          usuario_id,
          accion,
          detalle
        })

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Audit log not found' })
      }

      res.json({ success: true, message: 'Audit log updated successfully' })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  return router
}
