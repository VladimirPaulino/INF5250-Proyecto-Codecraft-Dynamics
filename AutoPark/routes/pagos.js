const express = require('express')
const PagoService = require('../classes/PagoService')
const { handle, listResponse, itemResponse, createdResponse, messageResponse } = require('../classes/routeHelpers')
const { requireAuth, requireAdmin } = require('../classes/auth')

module.exports = (db) => {
  const router = express.Router()
  const service = new PagoService(db)

  router.get('/', requireAuth, handle(async (req, res) => {
    const data = await service.findAll()
    listResponse(res, data)
  }))

  router.get('/:id', requireAuth, handle(async (req, res) => {
    const data = await service.findById(req.params.id)
    itemResponse(res, data)
  }))

  // Los pagos de salida se crean vía POST /api/tickets/salida
  router.post('/', requireAdmin, handle(async (req, res) => {
    const id = await service.createFromBody(req.body)
    createdResponse(res, 'Pago created successfully', id)
  }))

  router.delete('/:id', requireAdmin, handle(async (req, res) => {
    await service.delete(req.params.id)
    messageResponse(res, 'Pago deleted successfully')
  }))

  router.put('/:id', requireAdmin, handle(async (req, res) => {
    await service.updateFromBody(req.params.id, req.body)
    messageResponse(res, 'Pago updated successfully')
  }))

  return router
}
