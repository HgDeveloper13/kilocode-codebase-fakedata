import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { 
  User, 
  UserProfile, 
  UserSettings, 
  UserRole, 
  UserStatus 
} from '../models';
import { 
  ApiResponse, 
  ValidationResult, 
  AuthToken, 
  ValidationError 
} from '../types';
import { UserRole as UserRoleEnum, UserStatus as UserStatusEnum } from '../types/enums';

/**
 * Интерфейсы для сервиса
 */
export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date;
  bio?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
  refreshToken?: string;
}

/**
 * Класс для валидации пользовательских данных
 */
class UserValidator {
  static validateEmail(email: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!email) {
      errors.push({ field: 'email', message: 'Email обязателен' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ field: 'email', message: 'Неверный формат email' });
    }
    
    return errors;
  }

  static validatePassword(password: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!password) {
      errors.push({ field: 'password', message: 'Пароль обязателен' });
    } else {
      if (password.length < 8) {
        errors.push({ field: 'password', message: 'Пароль должен быть не менее 8 символов' });
      }
      if (!/(?=.*[a-z])/.test(password)) {
        errors.push({ field: 'password', message: 'Пароль должен содержать хотя бы одну строчную букву' });
      }
      if (!/(?=.*[A-Z])/.test(password)) {
        errors.push({ field: 'password', message: 'Пароль должен содержать хотя бы одну заглавную букву' });
      }
      if (!/(?=.*\d)/.test(password)) {
        errors.push({ field: 'password', message: 'Пароль должен содержать хотя бы одну цифру' });
      }
    }
    
    return errors;
  }

  static validateUserData(userData: CreateUserRequest): ValidationError[] {
    const errors: ValidationError[] = [];
    
    errors.push(...this.validateEmail(userData.email));
    errors.push(...this.validatePassword(userData.password));
    
    if (!userData.firstName || userData.firstName.trim().length < 2) {
      errors.push({ field: 'firstName', message: 'Имя должно быть не менее 2 символов' });
    }
    
    if (!userData.lastName || userData.lastName.trim().length < 2) {
      errors.push({ field: 'lastName', message: 'Фамилия должна быть не менее 2 символов' });
    }
    
    if (userData.phone && !/^\+?[\d\s\-\(\)]{10,}$/.test(userData.phone)) {
      errors.push({ field: 'phone', message: 'Неверный формат телефона' });
    }
    
    return errors;
  }
}

/**
 * Репозиторий для пользователей (в реальном проекте работал бы с БД)
 */
class UserRepository {
  private users: User[] = [];
  private profiles: UserProfile[] = [];

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async create(user: User): Promise<User> {
    this.users.push(user);
    return user;
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    return this.users[userIndex];
  }

  async createProfile(profile: UserProfile): Promise<UserProfile> {
    this.profiles.push(profile);
    return profile;
  }

  async findProfileByUserId(userId: string): Promise<UserProfile | null> {
    return this.profiles.find(profile => profile.userId === userId) || null;
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const profileIndex = this.profiles.findIndex(profile => profile.userId === userId);
    if (profileIndex === -1) return null;
    
    this.profiles[profileIndex] = { ...this.profiles[profileIndex], ...updates };
    return this.profiles[profileIndex];
  }
}

/**
 * Основной сервис для работы с пользователями
 */
export class UserService {
  private userRepository = new UserRepository();
  private jwtSecret = process.env.JWT_SECRET || 'default-secret';
  private jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

