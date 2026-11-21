const express = require('express')
const EspacioParqueoService = require('../classes/EspacioParqueoService')
const { requireAuth, requireAdmin } = require('../classes/auth')
const { handle, listResponse, itemResponse, createdResponse, messageResponse } = require('../classes/routeHelpers')

module.exports = (db) => {
  const router = express.Router()
  const service = new EspacioParqueoService(db)

  router.get('/', requireAuth, handle(async (req, res) => {
    const data = await service.findAll()
    listResponse(res, data)
  }))

  router.get('/:id', requireAuth, handle(async (req, res) => {
    const data = await service.findById(req.params.id)
    itemResponse(res, data)
  }))

  router.post('/', requireAdmin, handle(async (req, res) => {
    const id = await service.createFromBody(req.body)
    createdResponse(res, 'Espacio parqueo created successfully', id)
  }))

  router.delete('/:id', requireAdmin, handle(async (req, res) => {
    await service.delete(req.params.id)
    messageResponse(res, 'Espacio deleted successfully')
  }))

  router.put('/:id', requireAdmin, handle(async (req, res) => {
    await service.updateFromBody(req.params.id, req.body)
    messageResponse(res, 'Espacio updated successfully')
  }))

  return router
}
