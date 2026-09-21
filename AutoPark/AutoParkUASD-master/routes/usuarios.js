const express = require('express')
const UsuarioService = require('../classes/UsuarioService')
const { handle, listResponse, itemResponse, createdResponse, messageResponse } = require('../classes/routeHelpers')

module.exports = (db) => {
  const router = express.Router()
  const service = new UsuarioService(db)

  router.get('/', handle(async (req, res) => {
    const data = await service.findAll()
    listResponse(res, data)
  }))

  router.post('/login', handle(async (req, res) => {
    const data = await service.login(req.body)
    itemResponse(res, data)
  }))

  router.get('/:id', handle(async (req, res) => {
    const data = await service.findById(req.params.id)
    itemResponse(res, data)
  }))

  router.post('/', handle(async (req, res) => {
    const id = await service.createFromBody(req.body)
    createdResponse(res, 'Usuario created successfully', id)
  }))

  router.put('/:id', handle(async (req, res) => {
    await service.updateFromBody(req.params.id, req.body)
    messageResponse(res, 'Usuario updated successfully')
  }))

  router.delete('/:id', handle(async (req, res) => {
    await service.delete(req.params.id)
    messageResponse(res, 'Usuario deleted successfully')
  }))

  return router
}
