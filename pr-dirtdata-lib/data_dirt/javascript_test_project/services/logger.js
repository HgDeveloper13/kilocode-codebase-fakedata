const winston = require('winston');
const path = require('path');
const config = require('../config');

/**
 * Сервис для логирования с использованием Winston
 * Поддерживает логирование в файл и консоль с разными уровнями
 */
class LoggerService {
  constructor() {
    this.logger = this.createLogger();
  }

  /**
   * Создание экземпляра Winston логгера
   */
  createLogger() {
    const logger = winston.createLogger({
      level: config.logging.level,
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
          let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
          
          // Добавление метаданных в лог
          if (Object.keys(meta).length > 0) {
            log += ` | ${JSON.stringify(meta)}`;
          }
          
          // Добавление stack trace для ошибок
          if (stack) {
            log += `\n${stack}`;
          }
          
          return log;
        })
      ),
      defaultMeta: {
        service: 'javascript-test-project',
        environment: config.nodeEnv
      },
      transports: []
    });

    // Консольный транспорт для development
    if (config.logging.console.enabled) {
      logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
            let log = `${timestamp} ${level}: ${message}`;
            
            if (Object.keys(meta).length > 0) {
              log += ` ${JSON.stringify(meta)}`;
            }
            
            if (stack && config.isDevelopment) {
              log += `\n${stack}`;
            }
            
            return log;
          })
        )
      }));
    }

    // Файловый транспорт для production
    if (config.logging.file.enabled) {
      logger.add(new winston.transports.File({
        filename: path.join(__dirname, '../logs/error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: winston.format.json()
      }));

      logger.add(new winston.transports.File({
        filename: path.join(__dirname, '../logs/combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: winston.format.json()
      }));
    }

    return logger;
  }

  /**
   * Логирование сообщения уровня debug
   */
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  /**
   * Логирование сообщения уровня info
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  /**
   * Логирование сообщения уровня warn
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  /**
   * Логирование сообщения уровня error
   */
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  /**
   * Логирование HTTP запроса
   */
  logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };

    if (res.statusCode >= 400) {
      this.error('HTTP Request Error', logData);
    } else {
      this.info('HTTP Request', logData);
    }
  }

  /**
   * Логирование ошибки API
   */
  logApiError(error, req) {
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    };

    this.error('API Error', logData);
  }

  /**
   * Логирование бизнес-событий
   */
  logBusinessEvent(event, data = {}) {
    this.info(`Business Event: ${event}`, {
      event,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Создание child logger с дополнительными метаданными
   */
  child(meta) {
    return this.logger.child(meta);
  }

  /**
   * Асинхронное логирование с обработкой ошибок
   */
  async logAsync(level, message, meta = {}) {
    try {
      this.logger[level](message, meta);
    } catch (error) {
      console.error('Failed to log:', error);
    }
  }

  /**
   * Промо-логгер для создания структурированных логов
   */
  profile(name, meta = {}) {
    const start = Date.now();
    
    return {
      done: (additionalMeta = {}) => {
        const duration = Date.now() - start;
        this.info(`Profile: ${name}`, {
          name,
          duration: `${duration}ms`,
          ...meta,
          ...additionalMeta
        });
      }
    };
  }
}

// Создание singleton экземпляра логгера
const logger = new LoggerService();

module.exports = logger;