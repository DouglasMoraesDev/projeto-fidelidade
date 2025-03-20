// models/establishment.js
const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const establishment = sequelize.define('establishment', { // Modelo em minúsculo
  name: { type: DataTypes.STRING, allowNull: false },
  "primary-color": { type: DataTypes.STRING, defaultValue: '#ff6347' },
  "secondary-color": { type: DataTypes.STRING, defaultValue: '#f39c12' },
  "background-color": { type: DataTypes.STRING, defaultValue: '#ecf0f1' },
  "container-bg": { type: DataTypes.STRING, defaultValue: '#ffffff' },
  "text-color": { type: DataTypes.STRING, defaultValue: '#2c3e50' },
  "header-bg": { type: DataTypes.STRING, defaultValue: '#ff6347' },
  "footer-bg": { type: DataTypes.STRING, defaultValue: '#34495e' },
  "footer-text": { type: DataTypes.STRING, defaultValue: '#ecf0f1' },
  "input-border": { type: DataTypes.STRING, defaultValue: '#f39c12' },
  "button-bg": { type: DataTypes.STRING, defaultValue: '#ff6347' },
  "button-text": { type: DataTypes.STRING, defaultValue: '#ffffff' },
  "section-margin": { type: DataTypes.STRING, defaultValue: '20px' },
  logoURL: { type: DataTypes.STRING, defaultValue: 'default-logo.png' },
  voucher_message: { type: DataTypes.TEXT, allowNull: true }, // Atualizado para TEXT se necessário
  // Novo campo para data do último pagamento
  lastPaymentDate: { type: DataTypes.DATE, allowNull: true }

}, {
  tableName: 'establishments',
  timestamps: false
});

module.exports = establishment;
