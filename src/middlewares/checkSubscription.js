const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.checkSubscription = async (req, res, next) => {
  const establishmentId = req.params.id;  // Assume que o ID vem da URL, ajuste conforme necessário

  if (!establishmentId) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    // Recupera o estabelecimento do banco de dados
    const establishment = await prisma.establishment.findUnique({
      where: { id: establishmentId }
    });

    if (!establishment) {
      return res.status(404).json({ message: 'Estabelecimento não encontrado' });
    }

    // Agora você pode acessar lastPaymentDate
    const paymentDate = new Date(establishment.lastPaymentDate);

    if (!paymentDate || new Date() > paymentDate) {
      return res.status(403).json({ message: 'Assinatura expirada' });
    }

    // Passa o estabelecimento para os próximos middlewares ou lógica
    req.establishment = establishment;
    next();
  } catch (err) {
    console.error('Erro ao verificar assinatura:', err);
    res.status(500).json({ message: 'Erro ao verificar assinatura' });
  }
};
