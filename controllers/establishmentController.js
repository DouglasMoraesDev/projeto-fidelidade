// controllers/establishmentController.js
const Establishment = require('../models/establishment');

exports.getVoucherMessage = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Buscando voucher_message para o estabelecimento com ID: ${id}`);

    const establishment = await Establishment.findOne({
      where: { id },
      attributes: ['id', 'voucher_message']
    });

    if (!establishment) {
      console.log(`❌ Estabelecimento com ID ${id} não encontrado`);
      return res.status(404).json({ message: 'Estabelecimento não encontrado' });
    }

    console.log(`✅ Voucher_message encontrado: ${establishment.voucher_message}`);

    res.json({ voucherMessage: establishment.voucher_message });
  } catch (error) {
    console.error('🔥 Erro ao buscar voucher_message:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};