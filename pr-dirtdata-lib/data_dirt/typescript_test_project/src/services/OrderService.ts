import { v4 as uuidv4 } from 'uuid';
import { 
  Order, 
  OrderItem, 
  User, 
  Product, 
  PaymentMethod, 
  Address, 
  TrackingInfo, 
  OrderStatus, 
  PaymentStatus 
} from '../models';
import { 
  ApiResponse, 
  PaginatedResponse, 
  QueryOptions, 
  ValidationError 
} from '../types';
import { 
  OrderStatus as OrderStatusEnum, 
  PaymentStatus as PaymentStatusEnum,
  PaymentMethodType 
} from '../types/enums';

/**
 * Интерфейсы для сервиса заказов
 */
export interface CreateOrderRequest {
  userId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: {
    type: PaymentMethodType;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
  notes?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  notes?: string;
}

export interface ProcessPaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
}

export interface TrackingUpdateRequest {
  carrier: string;
  trackingNumber: string;
  status: string;
  location: string;
  description?: string;
}

/**
 * Интерфейс для расчета стоимости
 */
export interface ShippingCostCalculator {
  calculate(
    weight: number,
    distance: number,
    shippingMethod: 'standard' | 'express' | 'overnight'
  ): number;
}

/**
 * Класс для валидации данных заказов
 */
class OrderValidator {
  static validateOrderItems(items: { productId: string; quantity: number }[]): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!items || !Array.isArray(items) || items.length === 0) {
      errors.push({ field: 'items', message: 'Список товаров обязателен' });
      return errors;
    }

    items.forEach((item, index) => {
      if (!item.productId) {
        errors.push({ field: `items[${index}].productId`, message: 'ID продукта обязателен' });
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push({ field: `items[${index}].quantity`, message: 'Количество должно быть больше 0' });
      }
    });

    return errors;
  }

  static validateAddress(address: Address): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!address.street || address.street.trim().length === 0) {
      errors.push({ field: 'street', message: 'Улица обязательна' });
    }
    if (!address.city || address.city.trim().length === 0) {
      errors.push({ field: 'city', message: 'Город обязателен' });
    }
    if (!address.postalCode || address.postalCode.trim().length === 0) {
      errors.push({ field: 'postalCode', message: 'Почтовый индекс обязателен' });
    }
    if (!address.country || address.country.trim().length === 0) {
      errors.push({ field: 'country', message: 'Страна обязательна' });
    }

    return errors;
  }

  static validatePaymentMethod(paymentMethod: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!paymentMethod.type) {
      errors.push({ field: 'paymentMethod.type', message: 'Тип оплаты обязателен' });
      return errors;
    }

    const validTypes = Object.values(PaymentMethodType);
    if (!validTypes.includes(paymentMethod.type)) {
      errors.push({ field: 'paymentMethod.type', message: 'Недопустимый тип оплаты' });
    }

    if (paymentMethod.type === 'credit_card' || paymentMethod.type === 'debit_card') {
      if (!paymentMethod.last4) {
        errors.push({ field: 'paymentMethod.last4', message: 'Последние 4 цифры карты обязательны' });
      }
      if (!paymentMethod.brand) {
        errors.push({ field: 'paymentMethod.brand', message: 'Бренд карты обязателен' });
      }
    }

    return errors;
  }
}

/**
 * Репозиторий для заказов
 */
