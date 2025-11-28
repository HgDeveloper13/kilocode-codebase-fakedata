---
-- @script PartTouchScript
-- @desc Этот скрипт обрабатывает событие касания для BasePart. Когда персонаж игрока касается детали, он изменяет цвет детали и выводит сообщение в консоль. Включен механизм debounce для предотвращения слишком частого срабатывания события.
--

-- Получаем родительскую деталь, к которой прикреплен скрипт
local part = script.Parent

-- Флаг Debounce для предотвращения многократного срабатывания события в быстрой последовательности
local debounce = false

---
-- Обрабатывает логику прикосновения к детали.
-- Он проверяет, принадлежит ли касающаяся деталь персонажу игрока, и если да,
-- изменяет цвет родительской детали на случайный.
-- @param otherPart BasePart, который коснулся родительской детали.
--
local function onPartTouch(otherPart)
	-- Проверяем, не выполняется ли уже событие
	if debounce then
		return
	end

	-- Устанавливаем debounce в true, чтобы предотвратить повторное срабатывание
	debounce = true

	-- Проверяем, существуют ли otherPart и его родитель
	if otherPart and otherPart.Parent then
		-- Получаем игрока из модели персонажа
		local player = game.Players:GetPlayerFromCharacter(otherPart.Parent)

		-- Если игрок найден, значит, персонаж коснулся детали
		if player then
			print("Деталь коснулся игрок: " .. player.Name)
			-- Изменяем цвет детали на случайный BrickColor
			part.Color = BrickColor.random().Color
		end
	end

	-- Ждем 1 секунду, прежде чем разрешить событию сработать снова
	task.wait(1)

	-- Сбрасываем debounce в false
	debounce = false
end

-- Подключаем функцию onPartTouch к событию Touched детали
part.Touched:Connect(onPartTouch)