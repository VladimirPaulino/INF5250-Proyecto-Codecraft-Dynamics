const express = require('express')
const RateService = require('../classes/RateService')
const { obtenerTarifaActiva, TARIFA_DEFECTO } = require('../classes/TarifaService')
const { handle, listResponse, itemResponse, createdResponse, messageResponse } = require('../classes/routeHelpers')
const { requireAuth, requireAdmin } = require('../classes/auth')

// M10 · Catálogo de tarifas (RF-28): lectura con sesión, cambios solo admin.
module.exports = (db) => {
  const router = express.Router()
  const service = new RateService(db)

  router.get('/', requireAuth, handle(async (req, res) => {
    const data = await service.findAll()
    listResponse(res, data)
  }))

  // Tarifa que se aplica hoy a cada tipo de vehículo.
  router.get('/vigente', requireAuth, handle(async (req, res) => {
    const data = {}
    for (const tipo of Object.keys(TARIFA_DEFECTO)) {
      const activa = await obtenerTarifaActiva(db, tipo)
      data[tipo] = activa
        ? { nombre: activa.nombre, monto: Number(activa.monto), unidad: activa.unidad, origen: 'catalogo' }
        : { ...TARIFA_DEFECTO[tipo], origen: 'defecto' }
    }
    itemResponse(res, data)
  }))

  router.get('/:id', requireAuth, handle(async (req, res) => {
    const data = await service.findById(req.params.id)
    itemResponse(res, data)
  }))

  router.post('/', requireAdmin, handle(async (req, res) => {
    const id = await service.createFromBody(req.body)
    createdResponse(res, 'Tarifa creada', id)
  }))

  router.delete('/:id', requireAdmin, handle(async (req, res) => {
    await service.delete(req.params.id)
    messageResponse(res, 'Tarifa eliminada')
  }))

  router.put('/:id', requireAdmin, handle(async (req, res) => {
    await service.updateFromBody(req.params.id, req.body)
    messageResponse(res, 'Tarifa actualizada')
  }))

  return router
}
