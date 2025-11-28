package com.example.app.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Исключение, выбрасываемое при попытке создания пользователя с уже существующими учетными данными
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class UserAlreadyExistsException extends RuntimeException {

    /**
     * Конструктор с сообщением об ошибке
     * 
     * @param message сообщение об ошибке
     */
    public UserAlreadyExistsException(String message) {
        super(message);
    }

    /**
     * Конструктор с сообщением об ошибке и причиной
     * 
     * @param message сообщение об ошибке
     * @param cause причина исключения
     */
    public UserAlreadyExistsException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     * Конструктор с указанием типа конфликта
     * 
     * @param conflictType тип конфликта (например, "username", "email")
     * @param value значение, вызвавшее конфликт
     */
    public UserAlreadyExistsException(String conflictType, String value) {
        super(String.format("Пользователь с %s %s уже существует", conflictType, value));
    }
}