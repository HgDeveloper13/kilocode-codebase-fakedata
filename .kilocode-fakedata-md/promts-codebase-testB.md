# 📄 `promts-codebase-test.md`

> **Memory Bank для embedding-тестирования**  
> Кодовая база: `PlayerProfile.lua` + `InteractionManager.lua`  
> Цель: объективная оценка моделей (`all-minilm:l6-v2`, `bge-m3`, `qwen3-embedding` и др.) в условиях, близких к реальной Roblox-разработке.  
> Формат: markdown + таблицы → легко парсится, интегрируется в CI/ручной тест.

---

## 📋 Общие правила тестирования

- **Индексируется весь текст файла**: имя функции, тело, комментарии, пути.  
- **Поиск — семантический**, без BM25 (если не указано иное).  
- **Оценка по recall@1 и recall@3** (наличие целевой функции в топ-1 / топ-3).  
- **Порог уверенности не применяется** — оцениваем «сырой» embedding-поиск.  
- Все промпты тестируются **на обоих языках** (если не указано `RU-only` / `EN-only`).

---

## 🔍 Промпты и ожидаемые результаты

### 🔹 Уровень 1: Прямые, структурированные запросы (baseline)

| № | Промпт (RU) | Промпт (EN) | Ожидаемая функция | Файл | Строки | Тип |
|---|-------------|-------------|-------------------|------|--------|-----|
| 1 | Найди функцию для загрузки профиля игрока | Find function to load player profile | `PlayerProfile.fetchProfile` | `ReplicatedStorage/Modules/PlayerProfile.lua` | 34–48 | ✅ Прямое имя + коммент |
| 2 | Найди функцию сохранения данных в DataStore | Find function that saves data to DataStore | `PlayerProfile.persistProfile` | `ReplicatedStorage/Modules/PlayerProfile.lua` | 51–68 | ✅ Упоминание DataStore в комменте |
| 3 | Где обрабатывается событие входа игрока? | Where is player join event handled? | `handlePlayerJoin` | `ServerScriptService/InteractionManager.lua` | 39–47 | ✅ `PlayerAdded` + коммент |
| 4 | Какая функция вызывается при касании объекта? | Which function is called on part touch? | `onPartTouched` | `ServerScriptService/InteractionManager.lua` | 80–95 | ✅ Имя функции + `Touched` |

---

### 🔹 Уровень 2: Синонимы и перефразировки (semantic flexibility)

| № | Промпт (RU) | Промпт (EN) | Ожидаемая функция | Файл | Строки | Комментарий |
|---|-------------|-------------|-------------------|------|--------|-------------|
| 5 | Где читается прогресс игрока при старте? | Where is player progress read on startup? | `PlayerProfile.fetchProfile` | `PlayerProfile.lua` | 34–48 | «читается» → `fetch`, «прогресс» → `profile` |
| 6 | Как сохранить монеты после открытия сундука? | How to save coins after opening a chest? | `PlayerProfile.persistProfile` | `PlayerProfile.lua` | 51–68 | Контекст из `handleInteraction` (сундук → coins → save) |
| 7 | Куда отправляются данные при нажатии «E»? | Where are data sent when pressing 'E'? | `handleInteraction` | `InteractionManager.lua` | 52–77 | Косвенно: в комменте — *«реакция на нажатие Е»* |
| 8 | Что происходит при входе в зону восстановления? | What happens when entering heal zone? | `onPartTouched` | `InteractionManager.lua` | 80–95 | Только в комменте: *«вошёл в зону восстановления»* |

---

### 🔹 Уровень 3: Косвенные и контекстные запросы (reasoning)

| № | Промпт (RU) | Промпт (EN) | Ожидаемая функция | Файл | Строки | Почему сложно? |
|---|-------------|-------------|-------------------|------|--------|-----------------|
| 9 | Какой обработчик вызывается через RemoteEvent от клиента? | Which handler is triggered via RemoteEvent from client? | `handleInteraction` | `InteractionManager.lua` | 52–77 | Нужно связать `interactionEvent.OnServerEvent:Connect(handleInteraction)` |
|10 | Как сбросить данные игрока при краше? | How to reset player data on crash? | `PlayerProfile.resetSession` | `PlayerProfile.lua` | 71–76 | Вызывается косвенно: `PlayerRemoving:Connect(resetSession)` |
|11 | Как избежать ошибки при отключении соединения? | How to avoid errors when disconnecting an event? | `EventUtils.disconnectEvent` | *(внешний модуль)* | — | Нет в текущих файлах — проверка **cross-module recall** |
|12 | Как клонировать профиль, чтобы не испортить оригинал? | How to clone profile without mutating original? | `deepClone` | `PlayerProfile.lua` | 26–31 | Локальная функция (не экспортируется), но критична для логики |

---

### 🔹 Уровень 4: Шум, опечатки, жаргон (robustness)

| № | Промпт (RU) | Промпт (EN) | Ожидаемая функция | Файл | Строки | Ловушка |
|---|-------------|-------------|-------------------|------|--------|---------|
|13 | Найди интракшен от клиента | Find client-side interaction | `handleInteraction` | `InteractionManager.lua` | 52–77 | Опечатка *«интракшен»* (в комменте есть!) |
|14 | Где лоадится плейер при заходе? | Where is player loaded on join? | `PlayerProfile.fetchProfile` | `PlayerProfile.lua` | 34–48 | Жаргон: *«лоадится»*, *«плейер»* |
|15 | Как сохранить прогресс без DataStore? | How to save progress without DataStore? | `fakeSaveHandler` | `InteractionManager.lua` | 98–106 | Только в комменте: *«временно сохраняем в кэш (не в DataStore!)»* |
|16 | Что делает функция с префиксом `fake`? | What does function with `fake` prefix do? | `fakeSaveHandler` | `InteractionManager.lua` | 98–106 | Требует понимания соглашений именования |

