package com.example.app.controller;

import com.example.app.exception.ResourceNotFoundException;
import com.example.app.model.dto.ApiResponse;
import com.example.app.model.entity.Post;
import com.example.app.model.entity.Tag;
import com.example.app.model.entity.User;
import com.example.app.security.CustomUserDetails;
import com.example.app.service.PostService;
import com.example.app.service.TagService;
import com.example.app.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST контроллер для управления постами
 * 
 * Обрабатывает CRUD операции для постов и взаимодействие с ними
 */
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Slf4j
public class PostController {

    private final PostService postService;
    private final TagService tagService;
    private final UserService userService;

    /**
     * Получение всех опубликованных постов
     * 
     * @param page номер страницы (по умолчанию 0)
     * @param size размер страницы (по умолчанию 10)
     * @param sort поле для сортировки (по умолчанию publishedAt)
     * @param direction направление сортировки (по умолчанию DESC)
     * @return страница опубликованных постов
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<Post>>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "publishedAt") String sort,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {
        
        log.debug("Получение постов: страница={}, размер={}, сортировка={}, направление={}", 
                  page, size, sort, direction);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort));
        Page<Post> posts = postService.findPublishedPosts(pageable);
        
        return ResponseEntity.ok(ApiResponse.success(posts));
    }

    /**
     * Получение поста по ID
     * 
     * @param id ID поста
     * @return найденный пост
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Post>> getPostById(@PathVariable Long id) {
        log.debug("Получение поста по ID: {}", id);
        
        Post post = postService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Пост", "id", id));
        
        // Увеличиваем счетчик просмотров
        post.incrementViewCount();
        postService.save(post);
        
        return ResponseEntity.ok(ApiResponse.success(post));
    }

    /**
     * Получение поста по slug
     * 
     * @param slug slug поста
     * @return найденный пост
     */
    @GetMapping("/slug/{slug}")
    public ResponseEntity<ApiResponse<Post>> getPostBySlug(@PathVariable String slug) {
        log.debug("Получение поста по slug: {}", slug);
        
        Post post = postService.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Пост", "slug", slug));
        
        if (!post.isPublished()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Пост не опубликован"));
        }
        
        // Увеличиваем счетчик просмотров
        post.incrementViewCount();
        postService.save(post);
        
        return ResponseEntity.ok(ApiResponse.success(post));
    }

