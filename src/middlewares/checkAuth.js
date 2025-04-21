// src/middlewares/checkAuth.js

module.exports = function checkAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
  
    try {
      const payload = JSON.parse(atob(token));
      req.user = payload;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Token inválido' });
    }
  };
  