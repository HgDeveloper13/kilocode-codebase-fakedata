const express = require('express');
const Joi = require('joi');
const blogService = require('../services/blog');
const userService = require('../services/user');
const authService = require('../services/auth');
const Utils = require('../utils');
const logger = require('../services/logger');

/**
 * Роутер для поиска
 */
const router = express.Router();

/**
 * Схемы валидации
 */
const searchSchema = Joi.object({
  query: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Поисковый запрос должен содержать минимум 2 символа',
    'string.max': 'Поисковый запрос не может превышать 100 символов',
    'any.required': 'Поисковый запрос обязателен'
  }),
  type: Joi.string().valid('posts', 'users', 'all').default('all'),
  limit: Joi.number().integer().min(1).max(50).default(10),
  offset: Joi.number().integer().min(0).default(0)
});

/**
 * GET /api/v1/search/posts
 * Поиск постов
 */
router.get('/posts', async (req, res) => {
  try {
    const { query, limit = 10, offset = 0 } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json(
        Utils.createErrorResponse('Поисковый запрос должен содержать минимум 2 символа', [], 400)
      );
    }

    const searchResults = await blogService.searchPosts(query, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    logger.logBusinessEvent('posts_search_performed', {
      query,
      resultsCount: searchResults.total,
      userId: req.user?.id
    });

    res.json(
      Utils.createResponse(
        searchResults,
        `Найдено ${searchResults.total} постов по запросу "${query}"`
      )
    );
  } catch (error) {
    logger.error('Error searching posts', {
      query: req.query.query,
      error: Utils.handleError(error)
    });

    res.status(500).json(
      Utils.createErrorResponse('Ошибка при поиске постов', [error.message], 500)
    );
  }
});

module.exports = router;