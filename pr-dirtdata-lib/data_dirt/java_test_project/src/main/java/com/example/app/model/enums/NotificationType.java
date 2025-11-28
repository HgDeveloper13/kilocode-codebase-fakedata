package com.example.app.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Перечисление типов уведомлений в системе
 * 
 * Определяет различные типы уведомлений, которые могут быть отправлены пользователям:
 * email, SMS, push-уведомления
 */
public enum NotificationType {
    /**
     * Email уведомления
     */
    EMAIL("email"),
    
    /**
     * SMS уведомления
     */
    SMS("sms"),
    
    /**
     * Push уведомления на устройства
     */
    PUSH("push"),
    
    /**
     * Системные уведомления в приложении
     */
    SYSTEM("system");

    private final String value;

    NotificationType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static NotificationType fromValue(String value) {
        if (value == null) {
            return null;
        }
        for (NotificationType type : NotificationType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown notification type: " + value);
    }

    /**
     * Проверяет, является ли тип уведомления внешним (требует отправки)
     * 
     * @return true если уведомление внешнее, false для системных уведомлений
     */
    public boolean isExternal() {
        return this == EMAIL || this == SMS || this == PUSH;
    }

    /**
     * Возвращает приоритет уведомления (чем больше значение, тем выше приоритет)
     * 
     * @return приоритет уведомления
     */
    public int getPriority() {
        switch (this) {
            case EMAIL: return 1;
            case SMS: return 3;
            case PUSH: return 2;
            case SYSTEM: return 0;
            default: return 0;
        }
    }
}