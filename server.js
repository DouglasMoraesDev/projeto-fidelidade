// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const clientRoutes = require('./routes/clientRoutes');
const establishmentRoutes = require('./routes/establishmentRoutes');
const userRoutes = require('./routes/userRoutes');
const voucherRoutes = require("./routes/voucher");

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Rotas da API
app.use('/api/clients', clientRoutes);
app.use('/api', userRoutes); // Exemplo: rota de login: /api/login
app.use('/api/establishments', establishmentRoutes);
app.use("/api", voucherRoutes);

// Serve arquivos estáticos da pasta public
app.use(express.static('public'));

// Middleware de tratamento de erros (opcional)
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ message: 'Erro no servidor' });
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

