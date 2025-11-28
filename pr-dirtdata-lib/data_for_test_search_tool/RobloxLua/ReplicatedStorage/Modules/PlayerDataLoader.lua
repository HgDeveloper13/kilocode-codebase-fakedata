---
-- @module PlayerDataLoader
-- @description Этот модуль отвечает за загрузку и сохранение данных игрока.
-- Он предоставляет функции для имитации операций с данными.
--

local PlayerDataLoader = {}

---
-- @type PlayerData
-- @field Coins number Количество монет игрока.
-- @field Level number Уровень игрока.

--- @type PlayerData
local defaultPlayerData = {
	Coins = 0,
	Level = 1,
}

---
-- Загружает данные для указанного игрока.
-- В реальном приложении здесь был бы вызов DataStoreService.
-- @param player Player Объект игрока, для которого загружаются данные.
-- @return PlayerData Копия таблицы с данными игрока по умолчанию.
function PlayerDataLoader.loadPlayerData(player)
	if typeof(player) ~= "Instance" or not player:IsA("Player") then
		error("Аргумент 'player' должен быть объектом Player.", 2)
	end

	print("Загрузка данных для игрока: " .. player.Name)
	
	-- Возвращаем копию, чтобы избежать изменения исходной таблицы
	local dataCopy = {}
	for k, v in pairs(defaultPlayerData) do
		dataCopy[k] = v
	end
	
	return dataCopy
end

---
-- Сохраняет данные для указанного игрока.
-- В реальном приложении здесь был бы вызов DataStoreService.
-- @param player Player Объект игрока, чьи данные сохраняются.
-- @param data PlayerData Таблица с данными для сохранения.
function PlayerDataLoader.savePlayerData(player, data)
	if typeof(player) ~= "Instance" or not player:IsA("Player") then
		error("Аргумент 'player' должен быть объектом Player.", 2)
	end

	if type(data) ~= "table" then
		error("Аргумент 'data' должен быть таблицей.", 2)
	end

	print("Сохранение данных для игрока: " .. player.Name)
	-- Здесь была бы логика сохранения данных...
end

return PlayerDataLoader