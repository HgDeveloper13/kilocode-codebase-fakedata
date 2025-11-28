const { User, BlogPost, Comment } = require('../models');
const Utils = require('../utils');
const logger = require('./logger');
const config = require('../config');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Сервис для управления пользователями
 * Демонстрирует паттерны: Repository, Factory, Observer, Command
 */

/**
 * Паттерн Factory для создания пользователей с разными ролями
 */
class UserFactory {
  static createUser(type, userData) {
    const defaultData = {
      role: 'user',
      isActive: true,
      isVerified: false,
      preferences: {
        theme: 'light',
        language: 'ru',
        notifications: true
      }
    };

    switch (type) {
      case 'admin':
        return {
          ...defaultData,
          ...userData,
          role: 'admin',
          permissions: ['read:all', 'write:all', 'delete:all', 'manage:users']
        };
      
      case 'moderator':
        return {
          ...defaultData,
          ...userData,
          role: 'moderator',
          permissions: ['read:all', 'write:own', 'moderate:content']
        };
      
      case 'author':
        return {
          ...defaultData,
          ...userData,
          role: 'author',
          permissions: ['read:own', 'write:posts', 'publish:posts']
        };
      
      default: // user
        return {
          ...defaultData,
          ...userData
        };
    }
  }

  static async createAndValidateUser(type, userData) {
    const userInfo = this.createUser(type, userData);
    
    // Валидация данных
    const validation = await UserService.validateUserData(userInfo);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return UserService.createUser(userInfo);
  }
}

/**
 * Паттерн Observer для уведомлений о действиях с пользователями
 */
class UserObserver {
  constructor() {
    this.observers = new Map();
  }

  subscribe(event, callback) {
    if (!this.observers.has(event)) {
      this.observers.set(event, []);
    }
    this.observers.get(event).push(callback);
  }

  unsubscribe(event, callback) {
    const eventObservers = this.observers.get(event);
    if (eventObservers) {
      const index = eventObservers.indexOf(callback);
      if (index > -1) {
        eventObservers.splice(index, 1);
      }
    }
  }

  notify(event, data) {
    const eventObservers = this.observers.get(event);
    if (eventObservers) {
      eventObservers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error('Observer callback error', {
            event,
            error: Utils.handleError(error)
          });
        }
      });
    }
  }
}

/**
 * Паттерн Command для операций с пользователями
 */
class UserCommand {
  constructor(service) {
    this.service = service;
  }

  async execute(operation, data) {
    const command = this.getCommand(operation);
    return await command.execute(data);
  }

  getCommand(operation) {
    const commands = {
      'create': new CreateUserCommand(this.service),
      'update': new UpdateUserCommand(this.service),
      'delete': new DeleteUserCommand(this.service),
      'deactivate': new DeactivateUserCommand(this.service),
      'activate': new ActivateUserCommand(this.service),
      'change_role': new ChangeRoleCommand(this.service)
    };

    if (!commands[operation]) {
      throw new Error(`Unknown command: ${operation}`);
    }

    return commands[operation];
  }
}

class CreateUserCommand {
  constructor(service) {
    this.service = service;
  }

  async execute(data) {
    return await this.service.createUser(data);
  }
}

class UpdateUserCommand {
  constructor(service) {
    this.service = service;
  }

  async execute(data) {
    const { userId, updates } = data;
    return await this.service.updateUser(userId, updates);
  }
}

class DeleteUserCommand {
  constructor(service) {
    this.service = service;
  }

  async execute(data) {
    const { userId } = data;
    return await this.service.deleteUser(userId);
  }
}

class DeactivateUserCommand {
  constructor(service) {
    this.service = service;
  }

  async execute(data) {
    const { userId } = data;
    return await this.service.deactivateUser(userId);
  }
}

class ActivateUserCommand {
  constructor(service) {
    this.service = service;
  }

  async execute(data) {
    const { userId } = data;
    return await this.service.activateUser(userId);
  }
}

class ChangeRoleCommand {
  constructor(service) {
    this.service = service;
  }

  async execute(data) {
    const { userId, newRole } = data;
    return await this.service.changeUserRole(userId, newRole);
  }
}

/**
 * Основной сервис пользователей
 */
class UserService {
  constructor() {
    this.observer = new UserObserver();
    this.commandProcessor = new UserCommand(this);
    
    // Подписка на события для логирования
    this.observer.subscribe('user_created', (data) => {
      logger.logBusinessEvent('user_created', data);
    });

    this.observer.subscribe('user_updated', (data) => {
      logger.logBusinessEvent('user_updated', data);
    });

    this.observer.subscribe('user_deleted', (data) => {
      logger.logBusinessEvent('user_deleted', data);
    });
  }

  /**
   * Создание нового пользователя
   */
  async createUser(userData) {
    try {
      // Проверка уникальности
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('Пользователь с таким email уже существует');
      }

      // Хеширование пароля
      if (userData.password) {
        userData.password = await Utils.crypto.hashPassword(
          userData.password, 
          config.security.bcryptRounds
        );
      }

      // Создание пользователя
      const user = new User(userData);
      await user.save();

      // Уведомление наблюдателей
      this.observer.notify('user_created', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return user.toJSON();
    } catch (error) {
      logger.error('Error creating user', {
        error: Utils.handleError(error),
        email: userData.email
      });
      throw error;
    }
  }

