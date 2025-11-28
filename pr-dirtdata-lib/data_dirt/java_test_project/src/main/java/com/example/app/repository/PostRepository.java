package com.example.app.repository;

import com.example.app.model.entity.Post;
import com.example.app.model.entity.Post.Status;
import com.example.app.model.entity.User;
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
 * Репозиторий для работы с постами
 */
@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    /**
     * Находит опубликованные посты
     * 
     * @param pageable параметры пагинации
     * @return страница опубликованных постов
     */
    Page<Post> findByStatusOrderByPublishedAtDesc(Status status, Pageable pageable);

    /**
     * Находит посты по автору
     * 
     * @param author автор постов
     * @param pageable параметры пагинации
     * @return страница постов автора
     */
    Page<Post> findByAuthorOrderByCreatedAtDesc(User author, Pageable pageable);

    /**
     * Находит посты по автору и статусу
     * 
     * @param author автор постов
     * @param status статус постов
     * @param pageable параметры пагинации
     * @return страница постов автора с указанным статусом
     */
    Page<Post> findByAuthorAndStatusOrderByCreatedAtDesc(User author, Status status, Pageable pageable);

    /**
     * Находит посты по slug
     * 
     * @param slug slug поста
     * @return Optional с найденным постом
     */
    Optional<Post> findBySlug(String slug);

    /**
     * Находит посты по статусу и диапазону дат публикации
     * 
     * @param status статус постов
     * @param startDate начальная дата
     * @param endDate конечная дата
     * @param pageable параметры пагинации
     * @return страница постов
     */
    Page<Post> findByStatusAndPublishedAtBetween(
            Status status, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    /**
     * Находит посты по названию (частичное совпадение)
     * 
     * @param title часть названия поста
     * @param pageable параметры пагинации
     * @return страница постов
     */
    @Query("SELECT p FROM Post p WHERE p.title LIKE %:title% AND p.status = 'PUBLISHED'")
    Page<Post> findByTitleContainingAndStatusPublished(@Param("title") String title, Pageable pageable);

    /**
     * Находит посты по тегу
     * 
     * @param tagId ID тега
     * @param pageable параметры пагинации
     * @return страница постов с указанным тегом
     */
    @Query("SELECT p FROM Post p JOIN p.tags t WHERE t.id = :tagId AND p.status = 'PUBLISHED'")
    Page<Post> findByTagIdAndStatusPublished(@Param("tagId") Long tagId, Pageable pageable);

    /**
     * Находит посты с наибольшим количеством просмотров
     * 
     * @param limit количество постов
     * @return список популярных постов
     */
    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' ORDER BY p.viewCount DESC")
    List<Post> findTopByStatusPublishedOrderByViewCountDesc(Pageable limit);

    /**
     * Находит посты с наибольшим количеством комментариев
     * 
     * @param limit количество постов
     * @return список постов с большим количеством комментариев
     */
    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' ORDER BY p.commentCount DESC")
    List<Post> findTopByStatusPublishedOrderByCommentCountDesc(Pageable limit);

    /**
     * Находит посты, опубликованные в указанном месяце и году
     * 
     * @param year год публикации
     * @param month месяц публикации (1-12)
     * @param pageable параметры пагинации
     * @return страница постов
     */
    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' AND YEAR(p.publishedAt) = :year AND MONTH(p.publishedAt) = :month")
    Page<Post> findByPublishedAtYearAndMonth(@Param("year") int year, @Param("month") int month, Pageable pageable);

    /**
     * Находит посты по автору с полной загрузкой связанных сущностей
     * 
     * @param author автор постов
     * @param pageable параметры пагинации
     * @return страница постов с загруженными связями
     */
    @EntityGraph(attributePaths = {"author", "tags"})
    Page<Post> findByAuthorWithDetails(User author, Pageable pageable);

    /**
     * Подсчитывает количество постов по статусу
     * 
     * @param status статус постов
     * @return количество постов
     */
    long countByStatus(Status status);

    /**
     * Подсчитывает количество постов автора
     * 
     * @param author автор постов
     * @return количество постов автора
     */
    long countByAuthor(User author);

    /**
     * Подсчитывает количество опубликованных постов автора
     * 
     * @param author автор постов
     * @return количество опубликованных постов автора
     */
    long countByAuthorAndStatus(User author, Status status);

    /**
     * Проверяет существование поста с таким slug
     * 
     * @param slug slug поста
     * @param excludeId ID поста, который нужно исключить из проверки
     * @return true если пост с таким slug существует
     */
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Post p WHERE p.slug = :slug AND p.id != :excludeId")
    boolean existsBySlugAndIdIsNot(@Param("slug") String slug, @Param("excludeId") Long excludeId);

    /**
     * Находит случайные опубликованные посты
     * 
     * @param limit количество постов
     * @return список случайных постов
     */
    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' ORDER BY RAND()")
    List<Post> findRandomPublishedPosts(Pageable limit);

    /**
     * Находит посты с тегами для архивной страницы
     * 
     * @param pageable параметры пагинации
     * @return страница постов с тегами
     */
    @EntityGraph(attributePaths = {"author", "tags"})
    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' ORDER BY p.publishedAt DESC")
    Page<Post> findPublishedPostsWithDetails(Pageable pageable);
}