const express = require('express')
const CambioPuestoService = require('../classes/CambioPuestoService')
const { requireAuth, requireAdmin } = require('../classes/auth')
const { handle, listResponse, itemResponse, createdResponse, messageResponse } = require('../classes/routeHelpers')

module.exports = (db) => {
  const router = express.Router()
  const service = new CambioPuestoService(db)

  const esDuenoOAdmin = (req, usuarioId) =>
    req.user.role === 'admin' || String(req.user.id) === String(usuarioId)
  const prohibido = (res) => res.status(403).json({ success: false, error: 'No autorizado' })

  // Historial completo de cambios de puesto: solo administrador (revisión QA PR #17).
  router.get('/', requireAdmin, handle(async (req, res) => {
    const data = await service.findAll()
    listResponse(res, data)
  }))

  // Specific path must be registered before /:id
  router.get('/usuario/:usuario_id', requireAuth, handle(async (req, res) => {
    if (!esDuenoOAdmin(req, req.params.usuario_id)) return prohibido(res)
    const data = await service.findByUsuarioId(req.params.usuario_id)
    listResponse(res, data)
  }))

  router.get('/:id', requireAuth, handle(async (req, res) => {
    const data = await service.findById(req.params.id)
    if (!esDuenoOAdmin(req, data.usuario_id)) return prohibido(res)
    itemResponse(res, data)
  }))

  router.post('/', requireAdmin, handle(async (req, res) => {
    const id = await service.createFromBody(req.body)
    createdResponse(res, 'Cambio de puesto created successfully', id)
  }))

  router.delete('/:id', requireAdmin, handle(async (req, res) => {
    await service.delete(req.params.id)
    messageResponse(res, 'Cambio de puesto deleted successfully')
  }))

  router.put('/:id', requireAdmin, handle(async (req, res) => {
    await service.updateFromBody(req.params.id, req.body)
    messageResponse(res, 'Cambio de puesto updated successfully')
  }))

  return router
}
