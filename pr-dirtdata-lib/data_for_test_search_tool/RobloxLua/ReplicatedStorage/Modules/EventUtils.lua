--!nocheck

---
-- @module EventUtils
-- @description Утилиты для работы с событиями.
local EventUtils = {}

--- Отключает соединение события, если оно существует и активно.
-- @param connection RBXScriptConnection - Соединение, которое нужно отключить.
function EventUtils.disconnectEvent(connection)
	if connection and connection.Connected then
		connection:Disconnect()
	end
end

return EventUtils