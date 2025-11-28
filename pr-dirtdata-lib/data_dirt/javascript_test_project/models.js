const { v4: uuidv4 } = require('uuid');

/**
 * Базовый класс для всех моделей
 * Реализует общие методы для работы с данными
 */
class BaseModel {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  /**
   * Обновить timestamp изменения
   */
  touch() {
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Проверить валидность объекта
   */
  isValid() {
    return this.id && this.createdAt && this.updatedAt;
  }

  /**
   * Получить данные в виде plain object
   */
  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive
    };
  }

  /**
   * Статический метод для создания экземпляра из plain object
   */
  static fromJSON(data) {
    return new this(data);
  }
}

/**
 * Модель пользователя с полной функциональностью
 */
class User extends BaseModel {
  constructor(data = {}) {
    super(data);
    
    this.username = data.username;
    this.email = data.email;
    this.password = data.password; // Хешированный пароль
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.avatar = data.avatar;
    this.role = data.role || 'user';
    this.permissions = data.permissions || [];
    this.lastLogin = data.lastLogin;
    this.isVerified = data.isVerified || false;
    this.preferences = data.preferences || {
      theme: 'light',
      language: 'ru',
      notifications: true
    };
  }

  /**
   * Полное имя пользователя
   */
  get fullName() {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }

  /**
   * Проверить, имеет ли пользователь определенную роль
   */
  hasRole(role) {
    return this.role === role || this.role === 'admin';
  }

  /**
   * Проверить, имеет ли пользователь определенное разрешение
   */
  hasPermission(permission) {
    return this.role === 'admin' || this.permissions.includes(permission);
  }

  /**
   * Обновить данные пользователя с валидацией
   */
  updateProfile(updates) {
    const allowedFields = ['firstName', 'lastName', 'avatar', 'preferences'];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        this[field] = updates[field];
      }
    });
    
    return this.touch();
  }

  /**
   * Записать время последнего входа
   */
  recordLogin() {
    this.lastLogin = new Date();
    return this;
  }

  /**
   * Проверить, может ли пользователь выполнять определенные действия
   */
  canPerform(action) {
    const permissions = {
      'read:own_data': ['user', 'admin'],
      'read:all_data': ['admin'],
      'write:own_data': ['user', 'admin'],
      'write:all_data': ['admin'],
      'delete:own_data': ['user', 'admin'],
      'delete:all_data': ['admin'],
      'manage_users': ['admin']
    };

    const allowedRoles = permissions[action] || [];
    return allowedRoles.includes(this.role);
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      username: this.username,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      avatar: this.avatar,
      role: this.role,
      permissions: this.permissions,
      lastLogin: this.lastLogin,
      isVerified: this.isVerified,
      preferences: this.preferences
    };
  }
}

/**
 * Модель поста блога
 */
class BlogPost extends BaseModel {
  constructor(data = {}) {
    super(data);
    
    this.title = data.title;
    this.content = data.content;
    this.excerpt = data.excerpt;
    this.authorId = data.authorId;
    this.category = data.category || 'general';
    this.tags = data.tags || [];
    this.status = data.status || 'draft'; // draft, published, archived
    this.views = data.views || 0;
    this.likes = data.likes || [];
    this.comments = data.comments || [];
    this.featuredImage = data.featuredImage;
    this.isFeatured = data.isFeatured || false;
    this.seoTitle = data.seoTitle;
    this.seoDescription = data.seoDescription;
    this.publishedAt = data.publishedAt;
  }

  /**
   * Опубликовать пост
   */
  publish() {
    if (this.status !== 'published') {
      this.status = 'published';
      this.publishedAt = new Date();
      this.touch();
    }
    return this;
  }

  /**
   * Снять с публикации
   */
  unpublish() {
    this.status = 'draft';
    this.publishedAt = null;
    this.touch();
    return this;
  }

  /**
   * Добавить просмотр
   */
  addView() {
    this.views++;
    this.touch();
    return this;
  }

  /**
   * Переключить лайк от пользователя
   */
  toggleLike(userId) {
    const index = this.likes.indexOf(userId);
    if (index === -1) {
      this.likes.push(userId);
    } else {
      this.likes.splice(index, 1);
    }
    this.touch();
    return this;
  }

  /**
   * Добавить комментарий
   */
  addComment(comment) {
    const commentData = {
      id: uuidv4(),
      content: comment.content,
      authorId: comment.authorId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.comments.push(commentData);
    this.touch();
    return commentData;
  }

  /**
   * Генерировать excerpt из контента
   */
  generateExcerpt(maxLength = 150) {
    if (this.excerpt) return this.excerpt;
    
    const plainText = this.content.replace(/<[^>]*>/g, ''); // Удалить HTML теги
    this.excerpt = plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
    
    return this.excerpt;
  }

  /**
   * Проверить, опубликован ли пост
   */
  isPublished() {
    return this.status === 'published' && this.publishedAt;
  }

  /**
   * Получить количество лайков
   */
  getLikeCount() {
    return this.likes.length;
  }

  /**
   * Получить количество комментариев
   */
  getCommentCount() {
    return this.comments.length;
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      title: this.title,
      content: this.content,
      excerpt: this.excerpt || this.generateExcerpt(),
      authorId: this.authorId,
      category: this.category,
      tags: this.tags,
      status: this.status,
      views: this.views,
      likes: this.likes,
      comments: this.comments,
      featuredImage: this.featuredImage,
      isFeatured: this.isFeatured,
      seoTitle: this.seoTitle,
      seoDescription: this.seoDescription,
      publishedAt: this.publishedAt,
      isPublished: this.isPublished(),
      likeCount: this.getLikeCount(),
      commentCount: this.getCommentCount()
    };
  }
}

