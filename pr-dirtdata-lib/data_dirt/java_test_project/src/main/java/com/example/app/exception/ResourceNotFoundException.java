package com.example.app.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Исключение, выбрасываемое при попытке доступа к несуществующему ресурсу
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

    /**
     * Конструктор с сообщением об ошибке
     * 
     * @param message сообщение об ошибке
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }

    /**
     * Конструктор с сообщением об ошибке и причиной
     * 
     * @param message сообщение об ошибке
     * @param cause причина исключения
     */
    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     * Конструктор с указанием типа ресурса и его идентификатора
     * 
     * @param resourceType тип ресурса
     * @param fieldName имя поля
     * @param fieldValue значение поля
     */
    public ResourceNotFoundException(String resourceType, String fieldName, Object fieldValue) {
        super(String.format("%s не найден с %s: %s", resourceType, fieldName, fieldValue));
    }
}