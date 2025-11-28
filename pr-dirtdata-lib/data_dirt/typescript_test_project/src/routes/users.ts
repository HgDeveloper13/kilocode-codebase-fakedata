import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { asyncHandler, HandleError } from '../middleware/errorHandler';
import { logger } from '../middleware.logger';
import { validationResult, body, query } from 'express-validator';

/**
 * Интерфейсы для запросов
 */
interface UserQuery extends Query {
  page?: string;
  limit?: string;
  role?: string;
  status?: string;
  search?: string;
}

/**
 * Валидаторы для express-validator
 */
const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Имя должно быть не менее 2 символов'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Фамилия должна быть не менее 2 символов'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Неверный формат телефона'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Биография не должна превышать 500 символов'),
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Недопустимая тема'),
  body('language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage('Недопустимый код языка')
];

const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Номер страницы должен быть положительным числом'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Лимит должен быть от 1 до 100'),
  query('role')
    .optional()
    .isIn(['admin', 'moderator', 'user', 'guest'])
    .withMessage('Недопустимая роль пользователя'),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'pending_verification', 'banned'])
    .withMessage('Недопустимый статус пользователя'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Поисковый запрос должен быть от 1 до 100 символов')
];

/**
 * Класс для маршрутов пользователей
 */
export class UserRoutes {
  private router: Router;
  private userService: UserService;

  constructor() {
    this.router = Router();
    this.userService = new UserService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Защита всех маршрутов (кроме публичных)
    this.router.use(this.authenticateToken.bind(this));

    // Получение списка пользователей (только для администраторов)
    this.router.get(
      '/',
      this.requireRole(['admin', 'moderator']),
      validateQueryParams,
      asyncHandler(this.getUsers.bind(this))
    );

    // Получение профиля пользователя
    this.router.get(
      '/profile',
      asyncHandler(this.getProfile.bind(this))
    );

    // Обновление профиля пользователя
    this.router.put(
      '/profile',
      validateUserUpdate,
      asyncHandler(this.updateProfile.bind(this))
    );

    // Получение пользователя по ID
    this.router.get(
      '/:userId',
      this.requireRole(['admin']),
      asyncHandler(this.getUserById.bind(this))
    );

    // Обновление пользователя (только для администраторов)
    this.router.put(
      '/:userId',
      this.requireRole(['admin']),
      validateUserUpdate,
      asyncHandler(this.updateUser.bind(this))
    );

    // Блокировка пользователя (только для администраторов)
    this.router.patch(
      '/:userId/block',
      this.requireRole(['admin']),
      asyncHandler(this.blockUser.bind(this))
    );

    // Разблокировка пользователя (только для администраторов)
    this.router.patch(
      '/:userId/unblock',
      this.requireRole(['admin']),
      asyncHandler(this.unblockUser.bind(this))
    );

    // Удаление пользователя (только для администраторов)
    this.router.delete(
      '/:userId',
      this.requireRole(['admin']),
      asyncHandler(this.deleteUser.bind(this))
    );

    // Статистика пользователей (только для администраторов)
    this.router.get(
      '/stats',
      this.requireRole(['admin']),
      asyncHandler(this.getUserStats.bind(this))
    );
  }

  /**
   * Получение списка пользователей
   */
  @HandleError
  private async getUsers(req: Request & { query: UserQuery }, res: Response): Promise<void> {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        data: { validationErrors: errors.array() },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
      return;
    }

    const { page = '1', limit = '10', role, status, search } = req.query;

