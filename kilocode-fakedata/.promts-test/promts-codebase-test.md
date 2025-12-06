@search_code используй только поиск по кодовой базе! Если не найдено, не нужно искать другими способами!!!

# 🧪 Тестирование embedding-моделей: инструкция и промпты  
**Модель для теста**: `qllama/multilingual-e5-small:f16`  
**Инструмент поиска**: `@search_code` (семантический поиск по индексированной кодовой базе)  
**Кодовая база**:  
- `ReplicatedStorage/Modules/PlayerProfile.lua`  
- `ServerScriptService/InteractionManager.lua`

---

## 🔧 Правила выполнения теста

1. **Используй только `@search_code`**  
   - Никакого анализа «по памяти», «по логике», «по здравому смыслу».  
   - Если `@search_code` не вернул результат — ответ: *«Не найдено»*.  
   - **Не интерпретируй**, не домысливай, не улучшай запрос.

2. **Точный запрос = точный промпт**  
   - Копируй промпт **дословно**, без изменений регистра, пунктуации, опечаток.  
   - Пример:  
     - ❌ *«найди функцию загрузки профиля»*  
     - ✅ *«Найди функцию для загрузки профиля игрока»* (как в задании)

3. **Формат ответа на каждый промпт**:  
   ```text
   Промпт: «...»
   Результат @search_code:
   - [ ] Найдено: функция `имя`, файл:строка/не найдено
   - Если найдено указать позицию в выдаче: Позиция в списке результатов #1
   ```

4. **Модель фиксирована**:
   - Не переключайся на другие модели, даже если результат слабый.

---

> ✅ Дальше идут остальные уровни — по такому же принципу:  
> - только промпты,  
> - без ожидаемых ответов в этом блоке,  
> - без анализа,  
> - только «сырой» ввод для `@search_code`.

## 🧪 Условия тестирования

- Поиск — Использовать инструмент @search_code поиск по кодовой базе, если не найдет. То ничего ни делать больше!
- Индексируются: **имена функций, тела, комментарии, пути к файлам**.
- Оценка по:  
  - `recall@1` — целевая функция на 1-м месте,  
  - `recall@3` — целевая функция в топ-3,  
  - `MRR` (Mean Reciprocal Rank) — средний обратный ранг.  
- Все промпты тестируются **на русском и английском**, кроме помеченных.  
- Прогон выполняется на: **Intel N100, 16 ГБ RAM, M.2 SSD**.

---

## 🔍 Промпты и ожидаемые результаты

### 🔹 Уровень 1: Прямые запросы (baseline — должны находиться всеми моделями)

| № | Промпт (RU) | Промпт (EN) | Ожидаемая функция | Файл | Строки |
|---|-------------|-------------|-------------------|------|--------|
| 1 | Найди функцию для загрузки профиля игрока | Find function to load player profile | `PlayerProfile.fetchProfile` | `ReplicatedStorage/Modules/PlayerProfile.lua` | 34–48 |
| 2 | Найди функцию сохранения данных в DataStore | Find function that saves data to DataStore | `PlayerProfile.persistProfile` | `ReplicatedStorage/Modules/PlayerProfile.lua` | 51–68 |
| 3 | Где обрабатывается событие входа игрока? | Where is player join event handled? | `handlePlayerJoin` | `ServerScriptService/InteractionManager.lua` | 39–47 |
| 4 | Какая функция вызывается при касании объекта? | Which function is called on part touch? | `onPartTouched` | `ServerScriptService/InteractionManager.lua` | 80–95 |

---

### 🔹 Уровень 2: Синонимы и перефразировки (проверка семантической гибкости)

| № | Промпт (RU) | Промпт (EN) | Ожидаемая функция | Файл | Строки |
|---|-------------|-------------|-------------------|------|--------|
| 5 | Где читается прогресс игрока при старте? | Where is player progress read on startup? | `PlayerProfile.fetchProfile` | `ReplicatedStorage/Modules/PlayerProfile.lua` | 34–48 |
| 6 | Как сохранить монеты после открытия сундука? | How to save coins after opening a chest? | `PlayerProfile.persistProfile` | `ReplicatedStorage/Modules/PlayerProfile.lua` | 51–68 |
| 7 | Куда отправляются данные при нажатии «E»? | Where are data sent when pressing 'E'? | `handleInteraction` | `ServerScriptService/InteractionManager.lua` | 52–77 |
| 8 | Что происходит при входе в зону восстановления? | What happens when entering heal zone? | `onPartTouched` | `ServerScriptService/InteractionManager.lua` | 80–95 |

---

### 🔹 Уровень 3: Косвенные и контекстные запросы (требуется reasoning)

