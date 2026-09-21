const express = require('express')
const EspacioDisponibleService = require('../classes/EspacioDisponibleService')
const { handle, listResponse, itemResponse, createdResponse, messageResponse } = require('../classes/routeHelpers')

module.exports = (db) => {
  const router = express.Router()
  const service = new EspacioDisponibleService(db)

  router.get('/', handle(async (req, res) => {
    const data = await service.findAll()
    listResponse(res, data)
  }))

  router.get('/:id', handle(async (req, res) => {
    const data = await service.findById(req.params.id)
    itemResponse(res, data)
  }))

  router.post('/', handle(async (req, res) => {
    const id = await service.createFromBody(req.body)
    createdResponse(res, 'Espacio disponible created successfully', id)
  }))

  router.put('/:id', handle(async (req, res) => {
    await service.updateFromBody(req.params.id, req.body)
    messageResponse(res, 'Espacio disponible updated successfully')
  }))

  router.delete('/:id', handle(async (req, res) => {
    await service.delete(req.params.id)
    messageResponse(res, 'Espacio disponible deleted successfully')
  }))

  return router
}
