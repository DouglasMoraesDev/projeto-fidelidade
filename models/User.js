// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const Establishment = require('./establishment');

const User = sequelize.define('User', {
  username: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true 
  },
  password: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  establishmentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'Users',
  timestamps: false
});

// Associações com onDelete e onUpdate CASCADE
Establishment.hasMany(User, { 
  foreignKey: { name: 'establishmentId', allowNull: false },
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
User.belongsTo(Establishment, { 
  foreignKey: { name: 'establishmentId', allowNull: false },
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

module.exports = User;
