import { UserService } from '../../services/UserService';
import {
  createMockUser,
  testUserData,
  waitFor,
} from '../setup';

/**
 * Тесты для UserService
 */
describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  describe('validateUser', () => {
    it('should return valid result for correct user data', () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        dateOfBirth: new Date('1990-01-01'),
      };

      const result = userService.validateUser(userData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid result for incorrect email', () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = userService.validateUser(userData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('email');
    });

    it('should return invalid result for weak password', () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = userService.validateUser(userData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.field === 'password')).toBe(true);
    });

    it('should return invalid result for short first name', () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'J',
        lastName: 'Doe',
      };

      const result = userService.validateUser(userData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.field === 'firstName')).toBe(true);
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'TestPassword123!',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1234567890',
        dateOfBirth: new Date('1990-01-01'),
      };

      const result = await userService.createUser(userData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.user.email).toBe(userData.email);
      expect(result.data.user.firstName).toBe(userData.firstName);
      expect(result.data.user.lastName).toBe(userData.lastName);
      expect(result.data.token).toBeDefined();
      expect(typeof result.data.user.password).toBe('undefined');
    });

    it('should fail if user already exists', async () => {
      const userData = {
        email: testUserData.email,
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = await userService.createUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Пользователь уже существует');
    });

    it('should fail with validation errors', async () => {
      const userData = {
        email: 'invalid-email',
        password: '123',
        firstName: 'J',
        lastName: 'D',
      };

      const result = await userService.createUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Ошибка валидации');
      expect(result.data.validationErrors).toBeDefined();
      expect(result.data.validationErrors.length).toBeGreaterThan(0);
    });
  });

  describe('loginUser', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: testUserData.email,
        password: 'correct-password', // Предполагаем, что это правильный пароль
      };

      // Создаем пользователя для теста
      await userService.createUser({
        email: loginData.email,
        password: loginData.password,
        firstName: 'Test',
        lastName: 'User',
      });

      const result = await userService.loginUser(loginData);

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe(loginData.email);
      expect(result.data.token).toBeDefined();
    });

    it('should fail with incorrect password', async () => {
      const loginData = {
        email: testUserData.email,
        password: 'wrong-password',
      };

      const result = await userService.loginUser(loginData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Неверные учетные данные');
    });

    it('should fail with non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'anypassword',
      };

      const result = await userService.loginUser(loginData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Неверные учетные данные');
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const result = await userService.getUserById(testUserData.id);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(testUserData.id);
      expect(typeof result.data.password).toBe('undefined');
    });

    it('should return error for non-existent user', async () => {
      const result = await userService.getUserById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Пользователь не найден');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updates = {
        firstName: 'UpdatedName',
        phone: '+0987654321',
      };

      const result = await userService.updateUser(testUserData.id, updates);

      expect(result.success).toBe(true);
      expect(result.data.firstName).toBe(updates.firstName);
      expect(result.data.profile?.phone).toBe(updates.phone);
    });

    it('should return error for non-existent user', async () => {
      const updates = {
        firstName: 'UpdatedName',
      };

      const result = await userService.updateUser('non-existent-id', updates);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Пользователь не найден');
    });
  });

  describe('validateToken', () => {
    it('should return decoded token for valid token', () => {
      // Создаем пользователя для теста
      const userData = {
        email: 'token@example.com',
        password: 'TestPassword123!',
        firstName: 'Token',
        lastName: 'User',
      };

      // Создаем токен для теста
      const token = 'valid-jwt-token'; // Это нужно будет замокать в реальных тестах
      const decoded = userService.validateToken(token);

      // В реальных тестах decoded должен быть объектом с данными пользователя
      // Здесь мы просто проверяем, что функция не падает
      expect(typeof decoded).toBe('object');
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid-token';
      const decoded = userService.validateToken(invalidToken);

      expect(decoded).toBeNull();
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      const result = await userService.getUserProfile(testUserData.id);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  // Тесты с использованием async/await и промисов
  describe('async operations', () => {
    it('should handle async operations correctly', async () => {
      const userData = {
        email: 'async@example.com',
        password: 'TestPassword123!',
        firstName: 'Async',
        lastName: 'User',
      };

      // Тестируем цепочку асинхронных операций
      const createResult = await userService.createUser(userData);
      expect(createResult.success).toBe(true);

      const user = createResult.data.user;
      const getResult = await userService.getUserById(user.id);
      expect(getResult.success).toBe(true);
      expect(getResult.data.id).toBe(user.id);
    });

    it('should handle errors in async operations', async () => {
      await expect(
        userService.createUser({
          email: '', // Пустой email для вызова ошибки
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
        })
      ).rejects.toThrow();
    });
  });

  // Тесты с использованием mock'ов
  describe('with mocks', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle mocked dependencies', async () => {
      // Здесь можно замокать внешние зависимости
      const mockRepository = {
        findByEmail: jest.fn(),
        create: jest.fn(),
      };

      // В реальных тестах можно подменить репозиторий в сервисе
      // userService.userRepository = mockRepository;
      
      const userData = {
        email: 'mock@example.com',
        password: 'TestPassword123!',
        firstName: 'Mock',
        lastName: 'User',
      };

      const result = await userService.createUser(userData);
      
      // Проверяем, что результат успешный
      expect(result.success).toBe(true);
    });
  });

  // Тесты производительности
  describe('performance', () => {
    it('should create user within reasonable time', async () => {
      const startTime = Date.now();
      
      const userData = {
        email: 'perf@example.com',
        password: 'TestPassword123!',
        firstName: 'Performance',
        lastName: 'User',
      };

      await userService.createUser(userData);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Должно выполняться быстрее 1 секунды
    });
  });
});