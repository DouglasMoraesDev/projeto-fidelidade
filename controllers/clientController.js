// controllers/clientController.js

const clientService = require('../services/clientService');

const listClients = async (req, res, next) => {
  const establishmentId = req.query.establishmentId;
  if (!establishmentId) {
    return res.status(400).json({ message: 'EstablishmentId é obrigatório' });
  }
  try {
    const clients = await clientService.getClients(establishmentId);
    res.json(clients);
  } catch (error) {
    next(error);
  }
};

const createClient = async (req, res, next) => {
  const clientData = req.body;
  if (!clientData.establishmentId) {
    return res.status(400).json({ message: 'EstablishmentId é obrigatório' });
  }
  try {
    const newClient = await clientService.createClient(clientData);
    res.status(201).json(newClient);
  } catch (error) {
    next(error);
  }
};

const updateClient = async (req, res, next) => {
  const clientId = req.params.id;
  const { establishmentId, ...clientData } = req.body;
  if (!establishmentId) {
    return res.status(400).json({ message: 'EstablishmentId é obrigatório' });
  }
  try {
    const updatedClient = await clientService.updateClient(clientId, clientData, establishmentId);
    res.json({ message: 'Cliente atualizado', client: updatedClient });
  } catch (error) {
    next(error);
  }
};

const deleteClient = async (req, res, next) => {
  const clientId = req.params.id;
  const establishmentId = req.query.establishmentId;
  if (!establishmentId) {
    return res.status(400).json({ message: 'EstablishmentId é obrigatório' });
  }
  try {
    await clientService.deleteClient(clientId, establishmentId);
    res.json({ message: 'Cliente excluído' });
  } catch (error) {
    next(error);
  }
};

const addPoints = async (req, res, next) => {
  const clientId = req.params.id;
  const { pointsToAdd, establishmentId } = req.body;
  if (!establishmentId) {
    return res.status(400).json({ message: 'EstablishmentId é obrigatório' });
  }
  try {
    const updatedClient = await clientService.addPoints(clientId, pointsToAdd, establishmentId);
    res.json({ message: 'Pontos adicionados', client: updatedClient });
  } catch (error) {
    next(error);
  }
};

// Função para resetar os pontos do cliente
const resetClientPoints = async (req, res, next) => {
  const clientId = req.params.id;
  const { establishmentId } = req.body;
  if (!establishmentId) {
    return res.status(400).json({ message: 'EstablishmentId é obrigatório' });
  }
  try {
    const updatedClient = await clientService.resetClientPoints(clientId, establishmentId);
    res.json({ message: 'Pontos zerados com sucesso.', client: updatedClient });
  } catch (error) {
    next(error);
  }
};

// Nova função para enviar voucher e resetar os pontos de uma única vez
const sendVoucherAndResetPoints = async (req, res, next) => {
  const clientId = req.params.id;
  const { establishmentId } = req.body;
  if (!establishmentId) {
    return res.status(400).json({ message: 'EstablishmentId é obrigatório' });
  }
  try {
    // Define a mensagem do voucher – pode ser personalizada ou buscada de outro serviço
    const voucherMessage = `Parabéns! Você ganhou um voucher exclusivo do estabelecimento ${establishmentId}!`;

    // Reseta os pontos do cliente
    const updatedClient = await clientService.resetClientPoints(clientId, establishmentId);

    res.json({
      message: 'Voucher enviado e pontos zerados com sucesso.',
      voucherMessage,
      client: updatedClient
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  listClients, 
  createClient, 
  updateClient, 
  deleteClient, 
  addPoints, 
  resetClientPoints,
  sendVoucherAndResetPoints
};
