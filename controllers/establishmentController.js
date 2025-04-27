// controllers/establishmentController.js

const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');                     // ← importa o gerador de QR
const prisma = new PrismaClient();

/**
 * Gera e devolve um PNG com o QR Code
 * que aponta para a página de pontos do estabelecimento.
 */
exports.getQRCode = async (req, res) => {
  try {
    const establishmentId = parseInt(req.params.id, 10);
    if (!establishmentId) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    // Defina sua BASE_URL de produção via ENV ou default para localhost
    const baseUrl = process.env.BASE_URL
      || `http://localhost:${process.env.PORT || 3000}`;
    const targetUrl = `${baseUrl}/points.html?establishmentId=${establishmentId}`;

    // Informa que a resposta é uma imagem PNG
    res.type('png');
    // Escreve diretamente o PNG no corpo da resposta
    await QRCode.toFileStream(res, targetUrl);

  } catch (err) {
    console.error('[getQRCode]:', err);
    res.status(500).json({ message: 'Erro ao gerar QR Code.' });
  }
};

/**
 * Retorna todos os dados do estabelecimento (para aplicar tema, logo etc.)
 */
exports.getEstablishmentById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const establishment = await prisma.establishment.findUnique({
      where: { id }
    });

    if (!establishment) {
      return res.status(404).json({ message: 'Estabelecimento não encontrado' });
    }

    res.json(establishment);
  } catch (error) {
    console.error('🔥 Erro ao buscar estabelecimento:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

/**
 * Retorna somente a mensagem de voucher configurada no estabelecimento.
 */
exports.getVoucherMessage = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const establishment = await prisma.establishment.findUnique({
      where: { id },
      select: { voucherMessage: true }
    });

    if (!establishment) {
      return res.status(404).json({ message: 'Estabelecimento não encontrado' });
    }

    res.json({ voucherMessage: establishment.voucherMessage });
  } catch (error) {
    console.error('🔥 Erro ao buscar voucher_message:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};
