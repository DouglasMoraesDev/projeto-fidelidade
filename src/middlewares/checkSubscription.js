// src/middlewares/checkSubscription.js
const { prisma } = require('../../config/db'); // ✅ caminho corrigido

const today = new Date();
today.setHours(0, 0, 0, 0);

const paymentDate = new Date(establishment?.lastPaymentDate);
paymentDate.setHours(0, 0, 0, 0);

if (!paymentDate || today > paymentDate) {
  return res.status(402).json({
    message: 'Assinatura expirada',
    paymentUrl: '/payment.html'
  });
}

async function checkSubscription(req, res, next) {
  const estId = req.user.establishmentId; // supondo que o auth já tenha populado req.user
  const establishment = await prisma.establishment.findUnique({
    where: { id: estId },
    select: { lastPaymentDate: true }
  });


  const paymentDate = establishment?.lastPaymentDate
  ? new Date(establishment.lastPaymentDate)
  : null;

if (!paymentDate || new Date() > paymentDate) {
  return res.status(402).json({
    message: 'Assinatura expirada',
    paymentUrl: '/payment.html'
  });
}

  next();
}



module.exports = checkSubscription;
