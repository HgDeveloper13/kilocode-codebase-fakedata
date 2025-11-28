package com.example.app.service;

import com.example.app.model.entity.User;
import com.example.app.model.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Интерфейс сервиса для управления пользователями
 * 
 * Определяет основные операции для работы с пользователями:
 * создание, обновление, удаление, поиск и другие действия
 */
public interface UserService {

    /**
     * Находит пользователя по ID
     * 
     * @param id ID пользователя
     * @return Optional с найденным пользователем
     */
    Optional<User> findById(Long id);

    /**
     * Находит пользователя по имени пользователя
     * 
     * @param username имя пользователя
     * @return Optional с найденным пользователем
     */
    Optional<User> findByUsername(String username);

    /**
     * Находит пользователя по email
     * 
     * @param email email пользователя
     * @return Optional с найденным пользователем
     */
    Optional<User> findByEmail(String email);

    /**
     * Создает нового пользователя
     * 
     * @param user пользователь для создания
     * @return созданный пользователь
     * @throws IllegalArgumentException если пользователь с таким именем или email уже существует
     */
    User createUser(User user);

    /**
     * Обновляет информацию о пользователе
     * 
     * @param user пользователь с обновленной информацией
     * @return обновленный пользователь
     * @throws IllegalArgumentException если пользователь не существует или имя/email уже заняты
     */
    User updateUser(User user);

    /**
     * Удаляет пользователя
     * 
     * @param id ID пользователя
     * @throws IllegalArgumentException если пользователь не существует
     */
    void deleteUser(Long id);

    /**
     * Активирует пользователя
     * 
     * @param id ID пользователя
     * @return обновленный пользователь
     * @throws IllegalArgumentException если пользователь не существует
     */
    User activateUser(Long id);

    /**
     * Деактивирует пользователя
     * 
     * @param id ID пользователя
     * @return обновленный пользователь
     * @throws IllegalArgumentException если пользователь не существует
     */
    User deactivateUser(Long id);

    /**
     * Блокирует пользователя до указанной даты
     * 
     * @param id ID пользователя
     * @param until дата и время до которых пользователь заблокирован
     * @return обновленный пользователь
     * @throws IllegalArgumentException если пользователь не существует
     */
    User lockUser(Long id, LocalDateTime until);

    /**
     * Разблокирует пользователя
     * 
     * @param id ID пользователя
     * @return обновленный пользователь
     * @throws IllegalArgumentException если пользователь не существует
     */
    User unlockUser(Long id);

    /**
     * Обновляет пароль пользователя
     * 
     * @param id ID пользователя
     * @param newPassword новый пароль
     * @return обновленный пользователь
     * @throws IllegalArgumentException если пользователь не существует
     */
    User updatePassword(Long id, String newPassword);

    /**
     * Проверяет может ли пользователь войти в систему
     * 
     * @param username имя пользователя
     * @return true если пользователь может войти
     */
    boolean canUserLogin(String username);

    /**
     * Сбрасывает счетчик неудачных попыток входа
     * 
     * @param id ID пользователя
     * @return обновленный пользователь
     */
    User resetFailedLoginAttempts(Long id);

    /**
     * Увеличивает счетчик неудачных попыток входа
     * 
     * @param id ID пользователя
     * @return обновленный пользователь
     */
    User incrementFailedLoginAttempts(Long id);

    /**
     * Находит всех пользователей с пагинацией
     * 
     * @param pageable параметры пагинации
     * @return страница пользователей
     */
    Page<User> findAll(Pageable pageable);

    /**
     * Находит пользователей по статусу
     * 
     * @param status статус пользователей
     * @param pageable параметры пагинации
     * @return страница пользователей
     */
    Page<User> findByStatus(UserStatus status, Pageable pageable);

    /**
     * Находит пользователей по роли
     * 
     * @param role роль пользователей
     * @param pageable параметры пагинации
     * @return страница пользователей
     */
    Page<User> findByRole(User.Role role, Pageable pageable);

    /**
     * Находит пользователей по статусу и роли
     * 
     * @param status статус пользователей
     * @param role роль пользователей
     * @param pageable параметры пагинации
     * @return страница пользователей
     */
    Page<User> findByStatusAndRole(UserStatus status, User.Role role, Pageable pageable);

    /**
     * Находит пользователей, заблокированных до указанной даты
     * 
     * @param lockedUntil дата и время
     * @return список заблокированных пользователей
     */
    List<User> findLockedUsersBefore(LocalDateTime lockedUntil);

    /**
     * Находит пользователей с количеством неудачных попыток входа больше указанного
     * 
     * @param failedAttempts количество неудачных попыток
     * @return список пользователей
     */
    List<User> findByFailedLoginAttemptsGreaterThan(Integer failedAttempts);

    /**
     * Находит пользователей, зарегистрированных в указанном диапазоне дат
     * 
     * @param startDate начальная дата
     * @param endDate конечная дата
     * @param pageable параметры пагинации
     * @return страница пользователей
     */
    Page<User> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    /**
     * Находит пользователей по имени или фамилии
     * 
     * @param name часть имени или фамилии
     * @param pageable параметры пагинации
     * @return страница пользователей
     */
    Page<User> findByFirstNameContainingOrLastNameContaining(String name, Pageable pageable);

    /**
     * Подсчитывает общее количество пользователей
     * 
     * @return общее количество пользователей
     */
    long countAll();

    /**
     * Подсчитывает количество пользователей по статусу
     * 
     * @param status статус пользователей
     * @return количество пользователей
     */
    long countByStatus(UserStatus status);

    /**
     * Подсчитывает количество пользователей по роли
     * 
     * @param role роль пользователей
     * @return количество пользователей
     */
    long countByRole(User.Role role);

    /**
     * Проверяет существует ли пользователь с таким именем
     * 
     * @param username имя пользователя
     * @return true если пользователь существует
     */
    boolean existsByUsername(String username);

    /**
     * Проверяет существует ли пользователь с таким email
     * 
     * @param email email пользователя
     * @return true если пользователь существует
     */
    boolean existsByEmail(String email);

    /**
     * Генерирует хэш пароля
     * 
     * @param password исходный пароль
     * @return хэшированный пароль
     */
    String encodePassword(String password);
}