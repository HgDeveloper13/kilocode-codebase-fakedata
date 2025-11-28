package com.example.app.security;

import com.example.app.model.entity.User;
import com.example.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Кастомная реализация UserDetailsService
 * 
 * Загружает данные пользователя из базы данных для аутентификации
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Загружает пользователя по имени пользователя
     * 
     * @param username имя пользователя
     * @return UserDetails объект с информацией о пользователе
     * @throws UsernameNotFoundException если пользователь не найден
     */
    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Загрузка пользователя по имени: {}", username);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(
                        String.format("Пользователь с именем %s не найден", username)));
        
        if (!user.isActive()) {
            throw new UsernameNotFoundException(
                    String.format("Пользователь %s неактивен", username));
        }
        
        if (user.isLocked()) {
            throw new UsernameNotFoundException(
                    String.format("Пользователь %s заблокирован", username));
        }
        
        log.debug("Пользователь {} успешно загружен", username);
        return new CustomUserDetails(user);
    }

    /**
     * Загружает пользователя по ID
     * 
     * @param userId ID пользователя
     * @return UserDetails объект с информацией о пользователе
     * @throws UsernameNotFoundException если пользователь не найден
     */
    @Transactional
    public UserDetails loadUserById(Long userId) throws UsernameNotFoundException {
        log.debug("Загрузка пользователя по ID: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException(
                        String.format("Пользователь с ID %d не найден", userId)));
        
        if (!user.isActive()) {
            throw new UsernameNotFoundException(
                    String.format("Пользователь с ID %d неактивен", userId));
        }
        
        if (user.isLocked()) {
            throw new UsernameNotFoundException(
                    String.format("Пользователь с ID %d заблокирован", userId));
        }
        
        log.debug("Пользователь {} успешно загружен по ID", userId);
        return new CustomUserDetails(user);
    }
}