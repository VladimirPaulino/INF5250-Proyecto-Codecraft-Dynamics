class ApiClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl
  }

  getToken() {
    return localStorage.getItem('token')
  }

  authHeaders() {
    const headers = { 'Content-Type': 'application/json' }
    const token = this.getToken()
    if (token) headers.Authorization = `Bearer ${token}`
    return headers
  }

  async request(endpoint, method = 'GET', data = null) {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint.replace(/^\//, '')}`, {
        method,
        headers: this.authHeaders(),
        body: data ? JSON.stringify(data) : null
      })

      const contentType = response.headers.get('content-type') || ''
      const payload = contentType.includes('application/json')
        ? await response.json()
        : { success: false, error: await response.text() }

      if (!response.ok && payload && !payload.error) {
        payload.error = `Error HTTP ${response.status}`
      }
      if (payload && payload.success === undefined) {
        payload.success = response.ok
      }
      return payload
    } catch (error) {
      console.error('Error de conexión:', error)
      return { success: false, error: 'No se pudo conectar con el servidor' }
    }
  }

  get(endpoint) {
    return this.request(endpoint, 'GET')
  }

  post(endpoint, data) {
    return this.request(endpoint, 'POST', data)
  }

  put(endpoint, data) {
    return this.request(endpoint, 'PUT', data)
  }

  delete(endpoint) {
    return this.request(endpoint, 'DELETE')
  }
}

const apiClient = new ApiClient()

async function peticionBackend(endpoint, metodo, datos) {
  return apiClient.request(endpoint, metodo, datos)
}

function authHeaders() {
  return apiClient.authHeaders()
}

function apiUrl(path) {
  return `/api/${String(path).replace(/^\//, '')}`
}
