# TypeScript Test Project

Это полноценный тестовый проект на TypeScript, демонстрирующий современные практики разработки на Node.js.

## Особенности

- Современный TypeScript 5+ с строгой типизацией
- Express.js сервер с middleware
- Интерфейсы, типы, generics, классы, enums, namespaces
- Асинхронное программирование с async/await
- Обработка ошибок
- Система логирования
- Валидация данных
- JWT аутентификация
- Rate limiting
- Тесты и линтер

## Структура проекта

```
src/
├── app.ts                 # Главный файл приложения
├── config/                # Конфигурационные файлы
├── models/                # Модели данных
├── services/              # Бизнес-логика
├── utils/                 # Утилиты
├── types/                 # Типы TypeScript
├── interfaces/            # Интерфейсы
└── middleware/            # Express middleware
```

## Установка и запуск

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка проекта
npm run build

# Запуск скомпилированного проекта
npm start

# Проверка типов
npm run type-check

# Линтинг
npm run lint
```

## Стек технологий

- TypeScript 5+
- Node.js
- Express.js
- JWT
- bcryptjs
- Winston (логирование)
- ESLint
- Jest (тесты)

## Примеры использования

Проект содержит примеры:
- Работы с generics и utility types
- Создания middleware
- Валидации данных
- Обработки ошибок
- Работы с асинхронными операциями
- Создания интерфейсов и типов
- Использования enums и namespaces
- Архитектурных паттернов