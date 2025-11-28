const express = require('express');
const Joi = require('joi');
const authService = require('../services/auth');
const Utils = require('../utils');
const logger = require('../services/logger');

/**
 * Роутер аутентификации
 * Обрабатывает вход, регистрацию, обновление токенов и выход
 */
const router = express.Router();

// Схемы валидации
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Некорректный формат email',
    'any.required': 'Email обязателен'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Пароль должен содержать минимум 6 символов',
    'any.required': 'Пароль обязателен'
  })
});

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Некорректный формат email',
    'any.required': 'Email обязателен'
  }),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
    'string.min': 'Пароль должен содержать минимум 8 символов',
    'string.pattern.base': 'Пароль должен содержать заглавные и строчные буквы, а также цифры',
    'any.required': 'Пароль обязателен'
  }),
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.alphanum': 'Имя пользователя может содержать только буквы и цифры',
    'string.min': 'Имя пользователя должно содержать минимум 3 символа',
    'string.max': 'Имя пользователя должно содержать максимум 30 символов',
    'any.required': 'Имя пользователя обязательно'
  }),
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Текущий пароль обязателен'
  }),
  newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
    'string.min': 'Новый пароль должен содержать минимум 8 символов',
    'string.pattern.base': 'Пароль должен содержать заглавные и строчные буквы, а также цифры',
    'any.required': 'Новый пароль обязателен'
  })
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh токен обязателен'
  })
});

/**
 * Middleware для валидации запросов
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(422).json(
        Utils.createErrorResponse('Ошибка валидации', errors, 422)
      );
    }
    
    req.validatedData = value;
    next();
  };
};

/**
 * POST /api/v1/auth/register
 * Регистрация нового пользователя
 */
router.post('/register', validateRequest(registerSchema), async (req, res) => {
  try {
    const startTime = Date.now();
    
    const userData = req.validatedData;
    const user = await authService.createUser(userData);

    // Автоматический вход после регистрации
    const authResult = await authService.authenticateUser(userData.email, userData.password);
    
    logger.logBusinessEvent('user_registered_and_logged_in', {
      userId: user.id,
      email: user.email,
      responseTime: Date.now() - startTime
    });

    res.status(201).json(
      Utils.createResponse(
        authResult,
        'Пользователь успешно зарегистрирован и авторизован'
      )
    );
  } catch (error) {
    logger.error('Registration error', {
      error: Utils.handleError(error),
      email: req.validatedData?.email
    });

    const statusCode = error.message.includes('уже существует') ? 409 : 500;
    const errorMessage = error.message.includes('уже существует') 
      ? 'Пользователь с таким email уже существует'
      : 'Ошибка при регистрации';

    res.status(statusCode).json(
      Utils.createErrorResponse(errorMessage, [error.message], statusCode)
    );
  }
});

/**
 * POST /api/v1/auth/login
 * Аутентификация пользователя
 */
router.post('/login', validateRequest(loginSchema), async (req, res) => {
  try {
    const startTime = Date.now();
    
    const { email, password } = req.validatedData;
    const authResult = await authService.authenticateUser(email, password);

    logger.logBusinessEvent('user_logged_in', {
      userId: authResult.user.id,
      email,
      responseTime: Date.now() - startTime
    });

    res.json(
      Utils.createResponse(
        authResult,
        'Успешный вход в систему'
      )
    );
  } catch (error) {
    logger.error('Login error', {
      error: Utils.handleError(error),
      email: req.validatedData?.email
    });

    const statusCode = error.message.includes('Неверные учетные данные') ? 401 : 500;
    const errorMessage = error.message.includes('Неверные учетные данные')
      ? 'Неверный email или пароль'
      : 'Ошибка при входе в систему';

    res.status(statusCode).json(
      Utils.createErrorResponse(errorMessage, [error.message], statusCode)
    );
  }
});

/**
 * POST /api/v1/auth/refresh
 * Обновление токена
 */
