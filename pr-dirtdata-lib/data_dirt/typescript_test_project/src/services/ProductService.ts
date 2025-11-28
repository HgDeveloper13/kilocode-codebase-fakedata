import { v4 as uuidv4 } from 'uuid';
import { 
  Product, 
  Category, 
  Review, 
  ProductCategory 
} from '../models';
import { 
  ApiResponse, 
  PaginatedResponse, 
  QueryOptions, 
  FilterOptions, 
  SortOptions, 
  ValidationResult, 
  ValidationError 
} from '../types';
import { ProductCategory as ProductCategoryEnum } from '../types/enums';

/**
 * Интерфейсы для сервиса продуктов
 */
export interface CreateProductRequest {
  name: string;
  description: string;
  sku: string;
  category: ProductCategory;
  price: number;
  cost: number;
  stock: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in' | 'mm';
  };
  images: string[];
  specifications: Record<string, any>;
  tags: string[];
  brand?: string;
  manufacturer?: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  isActive?: boolean;
  images?: string[];
  specifications?: Record<string, any>;
}

export interface CreateReviewRequest {
  userId: string;
  productId: string;
  orderId?: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
}

export interface ProductFilter extends FilterOptions {
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  brand?: string;
  tags?: string[];
  rating?: number;
}

/**
 * Интерфейс для поиска продуктов
 */
export interface ProductSearchCriteria {
  query?: string;
  filters?: ProductFilter;
  sort?: SortOptions;
  pagination?: {
    page: number;
    limit: number;
  };
}

/**
 * Класс для валидации данных продуктов
 */
class ProductValidator {
  static validateProductData(productData: CreateProductRequest): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!productData.name || productData.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Название продукта обязательно и должно быть не менее 2 символов' });
    }

    if (!productData.description || productData.description.trim().length < 10) {
      errors.push({ field: 'description', message: 'Описание продукта обязательно и должно быть не менее 10 символов' });
    }

    if (!productData.sku || productData.sku.trim().length < 1) {
      errors.push({ field: 'sku', message: 'Артикул (SKU) обязателен' });
    }

    if (!productData.category || !Object.values(ProductCategoryEnum).includes(productData.category)) {
      errors.push({ field: 'category', message: 'Укажите действительную категорию продукта' });
    }

    if (productData.price <= 0) {
      errors.push({ field: 'price', message: 'Цена должна быть больше 0' });
    }

    if (productData.cost < 0) {
      errors.push({ field: 'cost', message: 'Себестоимость не может быть отрицательной' });
    }

    if (productData.stock < 0) {
      errors.push({ field: 'stock', message: 'Количество на складе не может быть отрицательным' });
    }

    if (productData.weight && productData.weight <= 0) {
      errors.push({ field: 'weight', message: 'Вес должен быть больше 0' });
    }

    if (productData.dimensions) {
      if (productData.dimensions.length <= 0 || productData.dimensions.width <= 0 || productData.dimensions.height <= 0) {
        errors.push({ field: 'dimensions', message: 'Все измерения должны быть больше 0' });
      }
      if (!['cm', 'in', 'mm'].includes(productData.dimensions.unit)) {
        errors.push({ field: 'dimensions.unit', message: 'Недопустимая единица измерения' });
      }
    }

    if (productData.images && !Array.isArray(productData.images)) {
      errors.push({ field: 'images', message: 'Изображения должны быть массивом' });
    }

    if (productData.tags && (!Array.isArray(productData.tags) || productData.tags.length === 0)) {
      errors.push({ field: 'tags', message: 'Теги должны быть массивом и не может быть пустым' });
    }

    return errors;
  }

  static validateReviewData(reviewData: CreateReviewRequest): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!reviewData.userId) {
      errors.push({ field: 'userId', message: 'ID пользователя обязателен' });
    }

    if (!reviewData.productId) {
      errors.push({ field: 'productId', message: 'ID продукта обязателен' });
    }

    if (reviewData.rating < 1 || reviewData.rating > 5) {
      errors.push({ field: 'rating', message: 'Рейтинг должен быть от 1 до 5' });
    }

    if (!reviewData.title || reviewData.title.trim().length < 5) {
      errors.push({ field: 'title', message: 'Заголовок отзыва должен быть не менее 5 символов' });
    }

    if (!reviewData.comment || reviewData.comment.trim().length < 10) {
      errors.push({ field: 'comment', message: 'Комментарий должен быть не менее 10 символов' });
    }

    return errors;
  }
}

