// controllers/userController.js
const { login } = require('../services/userService');

const loginController = async (req, res, next) => {
  const { username, password } = req.body;
  try {
    const { user, establishment } = await login(username, password);
    res.json({
      success: true,
      message: 'Login bem-sucedido',
      user: {
        id: user.id,
        username: user.username,
        establishmentId: user.establishmentId,
        "primary-color": establishment.primaryColor,
        "secondary-color": establishment.secondaryColor,
        "background-color": establishment.backgroundColor,
        "container-bg": establishment.containerBg,
        "text-color": establishment.textColor,
        "header-bg": establishment.headerBg,
        "footer-bg": establishment.footerBg,
        "footer-text": establishment.footerText,
        "input-border": establishment.inputBorder,
        "button-bg": establishment.buttonBg,
        "button-text": establishment.buttonText,
        "section-margin": establishment.sectionMargin,
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

module.exports = { login: loginController };

