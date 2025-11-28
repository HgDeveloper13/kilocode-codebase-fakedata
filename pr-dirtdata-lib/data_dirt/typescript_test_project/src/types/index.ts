/**
 * Базовые типы для приложения
 */

// Utility Types для работы с объектами
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T];

export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never
}[keyof T];

// Типы для API ответов
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Типы для фильтрации и сортировки
export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: string;
  order: SortOrder;
}

export interface FilterOptions {
  [key: string]: any;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

export interface QueryOptions {
  sort?: SortOptions;
  filter?: FilterOptions;
  pagination?: PaginationOptions;
}

// Типы для валидации
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Типы для аутентификации
export interface AuthToken {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Тип для функций middleware
export type MiddlewareFunction<T = any> = (
  req: T,
  res: any,
  next: (err?: any) => void
) => void;

// Тип для асинхронных функций
export type AsyncFunction<T = any, R = any> = (...args: T[]) => Promise<R>;

// Тип для событий
export interface DomainEvent {
  type: string;
  payload: any;
  timestamp: Date;
  aggregateId: string;
}

// Тип для репозиториев
export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(options?: FilterOptions): Promise<number>;
}

// Тип для сервисов
export interface Service<T> extends Repository<T> {
  validate(entity: T): ValidationResult;
  exists(id: string): Promise<boolean>;
}

// Тип для DTO (Data Transfer Object)
export type DTO<T> = {
  [P in keyof T]: T[P] extends Date ? string : T[P];
};

// Тип для доменных событий
export type EventHandler<T extends DomainEvent> = (event: T) => Promise<void> | void;

// Тип для стратегий
export interface Strategy<T, R> {
  execute(data: T): R;
}

// Тип для фабрик
export interface Factory<T> {
  create(data: Partial<T>): T;
}

// Тип для синглтона
export interface Singleton<T> {
  getInstance(): T;
}