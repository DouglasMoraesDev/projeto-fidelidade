// services/userService.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// Para segurança, considere usar hash (ex: bcrypt) para armazenar e comparar senhas

const login = async (username, password) => {
  const user = await prisma.user.findUnique({
    where: { username }
  });
  // Em produção, compare o hash da senha
  if (!user || user.password !== password) {
    throw new Error('Usuário ou senha inválidos');
  }
  const establishment = await prisma.establishment.findUnique({
    where: { id: user.establishmentId }
  });
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

