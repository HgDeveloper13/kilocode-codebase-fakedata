---
-- Модуль для выполнения поиска по проиндексированному коду.
-- @module CodeSearcher
--

local CodeSearcher = {}

---
-- Ищет заданный паттерн в таблице проиндексированного кода.
--
-- @param indexedCode { [string]: { Name: string, Source: string } } Таблица с кодом от CodeIndexer.
-- @param pattern string Строка для поиска.
-- @treturn {{ Path: string, Name: string, LineNumber: number, LineContent: string }} Массив с результатами поиска.
--
function CodeSearcher.search(indexedCode, pattern)
    -- Проверка типов
    if typeof(indexedCode) ~= "table" or typeof(pattern) ~= "string" then
        warn("CodeSearcher.search: неверные типы аргументов. Ожидались table и string.")
        return {}
    end

    if string.len(pattern) == 0 then
        warn("CodeSearcher.search: паттерн для поиска не может быть пустым.")
        return {}
    end

    local results = {}
    local lowerPattern = string.lower(pattern)

    -- Итерируемся по всем проиндексированным скриптам
    for path, scriptInfo in pairs(indexedCode) do
        local source = scriptInfo.Source
        local lines = source:split("\n")

        -- Ищем совпадение в каждой строке
        for i, line in ipairs(lines) do
            local lowerLine = string.lower(line)
            
            if string.find(lowerLine, lowerPattern, 1, true) then
                table.insert(results, {
                    Path = path,
                    Name = scriptInfo.Name,
                    LineNumber = i,
                    LineContent = line
                })
            end
        end
    end

    return results
end

return CodeSearcher