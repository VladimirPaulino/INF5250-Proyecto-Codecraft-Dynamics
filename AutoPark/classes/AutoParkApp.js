const express = require('express')
const cors = require('cors')
const path = require('path')

const usuariosRoutes = require('../routes/usuarios')
const espaciosParqueoRoutes = require('../routes/espacios_parqueo')
const vehiculosRoutes = require('../routes/vehiculos')
const ticketsRoutes = require('../routes/tickets')
const notificacionesRoutes = require('../routes/notificaciones')
const cambiosPuestosRoutes = require('../routes/cambios_puestos')
const auditLogsRoutes = require('../routes/audit_logs')
const espaciosDisponiblesRoutes = require('../routes/espacios_disponibles')
const reservacionesRoutes = require('../routes/reservaciones')
const seccionesParqueoRoutes = require('../routes/secciones_parqueo')
const pagosRoutes = require('../routes/pagos')
const ratesRoutes = require('../routes/rates')

class AutoParkApp {
  constructor(db, options = {}) {
    this.db = db
    this.port = options.port || 3000
    this.rootDir = options.rootDir || path.join(__dirname, '..')
    this.app = express()

    this.setupMiddleware()
    this.setupStatic()
    this.setupPages()
    this.setupApiRoutes()
    this.setupErrorHandling()
  }

  setupMiddleware() {
    this.app.use(express.json())
    this.app.use(cors())
  }

  setupStatic() {
    this.app.use('/html', express.static(path.join(this.rootDir, 'html')))
    this.app.use('/css', express.static(path.join(this.rootDir, 'css')))
    this.app.use('/js', express.static(path.join(this.rootDir, 'js')))
    this.app.use('/img', express.static(path.join(this.rootDir, 'img')))
  }

  setupPages() {
    const pages = {
      '/login': 'login.html',
      '/dashboard': 'index.html',
      '/admin': 'admin.html',
      '/entrada': 'entrada.html',
      '/salida': 'salida.html',
      '/reportes': 'reportes.html',
      '/vehiculo': 'vehiculo.html',
      '/tickets': 'ticket.html',
      '/reservacion': 'reservacion.html',
      '/usuarios': 'usuarios.html'
    }

    Object.entries(pages).forEach(([route, file]) => {
      this.app.get(route, (req, res) => {
        res.sendFile(path.join(this.rootDir, 'html', file))
      })
    })

    this.app.get('/', (req, res) => {
      res.redirect('/dashboard')
    })
  }

  setupApiRoutes() {
    this.app.use('/api/usuarios', usuariosRoutes(this.db))
    this.app.use('/api/espacios_parqueo', espaciosParqueoRoutes(this.db))
    this.app.use('/api/vehiculos', vehiculosRoutes(this.db))
    this.app.use('/api/tickets', ticketsRoutes(this.db))
    this.app.use('/api/notificaciones', notificacionesRoutes(this.db))
    this.app.use('/api/cambios_puestos', cambiosPuestosRoutes(this.db))
    this.app.use('/api/audit_logs', auditLogsRoutes(this.db))
    this.app.use('/api/espacios_disponibles', espaciosDisponiblesRoutes(this.db))
    this.app.use('/api/reservaciones', reservacionesRoutes(this.db))
    this.app.use('/api/secciones_parqueo', seccionesParqueoRoutes(this.db))
    this.app.use('/api/pagos', pagosRoutes(this.db))
    this.app.use('/api/rates', ratesRoutes(this.db))
  }

  setupErrorHandling() {
    this.app.use((err, req, res, next) => {
      console.error(err)
      res.status(500).json({ success: false, error: 'Internal Server Error' })
    })
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`AUTOPARK API server listening on port ${this.port}`)
    })
    return this.app
  }
}

module.exports = AutoParkApp
