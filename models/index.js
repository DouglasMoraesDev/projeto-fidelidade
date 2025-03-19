// models/index.js atualizado
const { Sequelize } = require('sequelize');
require('dotenv').config();

const DB_NAME = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'railway';
const DB_USER = process.env.MYSQLUSER || process.env.DB_USER || 'root';
const DB_PASS = process.env.MYSQLPASSWORD || process.env.DB_PASS || 'senha';
const DB_HOST = process.env.RAILWAY_TCP_PROXY_DOMAIN || process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.RAILWAY_TCP_PROXY_PORT || process.env.DB_PORT || 3306;

console.log(`Conectando ao MySQL: ${DB_HOST}:${DB_PORT}`);

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  dialectOptions: {
    connectTimeout: 60000,
    keepAlive: true,
    // Caso o Railway exija SSL, descomente a linha abaixo:
    // ssl: { rejectUnauthorized: false }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 60000  // aumentamos para 60 segundos
  },
  logging: console.log
});

module.exports = sequelize;