  /**
   * Обновление пользователя
   */
  async updateUser(userId, updates) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('Пользователь не найден');
      }

      // Применяем обновления
      const allowedFields = ['firstName', 'lastName', 'avatar', 'preferences', 'role', 'permissions'];
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          user[field] = updates[field];
        }
      });

      user.touch();
      await user.save();

      // Уведомление наблюдателей
      this.observer.notify('user_updated', {
        userId: user.id,
        updates: Object.keys(updates),
        updatedBy: updates.updatedBy
      });

      return user.toJSON();
    } catch (error) {
      logger.error('Error updating user', {
        userId,
        error: Utils.handleError(error)
      });
      throw error;
    }
  }

  /**
   * Удаление пользователя
   */
  async deleteUser(userId) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('Пользователь не найден');
      }

      // Мягкое удаление - деактивация
      user.isActive = false;
      user.touch();
      await user.save();

      // Уведомление наблюдателей
      this.observer.notify('user_deleted', {
        userId: user.id,
        email: user.email,
        deletedAt: new Date().toISOString()
      });

      return { success: true, message: 'Пользователь успешно удален' };
    } catch (error) {
      logger.error('Error deleting user', {
        userId,
        error: Utils.handleError(error)
      });
      throw error;
    }
  }

  /**
   * Получение пользователя по ID
   */
  async findById(id) {
    try {
      // В реальном приложении здесь был бы запрос к БД
      // Для примера возвращаем null
      if (!Utils.validation.isValidUUID(id)) {
        return null;
      }
      return null;
    } catch (error) {
      logger.error('Error finding user by ID', {
        userId: id,
        error: Utils.handleError(error)
      });
      return null;
    }
  }

  /**
   * Получение пользователя по email
   */
  async findByEmail(email) {
    try {
      // Валидация email
      if (!Utils.validation.isValidEmail(email)) {
        return null;
      }

      // В реальном приложении здесь был бы запрос к БД
      return null;
    } catch (error) {
      logger.error('Error finding user by email', {
        email,
        error: Utils.handleError(error)
      });
      return null;
    }
  }

  /**
   * Поиск пользователей с пагинацией и фильтрацией
   */
  async findUsers(options = {}) {
    try {
      const {
        page = 1,
        limit = config.api.pagination.defaultLimit,
        role,
        isActive,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      // В реальном приложении здесь был бы запрос к БД с фильтрацией
      // Для примера возвращаем пустой массив
      const users = [];
      const total = 0;

      return Utils.collection.paginate(users, page, limit);
    } catch (error) {
      logger.error('Error finding users', {
        options,
        error: Utils.handleError(error)
      });
      throw error;
    }
  }

  /**
   * Валидация данных пользователя
   */
  async validateUserData(userData) {
    const errors = [];

    // Валидация email
    if (!userData.email) {
      errors.push('Email обязателен');
    } else if (!Utils.validation.isValidEmail(userData.email)) {
      errors.push('Неверный формат email');
    }

    // Валидация username
    if (!userData.username) {
      errors.push('Имя пользователя обязательно');
    } else if (userData.username.length < 3) {
      errors.push('Имя пользователя должно содержать минимум 3 символа');
    }

    // Валидация пароля
    if (userData.password) {
      const passwordValidation = Utils.validation.validatePasswordStrength(userData.password);
      if (passwordValidation.strength === 'weak') {
        errors.push('Пароль слишком слабый');
      }
    }

    // Валидация роли
    const allowedRoles = ['user', 'author', 'moderator', 'admin'];
    if (userData.role && !allowedRoles.includes(userData.role)) {
      errors.push('Неверная роль пользователя');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Активация пользователя
   */
  async activateUser(userId) {
    return await this.commandProcessor.execute('activate', { userId });
  }

  /**
   * Деактивация пользователя
   */
  async deactivateUser(userId) {
    return await this.commandProcessor.execute('deactivate', { userId });
  }

  /**
   * Изменение роли пользователя
   */
  async changeUserRole(userId, newRole) {
    return await this.commandProcessor.execute('change_role', { userId, newRole });
  }

  /**
   * Получение статистики пользователей
   */
  async getUserStats() {
    try {
      // В реальном приложении здесь был бы запрос к БД
      // Для примера возвращаем тестовые данные
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byRole: {
          admin: 0,
          moderator: 0,
          author: 0,
          user: 0
        },
        registrationsByMonth: [],
        lastRegistration: null
      };
    } catch (error) {
      logger.error('Error getting user stats', {
        error: Utils.handleError(error)
      });
      throw error;
    }
  }

  /**
   * Массовые операции с пользователями
   */
  async bulkUpdate(userIds, updates) {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error('Список пользователей не может быть пустым');
      }

      const results = [];
      for (const userId of userIds) {
        try {
          const result = await this.updateUser(userId, updates);
          results.push({ userId, success: true, data: result });
        } catch (error) {
          results.push({ userId, success: false, error: error.message });
        }
      }

      logger.logBusinessEvent('bulk_user_update', {
        userCount: userIds.length,
        updateType: updates.type,
        results: results.filter(r => !r.success).length
      });

      return results;
    } catch (error) {
      logger.error('Error in bulk update', {
        userIds,
        updates,
        error: Utils.handleError(error)
      });
      throw error;
    }
  }

  /**
   * Экспорт пользователей
   */
  async exportUsers(options = {}) {
    try {
      const usersData = await this.findUsers({
        ...options,
        limit: 10000 // Экспорт всех записей
      });

      // Форматирование данных для экспорта
      const exportData = usersData.items.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: Utils.date.format(user.createdAt),
        lastLogin: Utils.date.format(user.lastLogin)
      }));

      logger.logBusinessEvent('users_exported', {
        count: exportData.length,
        format: 'json'
      });

      return exportData;
    } catch (error) {
      logger.error('Error exporting users', {
        error: Utils.handleError(error)
      });
      throw error;
    }
  }
}

// Создание singleton экземпляра сервиса
module.exports = new UserService();