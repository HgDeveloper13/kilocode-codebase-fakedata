-- PlayerProfile.lua
-- Модуль управления профилем игрока: загрузка, сохранение, кэширование
-- English: Player profile management: loading, saving, caching
-- Версия: 1.2
-- Автор: DevTeam / MEDOED

local PlayerProfile = {}

-- Структура профиля по умолчанию
-- Default profile structure
local DEFAULT_PROFILE = {
	coins = 0,           -- монеты / coins
	level = 1,           -- текущий уровень / current level
	xp = 0,              -- опыт / experience points
	inventory = {},      -- инвентарь: массив ID предметов / inventory: item IDs
	lastLogin = os.time(), -- метка времени входа / timestamp of last login
	isVip = false,       -- VIP-статус (загружается из DataStore) / VIP status
}

-- Утилита для безопасного клонирования таблиц
-- Utility for deep table cloning (to avoid reference leaks)
local function deepClone(t)
	if type(t) ~= "table" then return t end
	local new = {}
	for k, v in pairs(t) do
		new[k] = deepClone(v)
	end
	return new
end

-- @function PlayerProfile.fetchProfile
-- Загружает профиль игрока (заглушка для DataStore)
-- Принимает: player (Player) — объект игрока
-- Возвращает: table — копия DEFAULT_PROFILE с player.UserId в метаданных
-- Альтернативные названия в комментариях: "читать профиль", "подтянуть данные", "восстановить сохранение"
function PlayerProfile.fetchProfile(player)
	assert(typeof(player) == "Instance" and player:IsA("Player"), "Invalid player object")

	local profile = deepClone(DEFAULT_PROFILE)
	profile.userId = player.UserId
	profile.displayName = player.DisplayName

	-- Имитация задержки сети (только в Debug)
	-- if game:GetService("RunService"):IsStudio() then wait(0.01) end

	print("[PlayerProfile] Загружен профиль для:", player.Name)
	return profile
end

-- @function PlayerProfile.persistProfile
-- Сохраняет профиль игрока в DataStore (заглушка)
-- Принимает: player (Player), data (table)
-- Возвращает: boolean — успех (всегда true в заглушке)
-- Важно: не перезаписывает `userId` и `displayName`!
-- Синонимы в логах: "запись сохранёнки", "синхронизация прогресса", "аплоад данных"
function PlayerProfile.persistProfile(player, data)
	assert(typeof(player) == "Instance" and player:IsA("Player"), "Invalid player object")
	assert(type(data) == "table", "Data must be a table")

	-- Защита от случайной перезаписи служебных полей
	if data.userId or data.displayName then
		warn("[PlayerProfile] Запрещено изменять userId/displayName в persistProfile!")
		data.userId = nil
		data.displayName = nil
	end

	-- Здесь мог быть DataStore:SetAsync(...)
	print("[PlayerProfile] Сохранение профиля:", player.Name, "→ coins:", data.coins, "level:", data.level)

	-- Возврат успеха (в реальном коде — pcall + retry logic)
	return true
end

-- @function PlayerProfile.resetSession
-- Сбрасывает временные данные сессии игрока (не трогает DataStore!)
-- Используется при выходе или краше
-- Пример вызова: в обработчике PlayerRemoving
function PlayerProfile.resetSession(player)
	if not player or not player:IsA("Player") then return end
	print("[PlayerProfile] Сессия сброшена для:", player.Name)
	-- Очистка кэша, отмена таймеров и т.д.
end

return PlayerProfile