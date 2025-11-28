---
-- Модуль для индексации исходного кода скриптов в проекте.
-- @module CodeIndexer
--

local CodeIndexer = {}

---
-- Рекурсивно сканирует указанные корневые инстансы, находя все Script и ModuleScript,
-- и возвращает их содержимое в виде структурированной таблицы.
--
-- @param roots {Instance} Таблица инстансов для начала сканирования.
-- @treturn { [string]: { Name: string, Source: string } } Словарь, где ключ - полный путь к скрипту,
-- а значение - таблица с именем и исходным кодом.
--
function CodeIndexer.indexScripts(roots)
    -- Проверка типов для аргумента roots
    if typeof(roots) ~= "table" then
        warn("CodeIndexer.indexScripts ожидал таблицу, получил " .. typeof(roots))
        return {}
    end

    local indexedCode = {}

    -- Внутренняя рекурсивная функция для обхода инстансов
    local function traverse(instance)
        -- Проверяем, является ли инстанс скриптом, который можно прочитать
        if instance:IsA("Script") or instance:IsA("ModuleScript") then
            -- Свойство .Source защищено, поэтому используем pcall для безопасности
            local success, source = pcall(function()
                return instance.Source
            end)

            if success and typeof(source) == "string" then
                local path = instance:GetFullName()
                indexedCode[path] = {
                    Name = instance.Name,
                    Source = source
                }
            else
                warn("Не удалось прочитать .Source для " .. instance:GetFullName())
            end
        end

        -- Рекурсивно обходим всех потомков
        for _, child in ipairs(instance:GetChildren()) do
            traverse(child)
        end
    end

    -- Запускаем обход для каждого корневого элемента
    for _, root in ipairs(roots) do
        if typeof(root) == "Instance" then
            traverse(root)
        else
            warn("Элемент в таблице roots не является Instance: " .. tostring(root))
        end
    end

    return indexedCode
end

return CodeIndexer