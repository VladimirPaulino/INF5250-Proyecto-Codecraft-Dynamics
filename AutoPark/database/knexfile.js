const dbConfig = require("./db.config");

module.exports = {
  client: "mysql2",
  connection: dbConfig,
  migrations: {
    directory: "./knex/migrations",
  },
};