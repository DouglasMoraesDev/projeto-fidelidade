// models/Client.js
const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const Establishment = require('./establishment');

const Client = sequelize.define('Client', {
  fullName: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  phone: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  email: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  points: { 
    type: DataTypes.INTEGER, 
    defaultValue: 0 
  },
  establishmentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'Clients',
  timestamps: false
});

// Associação: um Establishment tem muitos Clients
Establishment.hasMany(Client, { foreignKey: 'establishmentId' });
Client.belongsTo(Establishment, { foreignKey: 'establishmentId' });

module.exports = Client;