router.post('/refresh', validateRequest(refreshTokenSchema), async (req, res) => {
  try {
    const { refreshToken } = req.validatedData;
    const tokens = await authService.refreshToken(refreshToken);

    logger.logBusinessEvent('token_refreshed', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json(
      Utils.createResponse(
        tokens,
        'Токен успешно обновлен'
      )
    );
  } catch (error) {
    logger.error('Token refresh error', {
      error: Utils.handleError(error),
      ip: req.ip
    });

    res.status(401).json(
      Utils.createErrorResponse('Недействительный refresh токен', [error.message], 401)
    );
  }
});

/**
 * POST /api/v1/auth/logout
 * Выход пользователя
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(200).json(
        Utils.createResponse(null, 'Выход выполнен')
      );
    }

    const token = authHeader.substring(7);
    const refreshToken = req.body.refreshToken;

    await authService.logout(token, refreshToken);

    logger.logBusinessEvent('user_logged_out', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json(
      Utils.createResponse(null, 'Успешный выход из системы')
    );
  } catch (error) {
    logger.error('Logout error', {
      error: Utils.handleError(error),
      ip: req.ip
    });

    // Не бросаем ошибку при logout
    res.json(
      Utils.createResponse(null, 'Выход выполнен')
    );
  }
});

/**
 * POST /api/v1/auth/change-password
 * Смена пароля (требует аутентификации)
 */
router.post('/change-password', 
  authService.authenticateRequest,
  validateRequest(changePasswordSchema),
  async (req, res) => {
    try {
      const startTime = Date.now();
      
      const { currentPassword, newPassword } = req.validatedData;
      await authService.changePassword(req.user.id, currentPassword, newPassword);

      logger.logBusinessEvent('password_changed', {
        userId: req.user.id,
        responseTime: Date.now() - startTime
      });

      res.json(
        Utils.createResponse(null, 'Пароль успешно изменен')
      );
    } catch (error) {
      logger.error('Password change error', {
        userId: req.user?.id,
        error: Utils.handleError(error)
      });

      const statusCode = error.message.includes('Неверный текущий пароль') ? 400 : 500;
      const errorMessage = error.message.includes('Неверный текущий пароль')
        ? 'Неверный текущий пароль'
        : 'Ошибка при смене пароля';

      res.status(statusCode).json(
        Utils.createErrorResponse(errorMessage, [error.message], statusCode)
      );
    }
  }
);

/**
 * GET /api/v1/auth/me
 * Получение информации о текущем пользователе
 */
router.get('/me', authService.authenticateRequest, async (req, res) => {
  try {
    const userData = req.user.toJSON();
    
    res.json(
      Utils.createResponse(
        userData,
        'Информация о пользователе получена'
      )
    );
  } catch (error) {
    logger.error('Get current user error', {
      userId: req.user?.id,
      error: Utils.handleError(error)
    });

    res.status(500).json(
      Utils.createErrorResponse('Ошибка при получении информации о пользователе', [error.message], 500)
    );
  }
});

/**
 * POST /api/v1/auth/verify-email
 * Подтверждение email (заглушка)
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json(
        Utils.createErrorResponse('Токен подтверждения обязателен', [], 400)
      );
    }

    // В реальном приложении здесь была бы логика подтверждения email
    logger.logBusinessEvent('email_verification_attempt', {
      token: token.substring(0, 10) + '...',
      ip: req.ip
    });

    res.json(
      Utils.createResponse(null, 'Email успешно подтвержден')
    );
  } catch (error) {
    logger.error('Email verification error', {
      error: Utils.handleError(error),
      ip: req.ip
    });

    res.status(400).json(
      Utils.createErrorResponse('Ошибка при подтверждении email', [error.message], 400)
    );
  }
});

/**
 * POST /api/v1/auth/forgot-password
 * Запрос на восстановление пароля (заглушка)
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json(
        Utils.createErrorResponse('Email обязателен', [], 400)
      );
    }

    // В реальном приложении здесь была бы логика отправки письма
    logger.logBusinessEvent('password_reset_requested', {
      email,
      ip: req.ip
    });

    res.json(
      Utils.createResponse(null, 'Инструкции по восстановлению пароля отправлены на email')
    );
  } catch (error) {
    logger.error('Forgot password error', {
      email: req.body?.email,
      error: Utils.handleError(error)
    });

    res.status(500).json(
      Utils.createErrorResponse('Ошибка при обработке запроса на восстановление пароля', [error.message], 500)
    );
  }
});

module.exports = router;