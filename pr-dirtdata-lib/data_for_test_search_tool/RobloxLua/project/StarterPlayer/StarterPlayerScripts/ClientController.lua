--[[
    ClientController.lua
    
    Этот скрипт обрабатывает ввод пользователя на стороне клиента,
    например, нажатия клавиш, и инициирует события на сервере.
    Он предназначен для демонстрации взаимодействия клиента с сервером
    через RemoteEvents.
]]

--- @class ClientController
local ClientController = {}

-- Сервисы
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")

-- Удаленные события (предполагается, что они существуют в ReplicatedStorage/RemoteEvents)
local interactionEvent = ReplicatedStorage:WaitForChild("RemoteEvents"):WaitForChild("interactionEvent")

-- UI Элементы (фиктивные)
local openShopButton -- = playerGui.ScreenGui.OpenShopButton

--- Обрабатывает начало ввода пользователя.
-- @param input InputObject, содержащий информацию о вводе.
-- @param gameProcessed bool, указывает, был ли ввод уже обработан игрой.
local function onInputBegan(input, gameProcessed)
    if gameProcessed then return end

    if input.KeyCode == Enum.KeyCode.E then
        -- Отправляем событие на сервер, когда игрок нажимает 'E'
        interactionEvent:FireServer("PlayerInteracted")
        print("Клавиша 'E' нажата, событие отправлено на сервер.")
    end
end

-- Подключаем обработчик к событию ввода
UserInputService.InputBegan:Connect(onInputBegan)

return ClientController