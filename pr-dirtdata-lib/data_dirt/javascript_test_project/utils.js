const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

/**
 * Утилиты для работы с асинхронными операциями
 */
class AsyncUtils {
  /**
   * Задержка выполнения с использованием Promise
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Повторить асинхронную функцию с экспоненциальной задержкой
   */
  static async retry(fn, maxAttempts = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await this.delay(delay);
      }
    }
  }

  /**
   * Выполнить несколько промисов с ограничением параллелизма
   */
  static async limitedParallel(tasks, limit = 5) {
    const results = [];
    const executing = [];

    for (const task of tasks) {
      const promise = Promise.resolve().then(() => task());
      results.push(promise);

      if (limit <= tasks.length) {
        const executing_promise = promise.then(() => 
          executing.splice(executing.indexOf(executing_promise), 1)
        );
        executing.push(executing_promise);

        if (executing.length >= limit) {
          await Promise.race(executing);
        }
      }
    }

    return Promise.all(results);
  }

  /**
   * Таймаут для промисов
   */
  static withTimeout(promise, ms, errorMessage = 'Operation timed out') {
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), ms);
    });

    return Promise.race([promise, timeout]);
  }

  /**
   * Обертка для последовательного выполнения асинхронных функций
   */
  static async sequence(asyncFunctions, initialValue = null) {
    let result = initialValue;
    
    for (const asyncFn of asyncFunctions) {
      result = await asyncFn(result);
    }
    
    return result;
  }
}

/**
 * Утилиты для валидации данных
 */
class ValidationUtils {
  /**
   * Проверка email
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Проверка силы пароля
   */
  static validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const score = {
      length: password.length >= minLength ? 1 : 0,
      upperCase: hasUpperCase ? 1 : 0,
      lowerCase: hasLowerCase ? 1 : 0,
      numbers: hasNumbers ? 1 : 0,
      specialChar: hasSpecialChar ? 1 : 0
    };

    const totalScore = Object.values(score).reduce((sum, val) => sum + val, 0);
    
