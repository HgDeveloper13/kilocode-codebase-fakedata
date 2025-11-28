import { Request, Response, NextFunction } from 'express';
import { 
  ApiResponse, 
  ValidationError, 
  ErrorType,
  v4 as uuidv4 
} from '../types';
import { logger } from './logger';

/**
 * Кастомные классы ошибок для разных типов исключений
 */

/**
 * Базовый класс для прикладных ошибок
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorType: ErrorType;
  public readonly isOperational: boolean;
  public readonly requestId: string;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number = 500,
    errorType: ErrorType = ErrorType.SERVER_ERROR,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.isOperational = isOperational;
    this.requestId = uuidv4();
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Ошибка валидации
 */
export class ValidationError extends AppError {
  public readonly validationErrors: ValidationError[];

  constructor(
    message: string,
    validationErrors: ValidationError[] = [],
    statusCode: number = 400,
    errorType: ErrorType = ErrorType.VALIDATION_ERROR
  ) {
    super(message, statusCode, errorType);
    this.validationErrors = validationErrors;
  }
}

/**
 * Ошибка аутентификации
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Требуется аутентификация') {
    super(message, 401, ErrorType.AUTHENTICATION_ERROR);
  }
}

/**
 * Ошибка авторизации
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Недостаточно прав доступа') {
    super(message, 403, ErrorType.AUTHORIZATION_ERROR);
  }
}

/**
 * Ошибка "не найдено"
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Ресурс не найден') {
    super(message, 404, ErrorType.NOT_FOUND_ERROR);
  }
}

/**
 * Ошибка конфликта
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Конфликт данных') {
    super(message, 409, ErrorType.CONFLICT_ERROR);
  }
}

/**
 * Ошибка сервера
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Внутренняя ошибка сервера') {
    super(message, 500, ErrorType.SERVER_ERROR);
  }
}

/**
 * Ошибка сети
 */
export class NetworkError extends AppError {
  constructor(message: string = 'Ошибка сети') {
    super(message, 502, ErrorType.NETWORK_ERROR);
  }
}

/**
 * Ошибка таймаута
 */
export class TimeoutError extends AppError {
  constructor(message: string = 'Превышено время ожидания') {
    super(message, 408, ErrorType.TIMEOUT_ERROR);
  }
}

/**
 * Интерфейс для детальной информации об ошибке
 */
export interface ErrorDetails {
  requestId: string;
  timestamp: string;
  path?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  stack?: string;
  validationErrors?: ValidationError[];
}

/**
 * Функция для определения типа ошибки
 */
function determineErrorType(error: Error): ErrorType {
  if (error instanceof AppError) {
    return error.errorType;
  }

  // Проверка на известные типы ошибок
  if (error.name === 'ValidationError') {
    return ErrorType.VALIDATION_ERROR;
  }
  
  if (error.name === 'CastError') {
    return ErrorType.VALIDATION_ERROR;
  }
  
  if (error.name === 'JsonWebTokenError') {
    return ErrorType.AUTHENTICATION_ERROR;
  }
  
  if (error.name === 'TokenExpiredError') {
    return ErrorType.AUTHENTICATION_ERROR;
  }
  
  if (error.name === 'MongoError' || error.name === 'MongooseError') {
    return ErrorType.SERVER_ERROR;
  }

  return ErrorType.SERVER_ERROR;
}

/**
 * Функция для определения статус-кода ошибки
 */
function determineStatusCode(error: Error): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  // Определение статус-кода по типу ошибки
  const errorType = determineErrorType(error);
  switch (errorType) {
    case ErrorType.VALIDATION_ERROR:
      return 400;
    case ErrorType.AUTHENTICATION_ERROR:
      return 401;
    case ErrorType.AUTHORIZATION_ERROR:
      return 403;
    case ErrorType.NOT_FOUND_ERROR:
      return 404;
    case ErrorType.CONFLICT_ERROR:
      return 409;
    case ErrorType.TIMEOUT_ERROR:
      return 408;
    case ErrorType.NETWORK_ERROR:
      return 502;
    default:
      return 500;
  }
}

/**
 * Функция для извлечения деталей об ошибке
 */
function extractErrorDetails(
  error: Error,
  req?: Request
): ErrorDetails {
  const requestId = uuidv4();
  
  const details: ErrorDetails = {
    requestId,
    timestamp: new Date().toISOString()
  };

  if (req) {
    details.path = req.originalUrl;
    details.method = req.method;
    details.ip = req.ip;
    details.userAgent = req.get('User-Agent');
  }

  // Если это кастомная ошибка, добавляем дополнительные данные
  if (error instanceof AppError) {
    details.requestId = error.requestId;
    details.timestamp = error.timestamp;
  }

  // Добавляем стектрейс в development режиме
  if (process.env.NODE_ENV === 'development') {
    details.stack = error.stack;
  }

  // Если есть validationErrors, добавляем их
  if (error instanceof ValidationError && 'validationErrors' in error) {
    details.validationErrors = (error as any).validationErrors;
  }

  return details;
}

/**
 * Функция для создания ответа об ошибке
 */
