const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const dbConfig = {
  host: process.env.DB_HOST || "0.0.0.0",
  port: toInt(process.env.DB_PORT, 3307),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "holamundo",
  database: process.env.DB_NAME || "sistema_parqueos",
};

module.exports = dbConfig;
