const express = require('express')
const TicketService = require('../classes/TicketService')
const { handle, listResponse, itemResponse, createdResponse, messageResponse } = require('../classes/routeHelpers')
const { requireAuth, optionalAuth } = require('../classes/auth')

module.exports = (db) => {
  const router = express.Router()
  const service = new TicketService(db)

  router.get('/', optionalAuth, handle(async (req, res) => {
    const data = await service.findAll()
    listResponse(res, data)
  }))

  // RF-18 y RF-21: entrada que reutiliza la placa y rechaza un segundo ticket abierto
  router.post('/entrada', requireAuth, handle(async (req, res) => {
    const { placa, tipo, fecha_hora_entrada } = req.body
    const result = await service.registrarEntrada({
      placa,
      tipo,
      usuario_id: req.user.id,
      fecha_hora_entrada
    })
    res.status(201).json({ success: true, message: 'Entrada registrada', id: result.ticket_id, ...result })
  }))

  router.get('/salida/cotizar', requireAuth, handle(async (req, res) => {
    const data = await service.cotizarSalida({
      ticket_id: req.query.ticket_id,
      placa: req.query.placa
    })
    itemResponse(res, data)
  }))

  router.post('/salida', requireAuth, handle(async (req, res) => {
    const result = await service.registrarSalida({
      ticket_id: req.body.ticket_id,
      placa: req.body.placa,
      usuario_id: req.user.id,
      fecha_hora_salida: req.body.fecha_hora_salida
    })
    res.status(201).json({ success: true, message: 'Salida registrada', ...result })
  }))

  router.get('/:id', optionalAuth, handle(async (req, res) => {
    const data = await service.findById(req.params.id)
    itemResponse(res, data)
  }))

  router.post('/', requireAuth, handle(async (req, res) => {
    const id = await service.createFromBody({ ...req.body, usuario_id: req.user.id })
    createdResponse(res, 'Ticket created successfully', id)
  }))

  router.put('/:id', requireAuth, handle(async (req, res) => {
    await service.updateFromBody(req.params.id, req.body)
    messageResponse(res, 'Ticket updated successfully')
  }))

  router.delete('/:id', requireAuth, handle(async (req, res) => {
    await service.delete(req.params.id)
    messageResponse(res, 'Ticket deleted successfully')
  }))

  return router
}
