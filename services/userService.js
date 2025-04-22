// services/userService.js
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_aqui';
const SESSION_DURATION = '2h';             // sessão expira em 2 horas
const DAYS_28_MS = 28 * 24 * 60 * 60 * 1000; // 28 dias em ms

/**
 * Autentica usuário, verifica pagamento e gera token JWT.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{user:object, establishment:object, token:string}>}
 */
const login = async (username, password) => {
  // 1) Busca usuário
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || user.password !== password) {
    throw new Error('Usuário ou senha inválidos');
  }

  // 2) Busca dados do estabelecimento
  const establishment = await prisma.establishment.findUnique({
    where: { id: user.establishmentId }
  });
  if (!establishment) {
    throw new Error('Estabelecimento não encontrado');
  }

  // 3) Verifica último pagamento (28 dias)
  const paymentDate = establishment.lastPaymentDate;
  if (!paymentDate
      || (Date.now() - new Date(paymentDate).getTime()) > DAYS_28_MS) {
    throw new Error('Pagamento pendente ou expirado');
  }

  // 4) Gera JWT com expiração de 2h
  const payload = {
    userId: user.id,
    establishmentId: user.establishmentId
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_DURATION });

  return { user, establishment, token };
};

module.exports = { login };
