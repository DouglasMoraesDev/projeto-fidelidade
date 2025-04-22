const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const clientRoutes = require('./routes/clientRoutes');
const establishmentRoutes = require('./routes/establishmentRoutes');
const userRoutes = require('./routes/userRoutes');
const voucherRoutes = require('./routes/voucher');

const { checkSubscription } = require('./src/middlewares/checkSubscription'); // corrigido
const checkAuth = require('./src/middlewares/checkAuth');

const app = express();

// Middlewares globais
app.use(cors());
app.use(bodyParser.json());

// Rotas públicas (ex: login)
app.use('/api', userRoutes); // /api/login etc

// Middleware de autenticação e assinatura (valem para rotas abaixo)
app.use('/api',
  checkAuth,           // valida o JWT, popula req.user
  checkSubscription    // verifica se o estabelecimento está ativo
);

// Rotas protegidas (só acessa se estiver autenticado e com assinatura em dia)
app.use('/api/clients', clientRoutes);
app.use('/api/establishments', establishmentRoutes);
app.use('/api', voucherRoutes); // ex: /api/vouchers

// Serve arquivos estáticos (ex: páginas HTML)
app.use(express.static('public'));

// Tratamento de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erro no servidor', error: err.message });
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
