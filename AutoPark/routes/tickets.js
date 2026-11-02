const express = require('express')
const TicketService = require('../classes/TicketService')
const { handle, listResponse, itemResponse, createdResponse, messageResponse } = require('../classes/routeHelpers')

module.exports = (db) => {
  const router = express.Router()
  const service = new TicketService(db)

  router.get('/', handle(async (req, res) => {
    const data = await service.findAll()
    listResponse(res, data)
  }))

  // RF-18 y RF-21: entrada que reutiliza la placa y rechaza un segundo ticket abierto
  router.post('/entrada', handle(async (req, res) => {
    const { placa, tipo, usuario_id, fecha_hora_entrada } = req.body
    const result = await service.registrarEntrada({ placa, tipo, usuario_id, fecha_hora_entrada })
    res.status(201).json({ success: true, message: 'Entrada registrada', id: result.ticket_id, ...result })
  }))

  router.get('/:id', handle(async (req, res) => {
    const data = await service.findById(req.params.id)
    itemResponse(res, data)
  }))

  router.post('/', handle(async (req, res) => {
    const id = await service.createFromBody(req.body)
    createdResponse(res, 'Ticket created successfully', id)
  }))

  router.put('/:id', handle(async (req, res) => {
    await service.updateFromBody(req.params.id, req.body)
    messageResponse(res, 'Ticket updated successfully')
  }))

  router.delete('/:id', handle(async (req, res) => {
    await service.delete(req.params.id)
    messageResponse(res, 'Ticket deleted successfully')
  }))

  return router
}
