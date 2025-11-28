package com.example.app.security;

import com.example.app.model.entity.User;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Кастомная реализация UserDetails
 * 
 * Содержит информацию о пользователе для Spring Security
 */
@Data
public class CustomUserDetails implements UserDetails {

    private final Long id;
    private final String username;
    private final String email;
    private final String password;
    private final String firstName;
    private final String lastName;
    private final Collection<? extends GrantedAuthority> authorities;
    private final boolean accountNonExpired;
    private final boolean accountNonLocked;
    private final boolean credentialsNonExpired;
    private final boolean enabled;

    /**
     * Конструктор на основе сущности User
     * 
     * @param user сущность пользователя
     */
    public CustomUserDetails(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.authorities = user.getAuthorities();
        this.accountNonExpired = true;
        this.accountNonLocked = !user.isLocked();
        this.credentialsNonExpired = true;
        this.enabled = user.isActive();
    }

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
     * Проверяет имеет ли пользователь указанную роль
     * 
     * @param role роль для проверки
     * @return true если пользователь имеет указанную роль
     */
    public boolean hasRole(String role) {
        return authorities.stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role));
    }

    /**
     * Проверяет имеет ли пользователь хотя бы одну из указанных ролей
     * 
     * @param roles список ролей для проверки
     * @return true если пользователь имеет хотя бы одну из указанных ролей
     */
    public boolean hasAnyRole(String... roles) {
        return authorities.stream()
                .anyMatch(authority -> {
                    for (String role : roles) {
                        if (authority.getAuthority().equals("ROLE_" + role)) {
                            return true;
                        }
                    }
                    return false;
                });
    }

    /**
     * Возвращает список названий ролей пользователя
     * 
     * @return список названий ролей
     */
    public List<String> getRoleNames() {
        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .map(role -> role.substring(5)) // Удаляем "ROLE_" префикс
                .collect(Collectors.toList());
    }

    /**
     * Проверяет является ли пользователь администратором
     * 
     * @return true если пользователь является администратором
     */
    public boolean isAdmin() {
        return hasRole("ADMIN");
    }

    /**
     * Проверяет является ли пользователь модератором или администратором
     * 
     * @return true if пользователь является модератором или администратором
     */
    public boolean isModerator() {
        return hasAnyRole("MODERATOR", "ADMIN");
    }

    /**
     * Возвращает ID пользователя
     * 
     * @return ID пользователя
     */
    public Long getUserId() {
        return id;
    }

    @Override
    public String toString() {
        return "CustomUserDetails{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", authorities=" + authorities +
                ", accountNonExpired=" + accountNonExpired +
                ", accountNonLocked=" + accountNonLocked +
                ", credentialsNonExpired=" + credentialsNonExpired +
                ", enabled=" + enabled +
                '}';
    }
}