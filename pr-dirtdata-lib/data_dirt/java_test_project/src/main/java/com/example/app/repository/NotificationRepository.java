package com.example.app.repository;

import com.example.app.model.entity.Notification;
import com.example.app.model.entity.User;
import com.example.app.model.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Репозиторий для работы с уведомлениями
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Находит уведомления пользователя
     * 
     * @param user пользователь
     * @param pageable параметры пагинации
     * @return страница уведомлений
     */
    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    /**
     * Находит непрочитанные уведомления пользователя
     * 
     * @param user пользователь
     * @param pageable параметры пагинации
     * @return страница непрочитанных уведомлений
     */
    Page<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user, Pageable pageable);

    /**
     * Находит уведомления по типу
     * 
     * @param type тип уведомления
     * @param user пользователь
     * @param pageable параметры пагинации
     * @return страница уведомлений
     */
    Page<Notification> findByTypeAndUserOrderByCreatedAtDesc(NotificationType type, User user, Pageable pageable);

    /**
     * Находит непрочитанные уведомления по типу
     * 
     * @param type тип уведомления
     * @param user пользователь
     * @param pageable параметры пагинации
     * @return страница непрочитанных уведомлений
     */
    Page<Notification> findByTypeAndUserAndIsReadFalseOrderByCreatedAtDesc(
            NotificationType type, User user, Pageable pageable);

    /**
     * Находит уведомления, отправленные в указанный период
     * 
     * @param startDate начальная дата
     * @param endDate конечная дата
     * @param pageable параметры пагинации
     * @return страница уведомлений
     */
    Page<Notification> findBySentAtBetweenOrderByCreatedAtDesc(
            LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    /**
     * Находит уведомления с ошибками отправки
     * 
     * @param pageable параметры пагинации
     * @return страница уведомлений с ошибками
     */
    Page<Notification> findByErrorMessageIsNotNullOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Находит просроченные уведомления (не отправленные более 24 часов)
     * 
     * @param pageable параметры пагинации
     * @return страница просроченных уведомлений
     */
    @Query("SELECT n FROM Notification n WHERE n.sentAt IS NULL AND n.createdAt < :cutoffTime")
    Page<Notification> findExpiredNotifications(@Param("cutoffTime") LocalDateTime cutoffTime, Pageable pageable);

    /**
     * Находит уведомления, которые можно повторно отправить
     * 
     * @param pageable параметры пагинации
     * @return страница уведомлений для повторной отправки
     */
    @Query("SELECT n FROM Notification n WHERE (n.errorMessage IS NOT NULL OR n.sentAt IS NULL) AND n.retryCount < 3")
    Page<Notification> findRetryableNotifications(Pageable pageable);

    /**
     * Подсчитывает количество непрочитанных уведомлений пользователя
     * 
     * @param user пользователь
     * @return количество непрочитанных уведомлений
     */
    long countByUserAndIsReadFalse(User user);

    /**
     * Подсчитывает количество уведомлений по типу
     * 
     * @param type тип уведомления
     * @param user пользователь
     * @return количество уведомлений
     */
    long countByTypeAndUser(NotificationType type, User user);

    /**
     * Подсчитывает количество отправленных уведомлений пользователя
     * 
     * @param user пользователь
     * @return количество отправленных уведомлений
     */
    long countByUserAndSentAtIsNotNull(User user);

    /**
     * Находит последние N уведомлений пользователя
     * 
     * @param user пользователь
     * @param limit количество уведомлений
     * @return список последних уведомлений
     */
    @Query("SELECT n FROM Notification n WHERE n.user = :user ORDER BY n.createdAt DESC")
    List<Notification> findTopByUserOrderByCreatedAtDesc(@Param("user") User user, Pageable limit);

    /**
     * Проверяет существование уведомления с таким сообщением для пользователя
     * 
     * @param user пользователь
     * @param message текст сообщения
     * @param type тип уведомления
     * @param hoursPeriod период в часах
     * @return true если уведомление существует в указанном периоде
     */
    @Query("SELECT CASE WHEN COUNT(n) > 0 THEN true ELSE false END FROM Notification n " +
           "WHERE n.user = :user AND n.message = :message AND n.type = :type " +
           "AND n.createdAt > :cutoffTime")
    boolean existsByUserAndMessageAndTypeAndCreatedAtAfter(
            @Param("user") User user,
            @Param("message") String message,
            @Param("type") NotificationType type,
            @Param("cutoffTime") LocalDateTime cutoffTime);
}