const mysql = require("mysql2/promise");
const dbConfig = require("./db.config");

async function main() {
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database
  });

  try {
    const rows = await connection.query("SELECT USER() AS user, @@hostname AS host");
    console.log("DB connection successful.");
    console.log(rows[0]);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("DB connection failed with current env settings.");
  console.error(
    `Tried host=${dbConfig.host} port=${dbConfig.port} user=${dbConfig.user} db=${dbConfig.database}`
  );
  console.error(err);
  process.exitCode = 1;
});