---

### 🔹 Уровень 5: Ложные совпадения (precision stress-test)

| № | Промпт | Ожидаемая функция | Фальшивая функция (ловушка) | Почему ловушка работает? |
|---|--------|-------------------|----------------------------|--------------------------|
|17 | Сохранение данных игрока | `PlayerProfile.persistProfile` | `fakeSaveHandler` | Оба содержат «save», «player», «data» в комментариях |
|18 | Загрузка профиля | `PlayerProfile.fetchProfile` | `DEFAULT_PROFILE` (константа) | `DEFAULT_PROFILE` содержит `coins`, `level` — high lexical overlap |
|19 | Обработка нажатия клавиши | `handleInteraction` | `onPartTouched` | Оба — «обработчики», оба связаны с действиями игрока |
|20 | Сброс кэша | `PlayerProfile.resetSession` | `fakeSaveHandler` | В `fakeSaveHandler` есть *«временное кэширование»* |

---

## 📊 Формат отчёта по результатам (`report-template.md`)

```markdown
# Embedding Model Test Report  
**Model**: `all-minilm:l6-v2`  
**Dimension**: 384  
**Codebase**: 2 files (PlayerProfile.lua, InteractionManager.lua)  
**DB**: Qdrant (v1.10+), cosine, normalized vectors  
**Hardware**: Intel N100, 16 GB RAM, M.2 SSD  

## 📈 Сводка метрик
| Метрика | Значение |
|---------|----------|
| **recall@1 (L1–L2)** | 1.00 (8/8) |
| **recall@1 (L3–L4)** | 0.60 (6/10) |
| **recall@3 (L5 ловушки)** | 0.75 (3/4) |
| **MRR (Mean Reciprocal Rank)** | 0.88 |
| **Время поиска (avg)** | 12 ms |

## 📋 Детали по уровням

### L1: Прямые запросы — ✅ 100%
| № | Промпт | Найдено? | Позиция | Score |
|---|--------|----------|---------|-------|
| 1 | «загрузка профиля» | ✅ | 1 | 0.85 |
| 2 | «сохранение в DataStore» | ✅ | 1 | 0.82 |
| ... | ... | ... | ... | ... |

### L2: Синонимы — ✅ 100%
| № | Промпт | Найдено? | Позиция | Score | Комментарий |
|---|--------|----------|---------|-------|-------------|
| 5 | «читается прогресс» | ✅ | 1 | 0.68 | Ниже порога, но верно |
| 6 | «сохранить монеты после сундука» | ✅ | 1 | 0.64 | Слабая связь через контекст |

### L3: Косвенные — ⚠️ 60%
| № | Промпт | Найдено? | Топ-1 | Score | Ошибка |
|---|--------|----------|-------|-------|--------|
| 9 | «обработчик через RemoteEvent» | ❌ | `interactionEvent` (сам объект) | 0.59 | Не распознал связь `:Connect(handler)` |
|10 | «сброс при краше» | ✅ | `resetSession` | 0.71 | Удачно |
|11 | «отключить соединение без ошибок» | ❌ | `handleInteraction` | 0.42 | Внешний модуль — не проиндексирован |

### L4: Шум — ⚠️ 50%
| № | Промпт | Найдено? | Топ-1 | Score |
|---|--------|----------|-------|-------|
|13 | «интракшен от клиента» | ✅ | `handleInteraction` | 0.61 |
|14 | «лоадится плейер» | ❌ | `DEFAULT_PROFILE` | 0.53 |
|15 | «сохранить без DataStore» | ✅ | `fakeSaveHandler` | 0.58 |

### L5: Ловушки — ✅ 75% (recall@3)
| № | Промпт | Цель в топ-3? | Топ-3 |  
|---|--------|--------------|--------|
|17 | «сохранение данных» | ✅ | [`persistProfile`, `fakeSaveHandler`, `deepClone`] |
|18 | «загрузка профиля» | ❌ | [`DEFAULT_PROFILE`, `fetchProfile`, `persistProfile`] |

## 🔎 Выводы
- ✅ Отлично справляется с **прямыми и синонимичными** запросами.  
- ⚠️ Слаб в **косвенных связях** (RemoteEvent → handler) и **cross-module** поиске.  
- ⚠️ Уязвим к **лексическому шуму** при score < 0.6.  
- ✅ Устойчив к **опечаткам**, если они есть в индексе («интракшен»).  

## 🛠 Рекомендации
1. Добавить в индекс **имена подключаемых модулей** (`EventUtils`).  
2. Для production — **гибрид: BM25 по `function_name` + embedding rerank**.  
3. Установить **порог `score ≥ 0.6`** для фильтрации ложных срабатываний.
```

---

## 🧪 Как использовать этот memory bank

1. **Вручную**:  
   - Копируйте промпты в интерфейс поиска → сверяйтесь с ожидаемым.  
   - Заполняйте `report-template.md`.

---