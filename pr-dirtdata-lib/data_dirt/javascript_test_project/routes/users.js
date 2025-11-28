const express = require('express');
const Joi = require('joi');
const userService = require('../services/user');
const authService = require('../services/auth');
const Utils = require('../utils');
const logger = require('../services/logger');

/**
 * Роутер для управления пользователями
 */
const router = express.Router();

// Middleware аутентификации для всех роутов
router.use(authService.authenticateRequest);

/**
 * Схемы валидации
 */
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional(),
  role: Joi.string().valid('user', 'author', 'moderator', 'admin').optional(),
  isActive: Joi.boolean().optional(),
  preferences: Joi.object({
    theme: Joi.string().valid('light', 'dark').optional(),
    language: Joi.string().valid('ru', 'en').optional(),
    notifications: Joi.boolean().optional()
  }).optional()
});

const updateUserSchema = Joi.object({
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional(),
  role: Joi.string().valid('user', 'author', 'moderator', 'admin').optional(),
  isActive: Joi.boolean().optional(),
  preferences: Joi.object({
    theme: Joi.string().valid('light', 'dark').optional(),
    language: Joi.string().valid('ru', 'en').optional(),
    notifications: Joi.boolean().optional()
  }).optional()
});

const userQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  role: Joi.string().valid('user', 'author', 'moderator', 'admin').optional(),
  isActive: Joi.boolean().optional(),
  search: Joi.string().min(2).max(50).optional(),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'username', 'email').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

/**
 * Middleware валидации
 */
const validateCreateUser = (req, res, next) => {
  const { error, value } = createUserSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(422).json(
      Utils.createErrorResponse('Ошибка валидации данных пользователя', errors, 422)
    );
  }
  req.validatedData = value;
  next();
};

const validateUpdateUser = (req, res, next) => {
  const { error, value } = updateUserSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(422).json(
      Utils.createErrorResponse('Ошибка валидации данных пользователя', errors, 422)
    );
  }
  req.validatedData = value;
  next();
};

const validateQuery = (req, res, next) => {
  const { error, value } = userQuerySchema.validate(req.query, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(422).json(
      Utils.createErrorResponse('Ошибка валидации параметров запроса', errors, 422)
    );
  }
  req.validatedQuery = value;
  next();
};

/**
 * GET /api/v1/users
 * Получение списка пользователей с пагинацией и фильтрацией
 */
router.get('/', 
  authService.requirePermission('read:all_data'),
  validateQuery,
  async (req, res) => {
    try {
      const startTime = Date.now();
      
      const users = await userService.findUsers(req.validatedQuery);
      
      logger.logBusinessEvent('users_list_retrieved', {
        userId: req.user.id,
        query: req.validatedQuery,
        responseTime: Date.now() - startTime
      });

      res.json(
        Utils.createResponse(
          users,
          'Список пользователей получен'
        )
      );
    } catch (error) {
      logger.error('Error retrieving users list', {
        userId: req.user.id,
        query: req.validatedQuery,
        error: Utils.handleError(error)
      });

      res.status(500).json(
        Utils.createErrorResponse('Ошибка при получении списка пользователей', [error.message], 500)
      );
    }
  }
);

/**
 * GET /api/v1/users/:id
 * Получение пользователя по ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Utils.validation.isValidUUID(id)) {
      return res.status(400).json(
        Utils.createErrorResponse('Некорректный формат ID пользователя', [], 400)
      );
    }

    const user = await userService.findById(id);
    
    if (!user) {
      return res.status(404).json(
        Utils.createErrorResponse('Пользователь не найден', [], 404)
      );
    }

    // Проверка прав доступа
    if (user.id !== req.user.id && !req.user.canPerform('read:all_data')) {
      return res.status(403).json(
        Utils.createErrorResponse('Недостаточно прав для просмотра этого пользователя', [], 403)
      );
    }

    logger.logBusinessEvent('user_retrieved', {
      requestedUserId: id,
      requestedBy: req.user.id,
      isOwnProfile: user.id === req.user.id
    });

    res.json(
      Utils.createResponse(
        user,
        'Пользователь найден'
      )
    );
  } catch (error) {
    logger.error('Error retrieving user', {
      userId: req.params.id,
      requestedBy: req.user.id,
      error: Utils.handleError(error)
    });

    res.status(500).json(
      Utils.createErrorResponse('Ошибка при получении пользователя', [error.message], 500)
    );
  }
});

/**
 * POST /api/v1/users
 * Создание нового пользователя (только для администраторов)
 */
