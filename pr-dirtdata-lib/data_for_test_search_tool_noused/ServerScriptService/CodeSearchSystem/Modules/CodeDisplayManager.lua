---
-- Модуль для отображения результатов поиска в консоли.
-- @module CodeDisplayManager
--

local CodeDisplayManager = {}

---
-- Форматирует и выводит результаты поиска в консоль.
--
-- @param results {{ Path: string, Name: string, LineNumber: number, LineContent: string }} Массив с результатами.
-- @param pattern string Исходный паттерн, который искали.
--
function CodeDisplayManager.displayResults(results, pattern)
    -- Проверка типов
    if typeof(results) ~= "table" or typeof(pattern) ~= "string" then
        warn("CodeDisplayManager.displayResults: неверные типы аргументов. Ожидались table и string.")
        return
    end

    print(`--- Search Results for "{pattern}" ---`)

    if #results == 0 then
        print("--> No results found.")
        return
    end

    print(`--> Found {#results} match(es):`)

    for i, result in ipairs(results) do
        -- Убираем лишние пробелы в начале и конце строки для красивого вывода
        local trimmedLine = string.gsub(result.LineContent, "^%s*(.-)%s*$", "%1")
        
        local output = string.format(
            '  [%d] In "%s" (Line %d): %s',
            i,
            result.Path,
            result.LineNumber,
            trimmedLine
        )
        print(output)
    end
    
    print("--- End of Search Results ---")
end

return CodeDisplayManager