// src/middlewares/checkSubscription.js
const { prisma } = require('./prisma/schema.prisma'); // ajuste o caminho conforme necessário

async function checkSubscription(req, res, next) {
  const estId = req.user.establishmentId; // supondo que o auth já tenha populado req.user
  const establishment = await prisma.establishment.findUnique({
    where: { id: estId },
    select: { lastPaymentDate: true }
  });

  const paymentDate = establishment?.lastPaymentDate;
  if (!paymentDate || new Date() > paymentDate) {
    // 402 = Payment Required
    return res.status(402).json({
      message: 'Assinatura expirada',
      paymentUrl: '/payment.html'  // backend informa a URL interna
    });
  }

  next();
}

module.exports = checkSubscription;
