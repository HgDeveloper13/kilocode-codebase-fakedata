// main.ts
import { loadUserProfile, saveUserProfile } from './utils/userData';

function initializeUserSession(userId: number) {
    /**
     * Инициализирует сессию нового пользователя.
     */
    console.log("Инициализация сессии...");
    const userData = loadUserProfile(userId);
    console.log(`Пользователь ${userData.name} вошел в систему.`);
    return userData;
}

function handleUserAction(userId: number, action: string) {
    /**
     * Обрабатывает действие, выполненное пользователем.
     */
    if (action === "save") {
        const currentData = { gold: 140 };
        saveUserProfile(userId, currentData);
        console.log(`Действие '${action}' для пользователя ${userId} обработано.`);
    } else {
        console.log(`Неизвестное действие: ${action}`);
    }
}

const testUserId = 101;
initializeUserSession(testUserId);
handleUserAction(testUserId, "save");