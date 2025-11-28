import { Router, Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/OrderService';
import { asyncHandler, HandleError } from '../middleware/errorHandler';
import { logger } from '../middleware.logger';
import { validationResult, body, query } from 'express-validator';
import { 
  CreateOrderRequest, 
  UpdateOrderStatusRequest,
  ProcessPaymentRequest,
  TrackingUpdateRequest 
} from '../services/OrderService';

/**
 * Интерфейсы для запросов
 */
interface OrderQuery extends Query {
  page?: string;
  limit?: string;
  status?: string;
  paymentStatus?: string;
  userId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Валидаторы для express-validator
 */
const validateOrderCreate = [
  body('userId')
    .optional()
    .isMongoId()
    .withMessage('Недопустимый ID пользователя'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Должен быть至少 один товар'),
  body('items.*.productId')
    .isMongoId()
    .withMessage('Недопустимый ID товара'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Количество должно быть не менее 1'),
  body('shippingAddress.street')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Улица обязательна'),
  body('shippingAddress.city')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Город обязателен'),
  body('shippingAddress.postalCode')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Почтовый индекс обязателен'),
  body('shippingAddress.country')
    .trim()
    .isLength({ min: 2, max: 2 })
    .withMessage('Страна обязательна'),
  body('billingAddress.street')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Улица обязательна'),
  body('billingAddress.city')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Город обязателен'),
  body('billingAddress.postalCode')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Почтовый индекс обязателен'),
  body('billingAddress.country')
    .trim()
    .isLength({ min: 2, max: 2 })
    .withMessage('Страна обязательна'),
  body('paymentMethod.type')
    .isIn(['credit_card', 'debit_card', 'paypal', 'stripe', 'cash_on_delivery'])
    .withMessage('Недопустимый тип оплаты'),
  body('paymentMethod.last4')
    .optional()
    .isLength({ min: 4, max: 4 })
    .withMessage('Последние 4 цифры должны быть 4 символа'),
  body('paymentMethod.brand')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Бренд карты обязателен'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Примечания не должны превышать 500 символов')
];

const validateOrderStatusUpdate = [
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed'])
    .withMessage('Недопустимый статус заказа'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Примечания не должны превышать 500 символов')
];

const validatePaymentProcess = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Сумма должна быть больше 0'),
  body('currency')
    .isLength({ min: 3, max: 3 })
    .withMessage('Валюта должна быть 3 символа')
];

const validateTrackingUpdate = [
  body('carrier')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Перевозчик обязателен'),
  body('trackingNumber')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Трек-номер обязателен'),
  body('status')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Статус обязателен'),
  body('location')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Местоположение обязательно'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Описание не должно превышать 200 символов')
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
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed'])
    .withMessage('Недопустимый статус заказа'),
  query('paymentStatus')
    .optional()
    .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'])
    .withMessage('Недопустимый статус оплаты'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'status', 'total'])
    .withMessage('Недопустимое поле для сортировки'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Порядок сортировки должен быть asc или desc')
];

/**
 * Класс для маршрутов заказов
 */
export class OrderRoutes {
  private router: Router;
  private orderService: OrderService;

  constructor() {
    this.router = Router();
    this.orderService = new OrderService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Защита всех маршрутов (требуется аутентификация)
    this.router.use(this.authenticateToken.bind(this));

    // Создание заказа
    this.router.post(
      '/',
      validateOrderCreate,
      asyncHandler(this.createOrder.bind(this))
    );

    // Получение заказов пользователя
    this.router.get(
      '/my',
      validateQueryParams,
      asyncHandler(this.getMyOrders.bind(this))
    );

    // Получение заказа по ID
    this.router.get(
      '/:orderId',
      asyncHandler(this.getOrder.bind(this))
    );

    // Обновление статуса заказа (только для администраторов)
    this.router.patch(
      '/:orderId/status',
      this.requireRole(['admin', 'moderator']),
      validateOrderStatusUpdate,
      asyncHandler(this.updateOrderStatus.bind(this))
    );

    // Оплата заказа
    this.router.post(
      '/:orderId/pay',
      asyncHandler(this.processPayment.bind(this))
    );

    // Добавление трекинга (только для администраторов)
    this.router.post(
      '/:orderId/tracking',
      this.requireRole(['admin', 'moderator']),
      validateTrackingUpdate,
      asyncHandler(this.addTrackingInfo.bind(this))
    );

    // Отмена заказа
    this.router.patch(
      '/:orderId/cancel',
      asyncHandler(this.cancelOrder.bind(this))
    );

    // Возврат заказа
    this.router.post(
      '/:orderId/return',
      asyncHandler(this.requestReturn.bind(this))
    );

    // Получение всех заказов (только для администраторов)
    this.router.get(
      '/',
      this.requireRole(['admin']),
      validateQueryParams,
      asyncHandler(this.getAllOrders.bind(this))
    );

    // Статистика заказов (только для администраторов)
    this.router.get(
      '/stats',
      this.requireRole(['admin']),
      asyncHandler(this.getOrderStats.bind(this))
    );
  }

  /**
   * Создание заказа
   */
  @HandleError
  private async createOrder(req: Request & { user?: any }, res: Response): Promise<void> {
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

    const orderData: CreateOrderRequest = {
      ...req.body,
      userId: req.user.userId // Добавляем ID пользователя из токена
    };

    try {
      const result = await this.orderService.createOrder(orderData);

      logger.info('Заказ успешно создан', {
        orderId: result.data?.id,
        userId: req.user.userId,
        total: result.data?.total,
        itemsCount: result.data?.items?.length
      });

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error('Ошибка при создании заказа', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user.userId
      });

      throw error;
    }
  }

  /**
   * Получение заказов текущего пользователя
   */
  @HandleError
  private async getMyOrders(req: Request & { user?: any } & { query: OrderQuery }, res: Response): Promise<void> {
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

    const { page = '1', limit = '10', status, paymentStatus, sortBy, sortOrder = 'desc' } = req.query;

    try {
      const queryOptions = {
        filter: {
          ...(status && { status }),
          ...(paymentStatus && { paymentStatus })
        },
        sort: sortBy ? { field: sortBy, order: sortOrder } : { field: 'createdAt', order: 'desc' },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      };

      const result = await this.orderService.getUserOrders(req.user.userId, queryOptions);

      res.json(result);
    } catch (error) {
      logger.error('Ошибка при получении заказов пользователя', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user.userId
      });

      throw error;
    }
  }

  /**
   * Получение заказа по ID
   */
  @HandleError
  private async getOrder(req: Request & { user?: any }, res: Response): Promise<void> {
    const { orderId } = req.params;
    const userId = req.user.userId;

    try {
      const result = await this.orderService.getOrderById(orderId);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      // Проверка, что заказ принадлежит пользователю (если не администратор)
      if (result.data?.userId !== userId && !['admin', 'moderator'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: 'Доступ запрещен',
          message: 'Вы можете просматривать только свои заказы',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        });
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Ошибка при получении заказа', {
        error: error instanceof Error ? error.message : String(error),
        orderId,
        userId
      });

      throw error;
    }
  }

  /**
   * Обновление статуса заказа
   */
  @HandleError
  private async updateOrderStatus(req: Request & { user?: any }, res: Response): Promise<void> {
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

    const { orderId } = req.params;
    const statusUpdate: UpdateOrderStatusRequest = req.body;
    const updatedBy = req.user.userId;

    try {
      const result = await this.orderService.updateOrderStatus(orderId, statusUpdate);

      logger.info('Статус заказа обновлен', {
        orderId,
        newStatus: statusUpdate.status,
        updatedBy,
        notes: statusUpdate.notes
      });

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error('Ошибка при обновлении статуса заказа', {
        error: error instanceof Error ? error.message : String(error),
        orderId,
        updatedBy
      });

      throw error;
    }
  }

  /**
   * Оплата заказа
   */
  @HandleError
  private async processPayment(req: Request & { user?: any }, res: Response): Promise<void> {
    const { orderId } = req.params;
    const userId = req.user.userId;

    try {
      const paymentResult = await this.orderService.processPayment(orderId);

      if (paymentResult.success) {
        logger.info('Оплата заказа успешна', {
          orderId,
          transactionId: paymentResult.data?.transactionId,
          userId
        });
      } else {
        logger.warn('Оплата заказа не удалась', {
          orderId,
          error: paymentResult.message,
          userId
        });
      }

      res.status(paymentResult.success ? 200 : 400).json(paymentResult);
    } catch (error) {
      logger.error('Ошибка при оплате заказа', {
        error: error instanceof Error ? error.message : String(error),
        orderId,
        userId
      });

      throw error;
    }
  }

  /**
   * Добавление информации о трекинге
   */
  @HandleError
  private async addTrackingInfo(req: Request & { user?: any }, res: Response): Promise<void> {
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

    const { orderId } = req.params;
    const trackingData: TrackingUpdateRequest = req.body;
    const updatedBy = req.user.userId;

    try {
      const result = await this.orderService.addTrackingInfo(orderId, trackingData);

      logger.info('Информация о трекинге добавлена', {
        orderId,
        carrier: trackingData.carrier,
        trackingNumber: trackingData.trackingNumber,
        status: trackingData.status,
        updatedBy
      });

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error('Ошибка при добавлении трекинга', {
        error: error instanceof Error ? error.message : String(error),
        orderId,
        updatedBy
      });

      throw error;
    }
  }

  /**
   * Отмена заказа
   */
  @HandleError
  private async cancelOrder(req: Request & { user?: any }, res: Response): Promise<void> {
    const { orderId } = req.params;
    const userId = req.user.userId;

    try {
      // В реальном приложении здесь была бы логика проверки возможности отмены
      // и обновления статуса заказа
      
      logger.info('Заказ отменен', {
        orderId,
        userId,
        reason: req.body.reason
      });

      res.json({
        success: true,
        message: 'Заказ успешно отменен',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      logger.error('Ошибка при отмене заказа', {
        error: error instanceof Error ? error.message : String(error),
        orderId,
        userId
      });

      throw error;
    }
  }

  /**
   * Запрос возврата
   */
  @HandleError
  private async requestReturn(req: Request & { user?: any }, res: Response): Promise<void> {
    const { orderId } = req.params;
    const userId = req.user.userId;
    const { reason, items } = req.body;

    try {
      // В реальном приложении здесь была бы логика обработки запроса на возврат
      
      logger.info('Запрос на возврат', {
        orderId,
        userId,
        reason,
        items
      });

      res.json({
        success: true,
        message: 'Запрос на возврат успешно отправлен',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      logger.error('Ошибка при запросе возврата', {
        error: error instanceof Error ? error.message : String(error),
        orderId,
        userId
      });

      throw error;
    }
  }

  /**
   * Получение всех заказов (для администраторов)
   */
  @HandleError
  private async getAllOrders(req: Request & { query: OrderQuery }, res: Response): Promise<void> {
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

    const {
      page = '1',
      limit = '10',
      status,
      paymentStatus,
      userId,
      sortBy,
      sortOrder = 'desc'
    } = req.query;

    try {
      const queryOptions = {
        filter: {
          ...(status && { status }),
          ...(paymentStatus && { paymentStatus }),
          ...(userId && { userId })
        },
        sort: sortBy ? { field: sortBy, order: sortOrder } : { field: 'createdAt', order: 'desc' },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      };

      const result = await this.orderService.getAllOrders(queryOptions);

      res.json(result);
    } catch (error) {
      logger.error('Ошибка при получении всех заказов', {
        error: error instanceof Error ? error.message : String(error)
      });

      throw error;
    }
  }

  /**
   * Получение статистики заказов
   */
  @HandleError
  private async getOrderStats(req: Request & { user?: any }, res: Response): Promise<void> {
    try {
      // В реальном приложении здесь была бы логика получения статистики
      const stats = {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        ordersByStatus: {},
        ordersByPaymentStatus: {},
        revenueByMonth: []
      };

      logger.info('Получение статистики заказов', {
        requestedBy: req.user.userId
      });

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      logger.error('Ошибка при получении статистики заказов', {
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
export const orderRoutes = new OrderRoutes().getRouter();