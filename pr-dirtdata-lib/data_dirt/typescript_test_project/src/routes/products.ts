import { Router, Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/ProductService';
import { asyncHandler, HandleError } from '../middleware/errorHandler';
import { logger } from '../middleware.logger';
import { validationResult, body, query } from 'express-validator';
import { 
  CreateProductRequest, 
  UpdateProductRequest, 
  CreateReviewRequest,
  ProductSearchCriteria 
} from '../services/ProductService';

/**
 * Интерфейсы для запросов
 */
interface ProductQuery extends Query {
  page?: string;
  limit?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  brand?: string;
  tags?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

/**
 * Валидаторы для express-validator
 */
const validateProductCreate = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Название должно быть от 2 до 200 символов'),
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Описание должно быть не менее 10 символов'),
  body('sku')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Артикул должен быть от 1 до 50 символов'),
  body('category')
    .isIn(['electronics', 'clothing', 'books', 'home', 'sports', 'toys', 'beauty', 'food', 'automotive', 'health', 'jewelry', 'shoes', 'bags', 'watches'])
    .withMessage('Недопустимая категория'),
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Цена должна быть больше 0'),
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Себестоимость не может быть отрицательной'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Количество на складе не может быть отрицательным'),
  body('weight')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Вес должен быть больше 0'),
  body('dimensions.length')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Длина должна быть больше 0'),
  body('dimensions.width')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Ширина должна быть больше 0'),
  body('dimensions.height')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Высота должна быть больше 0'),
  body('dimensions.unit')
    .optional()
    .isIn(['cm', 'in', 'mm'])
    .withMessage('Недопустимая единица измерения'),
  body('images')
    .isArray({ min: 1 })
    .withMessage('Должно быть至少 одно изображение'),
  body('images.*')
    .isURL()
    .withMessage('Каждое изображение должно быть действительным URL'),
  body('tags')
    .isArray({ min: 1 })
    .withMessage('Должен быть至少 один тег'),
  body('tags.*')
    .isLength({ min: 1, max: 50 })
    .withMessage('Теги должны быть от 1 до 50 символов'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Бренд не должен превышать 100 символов'),
  body('manufacturer')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Производитель не должен превышать 100 символов')
];

const validateProductUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Название должно быть от 2 до 200 символов'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Описание должно быть не менее 10 символов'),
  body('price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Цена должна быть больше 0'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Количество на складе не может быть отрицательным'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive должно быть булевым значением'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Изображения должны быть массивом'),
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Каждое изображение должно быть действительным URL'),
  body('specifications')
    .optional()
    .isObject()
    .withMessage('Спецификации должны быть объектом')
];

const validateReviewCreate = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Рейтинг должен быть от 1 до 5'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Заголовок должен быть от 5 до 100 символов'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Комментарий должен быть от 10 до 1000 символов'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Изображения должны быть массивом'),
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Каждое изображение должно быть действительным URL')
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
  query('minPrice')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Минимальная цена должна быть больше 0'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Максимальная цена должна быть больше 0'),
  query('inStock')
    .optional()
    .isBoolean()
    .withMessage('inStock должно быть булевым значением'),
  query('sortBy')
    .optional()
    .isIn(['name', 'price', 'createdAt', 'updatedAt'])
    .withMessage('Недопустимое поле для сортировки'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Порядок сортировки должен быть asc или desc'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Поисковый запрос должен быть от 1 до 100 символов')
];

/**
 * Класс для маршрутов продуктов
 */
export class ProductRoutes {
  private router: Router;
  private productService: ProductService;

  constructor() {
    this.router = Router();
    this.productService = new ProductService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Публичные маршруты (без аутентификации)
    this.router.get('/', validateQueryParams, asyncHandler(this.getProducts.bind(this)));
    this.router.get('/categories', asyncHandler(this.getCategories.bind(this)));
    this.router.get('/:productId', asyncHandler(this.getProduct.bind(this)));

    // Защищенные маршруты (требуется аутентификация)
    this.router.use(this.authenticateToken.bind(this));

    // Создание продукта (только для администраторов)
    this.router.post(
      '/',
      this.requireRole(['admin']),
      validateProductCreate,
      asyncHandler(this.createProduct.bind(this))
    );

    // Обновление продукта (только для администраторов)
    this.router.put(
      '/:productId',
      this.requireRole(['admin']),
      validateProductUpdate,
      asyncHandler(this.updateProduct.bind(this))
    );

    // Удаление продукта (только для администраторов)
    this.router.delete(
      '/:productId',
      this.requireRole(['admin']),
      asyncHandler(this.deleteProduct.bind(this))
    );

    // Отзывы
    this.router.post(
      '/:productId/reviews',
      validateReviewCreate,
      asyncHandler(this.createReview.bind(this))
    );

    this.router.get(
      '/:productId/reviews',
      asyncHandler(this.getProductReviews.bind(this))
    );

    // Статистика продуктов (только для администраторов)
    this.router.get(
      '/stats',
      this.requireRole(['admin']),
      asyncHandler(this.getProductStats.bind(this))
    );
  }

