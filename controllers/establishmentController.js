// controllers/establishmentController.js
const Establishment = require('../models/establishment');

exports.getVoucherMessage = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Buscando voucher message para o estabelecimento com ID: ${id}`);

    const establishment = await Establishment.findByPk(id);

    if (!establishment) {
      console.log(`Estabelecimento com ID ${id} não encontrado`);
      return res.status(404).json({ message: 'Estabelecimento não encontrado' });
    }

    console.log(`Voucher message encontrado: ${establishment.voucher_message}`);
    res.json({ voucherMessage: establishment.voucher_message });
  } catch (error) {
    console.error('Erro ao buscar voucher message:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};
