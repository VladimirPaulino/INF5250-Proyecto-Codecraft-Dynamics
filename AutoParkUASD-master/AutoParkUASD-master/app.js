const express = require('express')
const cors = require('cors')
const path = require('path')
const knex = require('knex')
const dbConfig = require('./database/db.config.js')

// Import route handlers
const usuariosRoutes = require('./routes/usuarios')
const espaciosParqueoRoutes = require('./routes/espacios_parqueo')
const vehiculosRoutes = require('./routes/vehiculos')
const ticketsRoutes = require('./routes/tickets')
const notificacionesRoutes = require('./routes/notificaciones')
const cambiosPuestosRoutes = require('./routes/cambios_puestos')
const auditLogsRoutes = require('./routes/audit_logs')
const espaciosDisponiblesRoutes = require('./routes/espacios_disponibles')
const reservacionesRoutes = require('./routes/reservaciones')
const seccionesParqueoRoutes = require('./routes/secciones_parqueo')
const pagosRoutes = require('./routes/pagos')
const ratesRoutes = require('./routes/rates')

const app = express()
const port = 3000

// Initialize database connection
const db = knex({
  client: 'mysql2',
  connection: dbConfig
})

app.use(express.json())
app.use(cors())

app.use('/html', express.static(path.join(__dirname, 'html')))
app.use('/css', express.static(path.join(__dirname, 'css')))
app.use('/js', express.static(path.join(__dirname, 'js')))
app.use('/img', express.static(path.join(__dirname, 'img')))

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'login.html'))
})

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'index.html'))
})

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'admin.html'))
})

app.get('/entrada', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'entrada.html'))
})

app.get('/salida', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'salida.html'))
})

app.get('/reportes', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'reportes.html'))
})

app.get('/vehiculo', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'vehiculo.html'))
})

app.get('/tickets', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'ticket.html'))
})

app.get('/reservacion', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'reservacion.html'))
})

app.get('/usuarios', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'usuarios.html'))
})

// Home endpoint redirects to the dashboard explicitly allows non-logged users
app.get('/', (req, res) => {
  res.redirect('/dashboard')
})

// Register routes
app.use('/api/usuarios', usuariosRoutes(db))
app.use('/api/espacios_parqueo', espaciosParqueoRoutes(db))
app.use('/api/vehiculos', vehiculosRoutes(db))
app.use('/api/tickets', ticketsRoutes(db))
app.use('/api/notificaciones', notificacionesRoutes(db))
app.use('/api/cambios_puestos', cambiosPuestosRoutes(db))
app.use('/api/audit_logs', auditLogsRoutes(db))
app.use('/api/espacios_disponibles', espaciosDisponiblesRoutes(db))
app.use('/api/reservaciones', reservacionesRoutes(db))
app.use('/api/secciones_parqueo', seccionesParqueoRoutes(db))
app.use('/api/pagos', pagosRoutes(db))
app.use('/api/rates', ratesRoutes(db))

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ success: false, error: 'Internal Server Error' })
})

app.listen(port, () => {
  console.log(`AUTOPARK API server listening on port ${port}`)
})