  /**
   * Получение списка продуктов
   */
  @HandleError
  private async getProducts(req: Request & { query: ProductQuery }, res: Response): Promise<void> {
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
      category,
      minPrice,
      maxPrice,
      inStock,
      brand,
      tags,
      sortBy,
      sortOrder = 'desc',
      search
    } = req.query;

    try {
      const queryOptions: ProductSearchCriteria = {
        filters: {
          ...(category && { category }),
          ...(minPrice && { minPrice: parseFloat(minPrice) }),
          ...(maxPrice && { maxPrice: parseFloat(maxPrice) }),
          ...(inStock && { inStock: inStock === 'true' }),
          ...(brand && { brand }),
          ...(tags && { tags: tags.split(',') })
        },
        sort: sortBy ? { field: sortBy, order: sortOrder } : undefined,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        },
        ...(search && { query: search })
      };

      const result = await this.productService.searchProducts(queryOptions);

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error('Ошибка при получении продуктов', {
        error: error instanceof Error ? error.message : String(error)
      });

      throw error;
    }
  }

  /**
   * Получение продукта по ID
   */
  @HandleError
  private async getProduct(req: Request, res: Response): Promise<void> {
    const { productId } = req.params;

    try {
      const result = await this.productService.getProductById(productId);

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error('Ошибка при получении продукта', {
        error: error instanceof Error ? error.message : String(error),
        productId
      });

      throw error;
    }
  }

  /**
   * Создание продукта
   */
  @HandleError
  private async createProduct(req: Request & { user?: any }, res: Response): Promise<void> {
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

    const productData: CreateProductRequest = req.body;
    const createdBy = req.user.userId;

    try {
      const result = await this.productService.createProduct(productData);

      logger.info('Продукт успешно создан', {
        productId: result.data?.id,
        name: productData.name,
        createdBy
      });

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error('Ошибка при создании продукта', {
        error: error instanceof Error ? error.message : String(error),
        name: productData.name,
        createdBy
      });

      throw error;
    }
  }

  /**
   * Обновление продукта
   */
  @HandleError
  private async updateProduct(req: Request & { user?: any }, res: Response): Promise<void> {
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

    const { productId } = req.params;
    const updates: UpdateProductRequest = req.body;
    const updatedBy = req.user.userId;

    try {
      const result = await this.productService.updateProduct(productId, updates);

      logger.info('Продукт успешно обновлен', {
        productId,
        updates,
        updatedBy
      });

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error('Ошибка при обновлении продукта', {
        error: error instanceof Error ? error.message : String(error),
        productId,
        updatedBy
      });

      throw error;
    }
  }

  /**
   * Удаление продукта
   */
  @HandleError
  private async deleteProduct(req: Request & { user?: any }, res: Response): Promise<void> {
    const { productId } = req.params;
    const deletedBy = req.user.userId;

    try {
      const result = await this.productService.deleteProduct(productId);

      logger.info('Продукт успешно удален', {
        productId,
        deletedBy
      });

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error('Ошибка при удалении продукта', {
        error: error instanceof Error ? error.message : String(error),
        productId,
        deletedBy
      });

      throw error;
    }
  }

  /**
   * Получение категорий
   */
  @HandleError
  private async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.productService.getCategories();

      res.json(result);
    } catch (error) {
      logger.error('Ошибка при получении категорий', {
        error: error instanceof Error ? error.message : String(error)
      });

      throw error;
    }
  }

  /**
   * Создание отзыва
   */
  @HandleError
  private async createReview(req: Request & { user?: any }, res: Response): Promise<void> {
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

    const { productId } = req.params;
    const reviewData: CreateReviewRequest = {
      ...req.body,
      userId: req.user.userId,
      productId
    };

    try {
      const result = await this.productService.createReview(reviewData);

      logger.info('Отзыв успешно создан', {
        productId,
        userId: req.user.userId,
        rating: reviewData.rating
      });

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error('Ошибка при создании отзыва', {
        error: error instanceof Error ? error.message : String(error),
        productId,
        userId: req.user.userId
      });

      throw error;
    }
  }

  /**
   * Получение отзывов продукта
   */
  @HandleError
  private async getProductReviews(req: Request, res: Response): Promise<void> {
    const { productId } = req.params;

    try {
      const result = await this.productService.getProductReviews(productId);

      res.json(result);
    } catch (error) {
      logger.error('Ошибка при получении отзывов', {
        error: error instanceof Error ? error.message : String(error),
        productId
      });

      throw error;
    }
  }

  /**
   * Получение статистики продуктов
   */
  @HandleError
  private async getProductStats(req: Request & { user?: any }, res: Response): Promise<void> {
    try {
      // В реальном приложении здесь была бы логика получения статистики
      const stats = {
        totalProducts: 0,
        activeProducts: 0,
        inactiveProducts: 0,
        outOfStockProducts: 0,
        productsByCategory: {},
        averagePrice: 0,
        totalStockValue: 0
      };

      logger.info('Получение статистики продуктов', {
        requestedBy: req.user.userId
      });

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      logger.error('Ошибка при получении статистики продуктов', {
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
export const productRoutes = new ProductRoutes().getRouter();