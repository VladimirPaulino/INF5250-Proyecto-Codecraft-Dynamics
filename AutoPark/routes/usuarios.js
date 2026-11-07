const express = require('express')
const UsuarioService = require('../classes/UsuarioService')
const { handle, listResponse, itemResponse, createdResponse, messageResponse } = require('../classes/routeHelpers')
const { requireAuth, requireAdmin } = require('../classes/auth')

module.exports = (db) => {
  const router = express.Router()
  const service = new UsuarioService(db)

  router.post('/login', handle(async (req, res) => {
    const data = await service.login(req.body)
    itemResponse(res, data)
  }))

  router.get('/', requireAdmin, handle(async (req, res) => {
    const data = await service.findAll()
    listResponse(res, data)
  }))

  router.get('/:id', requireAuth, handle(async (req, res) => {
    if (req.user.role !== 'admin' && String(req.user.id) !== String(req.params.id)) {
      return res.status(403).json({ success: false, error: 'No autorizado' })
    }
    const data = await service.findById(req.params.id)
    itemResponse(res, data)
  }))

  router.post('/', requireAdmin, handle(async (req, res) => {
    const id = await service.createFromBody(req.body, req.user)
    createdResponse(res, 'Usuario created successfully', id)
  }))

  router.put('/:id', requireAuth, handle(async (req, res) => {
    if (req.user.role !== 'admin' && String(req.user.id) !== String(req.params.id)) {
      return res.status(403).json({ success: false, error: 'No autorizado' })
    }
    await service.updateFromBody(req.params.id, req.body, req.user)
    messageResponse(res, 'Usuario updated successfully')
  }))

  router.delete('/:id', requireAdmin, handle(async (req, res) => {
    await service.delete(req.params.id)
    messageResponse(res, 'Usuario deleted successfully')
  }))

  return router
}
