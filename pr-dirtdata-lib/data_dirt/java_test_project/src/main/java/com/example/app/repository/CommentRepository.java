package com.example.app.repository;

import com.example.app.model.entity.Comment;
import com.example.app.model.entity.Comment.Status;
import com.example.app.model.entity.Post;
import com.example.app.model.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Репозиторий для работы с комментариями
 */
@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    /**
     * Находит комментарии поста
     * 
     * @param post пост
     * @param pageable параметры пагинации
     * @return страница комментариев поста
     */
    Page<Comment> findByPostAndParentIsNullOrderByCreatedAtDesc(Post post, Pageable pageable);

    /**
     * Находит комментарии поста с указанным статусом
     * 
     * @param post пост
     * @param status статус комментариев
     * @param pageable параметры пагинации
     * @return страница комментариев
     */
    Page<Comment> findByPostAndStatusOrderByCreatedAtDesc(Post post, Status status, Pageable pageable);

    /**
     * Находит комментарии пользователя
     * 
     * @param user пользователь
     * @param pageable параметры пагинации
     * @return страница комментариев пользователя
     */
    Page<Comment> findByAuthorOrderByCreatedAtDesc(User user, Pageable pageable);

    /**
     * Находит комментарии пользователя с указанным статусом
     * 
     * @param user пользователь
     * @param status статус комментариев
     * @param pageable параметры пагинации
     * @return страница комментариев пользователя
     */
    Page<Comment> findByAuthorAndStatusOrderByCreatedAtDesc(User user, Status status, Pageable pageable);

    /**
     * Находит ответы на комментарий
     * 
     * @param parent родительский комментарий
     * @param pageable параметры пагинации
     * @return страница ответов
     */
    Page<Comment> findByParentOrderByCreatedAtAsc(Comment parent, Pageable pageable);

    /**
     * Находит комментарии, ожидающие модерации
     * 
     * @param pageable параметры пагинации
     * @return страница комментариев на модерации
     */
    Page<Comment> findByStatusOrderByCreatedAtAsc(Status status, Pageable pageable);

    /**
     * Находит комментарии по диапазону дат
     * 
     * @param startDate начальная дата
     * @param endDate конечная дата
     * @param pageable параметры пагинации
     * @return страница комментариев
     */
    Page<Comment> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    /**
     * Находит комментарии к нескольким постам
     * 
     * @param posts список постов
     * @param status статус комментариев
     * @param pageable параметры пагинации
     * @return страница комментариев
     */
    @Query("SELECT c FROM Comment c WHERE c.post IN :posts AND c.status = :status ORDER BY c.createdAt DESC")
    Page<Comment> findByPostInAndStatus(List<Post> posts, Status status, Pageable pageable);

    /**
     * Находит последние комментарии к постам
     * 
     * @param posts список постов
     * @param limit количество комментариев
     * @return список последних комментариев
     */
    @Query("SELECT c FROM Comment c WHERE c.post IN :posts AND c.status = 'APPROVED' ORDER BY c.createdAt DESC")
    List<Comment> findRecentCommentsByPosts(@Param("posts") List<Post> posts, Pageable limit);

    /**
     * Подсчитывает количество комментариев поста
     * 
     * @param post пост
     * @param status статус комментариев
     * @return количество комментариев
     */
    long countByPostAndStatus(Post post, Status status);

    /**
     * Подсчитывает количество комментариев пользователя
     * 
     * @param user пользователь
     * @return количество комментариев пользователя
     */
    long countByAuthor(User user);

    /**
     * Подсчитывает количество комментариев пользователя с указанным статусом
     * 
     * @param user пользователь
     * @param status статус комментариев
     * @return количество комментариев
     */
    long countByAuthorAndStatus(User user, Status status);

    /**
     * Подсчитывает количество ответов на комментарий
     * 
     * @param parent родительский комментарий
     * @return количество ответов
     */
    long countByParent(Comment parent);

    /**
     * Проверяет, оставил ли пользователь комментарий к посту
     * 
     * @param user пользователь
     * @param post пост
     * @return true если пользователь оставил комментарий
     */
    boolean existsByAuthorAndPost(User user, Post post);

    /**
     * Проверяет, оставил ли пользователь комментарий с таким содержимым
     * 
     * @param user пользователь
     * @param post пост
     * @param content содержимое комментария
     * @param hoursPeriod период в часах
     * @return true если комментарий существует в указанном периоде
     */
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Comment c " +
           "WHERE c.author = :user AND c.post = :post AND c.content = :content " +
           "AND c.createdAt > :cutoffTime")
    boolean existsByAuthorAndPostAndContentAndCreatedAtAfter(
            @Param("user") User user,
            @Param("post") Post post,
            @Param("content") String content,
            @Param("cutoffTime") LocalDateTime cutoffTime);

    /**
     * Находит комментарии для модерации с информацией о посте и авторе
     * 
     * @param status статус комментариев
     * @param pageable параметры пагинации
     * @return страница комментариев для модерации
     */
    @Query("SELECT c FROM Comment c WHERE c.status = :status ORDER BY c.createdAt ASC")
    Page<Comment> findCommentsForModeration(@Param("status") Status status, Pageable pageable);
}