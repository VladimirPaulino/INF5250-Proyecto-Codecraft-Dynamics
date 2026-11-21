function handle(fn) {
  return async (req, res) => {
    try {
      await fn(req, res)
    } catch (err) {
      // RNF-03: los errores controlados (4xx) muestran su mensaje; los demás
      // se registran en el servidor y el navegador recibe un texto genérico,
      // sin SQL, rutas internas ni datos sensibles.
      const status = err.statusCode || 500
      if (status >= 500) {
        if (process.env.NODE_ENV !== 'test') console.error(err)
        return res.status(500).json({ success: false, error: 'Error interno del servidor' })
      }
      res.status(status).json({ success: false, error: err.message })
    }
  }
}

function listResponse(res, data) {
  res.json({ success: true, data, count: data.length })
}

function itemResponse(res, data) {
  res.json({ success: true, data })
}

function createdResponse(res, message, id) {
  res.status(201).json({ success: true, message, id })
}

function messageResponse(res, message) {
  res.json({ success: true, message })
}

module.exports = {
  handle,
  listResponse,
  itemResponse,
  createdResponse,
  messageResponse
}
