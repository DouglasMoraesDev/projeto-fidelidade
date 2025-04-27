const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DAYS_28_MS = 28 * 24 * 60 * 60 * 1000;

exports.checkSubscription = async (req, res, next) => {
  try {
    // pega establishmentId do token (req.user), ou da rota, se preferir
    const establishmentId = req.user.establishmentId;
    const est = await prisma.establishment.findUnique({
      where: { id: establishmentId },
      select: { lastPaymentDate: true }
    });
    const paymentDate = est?.lastPaymentDate;
    const now = Date.now();
    if (!paymentDate || (now - new Date(paymentDate).getTime()) > DAYS_28_MS) {
      // 402 = Payment Required
      return res
        .status(402)
        .json({ message: 'Assinatura expirada. Por favor, renove seu plano.' });
    }
    next();
  } catch (err) {
    console.error('Erro ao verificar assinatura:', err);
    res.status(500).json({ message: 'Erro ao verificar assinatura' });
  }
};
