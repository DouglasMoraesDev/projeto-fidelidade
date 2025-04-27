// controllers/clientController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Retorna os pontos de um cliente num estabelecimento (usando Prisma)
 * @param {string} phone
 * @param {string|number} establishmentId
 * @returns {Promise<number|null>}
 */
const getPoints = async (phone, establishmentId) => {
  const estId = parseInt(establishmentId, 10);
  const client = await prisma.client.findFirst({
    where: { phone, establishmentId: estId },
    select: { points: true },
  });
  return client ? client.points : null;
};

/**
 * Controller para o endpoint POST /api/clients/check-points
 */
const checkPoints = async (req, res, next) => {
  try {
    const { phone, establishmentId } = req.body;

    if (!phone || !establishmentId) {
      return res
        .status(400)
        .json({ message: 'phone e establishmentId são obrigatórios' });
    }

    const points = await getPoints(phone, establishmentId);

    if (points === null) {
      return res
        .status(404)
        .json({ message: 'Cliente não encontrado neste estabelecimento.' });
    }

    return res.json({ points });
  } catch (error) {
    next(error);
  }
};

const listClients = async (req, res, next) => {
  const establishmentId = parseInt(req.query.establishmentId, 10);
  if (!establishmentId) {
    return res.status(400).json({ message: 'EstablishmentId é obrigatório' });
  }
  try {
    const clients = await prisma.client.findMany({
      where: { establishmentId },
    });
    res.json(clients);
  } catch (error) {
    next(error);
  }
};

const createClient = async (req, res, next) => {
  const { fullName, phone, email, points, establishmentId } = req.body;
  const establishmentIdNumber = parseInt(establishmentId, 10);

  if (!fullName || !phone || !establishmentIdNumber) {
    return res
      .status(400)
      .json({ message: 'fullName, phone e establishmentId são obrigatórios' });
  }

  try {
    const newClient = await prisma.client.create({
      data: {
        fullName,
        phone,
        email,
        points: points || 0,
        establishmentId: establishmentIdNumber,
      },
    });
    res.status(201).json(newClient);
  } catch (error) {
    next(error);
  }
};

const updateClient = async (req, res, next) => {
  const clientId = parseInt(req.params.id, 10);
  const { fullName, phone, email, points, establishmentId } = req.body;
  const establishmentIdNumber = parseInt(establishmentId, 10);

  if (!fullName || !phone || !establishmentIdNumber) {
    return res
      .status(400)
      .json({ message: 'fullName, phone e establishmentId são obrigatórios' });
  }

  try {
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        fullName,
        phone,
        email,
        points,
        establishmentId: establishmentIdNumber,
      },
    });
    res.json({ message: 'Cliente atualizado', client: updatedClient });
  } catch (error) {
    next(error);
  }
};

const deleteClient = async (req, res, next) => {
  const clientId = parseInt(req.params.id, 10);
  const establishmentId = parseInt(req.query.establishmentId, 10);
  if (!establishmentId) {
    return res.status(400).json({ message: 'EstablishmentId é obrigatório' });
  }
  try {
    await prisma.client.delete({ where: { id: clientId } });
    res.json({ message: 'Cliente excluído' });
  } catch (error) {
    next(error);
  }
};

const addPoints = async (req, res, next) => {
  const clientId = parseInt(req.params.id, 10);
  const { pointsToAdd, establishmentId } = req.body;
  const establishmentIdNumber = parseInt(establishmentId, 10);
  if (!establishmentIdNumber) {
    return res.status(400).json({ message: 'EstablishmentId é obrigatório' });
  }
  try {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client || client.establishmentId !== establishmentIdNumber) {
      return res
        .status(404)
        .json({ message: 'Cliente não encontrado para este estabelecimento' });
    }
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: { points: client.points + pointsToAdd },
    });
    res.json({ message: 'Pontos adicionados', client: updatedClient });
  } catch (error) {
    next(error);
  }
};

const resetClientPoints = async (req, res, next) => {
  const clientId = parseInt(req.params.id, 10);
  const { establishmentId } = req.body;
  const establishmentIdNumber = parseInt(establishmentId, 10);
  if (!establishmentIdNumber) {
    return res.status(400).json({ message: 'EstablishmentId é obrigatório' });
  }
  try {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client || client.establishmentId !== establishmentIdNumber) {
      return res
        .status(404)
        .json({ message: 'Cliente não encontrado para este estabelecimento' });
    }
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: { points: 0 },
    });
    res.json({ message: 'Pontos zerados com sucesso.', client: updatedClient });
  } catch (error) {
    next(error);
  }
};

const sendVoucherAndResetPoints = async (req, res, next) => {
  const clientId = parseInt(req.params.id, 10);
  const { establishmentId } = req.body;
  const establishmentIdNumber = parseInt(establishmentId, 10);
  if (!establishmentIdNumber) {
    return res.status(400).json({ message: 'EstablishmentId é obrigatório' });
  }
  try {
    const establishment = await prisma.establishment.findUnique({
      where: { id: establishmentIdNumber },
      select: { voucherMessage: true },
    });
    const voucherMessage =
      establishment?.voucherMessage ||
      `Parabéns! Você ganhou um voucher exclusivo do estabelecimento ${establishmentIdNumber}!`;

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client || client.establishmentId !== establishmentIdNumber) {
      return res
        .status(404)
        .json({ message: 'Cliente não encontrado para este estabelecimento' });
    }
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: { points: 0 },
    });
    res.json({
      message: 'Voucher enviado e pontos zerados com sucesso.',
      voucherMessage,
      client: updatedClient,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkPoints,
  getPoints,
  listClients,
  createClient,
  updateClient,
  deleteClient,
  addPoints,
  resetClientPoints,
  sendVoucherAndResetPoints,
};
