const express = require('express')
const AuditLogService = require('../classes/AuditLogService')
const { handle, listResponse, itemResponse, createdResponse } = require('../classes/routeHelpers')
const { requireAdmin } = require('../classes/auth')

// M12 · Bitácora (RF-61): solo el administrador la consulta y nadie la edita ni la borra.
module.exports = (db) => {
  const router = express.Router()
  const service = new AuditLogService(db)

  router.get('/', requireAdmin, handle(async (req, res) => {
    const data = await service.findAll()
    listResponse(res, data)
  }))

  router.get('/:id', requireAdmin, handle(async (req, res) => {
    const data = await service.findById(req.params.id)
    itemResponse(res, data)
  }))

  router.post('/', requireAdmin, handle(async (req, res) => {
    const id = await service.createFromBody({ ...req.body, usuario_id: req.user.id })
    createdResponse(res, 'Audit log created successfully', id)
  }))

  const inmutable = (req, res) => {
    res.status(405).json({ success: false, error: 'La bitácora no se puede modificar ni borrar' })
  }
  router.put('/:id', requireAdmin, inmutable)
  router.delete('/:id', requireAdmin, inmutable)

  return router
}
