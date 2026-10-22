const express = require('express');
const ClimaService = require('../classes/ClimaService');

function climaRoutes() {
  const router = express.Router();
  const climaService = new ClimaService();

  router.get('/', async (req, res) => {
    try {
      const datos = await climaService.obtenerClima();

      res.json({
        success: true,
        data: datos
      });
    } catch (error) {
      console.error('Error al consultar clima:', error.message);

      res.status(502).json({
        success: false,
        error: 'No fue posible consultar el servicio meteorologico'
      });
    }
  });

  return router;
}

module.exports = climaRoutes;