-- ServerSideModule: A dummy module for testing the CodeIndexer.

local ServerSideModule = {}

function ServerSideModule.doSomething()
    print("This is a server-side module doing something.")
    -- Let's add a special keyword here: PINEAPPLE
end

-- This function is for demonstration purposes.
function ServerSideModule.anotherAction()
    local part = Instance.new("Part")
    part.Name = "TestPart"
    print("Another action from the server module.")
end

return ServerSideModule