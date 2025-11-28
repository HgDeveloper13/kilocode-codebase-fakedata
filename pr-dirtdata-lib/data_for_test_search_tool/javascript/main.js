// main.js
const { loadUserProfile, saveUserProfile } = require('./utils/userData');

function initializeUserSession(userId) {
    /**
     * Инициализирует сессию нового пользователя.
     */
    console.log("Инициализация сессии...");
    const userData = loadUserProfile(userId);
    console.log(`Пользователь ${userData.name} вошел в систему.`);
    return userData;
}

function handleUserAction(userId, action) {
    /**
     * Обрабатывает действие, выполненное пользователем.
     */
    if (action === "save") {
        // Просто для примера, данные не меняются
        const currentData = { level: 5, gold: 120 };
        saveUserProfile(userId, currentData);
        console.log(`Действие '${action}' для пользователя ${userId} обработано.`);
    } else {
        console.log(`Неизвестное действие: ${action}`);
    }
}

// Для запуска в Node.js
if (require.main === module) {
    const testUserId = 456;
    initializeUserSession(testUserId);
    handleUserAction(testUserId, "save");
}