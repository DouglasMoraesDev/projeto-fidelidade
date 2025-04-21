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

// Nova função para retornar todos os dados do estabelecimento pelo ID
exports.getEstablishmentById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🔍 Buscando estabelecimento com ID: ${id}`);

    const establishment = await prisma.establishment.findUnique({
      where: { id }
    });

    if (!establishment) {
      console.log(`❌ Estabelecimento com ID ${id} não encontrado`);
      return res.status(404).json({ message: 'Estabelecimento não encontrado' });
    }

    console.log(`✅ Estabelecimento encontrado`);
    res.json(establishment);
  } catch (error) {
    console.error('🔥 Erro ao buscar estabelecimento:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

exports.getQRCode = async (req, res) => {
  try {
    const establishmentId = parseInt(req.params.id, 10);

    // Use a variável de ambiente BASE_URL, ou localhost:3000 em dev
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const targetUrl = `${baseUrl}/points.html?establishmentId=${establishmentId}`;

    res.type('png');
    await QRCode.toFileStream(res, targetUrl);
  } catch (err) {
    console.error('[getQRCode]:', err);
    res.status(500).json({ message: 'Erro ao gerar QR Code.' });
  }
};
