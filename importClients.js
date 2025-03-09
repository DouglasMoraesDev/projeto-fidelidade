// importClients.js
const fs = require('fs');
const path = require('path');
const sequelize = require('./models/index');
const Client = require('./models/Client');

async function importClients() {
  try {
    // Lê o arquivo clientes.json (ajuste o caminho se necessário)
    const filePath = path.join(__dirname, 'clientes.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const clients = JSON.parse(fileData);
    
    // Insere cada cliente no banco de dados
    for (const clientData of clients) {
      // Você pode incluir validações ou tratamentos, se necessário
      await Client.create(clientData);
    }
    console.log('Clientes importados com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao importar clientes:', error);
    process.exit(1);
  }
}

// Sincroniza o banco de dados e executa a importação
sequelize.sync()
  .then(() => importClients())
  .catch(error => {
    console.error('Erro ao sincronizar o banco:', error);
    process.exit(1);
  });