class OrderRepository {
  private orders: Order[] = [];
  private users: User[] = [];
  private products: Product[] = [];

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    // Создание тестовых пользователей
    const testUsers: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        email: 'john.doe@example.com',
        password: '$2a$12$hashed_password_here', // хешированный пароль
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        status: 'active',
        isActive: true,
        lastLogin: new Date()
      }
    ];

    testUsers.forEach(user => {
      this.users.push({
        ...user,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    // Создание тестовых продуктов
    const testProducts: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Смартфон iPhone 15',
        description: 'Новейший iPhone с передовыми функциями',
        sku: 'IPHONE15-128GB-BLK',
        category: 'electronics',
        price: 999.99,
        cost: 700.00,
        stock: 50,
        weight: 0.171,
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

    testProducts.forEach(product => {
      this.products.push({
        ...product,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
  }

  async findAll(options?: QueryOptions): Promise<{ orders: Order[]; total: number }> {
    let filteredOrders = [...this.orders];

    // Фильтрация
    if (options?.filter) {
      filteredOrders = filteredOrders.filter(order => {
        for (const [key, value] of Object.entries(options.filter!)) {
          if (key === 'userId' && order.userId !== value) return false;
          if (key === 'status' && order.status !== value) return false;
          if (key === 'paymentStatus' && order.paymentStatus !== value) return false;
        }
        return true;
      });
    }

    // Сортировка
    if (options?.sort) {
      const { field, order } = options.sort;
      filteredOrders.sort((a, b) => {
        const aValue = a[field as keyof Order];
        const bValue = b[field as keyof Order];
        
        if (order === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    }

    // Пагинация
    const total = filteredOrders.length;
    const { page = 1, limit = 10 } = options?.pagination || {};
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    return {
      orders: paginatedOrders,
      total
    };
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.find(order => order.id === id) || null;
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return this.orders.filter(order => order.userId === userId);
  }

  async create(order: Order): Promise<Order> {
    this.orders.push(order);
    return order;
  }

  async update(id: string, updates: Partial<Order>): Promise<Order | null> {
    const orderIndex = this.orders.findIndex(order => order.id === id);
    if (orderIndex === -1) return null;

    this.orders[orderIndex] = { 
      ...this.orders[orderIndex], 
      ...updates,
      updatedAt: new Date()
    };
    
    return this.orders[orderIndex];
  }

  async delete(id: string): Promise<boolean> {
    const orderIndex = this.orders.findIndex(order => order.id === id);
    if (orderIndex === -1) return false;

    this.orders.splice(orderIndex, 1);
    return true;
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.users.find(user => user.id === userId) || null;
  }

  async getProductById(productId: string): Promise<Product | null> {
    return this.products.find(product => product.id === productId) || null;
  }

  async updateProductStock(productId: string, quantity: number): Promise<boolean> {
    const product = this.products.find(p => p.id === productId);
    if (!product) return false;

    product.stock -= quantity;
    return true;
  }
}

/**
 * Стратегия расчета стоимости доставки
 */
class ShippingCostCalculatorImpl implements ShippingCostCalculator {
  calculate(weight: number, distance: number, shippingMethod: 'standard' | 'express' | 'overnight'): number {
    const baseCost = 5.0; // Базовая стоимость
    const weightCost = weight * 0.5; // Стоимость за вес
    const distanceCost = distance * 0.01; // Стоимость за расстояние

    let multiplier = 1.0;
    switch (shippingMethod) {
      case 'express':
        multiplier = 1.5;
        break;
      case 'overnight':
        multiplier = 2.0;
        break;
    }

    return (baseCost + weightCost + distanceCost) * multiplier;
  }
}

/**
 * Интерфейс для платежного шлюза
 */
interface PaymentGateway {
  processPayment(request: ProcessPaymentRequest): Promise<{ success: boolean; transactionId: string; message?: string }>;
  refundPayment(orderId: string, amount: number): Promise<{ success: boolean; refundId: string; message?: string }>;
}

/**
 * Реализация платежного шлюза (мок)
 */
class MockPaymentGateway implements PaymentGateway {
  async processPayment(request: ProcessPaymentRequest): Promise<{ success: boolean; transactionId: string; message?: string }> {
    // Имитация обработки платежа
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 95% успешных платежей
    if (Math.random() < 0.95) {
      return {
        success: true,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: 'Платеж успешно обработан'
      };
    } else {
      return {
        success: false,
        transactionId: '',
        message: 'Платеж отклонен банком'
      };
    }
  }

  async refundPayment(orderId: string, amount: number): Promise<{ success: boolean; refundId: string; message?: string }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      refundId: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: 'Возврат средств успешно выполнен'
    };
  }
}

/**
 * Основной сервис для работы с заказами
 */
export class OrderService {
  private orderRepository = new OrderRepository();
  private paymentGateway: PaymentGateway = new MockPaymentGateway();
  private shippingCalculator: ShippingCostCalculator = new ShippingCostCalculatorImpl();

  /**
   * Валидация данных заказа
   */
  validateOrder(orderData: CreateOrderRequest): {
    isValid: boolean;
    errors: ValidationError[];
  } {
    const errors: ValidationError[] = [];

    if (!orderData.userId) {
      errors.push({ field: 'userId', message: 'ID пользователя обязателен' });
    } else {
      // Проверка существования пользователя
      const user = this.orderRepository.getUserById(orderData.userId);
      if (!user) {
        errors.push({ field: 'userId', message: 'Пользователь не найден' });
      }
    }

    errors.push(...OrderValidator.validateOrderItems(orderData.items));
    errors.push(...OrderValidator.validateAddress(orderData.shippingAddress));
    errors.push(...OrderValidator.validateAddress(orderData.billingAddress));
    errors.push(...OrderValidator.validatePaymentMethod(orderData.paymentMethod));

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Создание заказа
   */
  async createOrder(orderData: CreateOrderRequest): Promise<ApiResponse<Order>> {
    const validationResult = this.validateOrder(orderData);
    if (!validationResult.isValid) {
      return {
        success: false,
        error: 'Ошибка валидации',
        data: { validationErrors: validationResult.errors },
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    // Проверка доступности товаров
    const items: OrderItem[] = [];
    let subtotal = 0;
    let totalWeight = 0;

    for (const itemData of orderData.items) {
      const product = await this.orderRepository.getProductById(itemData.productId);
      if (!product) {
        return {
          success: false,
          error: 'Товар не найден',
          data: { productId: itemData.productId },
          timestamp: new Date().toISOString(),
          requestId: uuidv4()
        };
      }

      if (product.stock < itemData.quantity) {
        return {
          success: false,
          error: 'Недостаточно товара на складе',
          data: { 
            product: product.name,
            available: product.stock,
            requested: itemData.quantity
          },
          timestamp: new Date().toISOString(),
          requestId: uuidv4()
        };
      }

      const itemTotal = product.price * itemData.quantity;
      subtotal += itemTotal;
      totalWeight += (product.weight || 0) * itemData.quantity;

      items.push({
        productId: product.id,
        quantity: itemData.quantity,
        price: product.price,
        name: product.name,
        sku: product.sku,
        image: product.images[0]
      });
    }

    // Расчет стоимости доставки
    const shippingCost = this.shippingCalculator.calculate(totalWeight, 100, 'standard'); // 100 км расстояние

    // Расчет налога (20%)
    const tax = subtotal * 0.2;

    // Создание заказа
    const order: Order = {
      id: uuidv4(),
      userId: orderData.userId,
      status: OrderStatusEnum.PENDING,
      paymentStatus: PaymentStatusEnum.PENDING,
      items,
      subtotal,
      tax,
      shipping: shippingCost,
      total: subtotal + tax + shippingCost,
      currency: 'USD',
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
      paymentMethod: {
        type: orderData.paymentMethod.type,
        last4: orderData.paymentMethod.last4,
        brand: orderData.paymentMethod.brand,
        expiryMonth: orderData.paymentMethod.expiryMonth,
        expiryYear: orderData.paymentMethod.expiryYear,
        billingAddress: orderData.billingAddress
      },
      notes: orderData.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Сохранение заказа
    const createdOrder = await this.orderRepository.create(order);

    // Резервирование товаров
    for (const item of items) {
      await this.orderRepository.updateProductStock(item.productId, item.quantity);
    }

    return {
      success: true,
      data: createdOrder,
      message: 'Заказ успешно создан',
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }

  /**
   * Получение заказа по ID
   */
  async getOrderById(orderId: string): Promise<ApiResponse<Order>> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      return {
        success: false,
        error: 'Заказ не найден',
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    return {
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }

  /**
   * Получение заказов пользователя
   */
  async getUserOrders(userId: string, options?: QueryOptions): Promise<PaginatedResponse<Order[]>> {
    const { orders, total } = await this.orderRepository.findAll({
      ...options,
      filter: { ...options?.filter, userId }
    });

    const { page = 1, limit = 10 } = options?.pagination || {};
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      success: true,
      data: orders,
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

  /**
   * Обновление статуса заказа
   */
  async updateOrderStatus(orderId: string, statusUpdate: UpdateOrderStatusRequest): Promise<ApiResponse<Order>> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      return {
        success: false,
        error: 'Заказ не найден',
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    const updatedOrder = await this.orderRepository.update(orderId, {
      status: statusUpdate.status,
      updatedAt: new Date()
    });

    return {
      success: true,
      data: updatedOrder!,
      message: 'Статус заказа обновлен',
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }

  /**
   * Оплата заказа
   */
  async processPayment(orderId: string): Promise<ApiResponse<{ transactionId: string }>> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      return {
        success: false,
        error: 'Заказ не найден',
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    if (order.paymentStatus === PaymentStatusEnum.COMPLETED) {
      return {
        success: false,
        error: 'Заказ уже оплачен',
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    const paymentResult = await this.paymentGateway.processPayment({
      orderId,
      amount: order.total,
      currency: order.currency
    });

    if (!paymentResult.success) {
      await this.orderRepository.update(orderId, {
        paymentStatus: PaymentStatusEnum.FAILED,
        updatedAt: new Date()
      });

      return {
        success: false,
        error: 'Ошибка оплаты',
        message: paymentResult.message,
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    await this.orderRepository.update(orderId, {
      paymentStatus: PaymentStatusEnum.COMPLETED,
      status: OrderStatusEnum.CONFIRMED,
      updatedAt: new Date()
    });

    return {
      success: true,
      data: { transactionId: paymentResult.transactionId },
      message: 'Оплата успешно обработана',
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }

  /**
   * Добавление трекинга
   */
  async addTrackingInfo(orderId: string, trackingData: TrackingUpdateRequest): Promise<ApiResponse<Order>> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      return {
        success: false,
        error: 'Заказ не найден',
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    const trackingInfo: TrackingInfo = {
      carrier: trackingData.carrier,
      trackingNumber: trackingData.trackingNumber,
      status: trackingData.status,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 дней
      updates: [{
        status: trackingData.status,
        location: trackingData.location,
        timestamp: new Date(),
        description: trackingData.description
      }]
    };

    const updatedOrder = await this.orderRepository.update(orderId, {
      trackingInfo,
      status: OrderStatusEnum.SHIPPED,
      updatedAt: new Date()
    });

    return {
      success: true,
      data: updatedOrder!,
      message: 'Информация о трекинге добавлена',
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }

  /**
   * Получение всех заказов с пагинацией
   */
  async getAllOrders(options: QueryOptions): Promise<PaginatedResponse<Order[]>> {
    const { orders, total } = await this.orderRepository.findAll(options);
    const { page = 1, limit = 10 } = options.pagination || {};
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      success: true,
      data: orders,
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