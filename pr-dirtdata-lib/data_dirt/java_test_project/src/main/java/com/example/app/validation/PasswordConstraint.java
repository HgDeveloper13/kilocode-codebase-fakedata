package com.example.app.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.*;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

/**
 * Аннотация для валидации пароля
 * 
 * Проверяет, что пароль соответствует требованиям безопасности:
 * - Минимум 8 символов
 * - Содержит хотя бы одну заглавную букву
 * - Содержит хотя бы одну строчную букву
 * - Содержит хотя бы одну цифру
 * - Содержит хотя бы один специальный символ
 */
@Target({FIELD, PARAMETER, ANNOTATION_TYPE})
@Retention(RUNTIME)
@Constraint(validatedBy = PasswordValidator.class)
@Documented
public @interface PasswordConstraint {
    
    String message() default "Пароль должен содержать минимум 8 символов, " +
                          "включая заглавные и строчные буквы, цифры и специальные символы";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
}