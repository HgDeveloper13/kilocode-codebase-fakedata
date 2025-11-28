# Java Test Project

Это полноценный Java тестовый проект на Spring Boot, созданный для тестирования поиска кода и анализа Java приложений.

## Особенности

- **Современная Java** (Java 11+)
- **Spring Boot 3.2.0** с актуальными зависимостями
- **Spring Security** с JWT аутентификацией
- **Spring Data JPA** для работы с базой данных
- **H2 Database** для хранения данных
- **REST API** с полным набором CRUD операций
- **Валидация** с использованием Bean Validation
- **Lombok** для сокращения boilerplate кода
- **Тесты** с использованием JUnit 5 и Mockito

## Структура проекта

```
src/
├── main/
│   ├── java/com/example/app/
│   │   ├── config/           # Конфигурационные классы
│   │   ├── controller/       # REST контроллеры
│   │   ├── model/
│   │   │   ├── dto/          # Data Transfer Objects
│   │   │   ├── entity/       # JPA сущности
│   │   │   └── enums/        # Перечисления
│   │   ├── repository/       # Spring Data репозитории
│   │   ├── security/         # Классы безопасности
│   │   ├── service/          # Сервисные интерфейсы и реализации
│   │   └── utils/            # Утилиты и вспомогательные классы
│   └── resources/
│       ├── application.properties  # Настройки приложения
│       └── validation/             # Файлы валидации
└── test/
    └── java/com/example/app/       # Тесты
```

## Сущности

Проект содержит следующие основные сущности:

- **User** - пользователь системы с ролями и статусами
- **Post** - посты блога с модерацией и тегами
- **Comment** - комментарии к постам
- **Notification** - уведомления пользователей
- **Tag** - теги для категоризации постов

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - регистрация пользователя
- `POST /api/auth/login` - вход в систему
- `POST /api/auth/logout` - выход из системы
- `POST /api/auth/validate` - проверка валидности токена

### Пользователи
- `GET /api/users` - получение всех пользователей
- `GET /api/users/{id}` - получение пользователя по ID
- `PUT /api/users/{id}` - обновление пользователя
- `DELETE /api/users/{id}` - удаление пользователя

### Посты
- `GET /api/posts` - получение всех опубликованных постов
- `GET /api/posts/{id}` - получение поста по ID
- `GET /api/posts/slug/{slug}` - получение поста по slug
- `POST /api/posts` - создание нового поста
- `PUT /api/posts/{id}` - обновление поста
- `DELETE /api/posts/{id}` - удаление поста
- `POST /api/posts/{id}/publish` - публикация поста

### Комментарии
- `GET /api/posts/{postId}/comments` - получение комментариев к посту
- `POST /api/posts/{postId}/comments` - добавление комментария
- `PUT /api/comments/{id}` - обновление комментария
- `DELETE /api/comments/{id}` - удаление комментария

### Теги
- `GET /api/tags` - получение всех тегов
- `POST /api/tags` - создание тега
- `GET /api/posts/tag/{tagId}` - получение постов по тегу

## Запуск проекта

1. Убедитесь, что у вас установлена Java 11 или выше
2. Клонируйте репозиторий
3. Перейдите в директорию проекта
4. Запустите команду:

```bash
./mvnw spring-boot:run
```

Или с использованием Gradle:

```bash
./gradlew bootRun
```

Приложение будет доступно по адресу: http://localhost:8080

## H2 Database Console

Для доступа к H2 консоли:
- URL: http://localhost:8080/h2-console
- JDBC URL: jdbc:h2:mem:testdb
- Username: sa
- Password: (оставьте пустым)

## Безопасность

Проект использует JWT токены для аутентификации. Для доступа к защищенным endpoint'ам необходимо:
1. Зарегистрироваться или войти в систему
2. Получить JWT токен
3. Добавить токен в заголовок запроса: `Authorization: Bearer <token>`

## Особенности для тестирования поиска кода

Проект содержит различные типы Java кода:
- **Классы**: Entity, DTO, Service, Controller
- **Интерфейсы**: Repository, Service
- **Абстрактные классы**: BaseEntity
- **Enum**: UserStatus, NotificationType, Role
- **Record**: ApiResponse
- **Аннотации**: @Entity, @Table, @RestController и др.
- **Лямбда-выражения**: Stream API
- **Модульные конструкции**: Optional, CompletableFuture
- **Паттерны проектирования**: Repository, Service, DTO

## Тестирование

Для запуска тестов выполните:

```bash
./mvnw test
```

Проект содержит unit-тесты для сервисов с использованием Mockito и JUnit 5.

## Автор

Java Test Project - создан для тестирования поиска и анализа кода.