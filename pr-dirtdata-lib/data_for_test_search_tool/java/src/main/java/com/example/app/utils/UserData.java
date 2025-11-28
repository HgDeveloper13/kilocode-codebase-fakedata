package com.example.app.utils;

import java.util.HashMap;
import java.util.Map;

public class UserData {

    /**
     * Загружает профиль пользователя по его ID.
     * В реальном приложении здесь был бы запрос к базе данных.
     * @param userId ID пользователя.
     * @return Map с данными пользователя.
     */
    public static Map<String, Object> loadUserProfile(int userId) {
        System.out.println("Загрузка данных для пользователя " + userId + "...");
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", userId);
        userData.put("name", "Test User");
        userData.put("level", 5);
        userData.put("gold", 100);
        return userData;
    }

    /**
     * Сохраняет данные профиля пользователя.
     * Это заглушка, реальная логика сохранения отсутствует.
     * @param userId ID пользователя.
     * @param data Данные для сохранения.
     * @return true в случае успеха.
     */
    public static boolean saveUserProfile(int userId, Map<String, Object> data) {
        System.out.println("Сохранение данных для пользователя " + userId + ": " + data);
        // В реальном приложении здесь была бы запись в базу данных.
        return true;
    }
}