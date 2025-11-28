/**
 * Файл настройки тестового окружения
 */

import { config } from 'dotenv';

// Загрузка переменных окружения для тестов
config({ path: '.env.test' });

// Глобальные настройки для тестов
global.console = {
  ...console,
  // Отключаем логи в тестах (можно включить для отладки)
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Мокаем внешние зависимости
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    json: jest.fn(),
    printf: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

// Глобальные моки
beforeEach(() => {
  jest.clearAllMocks();
});

// Тестовые утилиты
export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  ip: '127.0.0.1',
  get: jest.fn(),
  ...overrides,
});

export const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
  return res;
};

export const createMockNext = () => jest.fn();

// Тестовые данные
export const testUserData = {
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'user' as const,
  status: 'active' as const,
  isActive: true,
  password: '$2a$12$hashed_password_here',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const testProductData = {
  id: 'test-product-id',
  name: 'Test Product',
  description: 'Test product description',
  sku: 'TEST-PRODUCT-001',
  category: 'electronics' as const,
  price: 99.99,
  cost: 70.00,
  stock: 50,
  images: ['https://example.com/test-product.jpg'],
  tags: ['test', 'product'],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const testOrderData = {
  id: 'test-order-id',
  userId: testUserData.id,
  status: 'pending' as const,
  paymentStatus: 'pending' as const,
  items: [
    {
      productId: testProductData.id,
      quantity: 2,
      price: testProductData.price,
      name: testProductData.name,
      sku: testProductData.sku,
    },
  ],
  subtotal: 199.98,
  tax: 39.99,
  shipping: 10.00,
  total: 249.97,
  currency: 'USD',
  shippingAddress: {
    street: '123 Test St',
    city: 'Test City',
    postalCode: '12345',
    country: 'US',
  },
  billingAddress: {
    street: '123 Test St',
    city: 'Test City',
    postalCode: '12345',
    country: 'US',
  },
  paymentMethod: {
    type: 'credit_card' as const,
    last4: '1234',
    brand: 'Visa',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Функции для создания моков
export const createMockUser = (overrides = {}) => ({
  ...testUserData,
  ...overrides,
});

export const createMockProduct = (overrides = {}) => ({
  ...testProductData,
  ...overrides,
});

export const createMockOrder = (overrides = {}) => ({
  ...testOrderData,
  ...overrides,
});

// Тестовый хелпер для ожидания
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Тестовый хелпер для генерации UUID
export const generateTestId = () => `test-id-${Math.random().toString(36).substr(2, 9)}`;

// Расширенные Jest матчеры
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },
  
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },
  
  toBeValidDate(received: any) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    
    if (pass) {
      return {
        message: () => `expected value not to be a valid date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected value to be a valid date`,
        pass: false,
      };
    }
  },
});

// Типы для расширенных матчеров
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidEmail(): R;
      toBeValidDate(): R;
    }
  }
}

// Экспорт всего для использования в тестах
export default {
  createMockRequest,
  createMockResponse,
  createMockNext,
  testUserData,
  testProductData,
  testOrderData,
  createMockUser,
  createMockProduct,
  createMockOrder,
  waitFor,
  generateTestId,
};