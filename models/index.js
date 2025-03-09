// models/index.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'guerra';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || 'sua_senha';
const DB_HOST = process.env.DB_HOST || 'localhost';

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize;
