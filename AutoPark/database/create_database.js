const dbConfig = require("./db.config");

const knex = require("knex")({
  client: "mysql2",
  connection: {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
  },
});

async function main() {
  try {
    await knex.raw(
      "CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
      [dbConfig.database]
    );
    console.log(`Database ready: ${dbConfig.database}`);
  } finally {
    await knex.destroy();
  }
}

main().catch((err) => {
  if (err && err.code === "ER_ACCESS_DENIED_ERROR") {
    console.error(
      "DB auth failed. Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME env vars, then retry."
    );
  }
  console.error(err);
  process.exitCode = 1;
});