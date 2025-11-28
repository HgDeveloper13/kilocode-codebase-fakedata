const path = require('path');

/**
 * Основной конфигурационный файл приложения
 * Содержит все настройки для различных окружений
 */
class Config {
  constructor() {
    // Основные настройки сервера
    this.port = process.env.PORT || 3000;
    this.nodeEnv = process.env.NODE_ENV || 'development';
    this.isDevelopment = this.nodeEnv === 'development';
    this.isProduction = this.nodeEnv === 'production';
    
    // Настройки базы данных
    this.database = {
      url: process.env.DATABASE_URL || 'mongodb://localhost:27017/test_project',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    };

    // JWT настройки для аутентификации
    this.jwt = {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    };

    // Настройки безопасности
    this.security = {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 минут
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 запросов
      corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:8080']
    };

    // Настройки логирования
    this.logging = {
      level: process.env.LOG_LEVEL || (this.isDevelopment ? 'debug' : 'info'),
      file: {
        enabled: !this.isDevelopment,
        filename: 'logs/app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d'
      },
      console: {
        enabled: true,
        colorize: this.isDevelopment
      }
    };

    // Настройки API
    this.api = {
      version: 'v1',
      prefix: '/api',
      pagination: {
        defaultLimit: 10,
        maxLimit: 100
      },
      cache: {
        ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 минут
        checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD) || 600 // 10 минут
      }
    };

    // Настройки файловой системы
    this.files = {
      uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../uploads'),
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'text/plain',
        'application/json'
      ]
    };

    // Настройки для внешних сервисов
    this.external = {
      email: {
        service: process.env.EMAIL_SERVICE || 'gmail',
        user: process.env.EMAIL_USER || '',
        password: process.env.EMAIL_PASSWORD || ''
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || null
      }
    };

    // Конфигурация для тестов
    this.test = {
      database: {
        url: 'mongodb://localhost:27017/test_project_test'
      },
      jwt: {
        secret: 'test-jwt-secret',
        expiresIn: '1h'
      }
    };
  }

  /**
   * Получить полный URL API с версией
   */
  getApiUrl() {
    return `${this.api.prefix}/${this.api.version}`;
  }

  /**
   * Проверить, включено ли логирование в файл
   */
  isFileLoggingEnabled() {
    return this.logging.file.enabled;
  }

  /**
   * Получить конфигурацию для конкретного окружения
   */
  getEnvironmentConfig() {
    return {
      port: this.port,
      nodeEnv: this.nodeEnv,
      isDevelopment: this.isDevelopment,
      isProduction: this.isProduction,
      api: this.api,
      security: this.security
    };
  }

  /**
   * Валидация критически важных настроек
   */
  validate() {
    const errors = [];

    if (!process.env.JWT_SECRET && this.isProduction) {
      errors.push('JWT_SECRET должен быть установлен в продакшене');
    }

    if (!process.env.DATABASE_URL && this.isProduction) {
      errors.push('DATABASE_URL должен быть установлен в продакшене');
    }

    if (errors.length > 0) {
      throw new Error(`Конфигурационные ошибки: ${errors.join(', ')}`);
    }

    return true;
  }
}

// Экспорт singleton экземпляра конфигурации
module.exports = new Config();