# JavaScript Test Project

Современный тестовый проект на JavaScript с Node.js и Express.js, созданный для демонстрации различных архитектурных паттернов, технологий и лучших практик разработки.

## 🎯 Цель проекта

Этот проект служит комплексным тестовым полигоном для:
- Демонстрации современных JavaScript/Node.js технологий
- Примеров реализации различных архитектурных паттернов
- Тестирования инструментов поиска и анализа кода
- Обучения и демонстрации best practices

## 🏗️ Архитектура проекта

### Технологический стек

- **Runtime**: Node.js 16+
- **Framework**: Express.js 4.x
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Joi
- **Authentication**: JWT, bcryptjs
- **Logging**: Winston
- **Development**: Nodemon, Jest, ESLint

### Архитектурные паттерны

Проект демонстрирует реализацию следующих паттернов:

#### 🏭 Паттерны проектирования
- **Factory** - Создание пользователей с разными ролями (`services/user.js`)
- **Strategy** - Различные стратегии сортировки постов (`services/blog.js`)
- **Decorator** - Добавление функциональности к постам (`services/blog.js`)
- **Composite** - Работа с иерархическими категориями (`services/blog.js`)
- **Observer** - Уведомления о событиях пользователей (`services/user.js`)
- **Command** - Инкапсуляция операций с пользователями (`services/user.js`)

#### 🏛️ Архитектурные слои
- **Models** - Модели данных с валидацией и бизнес-логикой
- **Services** - Сервисный слой с бизнес-логикой
- **Routes** - REST API эндпоинты с middleware
- **Utils** - Вспомогательные функции и утилиты
- **Config** - Конфигурация приложения

## 📁 Структура проекта

```
javascript_test_project/
├── app.js                 # Основной файл приложения
├── config.js             # Конфигурация приложения
├── models.js             # Модели данных
├── utils.js              # Вспомогательные функции
├── package.json          # Зависимости и скрипты
├── routes/               # API роуты
│   ├── index.js         # Главный роутер
│   ├── auth.js          # Роуты аутентификации
│   ├── users.js         # Роуты пользователей
│   ├── posts.js         # Роуты постов блога
│   ├── categories.js    # Роуты категорий
│   ├── search.js        # Роуты поиска
│   └── stats.js         # Роуты статистики
├── services/            # Сервисный слой
│   ├── logger.js        # Сервис логирования
│   ├── auth.js          # Сервис аутентификации
│   ├── user.js          # Сервис пользователей
│   └── blog.js          # Сервис блога
└── README.md            # Документация проекта
```

## 🚀 Быстрый старт

### Установка зависимостей

```bash
npm install
```

### Настройка окружения

Создайте файл `.env` в корне проекта:

```env
# Основные настройки
NODE_ENV=development
PORT=3000

# Безопасность
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret
BCRYPT_ROUNDS=12

# База данных
DATABASE_URL=mongodb://localhost:27017/javascript_test_project

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Логирование
LOG_LEVEL=debug
```

### Запуск приложения

```bash
# Разработка с перезагрузкой
npm run dev

# Продакшн
npm start

# Запуск тестов
npm test

# Линтинг
npm run lint
```

## 🔐 Аутентификация и авторизация

### JWT токены

Проект использует JWT для аутентификации с поддержкой:
- Access токены (24 часа)
- Refresh токены (7 дней)
- Автоматическое обновление токенов

### Роли пользователей

- **user** - Обычный пользователь
- **author** - Автор постов
- **moderator** - Модератор контента
- **admin** - Администратор системы

### Примеры API запросов

