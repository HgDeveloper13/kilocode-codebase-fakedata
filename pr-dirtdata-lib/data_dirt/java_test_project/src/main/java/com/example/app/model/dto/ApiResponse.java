package com.example.app.model.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

/**
 * Record для представления стандартного формата ответа API
 * 
 * Используется для единообразного возврата данных от REST контроллеров
 * 
 * @param success флаг успешности операции
 * @param data данные ответа
 * @param errors список ошибок (если есть)
 * @param timestamp время создания ответа
 * @param <T> тип данных ответа
 */
public record ApiResponse<T>(
        @JsonProperty("success") boolean success,
        @JsonProperty("data") @JsonInclude(JsonInclude.Include.NON_NULL) T data,
        @JsonProperty("errors") @JsonInclude(JsonInclude.Include.NON_EMPTY) List<String> errors,
        @JsonProperty("timestamp") Instant timestamp
) {
    
    /**
     * Создает успешный ответ с данными
     * 
     * @param data данные ответа
     * @param <T> тип данных
     * @return успешный ответ с данными
     */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, Collections.emptyList(), Instant.now());
    }
    
    /**
     * Создает успешный ответ без данных
     * 
     * @param <T> тип данных
     * @return успешный ответ без данных
     */
    public static <T> ApiResponse<T> success() {
        return new ApiResponse<>(true, null, Collections.emptyList(), Instant.now());
    }
    
    /**
     * Создает ответ с ошибкой
     * 
     * @param error сообщение об ошибке
     * @param <T> тип данных
     * @return ответ с ошибкой
     */
    public static <T> ApiResponse<T> error(String error) {
        return new ApiResponse<>(false, null, Collections.singletonList(error), Instant.now());
    }
    
    /**
     * Создает ответ с несколькими ошибками
     * 
     * @param errors список сообщений об ошибках
     * @param <T> тип данных
     * @return ответ с ошибками
     */
    public static <T> ApiResponse<T> errors(List<String> errors) {
        return new ApiResponse<>(false, null, errors, Instant.now());
    }
    
    /**
     * Проверяет, является ли ответ успешным
     * 
     * @return true если операция успешна, false в противном случае
     */
    public boolean isSuccess() {
        return success;
    }
    
    /**
     * Возвращает количество ошибок
     * 
     * @return количество ошибок в ответе
     */
    public int getErrorCount() {
        return errors != null ? errors.size() : 0;
    }
}