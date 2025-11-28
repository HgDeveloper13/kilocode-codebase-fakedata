import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { asyncHandler, HandleError } from '../middleware/errorHandler';
import { logger } from '../middleware.logger';
import { LoginRequest, CreateUserRequest } from '../services/UserService';
import { validationResult, body } from 'express-validator';

/**
 * Интерфейсы для запросов
 */
interface AuthRequest extends Request {
  body: LoginRequest | CreateUserRequest;
}

/**
 * Валидаторы для express-validator
 */
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Неверный формат email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Пароль должен быть не менее 8 символов')
];

const validateRegistration = [
  body('email')
    .isEmail()
    .withMessage('Неверный формат email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Пароль должен быть не менее 8 символов')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Пароль должен содержать заглавные и строчные буквы и цифры'),
  body('firstName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Имя должно быть не менее 2 символов'),
  body('lastName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Фамилия должна быть не менее 2 символов'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Неверный формат телефона')
];

/**
 * Класс для маршрутов аутентификации
 */
export class AuthRoutes {
  private router: Router;
  private userService: UserService;

  constructor() {
    this.router = Router();
    this.userService = new UserService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Регистрация пользователя
    this.router.post(
      '/register',
      validateRegistration,
      asyncHandler(this.register.bind(this))
    );

    // Аутентификация пользователя
    this.router.post(
      '/login',
      validateLogin,
      asyncHandler(this.login.bind(this))
    );

    // Выход из системы
    this.router.post(
      '/logout',
      asyncHandler(this.logout.bind(this))
    );

    // Проверка токена
    this.router.get(
      '/verify',
      asyncHandler(this.verifyToken.bind(this))
    );

    // Обновление профиля
    this.router.put(
      '/profile',
      this.authenticateToken.bind(this),
      validateUpdateProfile,
      asyncHandler(this.updateProfile.bind(this))
    );

    // Получение профиля
    this.router.get(
      '/profile',
      this.authenticateToken.bind(this),
      asyncHandler(this.getProfile.bind(this))
    );

    // Смена пароля
    this.router.post(
      '/change-password',
      this.authenticateToken.bind(this),
      validateChangePassword,
      asyncHandler(this.changePassword.bind(this))
    );

    // Восстановление пароля
    this.router.post(
      '/forgot-password',
      validateForgotPassword,
      asyncHandler(this.forgotPassword.bind(this))
    );

    // Сброс пароля
    this.router.post(
      '/reset-password/:token',
      validateResetPassword,
      asyncHandler(this.resetPassword.bind(this))
    );
  }

  /**
   * Регистрация нового пользователя
   */
  @HandleError
  private async register(req: AuthRequest, res: Response): Promise<void> {
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

    const userData: CreateUserRequest = req.body;

    try {
      const result = await this.userService.createUser(userData);
      
      logger.info('Пользователь успешно зарегистрирован', {
        email: userData.email,
        requestId: result.requestId
      });

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error('Ошибка при регистрации пользователя', {
        error: error instanceof Error ? error.message : String(error),
        email: userData.email
      });

      throw error;
    }
  }

  /**
   * Аутентификация пользователя
   */
  @HandleError
  private async login(req: AuthRequest, res: Response): Promise<void> {
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

    const loginData: LoginRequest = req.body;

    try {
      const result = await this.userService.loginUser(loginData);
      
      if (result.success) {
        logger.info('Пользователь успешно вошел в систему', {
          email: loginData.email,
          requestId: result.requestId
        });
      } else {
        logger.warn('Ошибка входа в систему', {
          email: loginData.email,
          error: result.error,
          requestId: result.requestId
        });
      }

      res.status(result.success ? 200 : 401).json(result);
    } catch (error) {
      logger.error('Ошибка при входе в систему', {
        error: error instanceof Error ? error.message : String(error),
        email: loginData.email
      });

      throw error;
    }
  }

  /**
   * Выход из системы
   */
  @HandleError
  private async logout(req: Request, res: Response): Promise<void> {
    // В реальном приложении здесь была бы инвалидация токена
    logger.info('Пользователь вышел из системы', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Успешный выход из системы',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }

  /**
   * Проверка токена
   */
  @HandleError
  private async verifyToken(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Требуется аутентификация',
        message: 'Токен не предоставлен',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = this.userService.validateToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        error: 'Недействительный токен',
        message: 'Токен недействителен или просрочен',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
      return;
    }

    // Получаем информацию о пользователе
    const userResult = await this.userService.getUserById(decoded.userId);

    if (!userResult.success) {
      res.status(404).json(userResult);
      return;
    }

    res.json({
      success: true,
      data: {
        valid: true,
        user: userResult.data,
        tokenPayload: decoded
      },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }

  /**
   * Получение профиля пользователя
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
   * Обновление профиля пользователя
   */
  @HandleError
  private async updateProfile(req: Request & { user?: any }, res: Response): Promise<void> {
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
   * Смена пароля
   */
  @HandleError
  private async changePassword(req: Request & { user?: any }, res: Response): Promise<void> {
    // В реальном приложении здесь была бы логика смены пароля
    res.json({
      success: true,
      message: 'Пароль успешно изменен',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }

  /**
   * Восстановление пароля
   */
  @HandleError
  private async forgotPassword(req: Request, res: Response): Promise<void> {
    // В реальном приложении здесь была бы логика восстановления пароля
    res.json({
      success: true,
      message: 'Инструкции по восстановлению пароля отправлены на email',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }

  /**
   * Сброс пароля
   */
  @HandleError
  private async resetPassword(req: Request, res: Response): Promise<void> {
    // В реальном приложении здесь была бы логика сброса пароля
    res.json({
      success: true,
      message: 'Пароль успешно сброшен',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }

  /**
   * Middleware для аутентификации
   */
  private authenticateToken(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Требуется аутентификация',
        message: 'Токен не предоставлен',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = this.userService.validateToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        error: 'Недействительный токен',
        message: 'Токен недействителен или просрочен',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
      return;
    }

    req.user = decoded;
    next();
  }

  /**
   * Получение маршрутов
   */
  public getRouter(): Router {
    return this.router;
  }
}

// Валидаторы для других методов
const validateUpdateProfile = [
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
    .withMessage('Биография не должна превышать 500 символов')
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Текущий пароль обязателен'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Новый пароль должен быть не менее 8 символов')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Новый пароль должен содержать заглавные и строчные буквы и цифры'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Пароли не совпадают');
      }
      return true;
    })
];

const validateForgotPassword = [
  body('email')
    .isEmail()
    .withMessage('Неверный формат email')
    .normalizeEmail()
];

const validateResetPassword = [
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Пароль должен быть не менее 8 символов')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Пароль должен содержать заглавные и строчные буквы и цифры'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Пароли не совпадают');
      }
      return true;
    })
];

// Экспортируем маршруты
export const authRoutes = new AuthRoutes().getRouter();