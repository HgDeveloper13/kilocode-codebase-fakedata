const express = require('express');
const logger = require('../services/logger');
const Utils = require('../utils');

/**
 * Главный роутер для API v1
 * Подключает все роутеры приложения
 */
const router = express.Router();

// Middleware для всех API роутов
router.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Подключение роутеров
router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/posts', require('./posts'));
router.use('/categories', require('./categories'));
router.use('/search', require('./search'));
router.use('/stats', require('./stats'));

// Health check для API
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'JavaScript Test Project API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      authentication: '/auth',
      users: '/users',
      posts: '/posts',
      categories: '/categories',
      search: '/search',
      statistics: '/stats'
    }
  });
});

// Документация API
router.get('/docs', (req, res) => {
  const apiDocs = {
    title: 'JavaScript Test Project API',
    version: '1.0.0',
    description: 'RESTful API для тестового проекта на JavaScript с Node.js',
    baseUrl: '/api/v1',
    endpoints: {
      authentication: {
        'POST /auth/login': 'Аутентификация пользователя',
        'POST /auth/register': 'Регистрация нового пользователя',
        'POST /auth/refresh': 'Обновление токена',
        'POST /auth/logout': 'Выход из системы',
        'POST /auth/change-password': 'Смена пароля'
      },
      users: {
        'GET /users': 'Получение списка пользователей',
        'GET /users/:id': 'Получение пользователя по ID',
        'POST /users': 'Создание нового пользователя',
        'PUT /users/:id': 'Обновление пользователя',
        'DELETE /users/:id': 'Удаление пользователя',
        'GET /users/:id/stats': 'Статистика пользователя'
      },
      posts: {
        'GET /posts': 'Получение списка постов',
        'GET /posts/:id': 'Получение поста по ID',
        'POST /posts': 'Создание нового поста',
        'PUT /posts/:id': 'Обновление поста',
        'DELETE /posts/:id': 'Удаление поста',
        'POST /posts/:id/like': 'Переключить лайк поста',
        'POST /posts/:id/comment': 'Добавить комментарий',
        'GET /posts/popular': 'Получить популярные посты'
      },
      categories: {
        'GET /categories': 'Получение списка категорий',
        'GET /categories/tree': 'Получение дерева категорий',
        'POST /categories': 'Создание категории',
        'PUT /categories/:id': 'Обновление категории',
        'DELETE /categories/:id': 'Удаление категории'
      },
      search: {
        'GET /search/posts': 'Поиск постов',
        'GET /search/users': 'Поиск пользователей',
        'GET /search/suggestions': 'Получение подсказок поиска'
      },
      statistics: {
        'GET /stats/overview': 'Общая статистика',
        'GET /stats/users': 'Статистика пользователей',
        'GET /stats/posts': 'Статистика постов',
        'GET /stats/analytics': 'Детальная аналитика'
      }
    },
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>',
      description: 'Для доступа к защищенным роутам требуется JWT токен'
    },
    responseFormat: {
      success: true,
      message: 'Описание результата',
      data: {}, // Основные данные
      errors: [], // Список ошибок при неудаче
      timestamp: '2023-01-01T00:00:00.000Z'
    },
    errorCodes: {
      400: 'Bad Request - Неверный запрос',
      401: 'Unauthorized - Не аутентифицирован',
      403: 'Forbidden - Недостаточно прав',
      404: 'Not Found - Ресурс не найден',
      422: 'Unprocessable Entity - Ошибка валидации',
      500: 'Internal Server Error - Внутренняя ошибка сервера'
    }
  };

  res.json(apiDocs);
});

// Обработчик для неизвестных роутов API
router.use('*', (req, res) => {
  res.status(404).json(
    Utils.createErrorResponse(
      `API endpoint ${req.originalUrl} not found`,
      ['The requested API endpoint does not exist'],
      404
    )
  );
});

// Глобальный обработчик ошибок для API роутов
router.use((error, req, res, next) => {
  logger.logApiError(error, req);
  
  // Определение кода ошибки
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (error.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation Error';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (error.message) {
    message = error.message;
  }

  res.status(statusCode).json(
    Utils.createErrorResponse(
      message,
      [error.stack || error.message],
      statusCode
    )
  );
});

module.exports = router;