| № | Промпт (RU) | Промпт (EN) | Ожидаемая функция | Файл | Строки |
|---|-------------|-------------|-------------------|------|--------|
| 9 | Какой обработчик вызывается через RemoteEvent от клиента? | Which handler is triggered via RemoteEvent from client? | `handleInteraction` | `ServerScriptService/InteractionManager.lua` | 52–77 |
|10 | Как сбросить данные игрока при краше? | How to reset player data on crash? | `PlayerProfile.resetSession` | `ReplicatedStorage/Modules/PlayerProfile.lua` | 71–76 |
|11 | Как избежать ошибки при отключении соединения? | How to avoid errors when disconnecting an event? | `EventUtils.disconnectEvent` | *(внешний модуль)* | — |
|12 | Как клонировать профиль, чтобы не испортить оригинал? | How to clone profile without mutating original? | `deepClone` | `ReplicatedStorage/Modules/PlayerProfile.lua` | 26–31 |

> 💡 Примечание: `EventUtils` не входит в индекс — это тест на **ограничения границ индексации**.

---

### 🔹 Уровень 4: Шум, опечатки, жаргон (robustness)

| № | Промпт (RU) | Промпт (EN) | Ожидаемая функция | Файл | Строки |
|---|-------------|-------------|-------------------|------|--------|
|13 | Найди интракшен от клиента | Find client-side interaction | `handleInteraction` | `ServerScriptService/InteractionManager.lua` | 52–77 |
|14 | Где лоадится плейер при заходе? | Where is player loaded on join? | `PlayerProfile.fetchProfile` | `ReplicatedStorage/Modules/PlayerProfile.lua` | 34–48 |
|15 | Как сохранить прогресс без DataStore? | How to save progress without DataStore? | `fakeSaveHandler` | `ServerScriptService/InteractionManager.lua` | 98–106 |
|16 | Что делает функция с префиксом `fake`? | What does function with `fake` prefix do? | `fakeSaveHandler` | `ServerScriptService/InteractionManager.lua` | 98–106 |

> ✅ Опечатка *«интракшен»* и жаргон *«лоадится»*, *«плейер»* — **намеренно внесены в комментарии**, чтобы проверить robustness.

---

### 🔹 Уровень 5: Ложные совпадения (precision stress-test)

| № | Промпт | Ожидаемая функция | Ловушка (часто в топ-1) | Причина ловушки |
|---|--------|-------------------|--------------------------|-----------------|
|17 | Сохранение данных игрока | `PlayerProfile.persistProfile` | `fakeSaveHandler` | Оба: «save», «player», «data» в комментариях |
|18 | Загрузка профиля | `PlayerProfile.fetchProfile` | `DEFAULT_PROFILE` | Константа содержит `coins`, `level`, `xp` — высокий lexical overlap |
|19 | Обработка нажатия клавиши | `handleInteraction` | `onPartTouched` | Оба — «обработчики действий игрока» |
|20 | Сброс кэша | `PlayerProfile.resetSession` | `fakeSaveHandler` | В `fakeSaveHandler`: *«временное кэширование»* |

---

## 📊 Шаблон отчёта по модели

```markdown
# Embedding Model Test Report  
**Model**: `название модели`  
**Dimension**: `N`  
**Index time**: `X.X с` | **RAM usage**: `~X.X ГБ` | **Collection size**: `~X.X МБ`  

## 📈 Сводка метрик
| Метрика | Значение |
|---------|----------|
| **recall@1 (L1–L2)** | `X/X` |
| **recall@1 (L3–L4)** | `X/X` |
| **recall@3 (L5)** | `X/X` |
| **MRR** | `X.XX` |
| **Avg. search time** | `X ms` |

## 📋 Детали по уровням

### L1: Прямые запросы (должны быть 100%)
| № | Промпт | Найдено? | Позиция | Score |
|---|--------|----------|---------|-------|
| 1 | «загрузка профиля» | ✅/❌ | 1/2/… | 0.XXX |

### L2: Синонимы
| № | Промпт | Найдено? | Позиция | Score | Комментарий |
|---|--------|----------|---------|-------|-------------|
| 5 | «читается прогресс» | ✅ | 1 | 0.68 | |

### L3: Косвенные
| № | Промпт | Найдено? | Топ-1 | Score | Ошибка |
|---|--------|----------|-------|-------|--------|
| 9 | «обработчик через RemoteEvent» | ❌ | `interactionEvent` | 0.59 | Не связал `:Connect(handler)` |

### L4: Шум
| № | Промпт | Найдено? | Топ-1 | Score |
|---|--------|----------|-------|-------|
|13 | «интракшен от клиента» | ✅ | `handleInteraction` | 0.61 |

### L5: Ловушки (recall@3)
| № | Промпт | Цель в топ-3? | Топ-3 функции |
|---|--------|--------------|----------------|
|17 | «сохранение данных» | ✅ | `persistProfile`, `fakeSaveHandler`, `deepClone` |

## 🔎 Выводы
- ✅ Сильные стороны: …  
- ⚠️ Слабые места: …  
- 🛠 Рекомендации: …
```