/**
 * Репозиторий для продуктов
 */
class ProductRepository {
  private products: Product[] = [];
  private categories: Category[] = [];
  private reviews: Review[] = [];

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    // Создание категорий по умолчанию
    const defaultCategories: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Электроника',
        description: 'Электронные устройства и аксессуары',
        slug: 'electronics',
        parentId: undefined,
        sortOrder: 1,
        isActive: true
      },
      {
        name: 'Одежда',
        description: 'Одежда и обувь',
        slug: 'clothing',
        parentId: undefined,
        sortOrder: 2,
        isActive: true
      },
      {
        name: 'Книги',
        description: 'Книги и литература',
        slug: 'books',
        parentId: undefined,
        sortOrder: 3,
        isActive: true
      }
    ];

    defaultCategories.forEach(cat => {
      this.categories.push({
        ...cat,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    // Создание продуктов по умолчанию
    const defaultProducts: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Смартфон iPhone 15',
        description: 'Новейший iPhone с передовыми функциями',
        sku: 'IPHONE15-128GB-BLK',
        category: ProductCategoryEnum.ELECTRONICS,
        price: 999.99,
        cost: 700.00,
        stock: 50,
        weight: 0.171,
        dimensions: {
          length: 14.67,
          width: 7.09,
          height: 0.83,
          unit: 'cm'
        },
        images: ['https://example.com/images/iphone15.jpg'],
        specifications: {
          display: '6.1 inches',
          storage: '128GB',
          color: 'черный',
          os: 'iOS 17'
        },
        tags: ['smartphone', 'apple', 'ios'],
        brand: 'Apple',
        manufacturer: 'Apple Inc.',
        isActive: true
      }
    ];

    defaultProducts.forEach(product => {
      this.products.push({
        ...product,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
  }

  async findAll(options?: QueryOptions): Promise<{ products: Product[]; total: number }> {
    let filteredProducts = [...this.products];

    // Фильтрация
    if (options?.filter) {
      filteredProducts = filteredProducts.filter(product => {
        for (const [key, value] of Object.entries(options.filter!)) {
          if (key === 'category' && product.category !== value) return false;
          if (key === 'minPrice' && product.price < value) return false;
          if (key === 'maxPrice' && product.price > value) return false;
          if (key === 'inStock' && product.stock <= 0) return false;
          if (key === 'brand' && product.brand !== value) return false;
        }
        return true;
      });
    }

    // Сортировка
    if (options?.sort) {
      filteredProducts.sort((a, b) => {
        const { field, order } = options.sort!;
        const aValue = a[field as keyof Product];
        const bValue = b[field as keyof Product];
        
        if (order === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    }

    // Пагинация
    const total = filteredProducts.length;
    const { page = 1, limit = 10 } = options?.pagination || {};
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    return {
      products: paginatedProducts,
      total
    };
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.find(product => product.id === id) || null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.products.find(product => product.sku === sku) || null;
  }

  async create(product: Product): Promise<Product> {
    this.products.push(product);
    return product;
  }

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    const productIndex = this.products.findIndex(product => product.id === id);
    if (productIndex === -1) return null;

    this.products[productIndex] = { 
      ...this.products[productIndex], 
      ...updates,
      updatedAt: new Date()
    };
    
    return this.products[productIndex];
  }

  async delete(id: string): Promise<boolean> {
    const productIndex = this.products.findIndex(product => product.id === id);
    if (productIndex === -1) return false;

    this.products.splice(productIndex, 1);
    return true;
  }

  async getCategories(): Promise<Category[]> {
    return [...this.categories];
  }

  async createReview(review: Review): Promise<Review> {
    this.reviews.push(review);
    return review;
  }

  async getProductReviews(productId: string): Promise<Review[]> {
    return this.reviews.filter(review => review.productId === productId);
  }

  async getProductRating(productId: string): Promise<number> {
    const productReviews = this.reviews.filter(review => review.productId === productId);
    if (productReviews.length === 0) return 0;

    const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / productReviews.length) * 10) / 10;
  }
}

/**
 * Основной сервис для работы с продуктами
 */
export class ProductService {
  private productRepository = new ProductRepository();

  /**
   * Валидация данных продукта
   */
  validateProduct(productData: CreateProductRequest): ValidationResult {
    const errors = ProductValidator.validateProductData(productData);
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Валидация данных отзыва
   */
  validateReview(reviewData: CreateReviewRequest): ValidationResult {
    const errors = ProductValidator.validateReviewData(reviewData);
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Создание продукта
   */
  async createProduct(productData: CreateProductRequest): Promise<ApiResponse<Product>> {
    const validationResult = this.validateProduct(productData);
    if (!validationResult.isValid) {
      return {
        success: false,
        error: 'Ошибка валидации',
        data: { validationErrors: validationResult.errors },
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    const existingProduct = await this.productRepository.findBySku(productData.sku);
    if (existingProduct) {
      return {
        success: false,
        error: 'Продукт с таким артикулом уже существует',
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    const product: Product = {
      id: uuidv4(),
      ...productData,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const createdProduct = await this.productRepository.create(product);

    return {
      success: true,
      data: createdProduct,
      message: 'Продукт успешно создан',
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }

  /**
   * Получение продукта по ID
   */
  async getProductById(productId: string): Promise<ApiResponse<Product>> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      return {
        success: false,
        error: 'Продукт не найден',
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    const rating = await this.productRepository.getProductRating(productId);

    return {
      success: true,
      data: { ...product, rating },
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }

  /**
   * Обновление продукта
   */
  async updateProduct(productId: string, updates: UpdateProductRequest): Promise<ApiResponse<Product>> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      return {
        success: false,
        error: 'Продукт не найден',
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    const updatedProduct = await this.productRepository.update(productId, updates);

    return {
      success: true,
      data: updatedProduct!,
      message: 'Продукт успешно обновлен',
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }

  /**
   * Удаление продукта
   */
  async deleteProduct(productId: string): Promise<ApiResponse<void>> {
    const deleted = await this.productRepository.delete(productId);
    if (!deleted) {
      return {
        success: false,
        error: 'Продукт не найден',
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    return {
      success: true,
      message: 'Продукт успешно удален',
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }

  /**
   * Поиск продуктов
   */
  async searchProducts(criteria: ProductSearchCriteria): Promise<ApiResponse<Product[]>> {
    const queryOptions: QueryOptions = {
      filter: criteria.filters,
      sort: criteria.sort,
      pagination: criteria.pagination
    };

    const { products, total } = await this.productRepository.findAll(queryOptions);

    // Если есть текстовый запрос, фильтруем дополнительно
    let filteredProducts = products;
    if (criteria.query) {
      const queryLower = criteria.query.toLowerCase();
      filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(queryLower) ||
        product.description.toLowerCase().includes(queryLower) ||
        product.sku.toLowerCase().includes(queryLower) ||
        product.tags.some(tag => tag.toLowerCase().includes(queryLower))
      );
    }

    return {
      success: true,
      data: filteredProducts,
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }

  /**
   * Получение всех категорий
   */
  async getCategories(): Promise<ApiResponse<Category[]>> {
    const categories = await this.productRepository.getCategories();

    return {
      success: true,
      data: categories,
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }

  /**
   * Создание отзыва
   */
  async createReview(reviewData: CreateReviewRequest): Promise<ApiResponse<Review>> {
    const validationResult = this.validateReview(reviewData);
    if (!validationResult.isValid) {
      return {
        success: false,
        error: 'Ошибка валидации',
        data: { validationErrors: validationResult.errors },
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    const product = await this.productRepository.findById(reviewData.productId);
    if (!product) {
      return {
        success: false,
        error: 'Продукт не найден',
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    const review: Review = {
      id: uuidv4(),
      ...reviewData,
      verified: false,
      helpful: 0,
      notHelpful: 0,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const createdReview = await this.productRepository.createReview(review);

    return {
      success: true,
      data: createdReview,
      message: 'Отзыв успешно создан',
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }

  /**
   * Получение отзывов продукта
   */
  async getProductReviews(productId: string): Promise<ApiResponse<Review[]>> {
    const reviews = await this.productRepository.getProductReviews(productId);

    return {
      success: true,
      data: reviews,
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }

  /**
   * Получение продуктов с пагинацией
   */
  async getProductsPaginated(options: QueryOptions): Promise<PaginatedResponse<Product[]>> {
    const { products, total } = await this.productRepository.findAll(options);
    const { page = 1, limit = 10 } = options.pagination || {};
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      },
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }
}