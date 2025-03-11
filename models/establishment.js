// models/establishment.js
const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const establishment = sequelize.define('establishment', { // Modelo em minúsculo
  name: { type: DataTypes.STRING, allowNull: false },
  "primary-color": { type: DataTypes.STRING, defaultValue: '#3498db' },
  "secondary-color": { type: DataTypes.STRING, defaultValue: '#2ecc71' },
  "background-color": { type: DataTypes.STRING, defaultValue: '#f5f5f5' },
  "container-bg": { type: DataTypes.STRING, defaultValue: '#ffffff' },
  "text-color": { type: DataTypes.STRING, defaultValue: '#333333' },
  "header-bg": { type: DataTypes.STRING, defaultValue: '#2980b9' },
  "footer-bg": { type: DataTypes.STRING, defaultValue: '#34495e' },
  "footer-text": { type: DataTypes.STRING, defaultValue: '#ecf0f1' },
  "input-border": { type: DataTypes.STRING, defaultValue: '#cccccc' },
  "button-bg": { type: DataTypes.STRING, defaultValue: '#3498db' },
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
