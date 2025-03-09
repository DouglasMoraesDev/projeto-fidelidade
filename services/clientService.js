// services/clientService.js




const { Op } = require('sequelize');
const Client = require('../models/Client');

const getClients = async (establishmentId) => {
  return await Client.findAll({ where: { establishmentId } });
};

const createClient = async (clientData) => {
  const { fullName, phone, email, establishmentId } = clientData;
  console.log("Verificando cliente existente...");

  const existingClient = await Client.findOne({
    where: {
      establishmentId,
      [Op.or]: [
        { phone },
        email ? { email } : {} 
      ]
    }
  });

  if (existingClient) {
    console.log("Cliente já existe:", existingClient.toJSON());
    throw new Error('Cliente já existe');
  }

  console.log("Criando novo cliente:", clientData);
  const newClient = await Client.create(clientData);
  return newClient;
};

const updateClient = async (clientId, clientData, establishmentId) => {
  const result = await Client.update(clientData, { where: { id: clientId, establishmentId } });
  if (result[0] === 0) {
    throw new Error('Cliente não encontrado');
  }
  return await Client.findOne({ where: { id: clientId, establishmentId } });
};

const deleteClient = async (clientId, establishmentId) => {
  const result = await Client.destroy({ where: { id: clientId, establishmentId } });
  if (result === 0) {
    throw new Error('Cliente não encontrado');
  }
};

const addPoints = async (clientId, pointsToAdd, establishmentId) => {
  const client = await Client.findOne({ where: { id: clientId, establishmentId } });
  if (!client) {
    throw new Error('Cliente não encontrado');
  }
  client.points += pointsToAdd;
  await client.save();
  return client;
};

// Nova função para resetar os pontos do cliente no banco de dados
const resetClientPoints = async (clientId, establishmentId) => {
  const client = await Client.findOne({ where: { id: clientId, establishmentId } });
  if (!client) {
    throw new Error('Cliente não encontrado');
  }
  client.points = 0;
  await client.save();
  return client;
};

module.exports = { getClients, createClient, updateClient, deleteClient, addPoints, resetClientPoints };
