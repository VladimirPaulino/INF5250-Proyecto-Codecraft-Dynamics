const express = require('express')
const ReservacionService = require('../classes/ReservacionService')
const { handle, listResponse, itemResponse, createdResponse, messageResponse } = require('../classes/routeHelpers')

module.exports = (db) => {
  const router = express.Router()
  const service = new ReservacionService(db)

  // GET /api/reservaciones?q=placa-o-cliente&estado=confirmada
  router.get('/', handle(async (req, res) => {
    const data = await service.listar({ q: req.query.q, estado: req.query.estado })
    listResponse(res, data)
  }))

  router.get('/:id', handle(async (req, res) => {
    const data = await service.findById(req.params.id)
    itemResponse(res, data)
  }))

  router.post('/', handle(async (req, res) => {
    const id = await service.createFromBody(req.body)
    createdResponse(res, 'Reservación confirmada', id)
  }))

  router.patch('/:id/cancelar', handle(async (req, res) => {
    await service.cancelar(req.params.id)
    messageResponse(res, 'Reservación cancelada')
  }))

  router.patch('/:id/llegada', handle(async (req, res) => {
    const ticketId = await service.registrarLlegada(req.params.id)
    res.json({ success: true, message: 'Llegada registrada', ticket_id: ticketId })
  }))

  router.delete('/:id', handle(async (req, res) => {
    await service.delete(req.params.id)
    messageResponse(res, 'Reservacion deleted successfully')
  }))

  router.put('/:id', handle(async (req, res) => {
    await service.updateFromBody(req.params.id, req.body)
    messageResponse(res, 'Reservacion updated successfully')
  }))

  return router
}
