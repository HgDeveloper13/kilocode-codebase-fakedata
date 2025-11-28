import { v4 as uuidv4 } from 'uuid';
import { 
  UserRole, 
  UserStatus, 
  OrderStatus, 
  PaymentStatus, 
  ProductCategory 
} from '../types/enums';

/**
 * Интерфейсы для моделей данных
 */

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: Date;
  isActive: boolean;
  profile?: UserProfile;
  settings?: UserSettings;
}

export interface UserProfile extends BaseEntity {
  userId: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: Address;
  socialLinks?: SocialLinks;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface SocialLinks {
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
  security: boolean;
}

export interface PrivacySettings {
  profileVisible: boolean;
  emailVisible: boolean;
  phoneVisible: boolean;
  trackingAllowed: boolean;
}

export interface Product extends BaseEntity {
  name: string;
  description: string;
  sku: string;
  category: ProductCategory;
  price: number;
  cost: number;
  stock: number;
  weight?: number;
  dimensions?: Dimensions;
  images: string[];
  specifications: Record<string, any>;
  isActive: boolean;
  tags: string[];
  brand?: string;
  manufacturer?: string;
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in' | 'mm';
}

export interface Order extends BaseEntity {
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  notes?: string;
  trackingInfo?: TrackingInfo;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  sku: string;
  image?: string;
}

export interface PaymentMethod {
  type: 'credit_card' | 'debit_card' | 'paypal' | 'stripe' | 'cash_on_delivery';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  billingAddress?: Address;
}

export interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery?: Date;
  updates: TrackingUpdate[];
}

export interface TrackingUpdate {
  status: string;
  location: string;
  timestamp: Date;
  description?: string;
}

export interface Review extends BaseEntity {
  userId: string;
  productId: string;
  orderId?: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  notHelpful: number;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface Category extends BaseEntity {
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  meta?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
}

export interface Cart extends BaseEntity {
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  subtotal: number;
  currency: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  addedAt: Date;
}

export interface Promotion extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'buy_one_get_one' | 'free_shipping';
  value: number;
  minimumOrderValue?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
  applicableProducts?: string[];
  applicableCategories?: string[];
}

/**
 * Абстрактные классы для моделей
 */

export abstract class BaseModel implements BaseEntity {
  public readonly id: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor() {
    this.id = uuidv4();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public updateTimestamp(): void {
    this.updatedAt = new Date();
  }

  public toJSON(): any {
    return {
      ...this,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }
}

/**
 * Generic модель для сущностей с аудитом
 */
export abstract class AuditableEntity<T extends BaseEntity> extends BaseModel {
  public createdBy?: string;
  public updatedBy?: string;
  public deletedAt?: Date;
  public deletedBy?: string;

  public markAsDeleted(deletedBy?: string): void {
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
  }

  public isDeleted(): boolean {
    return this.deletedAt !== undefined;
  }

  public getAuditInfo(): {
    createdBy?: string;
    updatedBy?: string;
    deletedBy?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
  } {
    return {
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      deletedBy: this.deletedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt
    };
  }
}

// Пространство имен для моделей
export namespace ModelValidators {
  export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  export function generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }
}