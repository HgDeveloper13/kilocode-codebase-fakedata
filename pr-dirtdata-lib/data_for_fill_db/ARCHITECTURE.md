# Архитектура MCP-сервера

## 1. Обзор

Этот документ описывает архитектуру MCP-сервера (Model Context Protocol), предназначенного для индексации кодовой базы и предоставления контекста для языковых моделей. Сервер анализирует исходный код, разбивает его на смысловые фрагменты (чанки), создает для них векторные представления (embeddings) и сохраняет их в векторной базе данных для последующего быстрого поиска.

## 2. Структура Проекта

```
/mcp-server
|
├── /src
|   ├── /common
|   |   └── types.ts           # Общие типы данных (Chunk, Vector, и т.д.)
|   |
|   ├── /providers
|   |   ├── /embedding
|   |   |   ├── IEmbeddingProvider.ts  # Интерфейс для провайдеров эмбеддингов
|   |   |   └── OllamaEmbeddingProvider.ts # Пример реализации для Ollama
|   |   |
|   |   └── /vector-db
|   |       ├── IVectorDBProvider.ts   # Интерфейс для провайдеров векторных БД
|   |       └── ChromaDBProvider.ts    # Пример реализации для ChromaDB
|   |
|   ├── /services
|   |   ├── /indexer
|   |   |   ├── IIndexerService.ts     # Интерфейс сервиса индексации
|   |   |   └── IndexerService.ts      # Реализация сервиса индексации
|   |   |
|   |   └── /parser
|   |       ├── IParser.ts           # Интерфейс для парсеров кода
|   |       └── TreeSitterParser.ts  # Реализация парсера на основе Tree-sitter
|   |
|   ├── /api
|   |   ├── routes.ts            # Определение API-маршрутов (например, для поиска)
|   |   └── controllers.ts       # Контроллеры для обработки HTTP-запросов
|   |
|   └── main.ts                  # Точка входа в приложение
|
├── /config
|   └── default.json             # Конфигурация по умолчанию
|
├── package.json
└── tsconfig.json
```

### Описание компонентов:

-   **/src/common**: Содержит общие типы и интерфейсы, используемые во всем приложении.
-   **/src/providers**: Абстракции для работы с внешними сервисами.
    -   **/embedding**: Провайдеры для генерации векторных эмбеддингов (например, через Ollama, OpenAI).
    -   **/vector-db**: Провайдеры для взаимодействия с векторными базами данных (ChromaDB, Pinecone).
-   **/src/services**: Основная бизнес-логика.
    -   **/indexer**: Сервис, который оркестрирует процесс индексации: читает файлы, парсит их, генерирует эмбеддинги и сохраняет в БД.
    -   **/parser**: Сервис для синтаксического анализа кода и его разбиения на чанки.
-   **/src/api**: Компоненты, отвечающие за HTTP API сервера (например, для выполнения поиска).
-   **/config**: Файлы конфигурации приложения.
-   **main.ts**: Точка входа, где инициализируются и связываются все компоненты.

## 3. Ключевые Интерфейсы

```typescript
/**
 * Represents a chunk of code with associated metadata.
 */
export interface Chunk {
  id: string;
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
}

/**
 * Represents a vector with its ID and associated metadata.
 */
export interface Vector {
  id: string;
  values: number[];
  metadata: {
    chunkId: string;
    filePath: string;
  };
}

/**
 * Interface for embedding providers.
 */
export interface IEmbeddingProvider {
  /**
   * Creates an embedding vector from a text chunk.
   * @param text The text to create an embedding for.
   * @returns A promise that resolves to the embedding vector (an array of numbers).
   */
  createEmbedding(text: string): Promise<number[]>;
}

/**
 * Interface for vector database providers.
 */
export interface IVectorDBProvider {
  /**
   * Adds multiple vectors to the database.
   * @param vectors An array of vectors to add.
   * @returns A promise that resolves when the operation is complete.
   */
  addVectors(vectors: Vector[]): Promise<void>;

  /**
   * Searches for vectors in the database that are similar to the given vector.
   * @param queryVector The vector to search with.
   * @param topK The number of similar vectors to return.
   * @returns A promise that resolves to an array of similar vectors.
   */
  search(queryVector: number[], topK: number): Promise<Vector[]>;
}

/**
 * Interface for the indexing service.
 */
export interface IIndexerService {
  /**
   * The embedding provider used by the service.
   */
  embeddingProvider: IEmbeddingProvider;

  /**
   * The vector database provider used by the service.
   */
  vectorDBProvider: IVectorDBProvider;

  /**
   * Starts the indexing process for a given directory.
   * @param directoryPath The path to the directory to index.
   * @returns A promise that resolves when the indexing is complete.
   */
  startIndexing(directoryPath: string): Promise<void>;
}
```

## 4. Процесс Индексации

Процесс индексации — это ключевая операция, в ходе которой исходный код преобразуется в векторы и сохраняется для поиска.

### Пошаговое описание:

1.  **Запуск:** Процесс инициируется вызовом метода `startIndexing` у `IIndexerService` с указанием пути к директории проекта.
2.  **Чтение Файлов:** Сервис рекурсивно обходит указанную директорию и находит все файлы с исходным кодом.
3.  **Парсинг и Чанкинг:** Каждый файл передается парсеру (например, `TreeSitterParser`), который разбивает его на осмысленные фрагменты (чанки) — функции, классы, методы.
4.  **Создание Эмбеддингов:** Для каждого чанка `IEmbeddingProvider` генерирует векторное представление (эмбеддинг).
5.  **Сохранение в БД:** Пул векторов, вместе с метаданными (путь к файлу, номер строки), передается в `IVectorDBProvider`, который сохраняет их в векторную базу данных.

### Диаграмма последовательности (Mermaid.js)

```mermaid
sequenceDiagram
    participant User
    participant IndexerService as IIndexerService
    participant Parser as IParser
    participant EmbeddingProvider as IEmbeddingProvider
    participant VectorDBProvider as IVectorDBProvider

    User->>+IndexerService: startIndexing(directoryPath)
    IndexerService->>IndexerService: Чтение файлов из директории
    loop Для каждого файла
        IndexerService->>+Parser: parse(fileContent)
        Parser-->>-IndexerService: chunks[]
    end
    loop Для каждого чанка
        IndexerService->>+EmbeddingProvider: createEmbedding(chunk.content)
        EmbeddingProvider-->>-IndexerService: embeddingVector
    end
    IndexerService->>+VectorDBProvider: addVectors(vectors[])
    VectorDBProvider-->>-IndexerService: acks
    IndexerService-->>-User: Индексация завершена