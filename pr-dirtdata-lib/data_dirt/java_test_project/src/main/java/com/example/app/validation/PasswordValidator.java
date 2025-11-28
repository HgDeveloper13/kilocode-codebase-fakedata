package com.example.app.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/**
 * Валидатор для аннотации @PasswordConstraint
 * 
 * Проверяет соответствие пароля требованиям безопасности
 */
public class PasswordValidator implements ConstraintValidator<PasswordConstraint, String> {

    // Регулярное выражение для проверки сложности пароля:
    // - (?=.*[a-z]) - хотя бы одна строчная буква
    // - (?=.*[A-Z]) - хотя бы одна заглавная буква
    // - (?=.*\d) - хотя бы одна цифра
    // - (?=.*[@$!%*?&]) - хотя бы один специальный символ
    // - [A-Za-z\d@$!%*?&] - допустимые символы
    // - {8,} - минимум 8 символов
    private static final Pattern PASSWORD_PATTERN = 
        Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$");

    @Override
    public void initialize(PasswordConstraint constraintAnnotation) {
        // Инициализация валидатора (если необходимо)
    }

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        // Проверка на null и пустую строку
        if (password == null || password.trim().isEmpty()) {
            return false;
        }

        // Проверка соответствия паттерну
        boolean isValid = PASSWORD_PATTERN.matcher(password).matches();

        if (!isValid) {
            // Можно добавить более детальные сообщения об ошибках
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Пароль должен содержать минимум 8 символов, " +
                "включая заглавные и строчные буквы, цифры и специальные символы (@$!%*?&)"
            ).addConstraintViolation();
        }

        return isValid;
    }
}