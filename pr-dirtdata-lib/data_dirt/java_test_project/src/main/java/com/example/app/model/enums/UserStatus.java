package com.example.app.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Перечисление статусов пользователей в системе
 * 
 * Определяет различные состояния учетной записи пользователя:
 * активен, неактивен, заблокирован, ожидает подтверждения
 */
public enum UserStatus {
    /**
     * Активный пользователь, может полноценно использовать систему
     */
    ACTIVE("active"),
    
    /**
     * Неактивный пользователь, учетная запись отключена
     */
    INACTIVE("inactive"),
    
    /**
     * Пользователь заблокирован администратором
     */
    BLOCKED("blocked"),
    
    /**
     * Пользователь зарегистрировался, но еще не подтвердил email
     */
    PENDING("pending");

    private final String value;

    UserStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static UserStatus fromValue(String value) {
        if (value == null) {
            return null;
        }
        for (UserStatus status : UserStatus.values()) {
            if (status.value.equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown user status: " + value);
    }

    /**
     * Проверяет, может ли пользователь входить в систему
     * 
     * @return true если пользователь может входить, false в противном случае
     */
    public boolean canLogin() {
        return this == ACTIVE;
    }

    /**
     * Проверяет, требуется ли подтверждение email
     * 
     * @return true если требуется подтверждение, false в противном случае
     */
    public boolean requiresEmailConfirmation() {
        return this == PENDING;
    }
}