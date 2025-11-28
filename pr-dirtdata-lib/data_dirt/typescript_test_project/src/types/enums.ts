/**
 * Перечисления для всего приложения
 */

// Роли пользователей
export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  GUEST = 'guest'
}

// Статусы пользователей
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
  BANNED = 'banned'
}

// Статусы заказов
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  FAILED = 'failed'
}

// Статусы оплаты
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

// Категории продуктов
export enum ProductCategory {
  ELECTRONICS = 'electronics',
  CLOTHING = 'clothing',
  BOOKS = 'books',
  HOME = 'home',
  SPORTS = 'sports',
  TOYS = 'toys',
  BEAUTY = 'beauty',
  FOOD = 'food',
  AUTOMOTIVE = 'automotive',
  HEALTH = 'health',
  JEWELERY = 'jewelry',
  SHOES = 'shoes',
  BAGS = 'bags',
  WATCHES = 'watches'
}

// Типы уведомлений
export enum NotificationType {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook'
}

// Приоритеты уведомлений
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Типы событий
export enum EventType {
  // Пользовательские события
  USER_REGISTERED = 'user.registered',
  USER_VERIFIED = 'user.verified',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_PROFILE_UPDATED = 'user.profile_updated',
  USER_PASSWORD_CHANGED = 'user.password_changed',
  
  // События заказов
  ORDER_CREATED = 'order.created',
  ORDER_STATUS_CHANGED = 'order.status_changed',
  ORDER_PAYMENT_COMPLETED = 'order.payment_completed',
  ORDER_SHIPPED = 'order.shipped',
  ORDER_DELIVERED = 'order.delivered',
  ORDER_CANCELLED = 'order.cancelled',
  
  // События продуктов
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  PRODUCT_REVIEW_ADDED = 'product.review_added',
  
  // События корзины
  CART_ITEM_ADDED = 'cart.item_added',
  CART_ITEM_REMOVED = 'cart.item_removed',
  CART_CHECKOUT_STARTED = 'cart.checkout_started'
}

// Типы логов
export enum LogType {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
  TRACE = 'trace'
}

// Типы действий для аудита
export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  EXPORT = 'export',
  IMPORT = 'import'
}

// Статусы задач
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused'
}

// Типы задач
export enum TaskType {
  DATA_PROCESSING = 'data_processing',
  FILE_UPLOAD = 'file_upload',
  EMAIL_SENDING = 'email_sending',
  REPORT_GENERATION = 'report_generation',
  DATA_EXPORT = 'data_export',
  DATA_IMPORT = 'data_import',
  CLEANUP = 'cleanup',
  MIGRATION = 'migration'
}

// Сложность задач
export enum TaskComplexity {
  TRIVIAL = 'trivial',
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  CRITICAL = 'critical'
}

// Типы файлов
export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
  ARCHIVE = 'archive',
  SPREADSHEET = 'spreadsheet',
  PRESENTATION = 'presentation',
  PDF = 'pdf'
}

// Размеры изображений
export enum ImageSize {
  THUMBNAIL = 'thumbnail',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  ORIGINAL = 'original'
}

// Типы ошибок
export enum ErrorType {
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  NOT_FOUND_ERROR = 'not_found_error',
  CONFLICT_ERROR = 'conflict_error',
  SERVER_ERROR = 'server_error',
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout_error'
}

// Статусы интеграций
export enum IntegrationStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  PENDING = 'pending',
  DISABLED = 'disabled'
}

// Типы интеграций
export enum IntegrationType {
  PAYMENT = 'payment',
  SHIPPING = 'shipping',
  EMAIL = 'email',
  SMS = 'sms',
  ANALYTICS = 'analytics',
  CRM = 'crm',
  ERP = 'erp',
  MARKETPLACE = 'marketplace'
}

// Способы оплаты
export enum PaymentMethodType {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  BANK_TRANSFER = 'bank_transfer',
  CASH_ON_DELIVERY = 'cash_on_delivery',
  DIGITAL_WALLET = 'digital_wallet'
}

// Способы доставки
export enum ShippingMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
  PICKUP = 'pickup',
  INTERNATIONAL = 'international'
}

// Статусы доставки
export enum ShippingStatus {
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned',
  CANCELLED = 'cancelled'
}

// Причины возвратов
export enum ReturnReason {
  WRONG_SIZE = 'wrong_size',
  WRONG_COLOR = 'wrong_color',
  DEFECTIVE = 'defective',
  NOT_AS_DESCRIBED = 'not_as_described',
  NO_LONGER_WANTED = 'no_longer_wanted',
  ARRIVED_LATE = 'arrived_late',
  DAMAGED = 'damaged'
}

// Статусы возвратов
export enum ReturnStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING_REFUND = 'processing_refund',
  REFUNDED = 'refunded',
  COMPLETED = 'completed'
}

// Пространство имен для валидации enum значений
export namespace EnumValidators {
  export function isValidUserRole(role: string): role is UserRole {
    return Object.values(UserRole).includes(role as UserRole);
  }

  export function isValidOrderStatus(status: string): status is OrderStatus {
    return Object.values(OrderStatus).includes(status as OrderStatus);
  }

  export function isValidPaymentStatus(status: string): status is PaymentStatus {
    return Object.values(PaymentStatus).includes(status as PaymentStatus);
  }

  export function isValidProductCategory(category: string): category is ProductCategory {
    return Object.values(ProductCategory).includes(category as ProductCategory);
  }

  export function isValidEventType(type: string): type is EventType {
    return Object.values(EventType).includes(type as EventType);
  }

  export function isValidErrorType(type: string): type is ErrorType {
    return Object.values(ErrorType).includes(type as ErrorType);
  }
}