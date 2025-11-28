-- UtilityFunctions: A shared module with helper functions.

local Utils = {}

---
-- A simple utility function.
-- @param a number
-- @param b number
-- @return number
---
function Utils.add(a, b)
    return a + b
end

---
-- Another utility function to demonstrate search.
-- This contains a searchable keyword.
---
function Utils.specialFunction()
    print("This is a very special function!")
end

return Utils