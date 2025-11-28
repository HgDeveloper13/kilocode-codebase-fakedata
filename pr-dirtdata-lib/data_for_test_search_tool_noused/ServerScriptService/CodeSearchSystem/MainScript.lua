--[[
    MainScript - Главный управляющий скрипт для системы индексации и поиска кода.

    Этот скрипт инициализирует и координирует работу всех модулей системы:
    1.  Ожидает загрузки игры.
    2.  Загружает необходимые модули (Indexer, Searcher, DisplayManager).
    3.  Определяет корневые директории для сканирования.
    4.  Запускает процесс индексации кода.
    5.  Выполняет поиск по заданному паттерну.
    6.  Отображает результаты поиска в консоли.
]]

-- Даем игре немного времени на загрузку всех объектов и скриптов
task.wait(3)

print("--- Code Search System: Initializing ---")

-- Получаем доступ к сервисам
local ServerScriptService = game:GetService("ServerScriptService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

-- Загружаем модули
local CodeIndexer = require(ServerScriptService.CodeSearchSystem.Modules.CodeIndexer)
local CodeSearcher = require(ServerScriptService.CodeSearchSystem.Modules.CodeSearcher)
local CodeDisplayManager = require(ServerScriptService.CodeSearchSystem.Modules.CodeDisplayManager)

-- 1. Определяем, где мы будем искать скрипты
local searchRoots = {
    ServerScriptService,
    ReplicatedStorage,
    Workspace
}

-- 2. Определяем, что мы будем искать
local searchPattern = "PINEAPPLE"

-- 3. Запускаем индексацию
print("--> Starting indexing...")
local indexedCode = CodeIndexer.indexScripts(searchRoots)
print("--> Indexing complete.")

-- 4. Выполняем поиск
print("--> Starting search...")
local searchResults = CodeSearcher.search(indexedCode, searchPattern)
print("--> Search complete.")

-- 5. Отображаем результаты
CodeDisplayManager.displayResults(searchResults, searchPattern)

print("--- Code Search System: Finished ---")