package com.example.app.model.entity;

import com.example.app.model.enums.UserStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Сущность пользователя системы
 * 
 * Содержит основную информацию о пользователе: учетные данные,
 * персональные данные, статус и роль в системе
 */
@Entity
@Table(name = "users", 
       uniqueConstraints = {
           @UniqueConstraint(columnNames = "username"),
           @UniqueConstraint(columnNames = "email")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class User extends BaseEntity<Long> {

    @Column(name = "username", nullable = false, length = 50)
    @NotBlank(message = "Имя пользователя не может быть пустым")
    @Size(min = 3, max = 50, message = "Имя пользователя должно быть от 3 до 50 символов")
    private String username;

    @Column(name = "email", nullable = false, length = 100)
    @NotBlank(message = "Email не может быть пустым")
    @Email(message = "Некорректный формат email")
    private String email;

    @Column(name = "password", nullable = false)
    @NotBlank(message = "Пароль не может быть пустым")
    @Size(min = 6, message = "Пароль должен быть не менее 6 символов")
    private String password;

    @Column(name = "first_name", length = 50)
    @Size(max = 50, message = "Имя не может быть длиннее 50 символов")
    private String firstName;

    @Column(name = "last_name", length = 50)
    @Size(max = 50, message = "Фамилия не может быть длиннее 50 символов")
    private String lastName;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private UserStatus status = UserStatus.PENDING;

    @Column(name = "role", nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Role role = Role.USER;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "last_login")
    private java.time.LocalDateTime lastLogin;

    @Column(name = "failed_login_attempts")
    @Builder.Default
    private Integer failedLoginAttempts = 0;

    @Column(name = "locked_until")
    private java.time.LocalDateTime lockedUntil;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @Builder.Default
    private List<Notification> notifications = new ArrayList<>();

    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @Builder.Default
    private List<Post> posts = new ArrayList<>();

    /**
     * Возвращает полное имя пользователя
     * 
     * @return полное имя (имя + фамилия) или имя пользователя если имя не указано
     */
    public String getDisplayName() {
        if (firstName != null && !firstName.trim().isEmpty()) {
            if (lastName != null && !lastName.trim().isEmpty()) {
                return firstName + " " + lastName;
            } else {
                return firstName;
            }
        }
        return username;
    }

    /**
     * Проверяет, является ли пользователь активным
     * 
     * @return true если пользователь активен
     */
    public boolean isActive() {
        return status == UserStatus.ACTIVE;
    }

    /**
     * Проверяет, заблокирован ли пользователь
     * 
     * @return true если пользователь заблокирован
     */
    public boolean isLocked() {
        return lockedUntil != null && lockedUntil.isAfter(java.time.LocalDateTime.now());
    }

    /**
     * Сбрасывает количество неудачных попыток входа
     */
    public void resetFailedLoginAttempts() {
        this.failedLoginAttempts = 0;
        this.lockedUntil = null;
    }

    /**
     * Увеличивает количество неудачных попыток входа
     * Если превышено максимальное количество, блокирует пользователя на 30 минут
     */
    public void incrementFailedLoginAttempts() {
        this.failedLoginAttempts++;
        if (this.failedLoginAttempts >= 5) {
            this.lockedUntil = java.time.LocalDateTime.now().plusMinutes(30);
        }
    }

    /**
     * Возвращает authorities для Spring Security
     * 
     * @return коллекция прав пользователя
     */
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + this.role.name()));
        return authorities;
    }

    /**
     * Перечисление ролей пользователей
     */
    public enum Role {
        USER, ADMIN, MODERATOR
    }
}