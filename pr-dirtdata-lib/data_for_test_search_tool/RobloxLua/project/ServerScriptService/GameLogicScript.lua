---
-- @class GameLogicScript
-- @author Kilo Code
-- @date 2025-11-15
--
-- @description
-- Этот скрипт управляет основной серверной логикой игры.
-- Он обрабатывает вход игроков, игровые взаимодействия и основной игровой цикл.
--

--[=[
	Инструкции:
	1. Получить сервисы ReplicatedStorage и Players.
	2. Подключить модули PlayerDataLoader и EventUtils.
	3. Создать флаг isGameActive.
	4. Объявить RemoteEvent interactionEvent.
	5. Написать функцию handlePlayerJoin.
	6. Написать функцию handleInteraction.
	7. Написать функцию cleanup для отключения событий.
	8. Подключить события PlayerAdded и OnServerEvent.
	9. Создать игровой цикл с task.wait.
]=]

-- 1. Получение сервисов
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

-- 2. Подключение модулей
local PlayerDataLoader = require(ReplicatedStorage.Modules.PlayerDataLoader)
local EventUtils = require(ReplicatedStorage.Modules.EventUtils)

-- 3. Локальные переменные
local isGameActive = true
local connections = {}

-- 4. Объявление RemoteEvent
local interactionEvent = ReplicatedStorage.RemoteEvents.interactionEvent

---
-- Обрабатывает вход нового игрока в игру.
-- Загружает данные игрока и выводит приветственное сообщение.
-- @param player Игрок, который присоединился.
local function handlePlayerJoin(player)
	PlayerDataLoader.loadPlayerData(player)
	print("Добро пожаловать в игру, " .. player.Name .. "!")
end

---
-- Обрабатывает взаимодействия, инициированные клиентом.
-- @param player Игрок, инициировавший взаимодействие.
-- @param data Данные, переданные от клиента.
local function handleInteraction(player, data)
	if data == "ButtonPressed" then
		print(player.Name .. " нажал на кнопку.")
	elseif data == "ItemUsed" then
		print(player.Name .. " использовал предмет.")
	else
		print("Неизвестное взаимодействие от " .. player.Name .. ": " .. tostring(data))
	end
end

---
-- Отключает все активные подключения к событиям.
-- Используется для очистки при завершении работы скрипта.
function cleanup()
	print("Очистка соединений GameLogicScript...")
	for _, connection in ipairs(connections) do
		EventUtils.disconnectEvent(connection)
	end
	isGameActive = false
	print("Очистка завершена.")
end

-- 8. Подключение к событиям
connections["PlayerAdded"] = Players.PlayerAdded:Connect(handlePlayerJoin)
connections["Interaction"] = interactionEvent.OnServerEvent:Connect(handleInteraction)


-- 9. Игровой цикл
task.spawn(function()
	while isGameActive do
		print("Игровой цикл активен...")
		task.wait(5)
	end
end)

-- Обработка завершения работы
game:BindToClose(cleanup)