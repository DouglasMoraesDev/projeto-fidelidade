// controllers/userController.js
const { login } = require('../services/userService');

/**
 * POST /api/login
 */
const loginController = async (req, res, next) => {
  const { username, password } = req.body;
  try {
    const { user, establishment, token } = await login(username, password);
    return res.json({
      success: true,
      message: 'Login bem‑sucedido',
      token,
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
    if (error.message.includes('Pagamento pendente') 
     || error.message.includes('expirado')) {
      return res.status(402).json({ message: error.message });
    }
    next(error);
  }
};

module.exports = { login: loginController };
