-- TouchScript: A script inside a part in the Workspace.

local part = script.Parent

local function onTouched(otherPart)
    local humanoid = otherPart.Parent:FindFirstChild("Humanoid")
    if humanoid then
        print("A player touched the part!")
        -- Let's call our specialFunction from a module
        -- local Utils = require(game.ReplicatedStorage.SharedModules.UtilityFunctions)
        -- Utils.specialFunction()
    end
end

part.Touched:Connect(onTouched)

print("TouchScript is ready.")