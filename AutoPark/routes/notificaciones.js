const express = require('express')
const NotificacionService = require('../classes/NotificacionService')
const { handle, listResponse, itemResponse, createdResponse, messageResponse } = require('../classes/routeHelpers')
const { requireAuth, requireAdmin } = require('../classes/auth')

// M11 · Notificaciones (RF-60).
module.exports = (db) => {
  const router = express.Router()
  const service = new NotificacionService(db)

  // Avisos del usuario de la sesión.
  router.get('/mias', requireAuth, handle(async (req, res) => {
    const data = await service.listarDeUsuario(req.user.id)
    listResponse(res, data)
  }))

  router.get('/', requireAdmin, handle(async (req, res) => {
    const data = await service.findAll()
    listResponse(res, data)
  }))

  router.get('/:id', requireAuth, handle(async (req, res) => {
    const data = await service.findById(req.params.id)
    if (req.user.role !== 'admin' && String(data.usuario_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'No autorizado' })
    }
    itemResponse(res, data)
  }))

  router.post('/', requireAdmin, handle(async (req, res) => {
    const id = await service.createFromBody(req.body)
    createdResponse(res, 'Notificacion created successfully', id)
  }))

  router.delete('/:id', requireAdmin, handle(async (req, res) => {
    await service.delete(req.params.id)
    messageResponse(res, 'Notificacion deleted successfully')
  }))

  router.put('/:id', requireAdmin, handle(async (req, res) => {
    await service.updateFromBody(req.params.id, req.body)
    messageResponse(res, 'Notificacion updated successfully')
  }))

  return router
}
