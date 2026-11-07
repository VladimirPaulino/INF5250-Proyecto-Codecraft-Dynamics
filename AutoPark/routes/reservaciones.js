const express = require('express')
const ReservacionService = require('../classes/ReservacionService')
const { handle, listResponse, itemResponse, createdResponse, messageResponse } = require('../classes/routeHelpers')
const { requireAuth } = require('../classes/auth')

module.exports = (db) => {
  const router = express.Router()
  const service = new ReservacionService(db)

  // GET /api/reservaciones?q=placa-o-cliente&estado=confirmada
  router.get('/', requireAuth, handle(async (req, res) => {
    const data = await service.listar({ q: req.query.q, estado: req.query.estado })
    listResponse(res, data)
  }))

  router.get('/:id', requireAuth, handle(async (req, res) => {
    const data = await service.findById(req.params.id)
    itemResponse(res, data)
  }))

  router.post('/', requireAuth, handle(async (req, res) => {
    const id = await service.createFromBody({ ...req.body, usuario_id: req.user.id })
    createdResponse(res, 'Reservación confirmada', id)
  }))

  router.patch('/:id/cancelar', requireAuth, handle(async (req, res) => {
    await service.cancelar(req.params.id)
    messageResponse(res, 'Reservación cancelada')
  }))

  router.patch('/:id/llegada', requireAuth, handle(async (req, res) => {
    const ticketId = await service.registrarLlegada(req.params.id)
    res.json({ success: true, message: 'Llegada registrada', ticket_id: ticketId })
  }))

  router.delete('/:id', requireAuth, handle(async (req, res) => {
    await service.cancelar(req.params.id)
    messageResponse(res, 'Reservación cancelada')
  }))

  router.put('/:id', requireAuth, handle(async (req, res) => {
    await service.updateFromBody(req.params.id, req.body)
    messageResponse(res, 'Reservacion updated successfully')
  }))

  return router
}
