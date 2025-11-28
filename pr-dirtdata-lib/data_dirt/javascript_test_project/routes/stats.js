const express = require('express');
const userService = require('../services/user');
const blogService = require('../services/blog');
const authService = require('../services/auth');
const Utils = require('../utils');
const logger = require('../services/logger');

/**
 * Роутер для статистики
 */
const router = express.Router();

/**
 * GET /api/v1/stats/overview
 * Получение общей статистики системы
 */
router.get('/overview', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Получение статистики из разных сервисов
    const [userStats, postStats] = await Promise.all([
      userService.getUserStats(),
      blogService.getPostStats()
    ]);

    const overview = {
      users: userStats,
      posts: postStats,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      },
      summary: {
        totalUsers: userStats.total || 0,
        totalPosts: postStats.total || 0,
        totalPublishedPosts: postStats.published || 0,
        totalDraftPosts: postStats.draft || 0,
        activeUsers: userStats.active || 0,
        totalViews: postStats.totalViews || 0,
        totalLikes: postStats.totalLikes || 0,
        totalComments: postStats.totalComments || 0
      }
    };

    logger.logBusinessEvent('overview_stats_retrieved', {
      responseTime: Date.now() - startTime,
      userId: req.user?.id
    });

    res.json(
      Utils.createResponse(
        overview,
        'Общая статистика получена'
      )
    );
  } catch (error) {
    logger.error('Error retrieving overview stats', {
      error: Utils.handleError(error)
    });

    res.status(500).json(
      Utils.createErrorResponse('Ошибка при получении общей статистики', [error.message], 500)
    );
  }
});

/**
 * GET /api/v1/stats/users
 * Статистика пользователей (требует аутентификации)
 */
router.get('/users',
  authService.authenticateRequest,
  authService.requireRole('admin'),
  async (req, res) => {
    try {
      const startTime = Date.now();
      
      const userStats = await userService.getUserStats();

      logger.logBusinessEvent('users_stats_retrieved', {
        responseTime: Date.now() - startTime,
        requestedBy: req.user.id
      });

      res.json(
        Utils.createResponse(
          userStats,
          'Статистика пользователей получена'
        )
      );
    } catch (error) {
      logger.error('Error retrieving users stats', {
        requestedBy: req.user.id,
        error: Utils.handleError(error)
      });

      res.status(500).json(
        Utils.createErrorResponse('Ошибка при получении статистики пользователей', [error.message], 500)
      );
    }
  }
);

/**
 * GET /api/v1/stats/posts
 * Статистика постов
 */
router.get('/posts', async (req, res) => {
  try {
    const startTime = Date.now();
    
    const postStats = await blogService.getPostStats();

    logger.logBusinessEvent('posts_stats_retrieved', {
      responseTime: Date.now() - startTime,
      userId: req.user?.id
    });

    res.json(
      Utils.createResponse(
        postStats,
        'Статистика постов получена'
      )
    );
  } catch (error) {
    logger.error('Error retrieving posts stats', {
      error: Utils.handleError(error)
    });

    res.status(500).json(
      Utils.createErrorResponse('Ошибка при получении статистики постов', [error.message], 500)
    );
  }
});

/**
 * GET /api/v1/stats/analytics
 * Детальная аналитика (только для администраторов)
 */
router.get('/analytics',
  authService.authenticateRequest,
  authService.requireRole('admin'),
  async (req, res) => {
    try {
      const startTime = Date.now();
      
      // В реальном приложении здесь была бы сложная аналитика
      const analytics = {
        traffic: {
          pageViews: 0,
          uniqueVisitors: 0,
          bounceRate: 0,
          averageSessionDuration: 0,
          topPages: []
        },
        engagement: {
          averageLikesPerPost: 0,
          averageCommentsPerPost: 0,
          mostEngagedUsers: [],
          mostLikedPosts: [],
          mostCommentedPosts: []
        },
        growth: {
          userGrowthRate: 0,
          postGrowthRate: 0,
          monthlyRegistrations: [],
          monthlyPosts: []
        },
        performance: {
          averageResponseTime: 0,
          serverUptime: process.uptime(),
          errorRate: 0,
          systemLoad: process.cpuUsage()
        }
      };

      logger.logBusinessEvent('analytics_stats_retrieved', {
        responseTime: Date.now() - startTime,
        requestedBy: req.user.id
      });

      res.json(
        Utils.createResponse(
          analytics,
          'Детальная аналитика получена'
        )
      );
    } catch (error) {
      logger.error('Error retrieving analytics', {
        requestedBy: req.user.id,
        error: Utils.handleError(error)
      });

      res.status(500).json(
        Utils.createErrorResponse('Ошибка при получении аналитики', [error.message], 500)
      );
    }
  }
);

module.exports = router;