/**
 * Модель комментария
 */
class Comment extends BaseModel {
  constructor(data = {}) {
    super(data);
    
    this.content = data.content;
    this.authorId = data.authorId;
    this.postId = data.postId;
    this.parentId = data.parentId || null; // Для ответов на комментарии
    this.likes = data.likes || [];
    this.isApproved = data.isApproved || false;
    this.ipAddress = data.ipAddress;
  }

  /**
   * Проверить, является ли комментарий ответом
   */
  isReply() {
    return this.parentId !== null;
  }

  /**
   * Переключить лайк от пользователя
   */
  toggleLike(userId) {
    const index = this.likes.indexOf(userId);
    if (index === -1) {
      this.likes.push(userId);
    } else {
      this.likes.splice(index, 1);
    }
    this.touch();
    return this;
  }

  /**
   * Одобрить комментарий
   */
  approve() {
    this.isApproved = true;
    this.touch();
    return this;
  }

  /**
   * Отклонить комментарий
   */
  reject() {
    this.isApproved = false;
    this.touch();
    return this;
  }

  /**
   * Создать ответ на комментарий
   */
  createReply(replyData) {
    const reply = new Comment({
      ...replyData,
      parentId: this.id,
      postId: this.postId
    });
    return reply;
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      content: this.content,
      authorId: this.authorId,
      postId: this.postId,
      parentId: this.parentId,
      likes: this.likes,
      isApproved: this.isApproved,
      ipAddress: this.ipAddress,
      isReply: this.isReply(),
      likeCount: this.likes.length
    };
  }
}

/**
 * Модель категории
 */
class Category extends BaseModel {
  constructor(data = {}) {
    super(data);
    
    this.name = data.name;
    this.slug = data.slug;
    this.description = data.description;
    this.color = data.color || '#000000';
    this.icon = data.icon;
    this.parentId = data.parentId || null;
    this.postCount = data.postCount || 0;
    this.isVisible = data.isVisible !== undefined ? data.isVisible : true;
    this.sortOrder = data.sortOrder || 0;
  }

  /**
   * Проверить, является ли категория дочерней
   */
  isChild() {
    return this.parentId !== null;
  }

  /**
   * Увеличить счетчик постов
   */
  incrementPostCount() {
    this.postCount++;
    this.touch();
    return this;
  }

  /**
   * Уменьшить счетчик постов
   */
  decrementPostCount() {
    if (this.postCount > 0) {
      this.postCount--;
      this.touch();
    }
    return this;
  }

  /**
   * Генерировать slug из названия
   */
  static generateSlug(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      name: this.name,
      slug: this.slug,
      description: this.description,
      color: this.color,
      icon: this.icon,
      parentId: this.parentId,
      postCount: this.postCount,
      isVisible: this.isVisible,
      sortOrder: this.sortOrder,
      isChild: this.isChild()
    };
  }
}

/**
 * Модель для работы с сессиями
 */
class Session extends BaseModel {
  constructor(data = {}) {
    super(data);
    
    this.userId = data.userId;
    this.token = data.token;
    this.refreshToken = data.refreshToken;
    this.ipAddress = data.ipAddress;
    this.userAgent = data.userAgent;
    this.expiresAt = data.expiresAt;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  /**
   * Проверить, истекла ли сессия
   */
  isExpired() {
    return new Date() > this.expiresAt;
  }

  /**
   * Продлить сессию
   */
  extend(duration) {
    const durationMs = typeof duration === 'string' 
      ? this.parseDuration(duration)
      : duration;
    
    this.expiresAt = new Date(Date.now() + durationMs);
    this.touch();
    return this;
  }

  /**
   * Завершить сессию
   */
  invalidate() {
    this.isActive = false;
    this.touch();
    return this;
  }

  /**
   * Парсить строку продолжительности в миллисекунды
   */
  parseDuration(duration) {
    const units = {
      'ms': 1,
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };

    const match = duration.match(/^(\d+)(ms|s|m|h|d)$/);
    if (!match) {
      throw new Error(`Некорректный формат продолжительности: ${duration}`);
    }

    const value = parseInt(match[1]);
    const unit = match[2];
    
    return value * units[unit];
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      userId: this.userId,
      token: this.token,
      refreshToken: this.refreshToken,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      expiresAt: this.expiresAt,
      isExpired: this.isExpired()
    };
  }
}

module.exports = {
  BaseModel,
  User,
  BlogPost,
  Comment,
  Category,
  Session
};