const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Session } = require('../models');
const { v4: uuidv4 } = require('uuid');
const Utils = require('../utils');
const logger = require('./logger');
const config = require('../config');

/**
 * Сервис аутентификации и авторизации
 * Управляет JWT токенами, сессиями и проверкой прав доступа
 */
class AuthService {
  constructor() {
    this.activeSessions = new Map(); // В продакшене лучше использовать Redis
  }

  /**
   * Аутентификация пользователя
   */
  async authenticateUser(email, password) {
    try {
      // Поиск пользователя по email
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new Error('Неверные учетные данные');
      }

      // Проверка пароля
      const isPasswordValid = await Utils.crypto.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Неверные учетные данные');
      }

      // Проверка, что пользователь активен
      if (!user.isActive) {
        throw new Error('Аккаунт заблокирован');
      }

      // Создание сессии
      const session = await this.createSession(user);
      
      // Генерация токенов
      const tokens = await this.generateTokens(user, session);
      
      // Обновление времени последнего входа
      user.recordLogin();
      await user.save();

      logger.logBusinessEvent('user_login', {
        userId: user.id,
        email: user.email,
        sessionId: session.id
      });

      return {
        user: user.toJSON(),
        session: session.toJSON(),
        ...tokens
      };
    } catch (error) {
      logger.logBusinessEvent('user_login_failed', {
        email,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Создание нового пользователя
   */
  async createUser(userData) {
    try {
      // Проверка уникальности email
      const existingUser = await this.findUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('Пользователь с таким email уже существует');
      }

      // Валидация силы пароля
      const passwordValidation = Utils.validation.validatePasswordStrength(userData.password);
      if (passwordValidation.strength === 'weak') {
        throw new Error('Пароль слишком слабый');
      }

      // Хеширование пароля
      const hashedPassword = await Utils.crypto.hashPassword(
        userData.password, 
        config.security.bcryptRounds
      );

      // Создание пользователя
      const user = new User({
        ...userData,
        password: hashedPassword,
        email: userData.email.toLowerCase().trim(),
        username: userData.username.toLowerCase().trim()
      });

      await user.save();

      logger.logBusinessEvent('user_registration', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return user.toJSON();
    } catch (error) {
      logger.error('Error creating user', {
        error: Utils.handleError(error),
        userData: { ...userData, password: '[HIDDEN]' }
      });
      throw error;
    }
  }

  /**
   * Обновление токена
   */
  async refreshToken(refreshToken) {
    try {
      // Верификация refresh токена
      const payload = Utils.crypto.verifyJWT(refreshToken, config.jwt.refreshSecret);
      
      // Поиск активной сессии
      const session = await this.findActiveSession(payload.sessionId);
      if (!session || session.isExpired()) {
        throw new Error('Недействительная сессия');
      }

      // Поиск пользователя
      const user = await this.findUserById(payload.userId);
      if (!user || !user.isActive) {
        throw new Error('Пользователь не найден или заблокирован');
      }

      // Генерация новых токенов
      const tokens = await this.generateTokens(user, session);

      logger.logBusinessEvent('token_refreshed', {
        userId: user.id,
        sessionId: session.id
      });

      return tokens;
    } catch (error) {
      logger.logBusinessEvent('token_refresh_failed', {
        error: error.message
      });
      throw new Error('Недействительный refresh токен');
    }
  }

  /**
   * Генерация JWT токенов
   */
  async generateTokens(user, session) {
    const payload = {
      userId: user.id,
      sessionId: session.id,
      role: user.role,
      permissions: user.permissions
    };

    const accessToken = Utils.crypto.generateJWT(
      payload, 
      config.jwt.secret, 
      config.jwt.expiresIn
    );

    const refreshToken = Utils.crypto.generateJWT(
      { ...payload, type: 'refresh' }, 
      config.jwt.refreshSecret, 
      config.jwt.refreshExpiresIn
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwt.expiresIn
    };
  }

  /**
   * Создание сессии
   */
  async createSession(user, metadata = {}) {
    const session = new Session({
      userId: user.id,
      token: Utils.crypto.generateToken(32),
      refreshToken: Utils.crypto.generateToken(32),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      expiresAt: Utils.date.addDays(new Date(), 7) // 7 дней
    });

    // Сохранение в памяти (в продакшене использовать Redis или БД)
    this.activeSessions.set(session.id, session);
    
    return session;
  }

  /**
   * Проверка токена и получение пользователя
   */
  async verifyToken(token) {
    try {
      const payload = Utils.crypto.verifyJWT(token, config.jwt.secret);
      
      // Проверка сессии
      const session = await this.findActiveSession(payload.sessionId);
      if (!session) {
        throw new Error('Сессия не найдена');
      }

      // Проверка пользователя
      const user = await this.findUserById(payload.userId);
      if (!user || !user.isActive) {
        throw new Error('Пользователь не найден или заблокирован');
      }

      return {
        user,
        session,
        permissions: payload.permissions,
        role: payload.role
      };
    } catch (error) {
      throw new Error('Недействительный токен');
    }
  }

  /**
   * Вспомогательные методы для работы с данными
   */
  
  async findUserByEmail(email) {
    // В реальном приложении здесь был бы запрос к БД
    // Для примера возвращаем null
    return null;
  }

  async findUserById(id) {
    // В реальном приложении здесь был бы запрос к БД
    // Для примера возвращаем null
    return null;
  }

  async findActiveSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session && !session.isExpired() && session.isActive) {
      return session;
    }
    return null;
  }

  async findSession(sessionId) {
    return this.activeSessions.get(sessionId);
  }

  async invalidateAllUserSessions(userId) {
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        session.invalidate();
        this.activeSessions.set(sessionId, session);
      }
    }
  }
}

module.exports = new AuthService();