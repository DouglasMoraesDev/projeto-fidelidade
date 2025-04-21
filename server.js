require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import middlewares
const checkAuth = require('./middlewares/checkAuth');
const checkSubscription = require('./middlewares/checkSubscription');

// Import routes
const authRoutes = require('./routes/userRoutes');           // /api/login, /api/register
const clientRoutes = require('./routes/clientRoutes');      // /api/clients
const establishmentRoutes = require('./routes/establishmentRoutes'); // /api/establishments
const voucherRoutes = require('./routes/voucher');           // /api/voucher

const app = express();

// ====== Global Middlewares ======
app.use(cors());
app.use(bodyParser.json());

// ====== Serve Static Files ======
// Páginas públicas (login, payment, front-end assets)
app.use(express.static('public'));

// ====== Public API Routes (sem autenticação) ======
// Autenticação e registro de usuários
app.use('/api', authRoutes);

// ====== Protected API Routes ======
// As rotas abaixo requerem token válido e assinatura ativa
app.use(
  '/api',
  checkAuth,           // verifica JWT e popula req.user
  checkSubscription    // verifica data de pagamento
);

// Rotas de clientes, estabelecimentos e vouchers
app.use('/api/clients', clientRoutes);
app.use('/api/establishments', establishmentRoutes);
app.use('/api/voucher', voucherRoutes);

// ====== 404 Handler ======
app.use((req, res, next) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// ====== Error Handler ======
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Erro no servidor' });
});

// ====== Start Server ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