    try {
      // В реальном приложении здесь была бы логика получения пользователей из БД
      // с учетом фильтрации и пагинации
      
      logger.info('Получение списка пользователей', {
        page: parseInt(page),
        limit: parseInt(limit),
        role,
        status,
        search,
        requestId: req.headers['x-request-id'] || 'unknown'
      });

      res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      logger.error('Ошибка при получении списка пользователей', {
        error: error instanceof Error ? error.message : String(error)
      });

      throw error;
    }
  }

  /**
   * Получение профиля текущего пользователя
   */
  @HandleError
  private async getProfile(req: Request & { user?: any }, res: Response): Promise<void> {
    const userId = req.user.userId;

    try {
      const userResult = await this.userService.getUserById(userId);
      
      if (!userResult.success) {
        res.status(404).json(userResult);
        return;
      }

      const profileResult = await this.userService.getUserProfile(userId);

      res.json({
        success: true,
        data: {
          user: userResult.data,
          profile: profileResult.data
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      logger.error('Ошибка при получении профиля', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });

      throw error;
    }
  }

  /**
   * Обновление профиля текущего пользователя
   */
  @HandleError
  private async updateProfile(req: Request & { user?: any }, res: Response): Promise<void> {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        data: { validationErrors: errors.array() },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
      return;
    }

    const userId = req.user.userId;
    const updates = req.body;

    try {
      const result = await this.userService.updateUser(userId, updates);
      
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error('Ошибка при обновлении профиля', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });

      throw error;
    }
  }

  /**
   * Получение пользователя по ID
   */
  @HandleError
  private async getUserById(req: Request & { user?: any }, res: Response): Promise<void> {
    const { userId } = req.params;

    try {
      const result = await this.userService.getUserById(userId);
      
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error('Ошибка при получении пользователя', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        requestedBy: req.user.userId
      });

      throw error;
    }
  }

  /**
   * Обновление пользователя
   */
  @HandleError
  private async updateUser(req: Request & { user?: any }, res: Response): Promise<void> {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        data: { validationErrors: errors.array() },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
      return;
    }

    const { userId } = req.params;
    const updates = req.body;
    const requestedBy = req.user.userId;

    try {
      // В реальном приложении здесь была бы логика обновления пользователя
      // с проверкой прав и валидацией данных
      
      logger.info('Обновление пользователя', {
        userId,
        updates,
        requestedBy
      });

      res.json({
        success: true,
        message: 'Пользователь успешно обновлен',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      logger.error('Ошибка при обновлении пользователя', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        requestedBy
      });

      throw error;
    }
  }

  /**
   * Блокировка пользователя
   */
  @HandleError
  private async blockUser(req: Request & { user?: any }, res: Response): Promise<void> {
    const { userId } = req.params;
    const requestedBy = req.user.userId;
    const { reason } = req.body;

    try {
      // В реальном приложении здесь была бы логика блокировки пользователя
      logger.info('Блокировка пользователя', {
        userId,
        reason,
        requestedBy
      });

      res.json({
        success: true,
        message: 'Пользователь успешно заблокирован',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      logger.error('Ошибка при блокировке пользователя', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        requestedBy
      });

      throw error;
    }
  }

  /**
   * Разблокировка пользователя
   */
  @HandleError
  private async unblockUser(req: Request & { user?: any }, res: Response): Promise<void> {
    const { userId } = req.params;
    const requestedBy = req.user.userId;

    try {
      // В реальном приложении здесь была бы логика разблокировки пользователя
      logger.info('Разблокировка пользователя', {
        userId,
        requestedBy
      });

      res.json({
        success: true,
        message: 'Пользователь успешно разблокирован',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      logger.error('Ошибка при разблокировке пользователя', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        requestedBy
      });

      throw error;
    }
  }

  /**
   * Удаление пользователя
   */
  @HandleError
  private async deleteUser(req: Request & { user?: any }, res: Response): Promise<void> {
    const { userId } = req.params;
    const requestedBy = req.user.userId;

    try {
      // В реальном приложении здесь была бы логика мягкого удаления пользователя
      logger.info('Удаление пользователя', {
        userId,
        requestedBy
      });

      res.json({
        success: true,
        message: 'Пользователь успешно удален',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      logger.error('Ошибка при удалении пользователя', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        requestedBy
      });

      throw error;
    }
  }

  /**
   * Получение статистики пользователей
   */
  @HandleError
  private async getUserStats(req: Request & { user?: any }, res: Response): Promise<void> {
    try {
      // В реальном приложении здесь была бы логика получения статистики
      const stats = {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        newUsersToday: 0,
        newUsersThisMonth: 0,
        usersByRole: {
          admin: 0,
          moderator: 0,
          user: 0,
          guest: 0
        },
        usersByStatus: {
          active: 0,
          inactive: 0,
          suspended: 0,
          pending_verification: 0,
          banned: 0
        }
      };

      logger.info('Получение статистики пользователей', {
        requestedBy: req.user.userId
      });

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      logger.error('Ошибка при получении статистики пользователей', {
        error: error instanceof Error ? error.message : String(error)
      });

      throw error;
    }
  }

  /**
   * Middleware для аутентификации
   */
  private authenticateToken(req: Request, res: Response, next: NextFunction): void {
    // В реальном приложении здесь была бы проверка JWT токена
    // Для упрощения добавим mock пользователя
    req.user = {
      userId: 'mock-user-id',
      email: 'user@example.com',
      role: 'admin'
    };
    next();
  }

  /**
   * Middleware для проверки роли
   */
  private requireRole(allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request & { user?: any }, res: Response, next: NextFunction): void => {
      const userRole = req.user?.role;
      
      if (!userRole || !allowedRoles.includes(userRole)) {
        res.status(403).json({
          success: false,
          error: 'Доступ запрещен',
          message: 'У вас недостаточно прав для выполнения этого действия',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        });
        return;
      }

      next();
    };
  }

  /**
   * Получение маршрутов
   */
  public getRouter(): Router {
    return this.router;
  }
}

// Экспортируем маршруты
export const userRoutes = new UserRoutes().getRouter();