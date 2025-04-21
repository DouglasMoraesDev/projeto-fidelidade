const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_de_teste';

module.exports = function checkAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const payload = jwt.verify(token, SECRET); // ← aqui verifica e decodifica
    req.user = payload; // ← opcional: usar depois
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
