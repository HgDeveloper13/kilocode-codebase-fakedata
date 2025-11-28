const express = require('express');
const Joi = require('joi');
const blogService = require('../services/blog');
const authService = require('../services/auth');
const Utils = require('../utils');
const logger = require('../services/logger');

/**
 * Роутер для управления постами блога
 */
const router = express.Router();

/**
 * Схемы валидации
 */
const createPostSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    'string.min': 'Заголовок не может быть пустым',
    'string.max': 'Заголовок не может превышать 200 символов',
    'any.required': 'Заголовок обязателен'
  }),
  content: Joi.string().min(10).required().messages({
    'string.min': 'Контент должен содержать минимум 10 символов',
    'any.required': 'Контент обязателен'
  }),
  category: Joi.string().required().messages({
    'any.required': 'Категория обязательна'
  }),
  tags: Joi.array().items(Joi.string()).default([]),
  status: Joi.string().valid('draft', 'published').default('draft'),
  featuredImage: Joi.string().uri().optional(),
  seoTitle: Joi.string().max(60).optional(),
  seoDescription: Joi.string().max(160).optional()
});

const updatePostSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  content: Joi.string().min(10).optional(),
  category: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
  featuredImage: Joi.string().uri().optional(),
  seoTitle: Joi.string().max(60).optional(),
  seoDescription: Joi.string().max(160).optional()
});

const postQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  category: Joi.string().optional(),
  authorId: Joi.string().optional(),
  status: Joi.string().valid('draft', 'published', 'archived').default('published'),
  tags: Joi.string().optional(), // comma-separated tags
  search: Joi.string().min(2).optional(),
  sortBy: Joi.string().valid('newest', 'oldest', 'mostViewed', 'mostLiked', 'alphabetical').default('newest')
});

const commentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required().messages({
    'string.min': 'Комментарий не может быть пустым',
    'string.max': 'Комментарий не может превышать 1000 символов',
    'any.required': 'Содержимое комментария обязательно'
  })
});

/**
 * Middleware валидации
 */
const validateCreatePost = (req, res, next) => {
  const { error, value } = createPostSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(422).json(
      Utils.createErrorResponse('Ошибка валидации данных поста', errors, 422)
    );
  }
  req.validatedData = value;
  next();
};

const validateUpdatePost = (req, res, next) => {
  const { error, value } = updatePostSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(422).json(
      Utils.createErrorResponse('Ошибка валидации данных поста', errors, 422)
    );
  }
  req.validatedData = value;
  next();
};

const validateQuery = (req, res, next) => {
  const { error, value } = postQuerySchema.validate(req.query, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(422).json(
      Utils.createErrorResponse('Ошибка валидации параметров запроса', errors, 422)
    );
  }
  req.validatedQuery = value;
  next();
};

const validateComment = (req, res, next) => {
  const { error, value } = commentSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(422).json(
      Utils.createErrorResponse('Ошибка валидации комментария', errors, 422)
    );
  }
  req.validatedData = value;
  next();
};

/**
 * Публичные роуты (не требуют аутентификации)
 */

/**
 * GET /api/v1/posts
 * Получение списка постов
 */
router.get('/', validateQuery, async (req, res) => {
  try {
    const startTime = Date.now();
    
    const posts = await blogService.findPosts(req.validatedQuery);
    
    logger.logBusinessEvent('posts_list_retrieved', {
      query: req.validatedQuery,
      responseTime: Date.now() - startTime
    });

    res.json(
      Utils.createResponse(
        posts,
        'Список постов получен'
      )
    );
  } catch (error) {
    logger.error('Error retrieving posts list', {
      query: req.validatedQuery,
      error: Utils.handleError(error)
    });

    res.status(500).json(
      Utils.createErrorResponse('Ошибка при получении списка постов', [error.message], 500)
    );
  }
});

/**
 * GET /api/v1/posts/popular
 * Получение популярных постов
 */
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const popularPosts = await blogService.getPopularPosts(limit);

    logger.logBusinessEvent('popular_posts_retrieved', { limit });

    res.json(
      Utils.createResponse(
        popularPosts,
        'Популярные посты получены'
      )
    );
  } catch (error) {
    logger.error('Error retrieving popular posts', {
      limit: req.query.limit,
      error: Utils.handleError(error)
    });

    res.status(500).json(
      Utils.createErrorResponse('Ошибка при получении популярных постов', [error.message], 500)
    );
  }
});

