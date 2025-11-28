package com.example.app.utils;

import java.text.Normalizer;
import java.util.regex.Pattern;

/**
 * Утилита для генерации slug из строк
 * 
 * Преобразует строки в URL-дружественные slug'и, удаляя или заменяя
 * специальные символы, пробелы и не-ASCII символы
 */
public class SlugGenerator {

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");
    private static final Pattern MULTIPLE_DASHES = Pattern.compile("-+");
    
    /**
     * Преобразует строку в slug
     * 
     * @param input входная строка
     * @return slug в нижнем регистре
     */
    public static String toSlug(String input) {
        if (input == null || input.trim().isEmpty()) {
            return "";
        }
        
        // Нормализация Unicode
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        
        // Удаление диакритических знаков
        String ascii = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        
        // Замена пробелов на дефисы
        String withDashes = WHITESPACE.matcher(ascii).replaceAll("-");
        
        // Удаление всех не-латинских символов и специальных символов, кроме дефисов
        String cleaned = NONLATIN.matcher(withDashes).replaceAll("");
        
        // Замена множественных дефисов на один
        String singleDashes = MULTIPLE_DASHES.matcher(cleaned).replaceAll("-");
        
        // Удаление дефисов в начале и конце
        String trimmed = singleDashes.replaceAll("^-+", "").replaceAll("-+$", "");
        
        return trimmed.toLowerCase();
    }
    
    /**
     * Преобразует строку в slug с максимальной длиной
     * 
     * @param input входная строка
     * @param maxLength максимальная длина slug
     * @return slug в нижнем регистре с ограничением по длине
     */
    public static String toSlug(String input, int maxLength) {
        String slug = toSlug(input);
        
        if (slug.length() > maxLength) {
            // Найти последний дефис в пределах maxLength
            int lastDashIndex = slug.lastIndexOf('-', maxLength);
            
            if (lastDashIndex > 0) {
                slug = slug.substring(0, lastDashIndex);
            } else {
                // Если нет дефисов, просто обрезаем
                slug = slug.substring(0, maxLength);
            }
            
            // Удаляем возможные дефисы в конце
            slug = slug.replaceAll("-+$", "");
        }
        
        return slug;
    }
    
    /**
     * Проверяет является ли строка валидным slug
     * 
     * @param slug проверяемая строка
     * @return true если строка является валидным slug
     */
    public static boolean isValidSlug(String slug) {
        if (slug == null || slug.trim().isEmpty()) {
            return false;
        }
        
        // Slug должен содержать только строчные латинские буквы, цифры и дефисы
        // Не должен начинаться или заканчиваться дефисом
        return slug.matches("^[a-z0-9]+(?:-[a-z0-9]+)*$");
    }
    
    /**
     * Генерирует уникальный slug, добавляя число если необходимо
     * 
     * @param baseSlug базовый slug
     * @param existingSlugs существующие slug'и для проверки уникальности
     * @return уникальный slug
     */
    public static String generateUniqueSlug(String baseSlug, java.util.Collection<String> existingSlugs) {
        if (baseSlug == null || baseSlug.trim().isEmpty()) {
            throw new IllegalArgumentException("Base slug cannot be null or empty");
        }
        
        String slug = toSlug(baseSlug);
        
        if (existingSlugs == null || !existingSlugs.contains(slug)) {
            return slug;
        }
        
        // Добавляем число к slug'у пока не получим уникальный
        int counter = 1;
        String uniqueSlug;
        
        do {
            uniqueSlug = slug + "-" + counter;
            counter++;
        } while (existingSlugs.contains(uniqueSlug));
        
        return uniqueSlug;
    }
}