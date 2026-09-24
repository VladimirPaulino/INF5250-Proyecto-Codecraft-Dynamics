const knex = require('knex')
const dbConfig = require('./database/db.config.js')
const AutoParkApp = require('./classes/AutoParkApp')

const db = knex({
  client: 'mysql2',
  connection: dbConfig
})

const app = new AutoParkApp(db, { port: 3000 })
app.start()
