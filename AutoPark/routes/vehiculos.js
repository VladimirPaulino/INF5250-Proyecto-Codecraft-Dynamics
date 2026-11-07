const express = require('express')
const VehiculoService = require('../classes/VehiculoService')
const { handle, listResponse, itemResponse, createdResponse, messageResponse } = require('../classes/routeHelpers')
const { requireAuth, optionalAuth } = require('../classes/auth')

module.exports = (db) => {
  const router = express.Router()
  const service = new VehiculoService(db)

  router.get('/', optionalAuth, handle(async (req, res) => {
    const data = await service.findAll()
    listResponse(res, data)
  }))

  router.get('/:id', optionalAuth, handle(async (req, res) => {
    const data = await service.findById(req.params.id)
    itemResponse(res, data)
  }))

  router.post('/', requireAuth, handle(async (req, res) => {
    const id = await service.createFromBody({ ...req.body, usuario_id: req.body.usuario_id || req.user.id })
    createdResponse(res, 'Vehiculo created successfully', id)
  }))

  router.delete('/:id', requireAuth, handle(async (req, res) => {
    await service.delete(req.params.id)
    messageResponse(res, 'Vehiculo deleted successfully')
  }))

  router.put('/:id', requireAuth, handle(async (req, res) => {
    await service.updateFromBody(req.params.id, req.body)
    messageResponse(res, 'Vehiculo updated successfully')
  }))

  return router
}