/**
 * GET /api/v1/posts/:id
 * Получение поста по ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Utils.validation.isValidUUID(id)) {
      return res.status(400).json(
        Utils.createErrorResponse('Некорректный формат ID поста', [], 400)
      );
    }

    const post = await blogService.findById(id, { incrementView: true });
    
    if (!post) {
      return res.status(404).json(
        Utils.createErrorResponse('Пост не найден', [], 404)
      );
    }

    // Проверка статуса поста для неавторизованных пользователей
    if (post.status !== 'published') {
      return res.status(404).json(
        Utils.createErrorResponse('Пост не найден', [], 404)
      );
    }

    logger.logBusinessEvent('post_retrieved', {
      postId: id,
      isPublic: true
    });

    res.json(
      Utils.createResponse(
        post,
        'Пост найден'
      )
    );
  } catch (error) {
    logger.error('Error retrieving post', {
      postId: req.params.id,
      error: Utils.handleError(error)
    });

    res.status(500).json(
      Utils.createErrorResponse('Ошибка при получении поста', [error.message], 500)
    );
  }
});

/**
 * Роуты, требующие аутентификации
 */

/**
 * POST /api/v1/posts
 * Создание нового поста
 */
router.post('/',
  authService.authenticateRequest,
  authService.requirePermission('write:posts'),
  validateCreatePost,
  async (req, res) => {
    try {
      const startTime = Date.now();
      
      const post = await blogService.createPost(req.validatedData, req.user.id);
      
      logger.logBusinessEvent('post_created', {
        postId: post.id,
        authorId: req.user.id,
        category: post.category,
        responseTime: Date.now() - startTime
      });

      res.status(201).json(
        Utils.createResponse(
          post,
          'Пост успешно создан'
        )
      );
    } catch (error) {
      logger.error('Error creating post', {
        authorId: req.user.id,
        postData: req.validatedData,
        error: Utils.handleError(error)
      });

      res.status(500).json(
        Utils.createErrorResponse('Ошибка при создании поста', [error.message], 500)
      );
    }
  }
);

/**
 * PUT /api/v1/posts/:id
 * Обновление поста
 */
router.put('/:id',
  authService.authenticateRequest,
  validateUpdatePost,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!Utils.validation.isValidUUID(id)) {
        return res.status(400).json(
          Utils.createErrorResponse('Некорректный формат ID поста', [], 400)
        );
      }

      const updatedPost = await blogService.updatePost(id, req.validatedData, req.user.id);
      
      logger.logBusinessEvent('post_updated', {
        postId: id,
        updatedBy: req.user.id,
        updatedFields: Object.keys(req.validatedData)
      });

      res.json(
        Utils.createResponse(
          updatedPost,
          'Пост успешно обновлен'
        )
      );
    } catch (error) {
      logger.error('Error updating post', {
        postId: req.params.id,
        updatedBy: req.user.id,
        updates: req.validatedData,
        error: Utils.handleError(error)
      });

      const statusCode = error.message.includes('не найден') ? 404 : 
                        error.message.includes('Нет прав') ? 403 : 500;
      const errorMessage = error.message.includes('не найден') ? 'Пост не найден' :
                          error.message.includes('Нет прав') ? 'Недостаточно прав для редактирования поста' :
                          'Ошибка при обновлении поста';

      res.status(statusCode).json(
        Utils.createErrorResponse(errorMessage, [error.message], statusCode)
      );
    }
  }
);

/**
 * DELETE /api/v1/posts/:id
 * Удаление поста
 */
router.delete('/:id',
  authService.authenticateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!Utils.validation.isValidUUID(id)) {
        return res.status(400).json(
          Utils.createErrorResponse('Некорректный формат ID поста', [], 400)
        );
      }

      const result = await blogService.deletePost(id, req.user.id);
      
      logger.logBusinessEvent('post_deleted', {
        postId: id,
        deletedBy: req.user.id
      });

      res.json(
        Utils.createResponse(
          result,
          'Пост успешно удален'
        )
      );
    } catch (error) {
      logger.error('Error deleting post', {
        postId: req.params.id,
        deletedBy: req.user.id,
        error: Utils.handleError(error)
      });

      const statusCode = error.message.includes('не найден') ? 404 : 
                        error.message.includes('Нет прав') ? 403 : 500;
      const errorMessage = error.message.includes('не найден') ? 'Пост не найден' :
                          error.message.includes('Нет прав') ? 'Недостаточно прав для удаления поста' :
                          'Ошибка при удалении поста';

      res.status(statusCode).json(
        Utils.createErrorResponse(errorMessage, [error.message], statusCode)
      );
    }
  }
);

/**
 * POST /api/v1/posts/:id/like
 * Переключение лайка поста
 */
