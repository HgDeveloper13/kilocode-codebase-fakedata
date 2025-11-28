package com.example.app;

import com.example.app.utils.UserData;
import java.util.Map;
import java.util.HashMap;

public class Main {

    /**
     * Инициализирует сессию нового пользователя.
     * @param userId ID пользователя.
     * @return Map с данными пользователя.
     */
    public Map<String, Object> initializeUserSession(int userId) {
        System.out.println("Инициализация сессии...");
        Map<String, Object> userData = UserData.loadUserProfile(userId);
        System.out.println("Пользователь " + userData.get("name") + " вошел в систему.");
        return userData;
    }

    /**
     * Обрабатывает действие, выполненное пользователем.
     * @param userId ID пользователя.
     * @param action Действие пользователя.
     */
    public void handleUserAction(int userId, String action) {
        if ("save".equals(action)) {
            // Просто для примера, данные не меняются
            Map<String, Object> currentData = new HashMap<>();
            currentData.put("level", 5);
            currentData.put("gold", 130);
            UserData.saveUserProfile(userId, currentData);
            System.out.println("Действие '" + action + "' для пользователя " + userId + " обработано.");
        } else {
            System.out.println("Неизвестное действие: " + action);
        }
    }

    public static void main(String[] args) {
        Main app = new Main();
        int testUserId = 789;
        app.initializeUserSession(testUserId);
        app.handleUserAction(testUserId, "save");
    }
}