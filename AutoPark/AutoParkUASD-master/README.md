# AUTOPARK UASD

A parking management system built with Express.js and MySQL, featuring RESTful API endpoints, database migrations, and automation scripts.

**[English](#english) | [Español](#español)**

---

## English

### Table of Contents

- [Installation](#installation)
- [Available Commands](#available-commands)
- [API Endpoints](#api-endpoints)
- [Setup Guide](#setup-guide)
- [Project Structure](#project-structure)
- [Database Management](#database-management)

### Installation

```bash
npm install
```

This will install all required dependencies:
- **Express** ^5.2.1 - Web application framework
- **Knex** ^3.1.0 - SQL query builder and migration tool
- **MariaDB** ^3.5.2 - Database driver
- **MySQL2** ^3.20.0 - MySQL protocol driver

### Available Commands

#### Start Application
```bash
npm start
```
Starts the Express.js server on port 3000. Access the application at `http://localhost:3000`

#### Database Commands
```bash
npm run db:check       # Check database connection status
npm run db:create      # Create database and tables
npm run migrate        # Run pending migrations
npm run migrate:rollback   # Revert last migration batch
npm run migrate:status     # List migration status
```

### API Endpoints

The API provides RESTful endpoints for all 12 tables. Each endpoint supports both GET and POST requests.

#### Available Endpoints

| Resource | GET | POST |
|----------|-----|------|
| `/api/usuarios` | Get all users | Create new user |
| `/api/espacios_parqueo` | Get all parking spaces | Create new parking space |
| `/api/vehiculos` | Get all vehicles | Create new vehicle |
| `/api/tickets` | Get all tickets | Create new ticket |
| `/api/notificaciones` | Get all notifications | Create new notification |
| `/api/cambios_puestos` | Get all spot changes | Create new spot change |
| `/api/audit_logs` | Get all audit logs | Create new audit log |
| `/api/espacios_disponibles` | Get available spaces | Create space availability |
| `/api/reservaciones` | Get all reservations | Create new reservation |
| `/api/secciones_parqueo` | Get parking sections | Create parking section |
| `/api/pagos` | Get all payments | Create new payment |
| `/api/rates` | Get all rates | Create new rate |

#### GET Requests

**Get all records:**
```bash
GET /api/usuarios
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 5
}
```

**Get single record by ID:**
```bash
GET /api/usuarios/:id
```

#### POST Requests

**Create new record:**
```bash
POST /api/usuarios
Content-Type: application/json

{
  "nombre": "John Doe",
  "email": "john@example.com",
  "telefono": "555-1234",
  "contrasena": "securepass123",
  "role": "usuario",
  "estado": "activo"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usuario created successfully",
  "id": 1
}
```

### Setup Guide

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure database** - Update `database/db.config.js` with your MySQL connection details

3. **Create database**
   ```bash
   npm run db:create
   ```

4. **Check connection**
   ```bash
   npm run db:check
   ```

5. **Run migrations**
   ```bash
   npm run migrate
   ```

6. **Start server**
   ```bash
   npm start
   ```

### Project Structure

```
AUTOPARK_UASD/
├── app.js                      # Main Express application
├── package.json                # Dependencies and scripts
├── README.md                   # Documentation
├── routes/                     # API route handlers
│   ├── usuarios.js
│   ├── espacios_parqueo.js
│   ├── vehiculos.js
│   ├── tickets.js
│   ├── notificaciones.js
│   ├── cambios_puestos.js
│   ├── audit_logs.js
│   ├── espacios_disponibles.js
│   ├── reservaciones.js
│   ├── secciones_parqueo.js
│   ├── pagos.js
│   └── rates.js
└── database/
    ├── db.config.js            # Database configuration
    ├── knexfile.js             # Knex configuration
    ├── create_database.js
    ├── db_check.js
    ├── knex/
    │   └── migrations/
    │       └── 20250322120000_initial_schema.js
    └── sql/
        ├── CREATE_DATABASE.SQL
        └── CREATE_TABLES.sql
```

### Database Management

Each table has its own route file in the `routes/` directory. Routes are modular and accept a database connection instance.

**Creating a New Migration:**
```bash
knex migrate:make migration_name --knexfile database/knexfile.js
```

---

## Español

### Tabla de Contenidos

- [Instalación](#instalación)
- [Comandos Disponibles](#comandos-disponibles)
- [Endpoints de la API](#endpoints-de-la-api)
- [Guía de Configuración](#guía-de-configuración)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Gestión de Base de Datos](#gestión-de-base-de-datos)

### Instalación

```bash
npm install
```

Esto instalará todas las dependencias necesarias:
- **Express** ^5.2.1 - Framework de aplicación web
- **Knex** ^3.1.0 - Constructor de consultas SQL y herramienta de migración
- **MariaDB** ^3.5.2 - Controlador de base de datos
- **MySQL2** ^3.20.0 - Controlador de protocolo MySQL

### Comandos Disponibles

#### Iniciar Aplicación
```bash
npm start
```
Inicia el servidor Express.js en el puerto 3000. Accede a la aplicación en `http://localhost:3000`

#### Comandos de Base de Datos
```bash
npm run db:check            # Verificar estado de conexión a BD
npm run db:create           # Crear BD y tablas
npm run migrate             # Ejecutar migraciones pendientes
npm run migrate:rollback    # Revertir último lote de migraciones
npm run migrate:status      # Listar estado de migraciones
```

### Endpoints de la API

La API proporciona endpoints RESTful para las 12 tablas. Cada endpoint soporta solicitudes GET y POST.

#### Endpoints Disponibles

| Recurso | GET | POST |
|---------|-----|------|
| `/api/usuarios` | Obtener todos los usuarios | Crear nuevo usuario |
| `/api/espacios_parqueo` | Obtener espacios de parqueo | Crear nuevo espacio |
| `/api/vehiculos` | Obtener todos los vehículos | Crear nuevo vehículo |
| `/api/tickets` | Obtener todos los tickets | Crear nuevo ticket |
| `/api/notificaciones` | Obtener notificaciones | Crear notificación |
| `/api/cambios_puestos` | Obtener cambios de puestos | Crear cambio de puesto |
| `/api/audit_logs` | Obtener registros de auditoría | Crear registro de auditoría |
| `/api/espacios_disponibles` | Obtener espacios disponibles | Crear disponibilidad |
| `/api/reservaciones` | Obtener reservaciones | Crear reservación |
| `/api/secciones_parqueo` | Obtener secciones | Crear sección |
| `/api/pagos` | Obtener pagos | Crear pago |
| `/api/rates` | Obtener tarifas | Crear tarifa |

#### Solicitudes GET

**Obtener todos los registros:**
```bash
GET /api/usuarios
```

**Respuesta:**
```json
{
  "success": true,
  "data": [...],
  "count": 5
}
```

**Obtener un registro por ID:**
```bash
GET /api/usuarios/:id
```

#### Solicitudes POST

**Crear nuevo registro:**
```bash
POST /api/usuarios
Content-Type: application/json

{
  "nombre": "Juan García",
  "email": "juan@example.com",
  "telefono": "555-1234",
  "contrasena": "contraseña123",
  "role": "usuario",
  "estado": "activo"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuario created successfully",
  "id": 1
}
```

### Guía de Configuración

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar base de datos** - Actualiza `database/db.config.js` con tus detalles de conexión MySQL

3. **Crear base de datos**
   ```bash
   npm run db:create
   ```

4. **Verificar conexión**
   ```bash
   npm run db:check
   ```

5. **Ejecutar migraciones**
   ```bash
   npm run migrate
   ```

6. **Iniciar servidor**
   ```bash
   npm start
   ```

### Estructura del Proyecto

```
AUTOPARK_UASD/
├── app.js                      # Aplicación principal Express
├── package.json                # Dependencias y scripts
├── README.md                   # Documentación
├── routes/                     # Manejadores de rutas API
│   ├── usuarios.js
│   ├── espacios_parqueo.js
│   ├── vehiculos.js
│   ├── tickets.js
│   ├── notificaciones.js
│   ├── cambios_puestos.js
│   ├── audit_logs.js
│   ├── espacios_disponibles.js
│   ├── reservaciones.js
│   ├── secciones_parqueo.js
│   ├── pagos.js
│   └── rates.js
└── database/
    ├── db.config.js            # Configuración de base de datos
    ├── knexfile.js             # Configuración de Knex
    ├── create_database.js
    ├── db_check.js
    ├── knex/
    │   └── migrations/
    │       └── 20250322120000_initial_schema.js
    └── sql/
        ├── CREATE_DATABASE.SQL
        └── CREATE_TABLES.sql
```

### Gestión de Base de Datos

Cada tabla tiene su propio archivo de ruta en la carpeta `routes/`. Las rutas son modulares y aceptan una instancia de conexión de base de datos.

**Crear una Nueva Migración:**
```bash
knex migrate:make migration_name --knexfile database/knexfile.js
```

### Características Principales

- Endpoints RESTful para todas las tablas
- Gestión de conexión a base de datos
- Sistema de migración automática con Knex.js
- Soporte para bases de datos MySQL
- Manejo robusto de errores
- Validación de campos requeridos
- Estructura modular y escalable
