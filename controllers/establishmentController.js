// controllers/establishmentController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getVoucherMessage = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🔍 Buscando voucher_message para o estabelecimento com ID: ${id}`);

    const establishment = await prisma.establishment.findUnique({
      where: { id },
      select: { id: true, voucherMessage: true }
    });

    if (!establishment) {
      console.log(`❌ Estabelecimento com ID ${id} não encontrado`);
      return res.status(404).json({ message: 'Estabelecimento não encontrado' });
    }

    console.log(`✅ Voucher_message encontrado: ${establishment.voucherMessage}`);
    res.json({ voucherMessage: establishment.voucherMessage });
  } catch (error) {
    console.error('🔥 Erro ao buscar voucher_message:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};
