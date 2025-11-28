package com.example.app.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Сущность комментария к посту
 * 
 * Представляет собой отзыв или комментарий пользователя к конкретному посту
 */
@Entity
@Table(name = "comments",
       indexes = {
           @Index(name = "idx_comment_post", columnList = "post_id"),
           @Index(name = "idx_comment_author", columnList = "author_id"),
           @Index(name = "idx_comment_status", columnList = "status")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class Comment extends BaseEntity<Long> {

    @Column(name = "content", nullable = false, length = 2000)
    @NotBlank(message = "Содержимое комментария не может быть пустым")
    @Size(max = 2000, message = "Содержимое не может быть длиннее 2000 символов")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(name = "like_count")
    @Builder.Default
    private Long likeCount = 0L;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    @ToString.Exclude
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    @ToString.Exclude
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @ToString.Exclude
    private Comment parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @Builder.Default
    private List<Comment> replies = new ArrayList<>();

    /**
     * Перечисление статусов комментария
     */
    public enum Status {
        PENDING,   // На модерации
        APPROVED,  // Одобрен
        REJECTED,  // Отклонен
        SPAM       // Спам
    }

    /**
     * Проверяет, одобрен ли комментарий
     * 
     * @return true если комментарий одобрен
     */
    public boolean isApproved() {
        return status == Status.APPROVED;
    }

    /**
     * Проверяет, находится ли комментарий на модерации
     * 
     * @return true если комментарий на модерации
     */
    public boolean isPending() {
        return status == Status.PENDING;
    }

    /**
     * Проверяет, является ли комментарий спамом
     * 
     * @return true если комментарий является спамом
     */
    public boolean isSpam() {
        return status == Status.SPAM;
    }

    /**
     * Одобряет комментарий
     */
    public void approve() {
        this.status = Status.APPROVED;
    }

    /**
     * Отклоняет комментарий
     */
    public void reject() {
        this.status = Status.REJECTED;
    }

    /**
     * Помечает комментарий как спам
     */
    public void markAsSpam() {
        this.status = Status.SPAM;
    }

    /**
     * Увеличивает счетчик лайков
     */
    public void incrementLikeCount() {
        this.likeCount++;
    }

    /**
     * Уменьшает счетчик лайков
     */
    public void decrementLikeCount() {
        if (this.likeCount > 0) {
            this.likeCount--;
        }
    }

    /**
     * Проверяет, является ли комментарий ответом на другой комментарий
     * 
     * @return true если комментарий является ответом
     */
    public boolean isReply() {
        return parent != null;
    }

    /**
     * Добавляет ответ к комментарию
     * 
     * @param reply ответ на комментарий
     */
    public void addReply(Comment reply) {
        this.replies.add(reply);
        reply.setParent(this);
    }

    /**
     * Удаляет ответ из комментария
     * 
     * @param reply ответ для удаления
     */
    public void removeReply(Comment reply) {
        this.replies.remove(reply);
        if (reply.getParent() == this) {
            reply.setParent(null);
        }
    }
}