function createErrorResponse(
  error: Error,
  req?: Request
): ApiResponse {
  const statusCode = determineStatusCode(error);
  const errorType = determineErrorType(error);
  const details = extractErrorDetails(error, req);

  const response: ApiResponse = {
    success: false,
    error: errorType,
    message: error.message || 'Произошла ошибка',
    timestamp: details.timestamp,
    requestId: details.requestId
  };

  // Добавляем детали в зависимости от типа ошибки
  if (details.validationErrors && details.validationErrors.length > 0) {
    response.data = {
      validationErrors: details.validationErrors
    };
  }

  // Добавляем технические детали в development режиме
  if (process.env.NODE_ENV === 'development') {
    response.data = {
      ...response.data,
      details: {
        stack: details.stack,
        path: details.path,
        method: details.method,
        ip: details.ip
      }
    };
  }

  return response;
}

/**
 * Централизованная обработка ошибок
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Логируем ошибку
  logger.error('Обработка ошибки', {
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
      body: req.body
    }
  });

  // Создаем ответ
  const response = createErrorResponse(error, req);
  const statusCode = determineStatusCode(error);

  // Отправляем ответ
  res.status(statusCode).json(response);
}

/**
 * Middleware для обработки 404 ошибок
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new NotFoundError(`Маршрут ${req.method} ${req.originalUrl} не найден`);
  next(error);
}

/**
 * Middleware для обработки асинхронных ошибок
 */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Middleware для обработки ошибок валидации
 */
export function validationErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Проверка, является ли ошибка ошибкой валидации
  if (error.name === 'ValidationError' || 
      (error.message && error.message.includes('validation'))) {
    const validationError = new ValidationError(
      'Ошибка валидации данных',
      [{ field: 'unknown', message: error.message }]
    );
    return next(validationError);
  }

  next(error);
}

/**
 * Middleware для обработки ошибок JWT
 */
export function jwtErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    const authError = new AuthenticationError('Недействительный или просроченный токен');
    return next(authError);
  }

  next(error);
}

/**
 * Пространство имен для обработки специфичных типов ошибок
 */
export namespace SpecificErrorHandlers {
  /**
   * Обработка ошибок MongoDB
   */
  export function handleMongoError(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    if (error.name && error.name.includes('Mongo')) {
      let message = 'Ошибка базы данных';
      let statusCode = 500;

      // Обработка дубликата
      if ((error as any).code === 11000) {
        message = 'Нарушение уникальности';
        statusCode = 409;
      }

      // Обработка невалидного ObjectId
      if ((error as any).kind === 'ObjectId') {
        message = 'Неверный формат ID';
        statusCode = 400;
      }

      const appError = new AppError(message, statusCode);
      return next(appError);
    }

    next(error);
  }

  /**
   * Обработка ошибок сети
   */
  export function handleNetworkError(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    if (error.message && (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('timeout')
    )) {
      const networkError = new NetworkError('Ошибка подключения к внешнему сервису');
      return next(networkError);
    }

    next(error);
  }

  /**
   * Обработка ошибок файловой системы
   */
  export function handleFileSystemError(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    if (error.message && (
      error.message.includes('ENOENT') || // Файл не найден
      error.message.includes('EACCES') || // Доступ запрещен
      error.message.includes('EBUSY')    // Файл занят
    )) {
      const fsError = new AppError('Ошибка файловой системы', 500);
      return next(fsError);
    }

    next(error);
  }
}

/**
 * Функция для создания middleware цепочки обработки ошибок
 */
export function createErrorHandlingPipeline() {
  return [
    // Специфичные обработчики ошибок
    SpecificErrorHandlers.handleMongoError,
    SpecificErrorHandlers.handleNetworkError,
    SpecificErrorHandlers.handleFileSystemError,
    
    // Общие обработчики
    validationErrorHandler,
    jwtErrorHandler,
    
    // Финальный обработчик
    errorHandler
  ];
}

/**
 * Декоратор для обработки ошибок в методах классов
 */
export function HandleError(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = function (this: any, ...args: any[]) {
    try {
      const result = originalMethod.apply(this, args);
      
      // Если метод возвращает Promise, обрабатываем ошибки в нем
      if (result && typeof result.catch === 'function') {
        return result.catch((error: Error) => {
          logger.error(`Ошибка в методе ${propertyKey}`, {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack
            }
          });
          
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      logger.error(`Ошибка в методе ${propertyKey}`, {
        error: {
          name: (error as Error).name,
          message: (error as Error).message,
          stack: (error as Error).stack
        }
      });
      
      throw error;
    }
  };

  return descriptor;
}

/**
 * Тип для функции-обертки для обработки ошибок
 */
export type ErrorHandlingWrapper<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => ReturnType<T> extends Promise<any> ? Promise<ReturnType<T>> : ReturnType<T>;

/**
 * Функция-обертка для обработки ошибок
 */
export function wrapWithErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  context?: any
): ErrorHandlingWrapper<T> {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn.apply(context || this, args);
    } catch (error) {
      logger.error(`Ошибка в функции ${fn.name}`, {
        error: {
          name: (error as Error).name,
          message: (error as Error).message,
          stack: (error as Error).stack
        },
        args
      });
      
      throw error;
    }
  }) as ErrorHandlingWrapper<T>;
}