// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./models/index');
const establishmentRoutes = require('./routes/establishmentRoutes');
const clientRoutes = require('./routes/clientRoutes');
const importRoutes = require('./routes/importRoutes'); // Importa a rota de importação
const userRoutes = require('./routes/userRoutes');

//const errorHandler = require('./middlewares/errorHandler');
const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Rotas da API
app.use('/api/clients', clientRoutes);
app.use('/api', userRoutes); // Exemplo: rota de login: /api/login
app.use('/api/establishments', establishmentRoutes);

app.use('/importar-clientes', importRoutes); // Rota para importar clientes

// Serve arquivos estáticos da pasta public
app.use(express.static('public'));

// Middleware de tratamento de erros
//app.use(errorHandler);

// Sincroniza os modelos e inicia o servidor
sequelize.sync({ alter: true })
  .then(() => {
    const PORT = process.env.PORT || 3000;
    console.log('Banco de dados sincronizado.');
    console.log(app._router.stack.map(r => r.route?.path).filter(Boolean));

    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch(err => {
    console.error('Erro ao sincronizar o banco de dados:', err);
  });
