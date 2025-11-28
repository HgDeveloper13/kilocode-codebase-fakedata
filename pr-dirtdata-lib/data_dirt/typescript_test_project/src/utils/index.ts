/**
 * Утилиты для всего приложения
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  ApiResponse, 
  ValidationError, 
  ValidationResult,
  AsyncFunction,
  MiddlewareFunction
} from '../types';

/**
 * Утилиты для работы с датами
 */
export namespace DateUtils {
  /**
   * Форматирование даты в локальном формате
   */
  export function formatLocal(date: Date, locale: string = 'ru-RU'): string {
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Получение возраста по дате рождения
   */
  export function getAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Проверка, является ли дата в прошлом
   */
  export function isPastDate(date: Date): boolean {
    return date < new Date();
  }

  /**
   * Проверка, является ли дата в будущем
   */
  export function isFutureDate(date: Date): boolean {
    return date > new Date();
  }

  /**
   * Получение начала дня
   */
  export function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  /**
   * Получение конца дня
   */
  export function endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }

  /**
   * Добавление дней к дате
   */
  export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Добавление месяцев к дате
   */
  export function addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  /**
   * Разница между датами в днях
   */
  export function differenceInDays(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

/**
 * Утилиты для работы с числами
 */
export namespace NumberUtils {
  /**
   * Форматирование числа с разделителями тысяч
   */
  export function formatNumber(num: number, locale: string = 'ru-RU'): string {
    return num.toLocaleString(locale);
  }

  /**
   * Форматирование валюты
   */
  export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
    return amount.toLocaleString(locale, {
      style: 'currency',
      currency: currency
    });
  }

  /**
   * Округление до заданного количества знаков
   */
  export function round(num: number, decimals: number = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  }

  /**
   * Проверка, является ли число в заданном диапазоне
   */
  export function inRange(num: number, min: number, max: number): boolean {
    return num >= min && num <= max;
  }

  /**
   * Генерация случайного числа в диапазоне
   */
  export function randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Вычисление процента от числа
   */
  export function calculatePercentage(value: number, percentage: number): number {
    return (value * percentage) / 100;
  }

  /**
   * Вычисление числа от процента
   */
  export function calculateValueFromPercentage(total: number, percentage: number): number {
    return (total * percentage) / 100;
  }
}

/**
 * Утилиты для работы со строками
 */
export namespace StringUtils {
  /**
   * Генерация slug из строки
   */
  export function generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  /**
   * Обрезка строки с многоточием
   */
  export function truncate(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Капитализация первой буквы
   */
  export function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Капитализация каждой буквы слова
   */
  export function capitalizeWords(text: string): string {
    return text.replace(/\b\w/g, (match) => match.toUpperCase());
  }

  /**
   * Удаление HTML тегов
   */
  export function stripHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }

  /**
   * Экранирование HTML
   */
  export function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Проверка на палиндром
   */
  export function isPalindrome(str: string): boolean {
    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleaned === cleaned.split('').reverse().join('');
  }
}

/**
 * Утилиты для валидации
 */
export namespace ValidationUtils {
  /**
   * Валидация email
   */
  export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Валидация телефона
   */
  export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Валидация URL
   */
  export function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Валидация даты
   */
  export function isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Валидация UUID
   */
  export function isValidUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Проверка сложности пароля
   */
  export function validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push('Пароль должен быть не менее 8 символов');

    if (/[a-z]/.test(password)) score++;
    else feedback.push('Пароль должен содержать строчные буквы');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Пароль должен содержать заглавные буквы');

    if (/\d/.test(password)) score++;
    else feedback.push('Пароль должен содержать цифры');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else feedback.push('Пароль должен содержать специальные символы');

    return {
      isValid: score >= 4,
      score,
      feedback
    };
  }
}

/**
 * Утилиты для асинхронных операций
 */
export namespace AsyncUtils {
  /**
   * Задержка выполнения
   */
  export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Повторение функции с экспоненциальной задержкой
   */
  export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (i === maxRetries) {
          throw lastError;
        }

        const delayMs = baseDelay * Math.pow(2, i);
        await delay(delayMs);
      }
    }

    throw lastError!;
  }

  /**
   * Параллельное выполнение функций с ограничением
   */
  export async function pool<T>(
    tasks: (() => Promise<T>)[],
    concurrency: number = 3
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<any>[] = [];

    for (const task of tasks) {
      const promise = task().then(result => {
        executing.splice(executing.indexOf(promise), 1);
        return result;
      });

      results.push(promise);

      if (concurrency <= tasks.length) {
        executing.push(promise);

        if (executing.length >= concurrency) {
          await Promise.race(executing);
        }
      }
    }

    return Promise.all(results);
  }

  /**
   * Тайм-аут для асинхронной операции
   */
  export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), timeoutMs);
      })
    ]);
  }
}