    return {
      score: totalScore,
      maxScore: 5,
      strength: totalScore < 2 ? 'weak' : totalScore < 4 ? 'medium' : 'strong',
      requirements: {
        minLength: password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      }
    };
  }

  /**
   * Проверка формата UUID
   */
  static isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Проверка диапазона чисел
   */
  static isInRange(value, min, max) {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
  }

  /**
   * Санитизация HTML
   */
  static sanitizeHTML(html) {
    return html
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Валидация объекта по схеме
   */
  static validateSchema(data, schema) {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      for (const rule of rules) {
        const error = this.applyRule(field, value, rule);
        if (error) {
          errors.push(error);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static applyRule(field, value, rule) {
    const { type, required, min, max, pattern } = rule;
    
    if (required && (value === undefined || value === null || value === '')) {
      return `${field} is required`;
    }
    
    if (value !== undefined && value !== null && value !== '') {
      if (type === 'string' && typeof value !== 'string') {
        return `${field} must be a string`;
      }
      
      if (type === 'number' && typeof value !== 'number') {
        return `${field} must be a number`;
      }
      
      if (min !== undefined && value.length < min) {
        return `${field} must be at least ${min} characters`;
      }
      
      if (max !== undefined && value.length > max) {
        return `${field} must be no more than ${max} characters`;
      }
      
      if (pattern && !pattern.test(value)) {
        return `${field} format is invalid`;
      }
    }
    
    return null;
  }
}

/**
 * Утилиты для работы со строками
 */
class StringUtils {
  /**
   * Генерация случайной строки
   */
  static generateRandomString(length = 10, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /**
   * Создание slug из строки
   */
  static createSlug(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Обрезание строки с добавлением многоточия
   */
  static truncate(str, length = 100, suffix = '...') {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  }

  /**
   * Капитализация первой буквы
   */
  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Капитализация каждого слова
   */
  static capitalizeWords(str) {
    return str.split(' ').map(word => this.capitalize(word)).join(' ');
  }

  /**
   * Преобразование camelCase в snake_case
   */
  static camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Преобразование snake_case в camelCase
   */
  static snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  /**
   * Маскирование email
   */
  static maskEmail(email) {
    const [username, domain] = email.split('@');
    const maskedUsername = username.substring(0, 2) + '*'.repeat(username.length - 2);
    return `${maskedUsername}@${domain}`;
  }

  /**
   * Удаление HTML тегов
   */
  static stripHTML(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Генерация краткого описания
   */
  static generateExcerpt(text, maxLength = 150) {
    const plainText = this.stripHTML(text);
    if (plainText.length <= maxLength) return plainText;
    
    const truncated = plainText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }
}

/**
 * Утилиты для работы с датами
 */
class DateUtils {
  /**
   * Форматирование даты
   */
  static format(date, format = 'DD.MM.YYYY HH:mm') {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * Получение относительного времени (например, "5 минут назад")
   */
  static getRelativeTime(date) {
    const now = new Date();
    const target = new Date(date);
    const diffMs = now - target;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'только что';
    if (diffMin < 60) return `${diffMin} мин. назад`;
    if (diffHour < 24) return `${diffHour} ч. назад`;
    if (diffDay < 30) return `${diffDay} дн. назад`;
    
    return this.format(date, 'DD.MM.YYYY');
  }

  /**
   * Проверка, является ли дата сегодняшней
   */
  static isToday(date) {
    const today = new Date();
    const target = new Date(date);
    
    return today.getDate() === target.getDate() &&
           today.getMonth() === target.getMonth() &&
           today.getFullYear() === target.getFullYear();
  }

  /**
   * Получение начала дня
   */
  static startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Получение конца дня
   */
  static endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * Добавление дней к дате
   */
  static addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  /**
   * Проверка, прошла ли дата
   */
  static isPast(date) {
    return new Date(date) < new Date();
  }
}

/**
 * Утилиты для работы с файловой системой
 */
class FileUtils {
  /**
   * Создание директории если она не существует
   */
  static async ensureDir(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Получение расширения файла
   */
  static getFileExtension(filename) {
    return path.extname(filename).toLowerCase();
  }

  /**
   * Проверка, является ли файл изображением
   */
  static isImage(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.includes(this.getFileExtension(filename));
  }

  /**
   * Форматирование размера файла
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Генерация уникального имени файла
   */
  static generateUniqueFileName(originalName) {
    const ext = this.getFileExtension(originalName);
    const name = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    return `${name}_${timestamp}_${random}${ext}`;
  }

  /**
   * Асинхронное чтение JSON файла
   */
  static async readJSON(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Error reading JSON file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Асинхронная запись JSON файла
   */
  static async writeJSON(filePath, data) {
    await this.ensureDir(path.dirname(filePath));
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonData, 'utf8');
  }
}

/**
 * Утилиты для криптографии и безопасности
 */
class CryptoUtils {
  /**
   * Хеширование пароля
   */
  static async hashPassword(password, rounds = 12) {
    return await bcrypt.hash(password, rounds);
  }

  /**
   * Проверка пароля
   */
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Генерация JWT токена
   */
  static generateJWT(payload, secret, expiresIn = '24h') {
    return jwt.sign(payload, secret, { expiresIn });
  }

  /**
   * Верификация JWT токена
   */
  static verifyJWT(token, secret) {
    return jwt.verify(token, secret);
  }

  /**
   * Генерация случайного токена
   */
  static generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Создание HMAC подписи
   */
  static createHMAC(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Проверка HMAC подписи
   */
  static verifyHMAC(data, signature, secret) {
    const expectedSignature = this.createHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Шифрование данных
   */
  static encrypt(text, secret) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(secret, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Расшифровка данных
   */
  static decrypt(encryptedText, secret) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(secret, 'salt', 32);
    
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipher(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

/**
 * Утилиты для работы с коллекциями
 */
class CollectionUtils {
  /**
   * Пагинация массива
   */
  static paginate(array, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const paginatedItems = array.slice(offset, offset + limit);
    
    return {
      items: paginatedItems,
      total: array.length,
      page,
      limit,
      pages: Math.ceil(array.length / limit)
    };
  }

  /**
   * Группировка массива по ключу
   */
  static groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = typeof key === 'function' ? key(item) : item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  /**
   * Удаление дубликатов из массива
   */
  static unique(array, key) {
    if (!key) {
      return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
      const value = typeof key === 'function' ? key(item) : item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  /**
   * Сортировка массива по нескольким полям
   */
  static sortBy(array, ...fields) {
    return array.sort((a, b) => {
      for (const field of fields) {
        const isDesc = field.startsWith('-');
        const fieldName = isDesc ? field.substring(1) : field;
        
        const aVal = typeof fieldName === 'function' ? fieldName(a) : a[fieldName];
        const bVal = typeof fieldName === 'function' ? fieldName(b) : b[fieldName];
        
        if (aVal < bVal) return isDesc ? 1 : -1;
        if (aVal > bVal) return isDesc ? -1 : 1;
      }
      return 0;
    });
  }

  /**
   * Получение случайного элемента из массива
   */
  static random(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Перемешивание массива
   */
  static shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Разделение массива на части
   */
  static chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

/**
 * Основной класс утилит, объединяющий все вспомогательные функции
 */
class Utils {
  constructor() {
    this.async = AsyncUtils;
    this.validation = ValidationUtils;
    this.string = StringUtils;
    this.date = DateUtils;
    this.file = FileUtils;
    this.crypto = CryptoUtils;
    this.collection = CollectionUtils;
  }

  /**
   * Централизованная обработка ошибок
   */
  static handleError(error, context = '') {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    };

    // Логирование ошибки (можно интегрировать с системой логов)
    console.error('Application Error:', errorInfo);
    
    return errorInfo;
  }

  /**
   * Создание ответа API в едином формате
   */
  static createResponse(data = null, message = '', success = true, errors = []) {
    return {
      success,
      message,
      data,
      errors,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Создание ответа об ошибке API
   */
  static createErrorResponse(message = 'Internal Server Error', errors = [], statusCode = 500) {
    return {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
      statusCode
    };
  }
}

module.exports = Utils;