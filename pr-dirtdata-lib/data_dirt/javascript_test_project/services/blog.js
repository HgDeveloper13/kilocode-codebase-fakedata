const { BlogPost, User, Comment, Category } = require('../models');
const Utils = require('../utils');
const logger = require('./logger');
const config = require('../config');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Сервис для управления постами блога
 * Демонстрирует паттерны: Strategy, Decorator, Composite
 */

/**
 * Паттерн Strategy для различных стратегий сортировки постов
 */
class PostSortingStrategy {
  static strategies = {
    newest: (posts) => Utils.collection.sortBy(posts, '-publishedAt', '-createdAt'),
    oldest: (posts) => Utils.collection.sortBy(posts, 'publishedAt', 'createdAt'),
    mostViewed: (posts) => Utils.collection.sortBy(posts, '-views'),
    mostLiked: (posts) => Utils.collection.sortBy(posts, '-likes'),
    alphabetical: (posts) => Utils.collection.sortBy(posts, 'title')
  };

  static getStrategy(sortBy) {
    return this.strategies[sortBy] || this.strategies.newest;
  }
}

/**
 * Паттерн Decorator для добавления функциональности к постам
 */
class PostDecorator {
  constructor(post) {
    this.post = post;
  }

  /**
   * Добавить метаданные SEO
   */
  withSEO() {
    this.post.seoTitle = this.post.seoTitle || this.post.title;
    this.post.seoDescription = this.post.seoDescription || Utils.string.generateExcerpt(this.post.content);
    this.post.seoKeywords = this.post.seoKeywords || this.post.tags.join(', ');
    return this;
  }

  /**
   * Добавить статистику
   */
  withStats() {
    this.post.viewStats = {
      views: this.post.views,
      likes: this.post.getLikeCount(),
      comments: this.post.getCommentCount(),
      engagement: this.calculateEngagement()
    };
    return this;
  }

  /**
   * Добавить информацию об авторе
   */
  withAuthor() {
    // В реальном приложении здесь был бы запрос к БД
    this.post.author = {
      id: this.post.authorId,
      name: 'Автор',
      avatar: null
    };
    return this;
  }

  /**
   * Добавить связанные категории
   */
  withCategory() {
    // В реальном приложении здесь был бы запрос к БД
    this.post.categoryInfo = {
      id: this.post.category,
      name: this.post.category,
      color: '#007bff'
    };
    return this;
  }

  /**
   * Рассчитать вовлеченность
   */
  calculateEngagement() {
    if (this.post.views === 0) return 0;
    return ((this.post.getLikeCount() + this.post.getCommentCount()) / this.post.views * 100).toFixed(2);
  }

  /**
   * Получить декорированный пост
   */
  getDecoratedPost() {
    return this.post;
  }
}

/**
 * Паттерн Composite для работы с категориями постов
 */
class CategoryComposite {
  constructor(category) {
    this.category = category;
    this.children = [];
  }

  add(child) {
    this.children.push(child);
  }

  remove(child) {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
    }
  }

  getPostCount() {
    let count = this.category.postCount;
    for (const child of this.children) {
      count += child.getPostCount();
    }
    return count;
  }

  toJSON() {
    return {
      ...this.category.toJSON(),
      children: this.children.map(child => child.toJSON()),
      totalPosts: this.getPostCount()
    };
  }
}

/**
 * Основной сервис постов блога
 */
class BlogPostService {
  constructor() {
    this.cache = new Map(); // Простой кеш в памяти
    this.cacheTimeout = 5 * 60 * 1000; // 5 минут
  }

  /**
   * Создание нового поста
   */
  async createPost(postData, authorId) {
    try {
      // Создание поста
      const post = new BlogPost({
        ...postData,
        authorId,
        publishedAt: postData.status === 'published' ? new Date() : null,
        excerpt: Utils.string.generateExcerpt(postData.content)
      });

      // Генерация SEO данных если не указаны
      if (!post.seoTitle) {
        post.seoTitle = post.title;
      }
      if (!post.seoDescription) {
        post.seoDescription = post.excerpt;
      }

      await post.save();

      // Обновление счетчика постов в категории
      await this.updateCategoryPostCount(post.category);

      logger.logBusinessEvent('post_created', {
        postId: post.id,
        title: post.title,
        authorId,
        category: post.category,
        status: post.status
      });

      return post.toJSON();
    } catch (error) {
      logger.error('Error creating post', {
        authorId,
        title: postData.title,
        error: Utils.handleError(error)
      });
      throw error;
    }
  }