```bash
# Регистрация
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "username": "testuser",
    "firstName": "Иван",
    "lastName": "Петров"
  }'

# Вход
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

## 📊 API Эндпоинты

### Аутентификация
- `POST /api/v1/auth/register` - Регистрация
- `POST /api/v1/auth/login` - Вход
- `POST /api/v1/auth/refresh` - Обновление токена
- `POST /api/v1/auth/logout` - Выход
- `GET /api/v1/auth/me` - Информация о пользователе

### Пользователи
- `GET /api/v1/users` - Список пользователей (с фильтрацией)
- `GET /api/v1/users/:id` - Получение пользователя
- `POST /api/v1/users` - Создание пользователя (admin)
- `PUT /api/v1/users/:id` - Обновление пользователя
- `DELETE /api/v1/users/:id` - Удаление пользователя (admin)

### Посты блога
- `GET /api/v1/posts` - Список постов (с пагинацией и фильтрацией)
- `GET /api/v1/posts/popular` - Популярные посты
- `GET /api/v1/posts/:id` - Получение поста
- `POST /api/v1/posts` - Создание поста
- `PUT /api/v1/posts/:id` - Обновление поста
- `DELETE /api/v1/posts/:id` - Удаление поста
- `POST /api/v1/posts/:id/like` - Переключение лайка
- `POST /api/v1/posts/:id/comment` - Добавление комментария

### Категории
- `GET /api/v1/categories` - Список категорий
- `GET /api/v1/categories/tree` - Дерево категорий
- `POST /api/v1/categories` - Создание категории
- `PUT /api/v1/categories/:id` - Обновление категории
- `DELETE /api/v1/categories/:id` - Удаление категории

### Поиск
- `GET /api/v1/search/posts` - Поиск постов
- `GET /api/v1/search/users` - Поиск пользователей

### Статистика
- `GET /api/v1/stats/overview` - Общая статистика
- `GET /api/v1/stats/users` - Статистика пользователей
- `GET /api/v1/stats/posts` - Статистика постов
- `GET /api/v1/stats/analytics` - Детальная аналитика

## 💡 Особенности реализации

### Модели данных

```javascript
// Пример модели пользователя
class User extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.username = data.username;
    this.email = data.email;
    this.password = data.password; // Хешированный
    this.role = data.role || 'user';
    // ... другие поля
  }

  // Методы модели
  hasRole(role) {
    return this.role === role || this.role === 'admin';
  }

  canPerform(action) {
    // Логика проверки разрешений
  }
}
```

### Сервисы

```javascript
// Пример сервиса с паттернами
class UserService {
  constructor() {
    this.observer = new UserObserver();
    this.commandProcessor = new UserCommand(this);
  }

  // Использование паттерна Command
  async updateUser(userId, updates) {
    return await this.commandProcessor.execute('update', { userId, updates });
  }
}
```

### Валидация

```javascript
// Схемы Joi для валидации
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
});
```

### Асинхронность

```javascript
// Примеры работы с async/await, промисами
class AsyncUtils {
  static async retry(fn, maxAttempts = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        await this.delay(baseDelay * Math.pow(2, attempt - 1));
      }
    }
  }
}
```

## 🔒 Безопасность

### Реализованные меры безопасности

- **helmet** - Безопасные HTTP заголовки
- **CORS** - Настройка междоменных запросов
- **Rate Limiting** - Ограничение количества запросов
- **bcrypt** - Хеширование паролей
- **JWT** - Безопасная аутентификация
- **Валидация входных данных** - Joi схемы
- **Логирование безопасности** - Winston с уровнями

## 📝 Логирование

Проект использует Winston для структурированного логирования:

```javascript
logger.info('User action performed', {
  userId: user.id,
  action: 'login',
  ip: req.ip,
  timestamp: new Date().toISOString()
});
```

### Уровни логирования
- **debug** - Отладочная информация
- **info** - Общая информация
- **warn** - Предупреждения
- **error** - Ошибки

## 🧪 Тестирование

```bash
# Запуск тестов
npm test

# Запуск с покрытием
npm run test:coverage

# Запуск конкретного теста
npm test -- --grep "authentication"
```

## 🔧 Конфигурация

### Настройки окружений

- **development** - Подробные ошибки, консольное логирование
- **production** - Минимизированные ошибки, файловое логирование
- **test** - Изолированная среда для тестов

## 📈 Мониторинг и метрики

### Health Check

```bash
curl http://localhost:3000/health
```

### Статистика API

- `/api/v1/stats/overview` - Общая статистика
- `/api/v1/stats/users` - Статистика пользователей
- `/api/v1/stats/posts` - Статистика постов
- `/api/v1/stats/analytics` - Детальная аналитика

## 🎯 Примеры использования для тестирования поиска

### Сложные запросы

```javascript
// Поиск функций с async/await
codebase_search("async authentication user login")

// Поиск паттернов проектирования
codebase_search("factory pattern user creation")

// Поиск middleware и обработки ошибок
codebase_search("express middleware error handling")

// Поиск валидации данных
codebase_search("joi validation schema")

// Поиск архитектурных слоев
codebase_search("service layer business logic")
```

### Поиск по архитектурным компонентам

```javascript
// Модели данных
codebase_search("class BaseModel constructor validation")

// Сервисы
codebase_search("async retry pattern exponential backoff")

// Роуты
codebase_search("express rate limiting authentication")

// Утилиты
codebase_search("jwt token generation verification")
```

---

**Версия проекта**: 1.0.0  
**Последнее обновление**: 2025-11-26  
**Совместимость**: Node.js 16+