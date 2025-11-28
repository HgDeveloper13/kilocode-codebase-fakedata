// utils/userData.js

function loadUserProfile(userId) {
    /**
     * Загружает профиль пользователя по его ID.
     * В реальном приложении здесь был бы запрос к API.
     */
    console.log(`Загрузка данных для пользователя ${userId}...`);
    // Имитация загрузки данных
    return {
        id: userId,
        name: "Test User",
        level: 5,
        gold: 100
    };
}

function saveUserProfile(userId, data) {
    /**
     * Сохраняет данные профиля пользователя.
     * Это заглушка, реальная логика сохранения отсутствует.
     */
    console.log(`Сохранение данных для пользователя ${userId}:`, data);
    // В реальном приложении здесь был бы POST-запрос к API.
    return true;
}

module.exports = { loadUserProfile, saveUserProfile };