  /**
   * Обновление поста
   */
  async updatePost(postId, updates, userId) {
    try {
      const post = await this.findById(postId);
      if (!post) {
        throw new Error('Пост не найден');
      }

      // Проверка прав доступа
      if (post.authorId !== userId) {
        throw new Error('Нет прав для редактирования этого поста');
      }

      // Применение обновлений
      const allowedFields = ['title', 'content', 'category', 'tags', 'featuredImage', 'status'];
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          post[field] = updates[field];
        }
      });

      // Обновление excerpt при изменении контента
      if (updates.content) {
        post.excerpt = Utils.string.generateExcerpt(updates.content);
      }

      // Обновление publishedAt при публикации
      if (updates.status === 'published' && !post.publishedAt) {
        post.publishedAt = new Date();
      }

      post.touch();
      await post.save();

      // Очистка кеша
      this.clearPostCache(postId);

      logger.logBusinessEvent('post_updated', {
        postId: post.id,
        title: post.title,
        userId,
        updatedFields: Object.keys(updates)
      });

      return post.toJSON();
    } catch (error) {
      logger.error('Error updating post', {
        postId,
        userId,
        error: Utils.handleError(error)
      });
      throw error;
    }
  }

  /**
   * Удаление поста
   */
  async deletePost(postId, userId) {
    try {
      const post = await this.findById(postId);
      if (!post) {
        throw new Error('Пост не найден');
      }

      // Проверка прав доступа
      if (post.authorId !== userId) {
        throw new Error('Нет прав для удаления этого поста');
      }

      // Мягкое удаление
      post.status = 'archived';
      post.touch();
      await post.save();

      // Обновление счетчика постов в категории
      await this.updateCategoryPostCount(post.category, -1);

      // Очистка кеша
      this.clearPostCache(postId);

      logger.logBusinessEvent('post_deleted', {
        postId: post.id,
        title: post.title,
        userId
      });

      return { success: true, message: 'Пост успешно удален' };
    } catch (error) {
      logger.error('Error deleting post', {
        postId,
        userId,
        error: Utils.handleError(error)
      });
      throw error;
    }
  }

  /**
   * Получение поста по ID с декорацией
   */
  async findById(id, options = {}) {
    try {
      // Проверка кеша
      const cacheKey = `post_${id}`;
      if (this.cache.has(cacheKey) && !this.isCacheExpired(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // В реальном приложении здесь был бы запрос к БД
      // Для примера возвращаем null
      const post = null;

      if (post) {
        // Добавление просмотра
        if (options.incrementView) {
          post.addView();
          await post.save();
        }

        // Декорация поста
        const decoratedPost = new PostDecorator(post)
          .withSEO()
          .withStats()
          .withAuthor()
          .withCategory()
          .getDecoratedPost();

        // Кеширование
        this.cache.set(cacheKey, decoratedPost);
        
        return decoratedPost;
      }

      return null;
    } catch (error) {
      logger.error('Error finding post by ID', {
        postId: id,
        error: Utils.handleError(error)
      });
      return null;
    }
  }

  /**
   * Поиск постов с фильтрацией и сортировкой
   */
  async findPosts(options = {}) {
    try {
      const {
        page = 1,
        limit = config.api.pagination.defaultLimit,
        category,
        authorId,
        status = 'published',
        tags,
        search,
        sortBy = 'newest'
      } = options;

      // В реальном приложении здесь был бы запрос к БД с фильтрацией
      // Для примера возвращаем пустой массив
      const posts = [];
      const total = 0;

      // Применение сортировки
      if (posts.length > 0) {
        const sortStrategy = PostSortingStrategy.getStrategy(sortBy);
        sortStrategy(posts);
      }

      // Пагинация
      return Utils.collection.paginate(posts, page, limit);
    } catch (error) {
      logger.error('Error finding posts', {
        options,
        error: Utils.handleError(error)
      });
      throw error;
    }
  }

  /**
   * Поиск постов по запросу
   */
  async searchPosts(query, options = {}) {
    try {
      if (!query || query.trim().length < 2) {
        throw new Error('Запрос должен содержать минимум 2 символа');
      }

      const searchResults = await this.findPosts({
        ...options,
        search: query.trim(),
        limit: 20
      });

      logger.logBusinessEvent('post_search', {
        query,
        resultCount: searchResults.total
      });

      return searchResults;
    } catch (error) {
      logger.error('Error searching posts', {
        query,
        error: Utils.handleError(error)
      });
      throw error;
    }
  }

  /**
   * Публикация поста
   */
  async publishPost(postId, userId) {
    try {
      const post = await this.findById(postId);
      if (!post) {
        throw new Error('Пост не найден');
      }

      // Проверка прав доступа
      if (post.authorId !== userId) {
        throw new Error('Нет прав для публикации этого поста');
      }

      post.publish();
      await post.save();

      // Очистка кеша
      this.clearPostCache(postId);

      logger.logBusinessEvent('post_published', {
        postId: post.id,
        title: post.title,
        userId
      });

      return post.toJSON();
    } catch (error) {
      logger.error('Error publishing post', {
        postId,
        userId,
        error: Utils.handleError(error)
      });
      throw error;
    }
  }

  /**
   * Снятие поста с публикации
   */
  async unpublishPost(postId, userId) {
    try {
      const post = await this.findById(postId);
      if (!post) {
        throw new Error('Пост не найден');
      }

      // Проверка прав доступа
      if (post.authorId !== userId) {
        throw new Error('Нет прав для снятия с публикации этого поста');
      }

      post.unpublish();
      await post.save();

      // Очистка кеша
      this.clearPostCache(postId);

      logger.logBusinessEvent('post_unpublished', {
        postId: post.id,
        title: post.title,
        userId
      });

      return post.toJSON();
    } catch (error) {
      logger.error('Error unpublishing post', {
        postId,
        userId,
        error: Utils.handleError(error)
      });
      throw error;
    }
  }

  /**
   * Переключение лайка поста
   */
  async toggleLike(postId, userId) {
    try {
      const post = await this.findById(postId);
      if (!post) {
        throw new Error('Пост не найден');
      }

      post.toggleLike(userId);
      await post.save();

      // Очистка кеша
      this.clearPostCache(postId);

      logger.logBusinessEvent('post_like_toggled', {
        postId: post.id,
        userId,
        isLiked: post.likes.includes(userId)
      });

      return {
        isLiked: post.likes.includes(userId),
        likeCount: post.getLikeCount()
      };
    } catch (error) {
      logger.error('Error toggling post like', {
        postId,
        userId,
        error: Utils.handleError(error)
      });
      throw error;
    }
  }

  /**
   * Добавление комментария к посту
   */
  async addComment(postId, commentData, userId) {
    try {
      const post = await this.findById(postId);
      if (!post) {
        throw new Error('Пост не найден');
      }

      const comment = post.addComment({
        ...commentData,
        authorId: userId
      });

      await post.save();

      // Очистка кеша
      this.clearPostCache(postId);

      logger.logBusinessEvent('comment_added', {
        postId,
        commentId: comment.id,
        userId
      });

      return comment;
    } catch (error) {
      logger.error('Error adding comment', {
        postId,
        userId,
        error: Utils.handleError(error)
      });
      throw error;
    }
  }

  /**
   * Получение популярных постов
   */
  async getPopularPosts(limit = 10) {
    try {
      return await this.findPosts({
        limit,
        sortBy: 'mostViewed',
        status: 'published'
      });
    } catch (error) {
      logger.error('Error getting popular posts', {
        limit,
        error: Utils.handleError(error)
      });
      throw error;
    }
  }

  /**
   * Получение статистики постов
   */
  async getPostStats() {
    try {
      // В реальном приложении здесь был бы запрос к БД
      // Для примера возвращаем тестовые данные
      return {
        total: 0,
        published: 0,
        draft: 0,
        archived: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        byCategory: {},
        byMonth: [],
        topPosts: []
      };
    } catch (error) {
      logger.error('Error getting post stats', {
        error: Utils.handleError(error)
      });
      throw error;
    }
  }

  /**
   * Вспомогательные методы
   */

  async updateCategoryPostCount(categoryId, increment = 1) {
    try {
      // В реальном приложении здесь был бы запрос к БД
      logger.info('Category post count updated', {
        categoryId,
        increment
      });
    } catch (error) {
      logger.error('Error updating category post count', {
        categoryId,
        increment,
        error: Utils.handleError(error)
      });
    }
  }

  clearPostCache(postId) {
    const cacheKey = `post_${postId}`;
    this.cache.delete(cacheKey);
  }

  isCacheExpired(cacheKey) {
    const item = this.cache.get(cacheKey);
    if (!item) return true;
    
    return Date.now() - item.timestamp > this.cacheTimeout;
  }

  /**
   * Построение дерева категорий
   */
  async buildCategoryTree() {
    try {
      // В реальном приложении здесь был бы запрос к БД для получения всех категорий
      const categories = [];
      
      const tree = [];
      for (const categoryData of categories) {
        const categoryNode = new CategoryComposite(categoryData);
        // Здесь должна быть логика построения иерархии
        tree.push(categoryNode);
      }

      return tree.map(node => node.toJSON());
    } catch (error) {
      logger.error('Error building category tree', {
        error: Utils.handleError(error)
      });
      throw error;
    }
  }
}

// Создание singleton экземпляра сервиса
module.exports = new BlogPostService();