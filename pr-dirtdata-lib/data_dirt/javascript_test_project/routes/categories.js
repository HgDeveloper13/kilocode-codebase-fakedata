const express = require('express');
const Joi = require('joi');
const authService = require('../services/auth');
const Utils = require('../utils');
const logger = require('../services/logger');

/**
 * Роутер для управления категориями
 */
const router = express.Router();

/**
 * Схемы валидации
 */
const createCategorySchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Название категории не может быть пустым',
    'string.max': 'Название категории не может превышать 100 символов',
    'any.required': 'Название категории обязательно'
  }),
  description: Joi.string().max(500).optional(),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#007bff').messages({
    'string.pattern.base': 'Цвет должен быть в формате #RRGGBB'
  }),
  icon: Joi.string().max(50).optional(),
  parentId: Joi.string().uuid().optional(),
  isVisible: Joi.boolean().default(true)
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(500).optional(),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  icon: Joi.string().max(50).optional(),
  parentId: Joi.string().uuid().allow(null).optional(),
  isVisible: Joi.boolean().optional(),
  sortOrder: Joi.number().integer().min(0).optional()
});

/**
 * Middleware валидации
 */
const validateCreateCategory = (req, res, next) => {
  const { error, value } = createCategorySchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(422).json(
      Utils.createErrorResponse('Ошибка валидации данных категории', errors, 422)
    );
  }
  req.validatedData = value;
  next();
};

const validateUpdateCategory = (req, res, next) => {
  const { error, value } = updateCategorySchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(422).json(
      Utils.createErrorResponse('Ошибка валидации данных категории', errors, 422)
    );
  }
  req.validatedData = value;
  next();
};

/**
 * GET /api/v1/categories
 * Получение списка категорий
 */
router.get('/', async (req, res) => {
  try {
    const { isVisible } = req.query;
    
    // В реальном приложении здесь был бы запрос к БД
    const categories = [];
    
    logger.logBusinessEvent('categories_retrieved', {
      filters: { isVisible },
      count: categories.length
    });

    res.json(
      Utils.createResponse(
        categories,
        'Список категорий получен'
      )
    );
  } catch (error) {
    logger.error('Error retrieving categories', {
      error: Utils.handleError(error)
    });

    res.status(500).json(
      Utils.createErrorResponse('Ошибка при получении категорий', [error.message], 500)
    );
  }
});

/**
 * GET /api/v1/categories/tree
 * Получение дерева категорий
 */
router.get('/tree', async (req, res) => {
  try {
    // В реальном приложении здесь был бы запрос для построения дерева
    const categoryTree = [];
    
    logger.logBusinessEvent('categories_tree_retrieved', {
      count: categoryTree.length
    });

    res.json(
      Utils.createResponse(
        categoryTree,
        'Дерево категорий получено'
      )
    );
  } catch (error) {
    logger.error('Error retrieving categories tree', {
      error: Utils.handleError(error)
    });

    res.status(500).json(
      Utils.createErrorResponse('Ошибка при получении дерева категорий', [error.message], 500)
    );
  }
});

/**
 * POST /api/v1/categories
 * Создание новой категории
 */
router.post('/',
  authService.authenticateRequest,
  authService.requirePermission('write:posts'),
  validateCreateCategory,
  async (req, res) => {
    try {
      const startTime = Date.now();
      
      // Генерация slug из названия
      const slug = Utils.string.createSlug(req.validatedData.name);
      const categoryData = {
        ...req.validatedData,
        slug
      };

      // В реальном приложении здесь было бы создание категории в БД
      const category = {
        id: Utils.string.generateRandomString(8),
        ...categoryData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      logger.logBusinessEvent('category_created', {
        categoryId: category.id,
        name: category.name,
        createdBy: req.user.id,
        responseTime: Date.now() - startTime
      });

      res.status(201).json(
        Utils.createResponse(
          category,
          'Категория успешно создана'
        )
      );
    } catch (error) {
      logger.error('Error creating category', {
        createdBy: req.user.id,
        categoryData: req.validatedData,
        error: Utils.handleError(error)
      });

      res.status(500).json(
        Utils.createErrorResponse('Ошибка при создании категории', [error.message], 500)
      );
    }
  }
);

/**
 * PUT /api/v1/categories/:id
 * Обновление категории
 */
router.put('/:id',
  authService.authenticateRequest,
  authService.requirePermission('write:posts'),
  validateUpdateCategory,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!Utils.validation.isValidUUID(id)) {
        return res.status(400).json(
          Utils.createErrorResponse('Некорректный формат ID категории', [], 400)
        );
      }

      const updates = req.validatedData;
      
      // Обновление slug при изменении названия
      if (updates.name) {
        updates.slug = Utils.string.createSlug(updates.name);
      }

      // В реальном приложении здесь было бы обновление категории в БД
      const category = {
        id,
        ...updates,
        updatedAt: new Date()
      };

      logger.logBusinessEvent('category_updated', {
        categoryId: id,
        updatedBy: req.user.id,
        updatedFields: Object.keys(updates)
      });

      res.json(
        Utils.createResponse(
          category,
          'Категория успешно обновлена'
        )
      );
    } catch (error) {
      logger.error('Error updating category', {
        categoryId: req.params.id,
        updatedBy: req.user.id,
        updates: req.validatedData,
        error: Utils.handleError(error)
      });

      res.status(500).json(
        Utils.createErrorResponse('Ошибка при обновлении категории', [error.message], 500)
      );
    }
  }
);

/**
 * DELETE /api/v1/categories/:id
 * Удаление категории
 */
router.delete('/:id',
  authService.authenticateRequest,
  authService.requireRole('admin'),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!Utils.validation.isValidUUID(id)) {
        return res.status(400).json(
          Utils.createErrorResponse('Некорректный формат ID категории', [], 400)
        );
      }

      // В реальном приложении здесь была бы проверка на связанные посты и удаление
      const result = { success: true, message: 'Категория успешно удалена' };

      logger.logBusinessEvent('category_deleted', {
        categoryId: id,
        deletedBy: req.user.id
      });

      res.json(
        Utils.createResponse(
          result,
          'Категория успешно удалена'
        )
      );
    } catch (error) {
      logger.error('Error deleting category', {
        categoryId: req.params.id,
        deletedBy: req.user.id,
        error: Utils.handleError(error)
      });

      res.status(500).json(
        Utils.createErrorResponse('Ошибка при удалении категории', [error.message], 500)
      );
    }
  }
);

module.exports = router;