  /**
   * Валидация данных пользователя
   */
  validateUser(userData: CreateUserRequest): ValidationResult {
    const errors = UserValidator.validateUserData(userData);
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Создание нового пользователя
   */
  async createUser(userData: CreateUserRequest): Promise<ApiResponse<AuthResponse>> {
    // Валидация данных
    const validationResult = this.validateUser(userData);
    if (!validationResult.isValid) {
      return {
        success: false,
        error: 'Ошибка валидации',
        message: 'Проверьте правильность заполнения формы',
        data: { validationErrors: validationResult.errors },
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    // Проверка существования пользователя
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      return {
        success: false,
        error: 'Пользователь уже существует',
        message: 'Пользователь с таким email уже зарегистрирован',
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    // Хеширование пароля
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Создание пользователя
    const user: User = {
      id: uuidv4(),
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: UserRoleEnum.USER,
      status: UserStatusEnum.PENDING_VERIFICATION,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Сохранение пользователя
    await this.userRepository.create(user);

    // Создание профиля
    if (userData.phone || userData.dateOfBirth) {
      const profile: UserProfile = {
        id: uuidv4(),
        userId: user.id,
        phone: userData.phone,
        dateOfBirth: userData.dateOfBirth,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await this.userRepository.createProfile(profile);
    }

    // Генерация JWT токена
    const token = this.generateToken(user);
    
    const userResponse = { ...user };
    delete userResponse.password;

    return {
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: 'Пользователь успешно зарегистрирован',
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }

  /**
   * Аутентификация пользователя
   */
  async loginUser(loginData: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    // Валидация данных
    const emailErrors = UserValidator.validateEmail(loginData.email);
    const passwordErrors = UserValidator.validatePassword(loginData.password);
    
    if (emailErrors.length > 0 || passwordErrors.length > 0) {
      return {
        success: false,
        error: 'Ошибка валидации',
        message: 'Проверьте правильность email и пароля',
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    // Поиск пользователя
    const user = await this.userRepository.findByEmail(loginData.email);
    if (!user) {
      return {
        success: false,
        error: 'Неверные учетные данные',
        message: 'Пользователь с таким email не найден',
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Неверные учетные данные',
        message: 'Неверный пароль',
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    // Обновление времени последнего входа
    await this.userRepository.update(user.id, { lastLogin: new Date() });

    // Генерация токена
    const token = this.generateToken(user);
    
    const userResponse = { ...user };
    delete userResponse.password;

    return {
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: 'Успешный вход в систему',
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }

  /**
   * Получение пользователя по ID
   */
  async getUserById(userId: string): Promise<ApiResponse<Omit<User, 'password'>>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'Пользователь не найден',
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    const userResponse = { ...user };
    delete userResponse.password;

    return {
      success: true,
      data: userResponse,
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }

  /**
   * Обновление пользователя
   */
  async updateUser(userId: string, updates: UpdateUserRequest): Promise<ApiResponse<Omit<User, 'password'>>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'Пользователь не найден',
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      };
    }

    // Обновление пользователя
    const updatedUser = await this.userRepository.update(userId, {
      ...updates,
      updatedAt: new Date()
    });

    // Обновление профиля
    if (updates.phone || updates.dateOfBirth || updates.bio) {
      const existingProfile = await this.userRepository.findProfileByUserId(userId);
      
      if (existingProfile) {
        await this.userRepository.updateProfile(userId, {
          ...updates,
          updatedAt: new Date()
        });
      } else {
        const profile: UserProfile = {
          id: uuidv4(),
          userId,
          phone: updates.phone,
          dateOfBirth: updates.dateOfBirth,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await this.userRepository.createProfile(profile);
      }
    }

    const userResponse = { ...updatedUser! };
    delete userResponse.password;

    return {
      success: true,
      data: userResponse,
      message: 'Профиль успешно обновлен',
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }

  /**
   * Генерация JWT токена
   */
  private generateToken(user: User): string {
    const payload: AuthToken = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Math.round(new Date().getTime() / 1000)),
      exp: Math.floor(Math.round(new Date().getTime() / 1000) + (7 * 24 * 60 * 60)) // 7 дней
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
  }

  /**
   * Валидация JWT токена
   */
  validateToken(token: string): AuthToken | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as AuthToken;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Получение профиля пользователя
   */
  async getUserProfile(userId: string): Promise<ApiResponse<UserProfile | null>> {
    const profile = await this.userRepository.findProfileByUserId(userId);
    
    return {
      success: true,
      data: profile,
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }
}