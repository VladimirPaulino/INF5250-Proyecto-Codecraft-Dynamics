class ApiClient {
  constructor(baseUrl = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl
  }

  async request(endpoint, method = 'GET', data = null) {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : null
      })

      return await response.json()
    } catch (error) {
      console.error('Error de conexión:', error)
      return { error: 'No se pudo conectar con el servidor' }
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

// Compatibilidad con páginas existentes
async function peticionBackend(endpoint, metodo, datos) {
  return apiClient.request(endpoint, metodo, datos)
}
