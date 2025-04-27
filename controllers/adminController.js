// controllers/adminController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Lista todos os estabelecimentos
 */
exports.listEstablishments = async (_, res, next) => {
  try {
    const list = await prisma.establishment.findMany();
    res.json(list);
  } catch (e) { next(e); }
};

/**
 * Atualiza tema e lastPaymentDate de um estabelecimento
 */
exports.updateEstablishment = async (req, res, next) => {
  try {
    const id   = parseInt(req.params.id, 10);
    const data = {
      primaryColor:    req.body.primaryColor,
      secondaryColor:  req.body.secondaryColor,
      backgroundColor: req.body.backgroundColor,
      containerBg:     req.body.containerBg,
      textColor:       req.body.textColor,
      headerBg:        req.body.headerBg,
      footerBg:        req.body.footerBg,
      footerText:      req.body.footerText,
      inputBorder:     req.body.inputBorder,
      buttonBg:        req.body.buttonBg,
      buttonText:      req.body.buttonText,
      voucherMessage:  req.body.voucherMessage,
      lastPaymentDate: new Date(req.body.lastPaymentDate),
    };
    const updated = await prisma.establishment.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (e) { next(e); }
};

/**
 * Exclui um estabelecimento
 */
exports.deleteEstablishment = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.establishment.delete({ where: { id } });
    res.json({ message: 'Estabelecimento removido' });
  } catch (e) { next(e); }
};