/**
 * Утилиты для объектов
 */
export namespace ObjectUtils {
  /**
   * Глубокое клонирование объекта
   */
  export function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
    if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as unknown as T;
    
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    
    return cloned;
  }

  /**
   * Объединение объектов (глубокое)
   */
  export function deepMerge<T extends object>(target: T, ...sources: Partial<T>[]): T {
    if (!sources.length) return target;
    
    const source = sources.shift();
    if (!source) return target;

    for (const key in source) {
      if (source[key] === undefined) continue;
      
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        this.deepMerge(target[key] as object, source[key] as object);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }

    return this.deepMerge(target, ...sources);
  }

  /**
   * Проверка, является ли объект пустым
   */
  export function isEmpty(obj: any): boolean {
    return obj === null || obj === undefined || 
           (typeof obj === 'object' && Object.keys(obj).length === 0);
  }

  /**
   * Получение значения по цепочке ключей
   */
  export function get<T, K extends keyof T>(obj: T, path: K | string, defaultValue?: any): any {
    const keys = String(path).split('.');
    let result = obj;

    for (const key of keys) {
      if (result == null) return defaultValue;
      result = result[key];
    }

    return result !== undefined ? result : defaultValue;
  }

  /**
   * Удаление undefined значений из объекта
   */
  export function removeUndefined<T extends object>(obj: T): T {
    const result = {} as T;
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  }
}

/**
 * Утилиты для массивов
 */
export namespace ArrayUtils {
  /**
   * Удаление дубликатов из массива
   */
  export function unique<T>(arr: T[]): T[] {
    return [...new Set(arr)];
  }

  /**
   * Группировка элементов массива
   */
  export function groupBy<T>(arr: T[], key: (item: T) => string | number): Record<string | number, T[]> {
    return arr.reduce((groups, item) => {
      const groupKey = key(item);
      groups[groupKey] = groups[groupKey] || [];
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string | number, T[]>);
  }

  /**
   * Перемешивание массива (алгоритм Фишера-Йетса)
   */
  export function shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Получение случайного элемента из массива
   */
  export function random<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Разделение массива на части
   */
  export function chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Поиск элемента с условием
   */
  export function findWhere<T>(arr: T[], condition: (item: T) => boolean): T | undefined {
    return arr.find(condition);
  }
}

/**
 * Утилиты для создания API ответов
 */
export namespace ApiUtils {
  /**
   * Создание успешного ответа
   */
  export function success<T>(
    data: T,
    message?: string,
    requestId: string = uuidv4()
  ): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Создание ответа с ошибкой
   */
  export function error(
    message: string,
    error?: string,
    requestId: string = uuidv4()
  ): ApiResponse {
    return {
      success: false,
      error: error || 'Bad Request',
      message,
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Создание ответа с валидацией
   */
  export function validationError(
    errors: ValidationError[],
    requestId: string = uuidv4()
  ): ApiResponse {
    return {
      success: false,
      error: 'Validation Error',
      message: 'Проверьте правильность заполнения формы',
      data: { validationErrors: errors },
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Создание middleware для обработки API ответов
   */
  export function createApiResponseHandler<T>(): MiddlewareFunction<T> {
    return (req, res, next) => {
      // Middleware для обработки ответов
      const originalSend = res.send;
      
      res.send = function(body: any) {
        if (typeof body === 'object' && !body.success) {
          return originalSend.call(this, ApiUtils.error(body.message || 'Ошибка', body.error, body.requestId));
        }
        
        if (typeof body === 'object' && !body.timestamp) {
          body.timestamp = new Date().toISOString();
          body.requestId = uuidv4();
        }
        
        return originalSend.call(this, body);
      };
      
      next();
    };
  }
}

/**
 * Утилиты для логирования
 */
export namespace LogUtils {
  /**
   * Форматирование сообщения для лога
   */
  export function formatLogMessage(
    level: string,
    message: string,
    meta?: Record<string, any>
  ): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  /**
   * Создание безопасного для логов объекта
   */
  export function sanitizeForLogging(obj: any): any {
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    const result = { ...obj };
    
    for (const field of sensitiveFields) {
      if (result[field]) {
        result[field] = '***';
      }
    }
    
    return result;
  }
}