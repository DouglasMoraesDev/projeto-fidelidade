// controllers/userController.js
const userService = require('../services/userService');

const login = async (req, res, next) => {
  const { username, password } = req.body;
  try {
    const { user, establishment } = await userService.login(username, password);
    res.json({
      success: true,
      message: 'Login bem-sucedido',
      user: {
        id: user.id,
        username: user.username,
        establishmentId: user.establishmentId,
        "primary-color": establishment.get("primary-color"),
        "secondary-color": establishment.get("secondary-color"),
        "background-color": establishment.get("background-color"),
        "container-bg": establishment.get("container-bg"),
        "text-color": establishment.get("text-color"),
        "header-bg": establishment.get("header-bg"),
        "footer-bg": establishment.get("footer-bg"),
        "footer-text": establishment.get("footer-text"),
        "input-border": establishment.get("input-border"),
        "button-bg": establishment.get("button-bg"),
        "button-text": establishment.get("button-text"),
        "section-margin": establishment.get("section-margin"),
        logoURL: establishment.logoURL
      }
    });
  } catch (error) {
    if (error.message && error.message.includes("Pagamento pendente")) {
      return res.status(403).json({ message: 'Pagamento pendente. Efetue o pagamento para acessar o sistema.' });
    }
    next(error);
  }
};

module.exports = { login };
