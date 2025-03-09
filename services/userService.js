// services/userService.js
const User = require('../models/User');
const Establishment = require('../models/establishment');

const login = async (username, password) => {
  const user = await User.findOne({ where: { username, password } });
  if (!user) {
    throw new Error('Usuário ou senha inválidos');
  }
  const establishment = await Establishment.findByPk(user.establishmentId);
  if (!establishment) {
    throw new Error('Estabelecimento não encontrado');
  }
  return { user, establishment };
};

module.exports = { login };
