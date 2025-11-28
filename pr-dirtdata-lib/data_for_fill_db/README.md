# MCP-сервер для индексации кода Roblox Lua

## Обзор

Этот MCP-сервер предназначен для индексации кодовой базы Roblox Lua. Он извлекает, анализирует и встраивает файлы `.lua`, сохраняя их в векторной базе данных для семантического поиска.

## Установка

Для установки зависимостей выполните следующую команду:

```bash
npm install
```

## Конфигурация

Конфигурация сервера осуществляется через переменные окружения, которые можно определить в файле `.env` в корневой директории проекта.

### Переменные окружения

*   `QDRANT_URL`: URL вашего экземпляра Qdrant.
*   `QDRANT_API_KEY`: (Опционально) Ключ API для Qdrant.
*   `EMBEDDING_PROVIDER`: Провайдер встраивания, который будет использоваться. Доступные значения: `ollama`, `openai`, `onnx`.
*   `OLLAMA_HOST`: (Если `EMBEDDING_PROVIDER` = `ollama`) URL вашего экземпляра Ollama.
*   `OLLAMA_EMBEDDING_MODEL`: (Если `EMBEDDING_PROVIDER` = `ollama`) Модель встраивания для Ollama.
*   `OPENAI_API_BASE`: (Если `EMBEDDING_PROVIDER` = `openai`) Базовый URL для OpenAI-совместимого API.
*   `OPENAI_API_KEY`: (Если `EMBEDDING_PROVIDER` = `openai`) Ключ API для OpenAI-совместимого API.
*   `OPENAI_EMBEDDING_MODEL`: (Если `EMBEDDING_PROVIDER` = `openai`) Модель встраивания для OpenAI.
*   `ONNX_MODEL_PATH`: (Если `EMBEDDING_PROVIDER` = `onnx`) Путь к файлу модели ONNX.
*   `ONNX_TOKENIZER_PATH`: (Если `EMBEDDING_PROVIDER` = `onnx`) Путь к файлу токенизатора.

### Настройка провайдеров

#### Qdrant

Убедитесь, что у вас запущен экземпляр Qdrant и он доступен по указанному `QDRANT_URL`.

#### Ollama

1.  Установите и запустите Ollama.
2.  Укажите `EMBEDDING_PROVIDER=ollama`.
3.  Убедитесь, что `OLLAMA_HOST` указывает на ваш локальный экземпляр Ollama.
4.  Загрузите необходимую модель встраивания, например `nomic-embed-text`.

#### OpenAI

1.  Укажите `EMBEDDING_PROVIDER=openai`.
2.  Задайте `OPENAI_API_BASE` и `OPENAI_API_KEY`.

#### ONNX

1.  Укажите `EMBEDDING_PROVIDER=onnx`.
2.  Убедитесь, что `ONNX_MODEL_PATH` и `ONNX_TOKENIZER_PATH` указывают на правильные файлы.

## Запуск

Для запуска процесса индексации используйте следующую команду:

```bash
npx ts-node src/app/main.ts <путь_к_папке_с_кодом>
```

## Архитектура

Подробное описание архитектуры доступно в файле [ARCHITECTURE.md](ARCHITECTURE.md).