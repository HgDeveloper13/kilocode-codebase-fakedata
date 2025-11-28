package com.example.app.model.entity;

import com.example.app.model.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Сущность уведомления
 * 
 * Представляет собой сообщение, которое может быть отправлено пользователю
 * различными способами: email, SMS, push-уведомления
 */
@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class Notification extends BaseEntity<Long> {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User user;

    @Column(name = "title", nullable = false, length = 200)
    @NotBlank(message = "Заголовок уведомления не может быть пустым")
    @Size(max = 200, message = "Заголовок не может быть длиннее 200 символов")
    private String title;

    @Column(name = "message", nullable = false, length = 1000)
    @NotBlank(message = "Сообщение уведомления не может быть пустым")
    @Size(max = 1000, message = "Сообщение не может быть длиннее 1000 символов")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotificationType type;

    @Column(name = "recipient", length = 100)
    @Size(max = 100, message = "Получатель не может быть длиннее 100 символов")
    private String recipient;

    @CreationTimestamp
    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "priority")
    @Builder.Default
    private Integer priority = 1;

    @Column(name = "retry_count")
    @Builder.Default
    private Integer retryCount = 0;

    @Column(name = "error_message", length = 500)
    @Size(max = 500, message = "Сообщение об ошибке не может быть длиннее 500 символов")
    private String errorMessage;

    /**
     * Помечает уведомление как прочитанное
     */
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }

    /**
     * Помечает уведомление как непрочитанное
     */
    public void markAsUnread() {
        this.isRead = false;
        this.readAt = null;
    }

    /**
     * Увеличивает счетчик повторных попыток отправки
     */
    public void incrementRetryCount() {
        this.retryCount++;
    }

    /**
     * Проверяет, является ли уведомление просроченным
     * (не было отправлено более 24 часов)
     * 
     * @return true если уведомление просрочено
     */
    public boolean isExpired() {
        if (sentAt == null) {
            return false;
        }
        return sentAt.isBefore(LocalDateTime.now().minusHours(24));
    }

    /**
     * Проверяет, можно ли повторно отправить уведомление
     * (не превышено максимальное количество попыток)
     * 
     * @return true если можно повторить отправку
     */
    public boolean canRetry() {
        return retryCount < 3;
    }

    /**
     * Устанавливает сообщение об ошибке
     * 
     * @param errorMessage сообщение об ошибке
     */
    public void setError(String errorMessage) {
        this.errorMessage = errorMessage;
        this.sentAt = LocalDateTime.now();
    }

    /**
     * Проверяет, было ли уведомление отправлено
     * 
     * @return true если уведомление было отправлено
     */
    public boolean isSent() {
        return sentAt != null;
    }
}