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

  // Verifica se a data do último pagamento existe e está dentro de 30 dias
  const paymentDate = establishment.lastPaymentDate;
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000; // 30 dias em milissegundos
  if (!paymentDate || (new Date() - new Date(paymentDate)) > THIRTY_DAYS) {
    throw new Error('Pagamento pendente. Efetue o pagamento para acessar o sistema.');
  }

  return { user, establishment };
};

module.exports = { login };
