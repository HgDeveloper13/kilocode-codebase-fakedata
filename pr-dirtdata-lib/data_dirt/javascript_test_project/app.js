const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Импорт конфигурации и утилит
const config = require('./config');
const Utils = require('./utils');
const logger = require('./services/logger');

/**
 * Основной класс приложения
 * Управляет инициализацией сервера, middleware и роутов
 */
class App {
  constructor() {
    this.app = express();
    this.port = config.port;
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Инициализация middleware
   */
  initializeMiddlewares() {
    // Базовые middleware
    this.app.use(helmet()); // Безопасность заголовков
    this.app.use(cors({
      origin: config.security.corsOrigins,
      credentials: true,
      optionsSuccessStatus: 200
    }));

    // Парсинг JSON и URL-encoded данных
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Ограничение скорости запросов
    const limiter = rateLimit({
      windowMs: config.security.rateLimitWindowMs,
      max: config.security.rateLimitMaxRequests,
      message: {
        success: false,
        message: 'Слишком много запросов, попробуйте позже'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Логирование запросов
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      next();
    });

    // Статические файлы
    this.app.use('/uploads', express.static(config.files.uploadDir));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        version: process.env.npm_package_version || '1.0.0'
      });
    });
  }

  /**
   * Инициализация роутов
   */
  initializeRoutes() {
    // API версия и базовые роуты
    this.app.get('/', (req, res) => {
      res.json({
        message: 'JavaScript Test Project API',
        version: '1.0.0',
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
        endpoints: {
          api: '/api/v1',
          health: '/health',
          documentation: '/api/v1/docs'
        }
      });
    });

    // Подключение API роутов
    this.app.use('/api/v1', require('./routes'));

    // 404 обработчик для API
    this.app.use('/api/*', (req, res) => {
      const error = Utils.createErrorResponse('API endpoint not found', [], 404);
      res.status(404).json(error);
    });

    // Главный 404 обработчик
    this.app.use('*', (req, res) => {
      const error = Utils.createErrorResponse('Page not found', [], 404);
      res.status(404).json(error);
    });
  }

  /**
   * Инициализация обработки ошибок
   */
  initializeErrorHandling() {
    // Глобальный обработчик ошибок
    this.app.use((error, req, res, next) => {
      const errorInfo = Utils.handleError(error, `${req.method} ${req.url}`);
      
      // Логирование ошибки
      logger.error('Unhandled Error', {
        error: errorInfo,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      // Отправка ответа клиенту
      const errorResponse = Utils.createErrorResponse(
        config.isDevelopment ? error.message : 'Внутренняя ошибка сервера',
        config.isDevelopment ? [error.stack] : [],
        error.statusCode || 500
      );

      res.status(errorResponse.statusCode).json(errorResponse);
    });

    // Обработчик необработанных промисов
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        reason: reason,
        promise: promise
      });
    });

    // Обработчик необработанных исключений
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: Utils.handleError(error),
        stack: error.stack
      });
      
      // Завершение процесса после критической ошибки
      process.exit(1);
    });

    // Graceful shutdown
    this.setupGracefulShutdown();
  }

  /**
   * Настройка graceful shutdown
   */
  setupGracefulShutdown() {
    const gracefulShutdown = (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      this.server.close(() => {
        logger.info('HTTP server closed');
        
        // Здесь можно добавить закрытие соединений с БД
        // database.disconnect().then(() => {
        //   logger.info('Database connection closed');
        //   process.exit(0);
        // });
        
        process.exit(0);
      });

      // Принудительное завершение через 10 секунд
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * Запуск сервера
   */
  async start() {
    try {
      // Валидация конфигурации
      config.validate();

      // Создание директорий для файлов
      await this.ensureDirectories();

      // Запуск сервера
      this.server = this.app.listen(this.port, () => {
        logger.info(`Server running on port ${this.port}`);
        logger.info(`Environment: ${config.nodeEnv}`);
        logger.info(`Health check: http://localhost:${this.port}/health`);
        logger.info(`API docs: http://localhost:${this.port}/api/v1`);
      });

    } catch (error) {
      logger.error('Failed to start server', { error: Utils.handleError(error) });
      process.exit(1);
    }
  }

  /**
   * Создание необходимых директорий
   */
  async ensureDirectories() {
    const directories = [
      config.files.uploadDir,
      'logs',
      'data'
    ];

    for (const dir of directories) {
      await Utils.file.ensureDir(dir);
    }
  }

  /**
   * Получение Express приложения (для тестирования)
   */
  getApp() {
    return this.app;
  }

  /**
   * Получение HTTP сервера (для graceful shutdown)
   */
  getServer() {
    return this.server;
  }
}

/**
 * Функция создания и запуска приложения
 */
async function createAndStartApp() {
  const app = new App();
  await app.start();
  return app;
}

// Экспорт класса для тестирования
module.exports = App;

// Если файл запущен напрямую, запускаем сервер
if (require.main === module) {
  createAndStartApp().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}