router.post('/:id/like',
  authService.authenticateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!Utils.validation.isValidUUID(id)) {
        return res.status(400).json(
          Utils.createErrorResponse('Некорректный формат ID поста', [], 400)
        );
      }

      const result = await blogService.toggleLike(id, req.user.id);
      
      logger.logBusinessEvent('post_like_toggled', {
        postId: id,
        userId: req.user.id,
        isLiked: result.isLiked
      });

      res.json(
        Utils.createResponse(
          result,
          result.isLiked ? 'Пост лайкнут' : 'Лайк снят'
        )
      );
    } catch (error) {
      logger.error('Error toggling post like', {
        postId: req.params.id,
        userId: req.user.id,
        error: Utils.handleError(error)
      });

      const statusCode = error.message.includes('не найден') ? 404 : 500;
      res.status(statusCode).json(
        Utils.createErrorResponse('Ошибка при переключении лайка', [error.message], statusCode)
      );
    }
  }
);

/**
 * POST /api/v1/posts/:id/comment
 * Добавление комментария к посту
 */
router.post('/:id/comment',
  authService.authenticateRequest,
  validateComment,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!Utils.validation.isValidUUID(id)) {
        return res.status(400).json(
          Utils.createErrorResponse('Некорректный формат ID поста', [], 400)
        );
      }

      const comment = await blogService.addComment(id, req.validatedData, req.user.id);
      
      logger.logBusinessEvent('comment_added', {
        postId: id,
        commentId: comment.id,
        authorId: req.user.id
      });

      res.status(201).json(
        Utils.createResponse(
          comment,
          'Комментарий успешно добавлен'
        )
      );
    } catch (error) {
      logger.error('Error adding comment', {
        postId: req.params.id,
        authorId: req.user.id,
        commentData: req.validatedData,
        error: Utils.handleError(error)
      });

      const statusCode = error.message.includes('не найден') ? 404 : 500;
      res.status(statusCode).json(
        Utils.createErrorResponse('Ошибка при добавлении комментария', [error.message], statusCode)
      );
    }
  }
);

/**
 * POST /api/v1/posts/:id/publish
 * Публикация поста
 */
router.post('/:id/publish',
  authService.authenticateRequest,
  authService.requirePermission('publish:posts'),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!Utils.validation.isValidUUID(id)) {
        return res.status(400).json(
          Utils.createErrorResponse('Некорректный формат ID поста', [], 400)
        );
      }

      const post = await blogService.publishPost(id, req.user.id);
      
      logger.logBusinessEvent('post_published', {
        postId: id,
        publishedBy: req.user.id
      });

      res.json(
        Utils.createResponse(
          post,
          'Пост успешно опубликован'
        )
      );
    } catch (error) {
      logger.error('Error publishing post', {
        postId: req.params.id,
        publishedBy: req.user.id,
        error: Utils.handleError(error)
      });

      const statusCode = error.message.includes('не найден') ? 404 : 
                        error.message.includes('Нет прав') ? 403 : 500;
      const errorMessage = error.message.includes('не найден') ? 'Пост не найден' :
                          error.message.includes('Нет прав') ? 'Недостаточно прав для публикации поста' :
                          'Ошибка при публикации поста';

      res.status(statusCode).json(
        Utils.createErrorResponse(errorMessage, [error.message], statusCode)
      );
    }
  }
);

/**
 * POST /api/v1/posts/:id/unpublish
 * Снятие поста с публикации
 */
router.post('/:id/unpublish',
  authService.authenticateRequest,
  authService.requirePermission('publish:posts'),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!Utils.validation.isValidUUID(id)) {
        return res.status(400).json(
          Utils.createErrorResponse('Некорректный формат ID поста', [], 400)
        );
      }

      const post = await blogService.unpublishPost(id, req.user.id);
      
      logger.logBusinessEvent('post_unpublished', {
        postId: id,
        unpublishedBy: req.user.id
      });

      res.json(
        Utils.createResponse(
          post,
          'Пост снят с публикации'
        )
      );
    } catch (error) {
      logger.error('Error unpublishing post', {
        postId: req.params.id,
        unpublishedBy: req.user.id,
        error: Utils.handleError(error)
      });

      const statusCode = error.message.includes('не найден') ? 404 : 
                        error.message.includes('Нет прав') ? 403 : 500;
      const errorMessage = error.message.includes('не найден') ? 'Пост не найден' :
                          error.message.includes('Нет прав') ? 'Недостаточно прав для снятия поста с публикации' :
                          'Ошибка при снятии поста с публикации';

      res.status(statusCode).json(
        Utils.createErrorResponse(errorMessage, [error.message], statusCode)
      );
    }
  }
);

module.exports = router;