router.post('/',
  authService.requireRole('admin'),
  validateCreateUser,
  async (req, res) => {
    try {
      const startTime = Date.now();
      
      // Генерация случайного пароля для нового пользователя
      const randomPassword = Utils.string.generateRandomString(12);
      const userData = {
        ...req.validatedData,
        password: randomPassword
      };

      const user = await userService.createUser(userData);
      
      logger.logBusinessEvent('user_created_by_admin', {
        createdUserId: user.id,
        createdBy: req.user.id,
        userRole: user.role,
        responseTime: Date.now() - startTime
      });

      res.status(201).json(
        Utils.createResponse(
          user,
          'Пользователь успешно создан'
        )
      );
    } catch (error) {
      logger.error('Error creating user', {
        createdBy: req.user.id,
        userData: { ...req.validatedData, password: '[HIDDEN]' },
        error: Utils.handleError(error)
      });

      const statusCode = error.message.includes('уже существует') ? 409 : 500;
      const errorMessage = error.message.includes('уже существует')
        ? 'Пользователь с таким email уже существует'
        : 'Ошибка при создании пользователя';

      res.status(statusCode).json(
        Utils.createErrorResponse(errorMessage, [error.message], statusCode)
      );
    }
  }
);

/**
 * PUT /api/v1/users/:id
 * Обновление пользователя
 */
router.put('/:id',
  validateUpdateUser,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!Utils.validation.isValidUUID(id)) {
        return res.status(400).json(
          Utils.createErrorResponse('Некорректный формат ID пользователя', [], 400)
        );
      }

      const targetUser = await userService.findById(id);
      if (!targetUser) {
        return res.status(404).json(
          Utils.createErrorResponse('Пользователь не найден', [], 404)
        );
      }

      // Проверка прав доступа
      const canEdit = targetUser.id === req.user.id || req.user.canPerform('write:all_data');
      if (!canEdit) {
        return res.status(403).json(
          Utils.createErrorResponse('Недостаточно прав для редактирования этого пользователя', [], 403)
        );
      }

      // Обычные пользователи не могут изменять роли
      const updates = req.validatedData;
      if (targetUser.id !== req.user.id && req.user.role !== 'admin') {
        delete updates.role;
      }

      const updatedUser = await userService.updateUser(id, {
        ...updates,
        updatedBy: req.user.id
      });

      logger.logBusinessEvent('user_updated', {
        updatedUserId: id,
        updatedBy: req.user.id,
        updatedFields: Object.keys(updates),
        isOwnUpdate: targetUser.id === req.user.id
      });

      res.json(
        Utils.createResponse(
          updatedUser,
          'Пользователь успешно обновлен'
        )
      );
    } catch (error) {
      logger.error('Error updating user', {
        userId: req.params.id,
        updatedBy: req.user.id,
        updates: req.validatedData,
        error: Utils.handleError(error)
      });

      res.status(500).json(
        Utils.createErrorResponse('Ошибка при обновлении пользователя', [error.message], 500)
      );
    }
  }
);

/**
 * DELETE /api/v1/users/:id
 * Удаление пользователя (только для администраторов)
 */
router.delete('/:id',
  authService.requireRole('admin'),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!Utils.validation.isValidUUID(id)) {
        return res.status(400).json(
          Utils.createErrorResponse('Некорректный формат ID пользователя', [], 400)
        );
      }

      if (id === req.user.id) {
        return res.status(400).json(
          Utils.createErrorResponse('Нельзя удалить самого себя', [], 400)
        );
      }

      const result = await userService.deleteUser(id);

      logger.logBusinessEvent('user_deleted', {
        deletedUserId: id,
        deletedBy: req.user.id
      });

      res.json(
        Utils.createResponse(
          result,
          'Пользователь успешно удален'
        )
      );
    } catch (error) {
      logger.error('Error deleting user', {
        userId: req.params.id,
        deletedBy: req.user.id,
        error: Utils.handleError(error)
      });

      res.status(500).json(
        Utils.createErrorResponse('Ошибка при удалении пользователя', [error.message], 500)
      );
    }
  }
);

