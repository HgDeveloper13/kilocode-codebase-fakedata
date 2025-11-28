package com.example.app.repository;

import com.example.app.model.entity.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Репозиторий для работы с тегами
 */
@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {

    /**
     * Находит тег по названию
     * 
     * @param name название тега
     * @return Optional с найденным тегом
     */
    Optional<Tag> findByName(String name);

    /**
     * Находит тег по slug
     * 
     * @param slug slug тега
     * @return Optional с найденным тегом
     */
    Optional<Tag> findBySlug(String slug);

    /**
     * Проверяет существует ли тег с таким названием
     * 
     * @param name название тега
     * @param excludeId ID тега, который нужно исключить из проверки
     * @return true если тег существует
     */
    boolean existsByNameAndIdIsNot(String name, Long excludeId);

    /**
     * Проверяет существует ли тег с таким slug
     * 
     * @param slug slug тега
     * @param excludeId ID тега, который нужно исключить из проверки
     * @return true если тег существует
     */
    boolean existsBySlugAndIdIsNot(String slug, Long excludeId);

    /**
     * Находит теги, используемые в постах (с количеством постов больше 0)
     * 
     * @param pageable параметры пагинации
     * @return страница используемых тегов
     */
    @Query("SELECT t FROM Tag t WHERE t.postCount > 0 ORDER BY t.postCount DESC")
    Page<Tag> findUsedTagsOrderByPostCountDesc(Pageable pageable);

    /**
     * Находит теги по количеству постов в указанном диапазоне
     * 
     * @param minPostCount минимальное количество постов
     * @param maxPostCount максимальное количество постов
     * @param pageable параметры пагинации
     * @return страница тегов
     */
    @Query("SELECT t FROM Tag t WHERE t.postCount BETWEEN :minPostCount AND :maxPostCount ORDER BY t.postCount DESC")
    Page<Tag> findByPostCountBetween(@Param("minPostCount") Long minPostCount, 
                                     @Param("maxPostCount") Long maxPostCount, Pageable pageable);

    /**
     * Находит популярные теги (с наибольшим количеством постов)
     * 
     * @param limit количество тегов
     * @return список популярных тегов
     */
    @Query("SELECT t FROM Tag t ORDER BY t.postCount DESC")
    List<Tag> findTopTagsByPostCount(Pageable limit);

    /**
     * Находит теги, начинающиеся с указанной строки
     * 
     * @param prefix начальная часть названия
     * @param pageable параметры пагинации
     * @return страница тегов
     */
    @Query("SELECT t FROM Tag t WHERE t.name LIKE :prefix% ORDER BY t.name ASC")
    Page<Tag> findByNameStartingWith(@Param("prefix") String prefix, Pageable pageable);

    /**
     * Подсчитывает количество используемых тегов
     * 
     * @return количество используемых тегов
     */
    @Query("SELECT COUNT(t) FROM Tag t WHERE t.postCount > 0")
    long countUsedTags();

    /**
     * Подсчитывает количество неиспользуемых тегов
     * 
     * @return количество неиспользуемых тегов
     */
    @Query("SELECT COUNT(t) FROM Tag t WHERE t.postCount = 0")
    long countUnusedTags();

    /**
     * Находит теги для автозаполнения при создании постов
     * 
     * @param searchTerm поисковый запрос
     * @param limit максимальное количество результатов
     * @return список тегов для автозаполнения
     */
    @Query("SELECT t FROM Tag t WHERE t.name LIKE %:searchTerm% OR t.slug LIKE %:searchTerm% ORDER BY t.postCount DESC, t.name ASC")
    List<Tag> findTagsForAutocomplete(@Param("searchTerm") String searchTerm, Pageable limit);

    /**
     * Обновляет количество постов для тега
     * 
     * @param tagId ID тега
     * @param newCount новое количество постов
     */
    @Query("UPDATE Tag t SET t.postCount = :newCount WHERE t.id = :tagId")
    void updatePostCount(@Param("tagId") Long tagId, @Param("newCount") Long newCount);

    /**
     * Увеличивает количество постов для тега
     * 
     * @param tagId ID тега
     */
    default void incrementPostCount(Long tagId) {
        Optional<Tag> tagOpt = findById(tagId);
        if (tagOpt.isPresent()) {
            Tag tag = tagOpt.get();
            tag.incrementPostCount();
            save(tag);
        }
    }

    /**
     * Уменьшает количество постов для тега
     * 
     * @param tagId ID тега
     */
    default void decrementPostCount(Long tagId) {
        Optional<Tag> tagOpt = findById(tagId);
        if (tagOpt.isPresent()) {
            Tag tag = tagOpt.get();
            tag.decrementPostCount();
            save(tag);
        }
    }

    /**
     * Проверяет, используется ли тег в опубликованных постах
     * 
     * @param tagId ID тега
     * @return true если тег используется в опубликованных постах
     */
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Tag t JOIN t.posts p WHERE t.id = :tagId AND p.status = 'PUBLISHED'")
    boolean isTagUsedInPublishedPosts(@Param("tagId") Long tagId);
}