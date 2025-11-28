// utils/userData.ts

interface UserProfile {
    id: number;
    name: string;
    level: number;
    gold: number;
}

export function loadUserProfile(userId: number): UserProfile {
    /**
     * Загружает профиль пользователя по его ID.
     */
    console.log(`Загрузка данных для пользователя ${userId}...`);
    return {
        id: userId,
        name: "Test User",
        level: 5,
        gold: 100
    };
}

export function saveUserProfile(userId: number, data: Partial<UserProfile>): boolean {
    /**
     * Сохраняет данные профиля пользователя.
     */
    console.log(`Сохранение данных для пользователя ${userId}:`, data);
    return true;
}