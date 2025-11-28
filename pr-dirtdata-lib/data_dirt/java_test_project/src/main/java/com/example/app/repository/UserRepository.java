package com.example.app.repository;

import com.example.app.model.entity.User;
import com.example.app.model.entity.User.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Репозиторий для работы с сущностью User
 * 
 * Содержит методы для поиска, фильтрации и управления пользователями
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

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
     * Находит всех активных пользователей
     * 
     * @param pageable параметры пагинации
     * @return страница активных пользователей
     */
    Page<User> findByStatus(com.example.app.model.enums.UserStatus status, Pageable pageable);

    /**
     * Находит всех пользователей по роли
     * 
     * @param role роль пользователя
     * @param pageable параметры пагинации
     * @return страница пользователей указанной роли
     */
    Page<User> findByRole(Role role, Pageable pageable);

    /**
     * Находит пользователей по статусу и роли
     * 
     * @param status статус пользователя
     * @param role роль пользователя
     * @param pageable параметры пагинации
     * @return страница пользователей
     */
    Page<User> findByStatusAndRole(com.example.app.model.enums.UserStatus status, Role role, Pageable pageable);

    /**
     * Находит пользователей, заблокированных до указанной даты
     * 
     * @param lockedUntil дата и время
     * @return список заблокированных пользователей
     */
    List<User> findByLockedUntilBefore(LocalDateTime lockedUntil);

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
     * Находит пользователей по имени или фамилии (частичное совпадение)
     * 
     * @param name часть имени или фамилии
     * @param pageable параметры пагинации
     * @return страница пользователей
     */
    @Query("SELECT u FROM User u WHERE u.firstName LIKE %:name% OR u.lastName LIKE %:name%")
    Page<User> findByFirstNameContainingOrLastNameContaining(@Param("name") String name, Pageable pageable);

    /**
     * Находит пользователей с уведомлениями, которые еще не были прочиты
     * 
     * @param pageable параметры пагинации
     * @return страница пользователей
     */
    @Query("SELECT DISTINCT u FROM User u JOIN u.notifications n WHERE n.isRead = false")
    Page<User> findUsersWithUnreadNotifications(Pageable pageable);

    /**
     * Находит пользователей, у которых есть опубликованные посты
     * 
     * @param pageable параметры пагинации
     * @return страница пользователей
     */
    @Query("SELECT DISTINCT u FROM User u JOIN u.posts p WHERE p.status = 'PUBLISHED'")
    Page<User> findUsersWithPublishedPosts(Pageable pageable);

    /**
     * Подсчитывает количество пользователей по статусу
     * 
     * @param status статус пользователей
     * @return количество пользователей
     */
    long countByStatus(com.example.app.model.enums.UserStatus status);

    /**
     * Подсчитывает количество пользователей по роли
     * 
     * @param role роль пользователей
     * @return количество пользователей
     */
    long countByRole(Role role);

    /**
     * Подсчитывает количество активных пользователей
     * 
     * @return количество активных пользователей
     */
    default long countActiveUsers() {
        return countByStatus(com.example.app.model.enums.UserStatus.ACTIVE);
    }

    /**
     * Подсчитывает количество администраторов
     * 
     * @return количество администраторов
     */
    default long countAdmins() {
        return countByRole(Role.ADMIN);
    }

    /**
     * Проверяет, может ли пользователь войти в систему
     * (не заблокирован и имеет активный статус)
     * 
     * @param username имя пользователя
     * @return true если пользователь может войти
     */
    @Query("SELECT CASE WHEN u.status = 'ACTIVE' AND (u.lockedUntil IS NULL OR u.lockedUntil < CURRENT_TIMESTAMP) THEN true ELSE false END FROM User u WHERE u.username = :username")
    boolean canUserLogin(@Param("username") String username);
}