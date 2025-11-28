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
 * Сущность тега для категоризации постов
 * 
 * Используется для группировки и поиска постов по тематике
 */
@Entity
@Table(name = "tags",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = "name"),
           @UniqueConstraint(columnNames = "slug")
       },
       indexes = {
           @Index(name = "idx_tag_name", columnList = "name"),
           @Index(name = "idx_tag_slug", columnList = "slug")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class Tag extends BaseEntity<Long> {

    @Column(name = "name", nullable = false, length = 100)
    @NotBlank(message = "Название тега не может быть пустым")
    @Size(max = 100, message = "Название не может быть длиннее 100 символов")
    private String name;

    @Column(name = "slug", nullable = false, length = 100)
    @NotBlank(message = "Slug тега не может быть пустым")
    @Size(max = 100, message = "Slug не может быть длиннее 100 символов")
    private String slug;

    @Column(name = "description", length = 500)
    @Size(max = 500, message = "Описание не может быть длиннее 500 символов")
    private String description;

    @Column(name = "color", length = 7)
    @Size(max = 7, message = "Цвет не может быть длиннее 7 символов")
    @Builder.Default
    private String color = "#007bff";

    @Column(name = "post_count")
    @Builder.Default
    private Long postCount = 0L;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToMany(mappedBy = "tags")
    @ToString.Exclude
    @Builder.Default
    private List<Post> posts = new ArrayList<>();

    /**
     * Увеличивает счетчик постов с этим тегом
     */
    public void incrementPostCount() {
        this.postCount++;
    }

    /**
     * Уменьшает счетчик постов с этим тегом
     */
    public void decrementPostCount() {
        if (this.postCount > 0) {
            this.postCount--;
        }
    }

    /**
     * Проверяет, используется ли тег в постах
     * 
     * @return true если тег используется
     */
    public boolean isUsed() {
        return postCount > 0;
    }

    /**
     * Генерирует slug из названия тега
     * Заменяет пробелы и специальные символы на дефисы
     * 
     * @param name название тега
     * @return сгенерированный slug
     */
    public static String generateSlug(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "";
        }
        return name.trim()
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s]", "")
                .replaceAll("\\s+", "-");
    }

    /**
     * Проверяет, является ли цвет валидным HEX цветом
     * 
     * @param color цвет в формате #RRGGBB
     * @return true если цвет валидный
     */
    public static boolean isValidColor(String color) {
        if (color == null || color.isEmpty()) {
            return false;
        }
        return color.matches("^#[0-9a-fA-F]{6}$");
    }

    /**
     * Устанавливает slug на основе названия
     */
    public void generateSlug() {
        this.slug = generateSlug(this.name);
    }

    /**
     * Устанавливает цвет тега после валидации
     * 
     * @param color цвет в формате #RRGGBB
     * @throws IllegalArgumentException если цвет не валиден
     */
    public void setColor(String color) {
        if (color != null && !isValidColor(color)) {
            throw new IllegalArgumentException("Некорректный формат цвета: " + color);
        }
        this.color = color != null ? color : "#007bff";
    }

    /**
     * Добавляет пост к тегу
     * 
     * @param post пост для добавления
     */
    public void addPost(Post post) {
        this.posts.add(post);
        post.getTags().add(this);
        incrementPostCount();
    }

    /**
     * Удаляет пост из тега
     * 
     * @param post пост для удаления
     */
    public void removePost(Post post) {
        this.posts.remove(post);
        post.getTags().remove(this);
        decrementPostCount();
    }
}