/**
 * GET /api/v1/users/:id/stats
 * Получение статистики пользователя
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Utils.validation.isValidUUID(id)) {
      return res.status(400).json(
        Utils.createErrorResponse('Некорректный формат ID пользователя', [], 400)
      );
    }

    const user = await userService.findById(id);
    if (!user) {
      return res.status(404).json(
        Utils.createErrorResponse('Пользователь не найден', [], 404)
      );
    }

    // Проверка прав доступа
    if (user.id !== req.user.id && !req.user.canPerform('read:all_data')) {
      return res.status(403).json(
        Utils.createErrorResponse('Недостаточно прав для просмотра статистики', [], 403)
      );
    }

    // В реальном приложении здесь была бы логика сбора статистики
    const stats = {
      postsCount: 0,
      commentsCount: 0,
      likesReceived: 0,
      profileViews: 0,
      lastActivity: user.lastLogin || user.updatedAt,
      registrationDate: user.createdAt,
      accountAge: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)),
      role: user.role,
      isActive: user.isActive
    };

    logger.logBusinessEvent('user_stats_retrieved', {
      userId: id,
      requestedBy: req.user.id,
      isOwnStats: user.id === req.user.id
    });

    res.json(
      Utils.createResponse(
        stats,
        'Статистика пользователя получена'
      )
    );
  } catch (error) {
    logger.error('Error retrieving user stats', {
      userId: req.params.id,
      requestedBy: req.user.id,
      error: Utils.handleError(error)
    });

    res.status(500).json(
      Utils.createErrorResponse('Ошибка при получении статистики', [error.message], 500)
    );
  }
});

/**
 * POST /api/v1/users/:id/activate
 * Активация пользователя (только для администраторов)
 */
router.post('/:id/activate',
  authService.requireRole('admin'),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!Utils.validation.isValidUUID(id)) {
        return res.status(400).json(
          Utils.createErrorResponse('Некорректный формат ID пользователя', [], 400)
        );
      }

      const result = await userService.activateUser(id);

      logger.logBusinessEvent('user_activated', {
        activatedUserId: id,
        activatedBy: req.user.id
      });

      res.json(
        Utils.createResponse(
          result,
          'Пользователь успешно активирован'
        )
      );
    } catch (error) {
      logger.error('Error activating user', {
        userId: req.params.id,
        activatedBy: req.user.id,
        error: Utils.handleError(error)
      });

      res.status(500).json(
        Utils.createErrorResponse('Ошибка при активации пользователя', [error.message], 500)
      );
    }
  }
);

/**
 * POST /api/v1/users/:id/deactivate
 * Деактивация пользователя (только для администраторов)
 */
router.post('/:id/deactivate',
  authService.requireRole('admin'),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!Utils.validation.isValidUUID(id)) {
        return res.status(400).json(
          Utils.createErrorResponse('Некорректный формат ID пользователя', [], 400)
        );
      }

      if (id === req.user.id) {
        return res.status(400).json(
          Utils.createErrorResponse('Нельзя деактивировать самого себя', [], 400)
        );
      }

      const result = await userService.deactivateUser(id);

      logger.logBusinessEvent('user_deactivated', {
        deactivatedUserId: id,
        deactivatedBy: req.user.id
      });

      res.json(
        Utils.createResponse(
          result,
          'Пользователь успешно деактивирован'
        )
      );
    } catch (error) {
      logger.error('Error deactivating user', {
        userId: req.params.id,
        deactivatedBy: req.user.id,
        error: Utils.handleError(error)
      });

      res.status(500).json(
        Utils.createErrorResponse('Ошибка при деактивации пользователя', [error.message], 500)
      );
    }
  }
);

/**
 * GET /api/v1/users/stats/overview
 * Получение общей статистики пользователей (только для администраторов)
 */
router.get('/stats/overview',
  authService.requireRole('admin'),
  async (req, res) => {
    try {
      const stats = await userService.getUserStats();

      logger.logBusinessEvent('users_overview_stats_retrieved', {
        requestedBy: req.user.id
      });

      res.json(
        Utils.createResponse(
          stats,
          'Общая статистика пользователей получена'
        )
      );
    } catch (error) {
      logger.error('Error retrieving users overview stats', {
        requestedBy: req.user.id,
        error: Utils.handleError(error)
      });

      res.status(500).json(
        Utils.createErrorResponse('Ошибка при получении статистики', [error.message], 500)
      );
    }
  }
);

module.exports = router;