    /**
     * Создание нового поста
     * 
     * @param post данные для создания поста
     * @return созданный пост
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Post>> createPost(@Valid @RequestBody Post post) {
        log.info("Создание нового поста: {}", post.getTitle());
        
        try {
            // Получаем текущего пользователя
            CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder
                    .getContext().getAuthentication().getPrincipal();
            
            User author = userService.findById(userDetails.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Пользователь", "id", userDetails.getUserId()));
            
            post.setAuthor(author);
            
            // Если статус не указан, устанавливаем как черновик
            if (post.getStatus() == null) {
                post.setStatus(Post.Status.DRAFT);
            }
            
            Post createdPost = postService.save(post);
            log.info("Пост успешно создан: {}", createdPost.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(createdPost));
            
        } catch (ResourceNotFoundException e) {
            log.error("Пользователь не найден при создании поста: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Пользователь не найден"));
        } catch (Exception e) {
            log.error("Ошибка при создании поста: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Ошибка при создании поста"));
        }
    }

    /**
     * Обновление поста
     * 
     * @param id ID поста
     * @param post данные для обновления поста
     * @return обновленный пост
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Post>> updatePost(@PathVariable Long id, @Valid @RequestBody Post post) {
        log.info("Обновление поста: {}", id);
        
        try {
            Post existingPost = postService.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Пост", "id", id));
            
            // Проверяем права на редактирование
            CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder
                    .getContext().getAuthentication().getPrincipal();
            
            if (!existingPost.getAuthor().getId().equals(userDetails.getUserId()) && !userDetails.hasRole("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Нет прав на редактирование этого поста"));
            }
            
            post.setId(id);
            post.setAuthor(existingPost.getAuthor());
            post.setCreatedAt(existingPost.getCreatedAt());
            post.setViewCount(existingPost.getViewCount());
            post.setLikeCount(existingPost.getLikeCount());
            post.setCommentCount(existingPost.getCommentCount());
            
            Post updatedPost = postService.save(post);
            log.info("Пост успешно обновлен: {}", updatedPost.getId());
            
            return ResponseEntity.ok(ApiResponse.success(updatedPost));
            
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Ошибка при обновлении поста: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Ошибка при обновлении поста"));
        }
    }

    /**
     * Удаление поста
     * 
     * @param id ID поста
     * @return сообщение об успешном удалении
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deletePost(@PathVariable Long id) {
        log.info("Удаление поста: {}", id);
        
        try {
            Post existingPost = postService.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Пост", "id", id));
            
            // Проверяем права на удаление
            CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder
                    .getContext().getAuthentication().getPrincipal();
            
            if (!existingPost.getAuthor().getId().equals(userDetails.getUserId()) && !userDetails.hasRole("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Нет прав на удаление этого поста"));
            }
            
            postService.delete(id);
            log.info("Пост успешно удален: {}", id);
            
            return ResponseEntity.ok(ApiResponse.success("Пост успешно удален"));
            
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Ошибка при удалении поста: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Ошибка при удалении поста"));
        }
    }

    /**
     * Публикация поста
     * 
     * @param id ID поста
     * @return опубликованный пост
     */
    @PostMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<Post>> publishPost(@PathVariable Long id) {
        log.info("Публикация поста: {}", id);
        
        try {
            Post existingPost = postService.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Пост", "id", id));
            
            // Проверяем права на публикацию
            CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder
                    .getContext().getAuthentication().getPrincipal();
            
            if (!existingPost.getAuthor().getId().equals(userDetails.getUserId()) && 
                !userDetails.hasAnyRole("MODERATOR", "ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Нет прав на публикацию этого поста"));
            }
            
            existingPost.publish();
            Post publishedPost = postService.save(existingPost);
            
            log.info("Пост успешно опубликован: {}", publishedPost.getId());
            return ResponseEntity.ok(ApiResponse.success(publishedPost));
            
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Ошибка при публикации поста: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Ошибка при публикации поста"));
        }
    }

    /**
     * Добавление тега к посту
     * 
     * @param postId ID поста
     * @param tagId ID тега
     * @return обновленный пост
     */
    @PostMapping("/{postId}/tags/{tagId}")
    public ResponseEntity<ApiResponse<Post>> addTagToPost(@PathVariable Long postId, @PathVariable Long tagId) {
        log.info("Добавление тега {} к посту {}", tagId, postId);
        
        try {
            Post post = postService.findById(postId)
                    .orElseThrow(() -> new ResourceNotFoundException("Пост", "id", postId));
            
            Tag tag = tagService.findById(tagId)
                    .orElseThrow(() -> new ResourceNotFoundException("Тег", "id", tagId));
            
            post.addTag(tag);
            Post updatedPost = postService.save(post);
            
            log.info("Тег успешно добавлен к посту: {}", updatedPost.getId());
            return ResponseEntity.ok(ApiResponse.success(updatedPost));
            
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Ошибка при добавлении тега к посту: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Ошибка при добавлении тега к посту"));
        }
    }

    /**
     * Удаление тега из поста
     * 
     * @param postId ID поста
     * @param tagId ID тега
     * @return обновленный пост
     */
    @DeleteMapping("/{postId}/tags/{tagId}")
    public ResponseEntity<ApiResponse<Post>> removeTagFromPost(@PathVariable Long postId, @PathVariable Long tagId) {
        log.info("Удаление тега {} из поста {}", tagId, postId);
        
        try {
            Post post = postService.findById(postId)
                    .orElseThrow(() -> new ResourceNotFoundException("Пост", "id", postId));
            
            Tag tag = tagService.findById(tagId)
                    .orElseThrow(() -> new ResourceNotFoundException("Тег", "id", tagId));
            
            post.removeTag(tag);
            Post updatedPost = postService.save(post);
            
            log.info("Тег успешно удален из поста: {}", updatedPost.getId());
            return ResponseEntity.ok(ApiResponse.success(updatedPost));
            
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Ошибка при удалении тега из поста: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Ошибка при удалении тега из поста"));
        }
    }

    /**
     * Поиск постов по названию
     * 
     * @param title часть названия для поиска
     * @param page номер страницы
     * @param size размер страницы
     * @return страница найденных постов
     */
    @GetMapping("/search/title")
    public ResponseEntity<ApiResponse<Page<Post>>> searchPostsByTitle(
            @RequestParam String title,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        log.debug("Поиск постов по названию: {}, страница={}, размер={}", title, page, size);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> posts = postService.findByTitleContainingAndStatusPublished(title, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(posts));
    }

    /**
     * Получение постов по тегу
     * 
     * @param tagId ID тега
     * @param page номер страницы
     * @param size размер страницы
     * @return страница постов с указанным тегом
     */
    @GetMapping("/tag/{tagId}")
    public ResponseEntity<ApiResponse<Page<Post>>> getPostsByTag(
            @PathVariable Long tagId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        log.debug("Получение постов по тегу: {}, страница={}, размер={}", tagId, page, size);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> posts = postService.findByTagIdAndStatusPublished(tagId, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(posts));
    }

    /**
     * Получение популярных постов
     * 
     * @param limit количество постов
     * @return список популярных постов
     */
    @GetMapping("/popular")
    public ResponseEntity<ApiResponse<List<Post>>> getPopularPosts(
            @RequestParam(defaultValue = "10") int limit) {
        
        log.debug("Получение популярных постов: количество={}", limit);
        
        Pageable pageable = PageRequest.of(0, limit);
        List<Post> posts = postService.findTopByStatusPublishedOrderByViewCountDesc(pageable);
        
        return ResponseEntity.ok(ApiResponse.success(posts));
    }
}