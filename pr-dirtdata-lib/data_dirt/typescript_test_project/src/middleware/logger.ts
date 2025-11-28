import { Request, Response, NextFunction } from 'express';
import { formatLogMessage, sanitizeForLogging } from '../utils';

/**
 * Интерфейсы для middleware
 */
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  meta?: Record<string, any>;
}

export interface Logger {
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}

/**
 * Консольный логгер
 */
class ConsoleLogger implements Logger {
  info(message: string, meta?: Record<string, any>): void {
    console.log(formatLogMessage('info', message, meta));
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(formatLogMessage('warn', message, meta));
  }

  error(message: string, meta?: Record<string, any>): void {
    console.error(formatLogMessage('error', message, meta));
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatLogMessage('debug', message, meta));
    }
  }
}

/**
 * Файл-логгер (в реальном проекте использовался бы Winston или другой логгер)
 */
class FileLogger implements Logger {
  private logLevel: string;

  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  info(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('info')) {
      this.writeLog('info', message, meta);
    }
  }

  warn(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('warn')) {
      this.writeLog('warn', message, meta);
    }
  }

  error(message: string, meta?: Record<string, any>): void {
    this.writeLog('error', message, meta);
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('debug')) {
      this.writeLog('debug', message, meta);
    }
  }

  private writeLog(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    meta?: Record<string, any>
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta: meta ? sanitizeForLogging(meta) : undefined
    };

    // В реальном проекте здесь была бы запись в файл
    console.log(JSON.stringify(logEntry));
  }
}

/**
 * Создание логгера в зависимости от окружения
 */
function createLogger(): Logger {
  if (process.env.NODE_ENV === 'production') {
    return new FileLogger();
  }
  return new ConsoleLogger();
}

// Экспортируем экземпляр логгера
export const logger = createLogger();

/**
 * Middleware для логирования запросов
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  // Логируем начало запроса
  logger.info('Начало обработки запроса', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Перехватываем окончание ответа
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    const logLevel = status >= 400 ? 'warn' : 'info';
    const message = `Завершение обработки запроса: ${req.method} ${req.originalUrl}`;
    
    logger[logLevel](message, {
      status,
      duration: `${duration}ms`,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip
    });
  });

  next();
}

/**
 * Middleware для логирования ошибок
 */
export function errorLogger(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Ошибка в обработке запроса', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: sanitizeForLogging(req.body)
    }
  });

  next(error);
}

/**
 * Тип для асинхронного логгера
 */
export type AsyncLogger = (
  message: string,
  meta?: Record<string, any>
) => Promise<void>;

/**
 * Асинхронный логгер (для более сложных сценариев)
 */
export class AsyncLoggerImpl implements Logger {
  private queue: LogEntry[] = [];
  private isProcessing = false;

  constructor(private batchSize = 10, private flushInterval = 5000) {
    this.startProcessing();
  }

  private startProcessing(): void {
    setInterval(() => {
      if (this.queue.length > 0 && !this.isProcessing) {
        this.flush();
      }
    }, this.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const batch = this.queue.splice(0, this.batchSize);

    try {
      await this.writeBatch(batch);
    } catch (error) {
      console.error('Ошибка при записи логов:', error);
      // В реальном проекте здесь была бы повторная попытка записи
    } finally {
      this.isProcessing = false;
    }
  }

  private async writeBatch(entries: LogEntry[]): Promise<void> {
    // В реальном проекте здесь была бы асинхронная запись в файл или базу данных
    for (const entry of entries) {
      console.log(JSON.stringify(entry));
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    this.queue.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      meta: meta ? sanitizeForLogging(meta) : undefined
    });
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.queue.push({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      meta: meta ? sanitizeForLogging(meta) : undefined
    });
  }

  error(message: string, meta?: Record<string, any>): void {
    this.queue.push({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      meta: meta ? sanitizeForLogging(meta) : undefined
    });
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      this.queue.push({
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        meta: meta ? sanitizeForLogging(meta) : undefined
      });
    }
  }
}

/**
 * Пространство имен для логирования производительности
 */
export namespace PerformanceLogger {
  /**
   * Логирование времени выполнения функции
   */
  export function logExecutionTime<T extends (...args: any[]) => any>(
    fn: T,
    functionName: string = fn.name
  ): T {
    return (async (...args: any[]) => {
      const start = performance.now();
      
      try {
        const result = await fn(...args);
        const end = performance.now();
        const duration = end - start;
        
        logger.debug(`Выполнение функции ${functionName}`, {
          duration: `${duration.toFixed(2)}ms`,
          argsCount: args.length
        });
        
        return result;
      } catch (error) {
        const end = performance.now();
        const duration = end - start;
        
        logger.error(`Ошибка в функции ${functionName}`, {
          duration: `${duration.toFixed(2)}ms`,
          error: {
            name: (error as Error).name,
            message: (error as Error).message
          }
        });
        
        throw error;
      }
    }) as T;
  }

  /**
   * Декоратор для логирования методов классов
   */
  export function LogPerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
    const originalMethod = descriptor.value;
    descriptor.value = logExecutionTime(originalMethod, propertyKey);
  }

  /**
   * Логирование использования памяти
   */
  export function logMemoryUsage(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      
      logger.debug('Использование памяти', {
        rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(usage.external / 1024 / 1024)} MB`
      });
    }
  }

  /**
   * Логирование производительности запроса
   */
  export function logRequestPerformance(req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime.bigint();
    
    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // в миллисекундах
      
      logger.debug('Производительность запроса', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration.toFixed(2)}ms`
      });
      
      // Логируем использование памяти каждые 100 запросов
      if (Math.random() < 0.01) {
        logMemoryUsage();
      }
    });
    
    next();
  }
}