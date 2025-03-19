// models/index.js atualizado
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use exatamente os nomes das variáveis do Railway
const DB_NAME = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'railway';
const DB_USER = process.env.MYSQLUSER || process.env.DB_USER || 'root';
const DB_PASS = process.env.MYSQLPASSWORD || process.env.DB_PASS || 'senha';
// Para conexões locais usando railway run, use o proxy e porta pública
const DB_HOST = process.env.RAILWAY_TCP_PROXY_DOMAIN || process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.RAILWAY_TCP_PROXY_PORT || process.env.DB_PORT || 3306;

// Log para debugging
console.log(`Conectando ao MySQL: ${DB_HOST}:${DB_PORT}`);

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  dialectOptions: {
    connectTimeout: 60000
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 10000
  },
  logging: console.log
});



module.exports = sequelize;