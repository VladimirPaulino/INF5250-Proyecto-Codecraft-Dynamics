function handle(fn) {
  return async (req, res) => {
    try {
      await fn(req, res)
    } catch (err) {
      const status = err.statusCode || 500
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
