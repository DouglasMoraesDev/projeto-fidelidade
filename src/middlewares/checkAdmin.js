// src/middlewares/checkAdmin.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.checkAdmin = async (req, res, next) => {
  const userId = req.user.id;           // já populado por checkAuth
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'owner') {
    return res.status(403).json({ message: 'Acesso negado' });
  }
  next();
};
