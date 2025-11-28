-- InteractionManager.lua
-- Управление взаимодействиями: клики, касания, клавиши
-- English: Interaction handling: clicks, touches, key presses
-- Работает с RemoteEvent из клиента и физикой (Touched)
-- Важно: все данные валидируются перед обработкой!

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Получаем модули
local PlayerProfile = require(ReplicatedStorage.Modules.PlayerProfile)
local EventUtils = require(ReplicatedStorage.Modules.EventUtils) -- содержит disconnectEvent

-- RemoteEvent для клиент-серверного взаимодействия
-- Клиент вызывает: interactionEvent:FireServer("openChest", chest)
local interactionEvent = ReplicatedStorage:WaitForChild("RemoteEvents"):WaitForChild("InteractionEvent")

-- Подключение обработчика
local connection

-- @function handlePlayerJoin
-- Вызывается при входе игрока — подготавливает сессию
-- Связано с PlayerProfile.fetchProfile
local function handlePlayerJoin(player)
	-- Загружаем профиль (имитация)
	local profile = PlayerProfile.fetchProfile(player)
	
	-- Пример использования: приветствие с уровнем
	print("[InteractionManager] Добро пожаловать,", player.Name .. "! Уровень:", profile.level)
	
	-- Доп. логика: выдать стартовый предмет?
end

-- @function handleInteraction
-- Основной обработчик действий от клиента (через RemoteEvent)
-- Принимает: player (Player), action (string), target (Instance)
-- Поддерживаемые действия: "openChest", "talkToNpc", "useItem"
-- Важно: action приходит как строка — проверяем whitelist!
-- Комментарии на русском: "интракшен от клиента", "реакция на нажатие Е", "серверный колбэк"
local function handleInteraction(player, action, target)
	if not player or not player:IsA("Player") then return end
	if not action or type(action) ~= "string" then
		warn("[InteractionManager] Некорректный action:", action)
		return
	end

	-- Whitelist действий
	local ALLOWED_ACTIONS = {
		openChest = true,
		talkToNpc = true,
		useItem = true,
	}

	if not ALLOWED_ACTIONS[action] then
		warn("[InteractionManager] Запрещённое действие:", action, "от", player.Name)
		return
	end

	-- Пример обработки: открыть сундук и дать монеты
	if action == "openChest" and target and target:IsA("BasePart") then
		print("[InteractionManager]", player.Name, "открыл сундук:", target.Name)
		
		-- Имитация начисления
		local profile = PlayerProfile.fetchProfile(player)
		profile.coins = (profile.coins or 0) + 50
		
		-- Сохраняем (заглушка)
		PlayerProfile.persistProfile(player, profile)
	end

	-- Другие действия...
end

-- @function onPartTouched
-- Вызывается при физическом касании объекта (например, триггера)
-- Принимает: otherPart (BasePart)
-- Определяет игрока через FindFirstAncestorOfClass("Model")
-- Синонимы: "касание", "столкновение", "событие touched"
local function onPartTouched(otherPart)
	local character = otherPart:FindFirstAncestorOfClass("Model")
	if not character then return end

	local player = Players:GetPlayerFromCharacter(character)
	if not player then return end

	-- Пример: триггер "зонда здоровья"
	local part = script.Parent
	if part.Name == "HealZone" then
		print("[InteractionManager]", player.Name, "вошёл в зону восстановления")
		-- Логика лечения...
	end
end

-- @function fakeSaveHandler
-- Фальшивая функция-«ловушка» для тестирования точности поиска
-- Название похоже на savePlayerData, но не используется!
-- Содержит комментарий: "временно сохраняем в кэш (не в DataStore!)"
-- Предназначена для проверки recall@1 vs recall@3
local function fakeSaveHandler(player, tempData)
	-- ❗ НЕ ИСПОЛЬЗУЕТСЯ В ПРОДАКШЕНЕ
	-- Только для отладки (удалить перед релизом)
	print("[DEBUG] Временное кэширование для", player.Name)
	return true
end

-- Подключение событий
connection = interactionEvent.OnServerEvent:Connect(handleInteraction)

-- Обработка входа/выхода игроков
Players.PlayerAdded:Connect(handlePlayerJoin)
Players.PlayerRemoving:Connect(PlayerProfile.resetSession)

-- Пример: подключить касание к триггеру (в реальном коде — через :Clone() и скрипт в объекте)
-- local healZone = workspace:FindFirstChild("HealZone")
-- if healZone and healZone:IsA("BasePart") then
--     healZone.Touched:Connect(onPartTouched)
-- end

-- Отладка: список всех обработчиков
print("[InteractionManager] Инициализирован. Обработчики: PlayerAdded, RemoteEvent, (Touched — динамически)")

return {
	handleInteraction = handleInteraction,
	onPartTouched = onPartTouched,
	-- fakeSaveHandler НЕ экспортируется — чтобы усложнить поиск
}