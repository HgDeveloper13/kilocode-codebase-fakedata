package com.example.app.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Сущность поста (статьи) в блоге
 * 
 * Представляет собой публикацию пользователя с содержимым,
 * метаданными и комментариями
 */
@Entity
@Table(name = "posts", 
       indexes = {
           @Index(name = "idx_post_status", columnList = "status"),
           @Index(name = "idx_post_author", columnList = "author_id"),
           @Index(name = "idx_post_created", columnList = "createdAt")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class Post extends BaseEntity<Long> {

    @Column(name = "title", nullable = false, length = 200)
    @NotBlank(message = "Заголовок поста не может быть пустым")
    @Size(max = 200, message = "Заголовок не может быть длиннее 200 символов")
    private String title;

    @Column(name = "content", nullable = false, length = 10000)
    @NotBlank(message = "Содержимое поста не может быть пустым")
    @Size(max = 10000, message = "Содержимое не может быть длиннее 10000 символов")
    private String content;

    @Column(name = "excerpt", length = 500)
    @Size(max = 500, message = "Анонс не может быть длиннее 500 символов")
    private String excerpt;

    @Column(name = "slug", nullable = false, length = 200, unique = true)
    @NotBlank(message = "Slug не может быть пустым")
    @Size(max = 200, message = "Slug не может быть длиннее 200 символов")
    private String slug;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private Status status = Status.DRAFT;

    @Column(name = "view_count")
    @Builder.Default
    private Long viewCount = 0L;

    @Column(name = "like_count")
    @Builder.Default
    private Long likeCount = 0L;

    @Column(name = "comment_count")
    @Builder.Default
    private Long commentCount = 0L;

    @CreationTimestamp
    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "featured_image", length = 500)
    @Size(max = 500, message = "URL изображения не может быть длиннее 500 символов")
    private String featuredImage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    @ToString.Exclude
    private User author;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "post_tag",
        joinColumns = @JoinColumn(name = "post_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @ToString.Exclude
    @Builder.Default
    private List<Tag> tags = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Перечисление статусов поста
     */
    public enum Status {
        DRAFT,     // Черновик
        PUBLISHED, // Опубликован
        ARCHIVED,  // В архиве
        REJECTED   // Отклонен
    }

    /**
     * Проверяет, опубликован ли пост
     * 
     * @return true если пост опубликован
     */
    public boolean isPublished() {
        return status == Status.PUBLISHED;
    }

    /**
     * Проверяет, является ли пост черновиком
     * 
     * @return true если пост является черновиком
     */
    public boolean isDraft() {
        return status == Status.DRAFT;
    }

    /**
     * Увеличивает счетчик просмотров
     */
    public void incrementViewCount() {
        this.viewCount++;
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
     * Увеличивает счетчик комментариев
     */
    public void incrementCommentCount() {
        this.commentCount++;
    }

    /**
     * Уменьшает счетчик комментариев
     */
    public void decrementCommentCount() {
        if (this.commentCount > 0) {
            this.commentCount--;
        }
    }

    /**
     * Публикует пост (устанавливает статус PUBLISHED и дату публикации)
     */
    public void publish() {
        this.status = Status.PUBLISHED;
        if (this.publishedAt == null) {
            this.publishedAt = LocalDateTime.now();
        }
    }

    /**
     * Архивирует пост
     */
    public void archive() {
        this.status = Status.ARCHIVED;
    }

    /**
     * Отклоняет пост
     */
    public void reject() {
        this.status = Status.REJECTED;
    }

    /**
     * Добавляет тег к посту
     * 
     * @param tag тег для добавления
     */
    public void addTag(Tag tag) {
        this.tags.add(tag);
        tag.getPosts().add(this);
    }

    /**
     * Удаляет тег из поста
     * 
     * @param tag тег для удаления
     */
    public void removeTag(Tag tag) {
        this.tags.remove(tag);
        tag.getPosts().remove(this);
    }
}