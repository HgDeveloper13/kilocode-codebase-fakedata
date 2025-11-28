package com.example.app.service.impl;

import com.example.app.exception.ResourceNotFoundException;
import com.example.app.exception.UserAlreadyExistsException;
import com.example.app.model.entity.User;
import com.example.app.model.enums.UserStatus;
import com.example.app.repository.UserRepository;
import com.example.app.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Реализация сервиса для управления пользователями
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public Optional<User> findById(Long id) {
        log.debug("Поиск пользователя по ID: {}", id);
        return userRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> findByUsername(String username) {
        log.debug("Поиск пользователя по имени: {}", username);
        return userRepository.findByUsername(username);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        log.debug("Поиск пользователя по email: {}", email);
        return userRepository.findByEmail(email);
    }

    @Override
    @Transactional
    public User createUser(User user) {
        log.info("Создание нового пользователя: {}", user.getUsername());
        
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new UserAlreadyExistsException("Пользователь с именем " + user.getUsername() + " уже существует");
        }
        
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new UserAlreadyExistsException("Пользователь с email " + user.getEmail() + " уже существует");
        }
        
        user.setPassword(encodePassword(user.getPassword()));
        user.setStatus(UserStatus.PENDING);
        
        User savedUser = userRepository.save(user);
        log.info("Пользователь создан: {}", savedUser.getId());
        
        return savedUser;
    }

    @Override
    @Transactional
    public User updateUser(User user) {
        log.info("Обновление пользователя: {}", user.getId());
        
        User existingUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден с ID: " + user.getId()));
        
        if (!existingUser.getUsername().equals(user.getUsername()) && 
            userRepository.existsByUsername(user.getUsername())) {
            throw new UserAlreadyExistsException("Пользователь с именем " + user.getUsername() + " уже существует");
        }
        
        if (!existingUser.getEmail().equals(user.getEmail()) && 
            userRepository.existsByEmail(user.getEmail())) {
            throw new UserAlreadyExistsException("Пользователь с email " + user.getEmail() + " already exists");
        }
        
        // Не обновляем пароль, если он не указан
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            user.setPassword(existingUser.getPassword());
        } else {
            user.setPassword(encodePassword(user.getPassword()));
        }
        
        user.setStatus(existingUser.getStatus());
        user.setRole(existingUser.getRole());
        user.setCreatedAt(existingUser.getCreatedAt());
        user.setFailedLoginAttempts(existingUser.getFailedLoginAttempts());
        user.setLockedUntil(existingUser.getLockedUntil());
        
        User updatedUser = userRepository.save(user);
        log.info("Пользователь обновлен: {}", updatedUser.getId());
        
        return updatedUser;
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        log.info("Удаление пользователя: {}", id);
        
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("Пользователь не найден с ID: " + id);
        }
        
        userRepository.deleteById(id);
        log.info("Пользователь удален: {}", id);
    }

    @Override
    @Transactional
    public User activateUser(Long id) {
        log.info("Активация пользователя: {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден с ID: " + id));
        
        user.setStatus(UserStatus.ACTIVE);
        user.setLockedUntil(null);
        user.setFailedLoginAttempts(0);
        
        User updatedUser = userRepository.save(user);
        log.info("Пользователь активирован: {}", updatedUser.getId());
        
        return updatedUser;
    }

    @Override
    @Transactional
    public User deactivateUser(Long id) {
        log.info("Деактивация пользователя: {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден с ID: " + id));
        
        user.setStatus(UserStatus.INACTIVE);
        user.setLockedUntil(LocalDateTime.now());
        
        User updatedUser = userRepository.save(user);
        log.info("Пользователь деактивирован: {}", updatedUser.getId());
        
        return updatedUser;
    }

    @Override
    @Transactional
    public User lockUser(Long id, LocalDateTime until) {
        log.info("Блокировка пользователя: {} до {}", id, until);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден с ID: " + id));
        
        user.setLockedUntil(until);
        user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
        
        User updatedUser = userRepository.save(user);
        log.info("Пользователь заблокирован: {}", updatedUser.getId());
        
        return updatedUser;
    }

    @Override
    @Transactional
    public User unlockUser(Long id) {
        log.info("Разблокировка пользователя: {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден с ID: " + id));
        
        user.setLockedUntil(null);
        user.setFailedLoginAttempts(0);
        
        User updatedUser = userRepository.save(user);
        log.info("Пользователь разблокирован: {}", updatedUser.getId());
        
        return updatedUser;
    }

    @Override
    @Transactional
    public User updatePassword(Long id, String newPassword) {
        log.info("Обновление пароля для пользователя: {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден с ID: " + id));
        
        user.setPassword(encodePassword(newPassword));
        
        User updatedUser = userRepository.save(user);
        log.info("Пароль обновлен для пользователя: {}", updatedUser.getId());
        
        return updatedUser;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canUserLogin(String username) {
        return userRepository.canUserLogin(username);
    }

    @Override
    @Transactional
    public User resetFailedLoginAttempts(Long id) {
        log.debug("Сброс счетчика неудачных попыток для пользователя: {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден с ID: " + id));
        
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User incrementFailedLoginAttempts(Long id) {
        log.debug("Увеличение счетчика неудачных попыток для пользователя: {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден с ID: " + id));
        
        user.incrementFailedLoginAttempts();
        
        return userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<User> findAll(Pageable pageable) {
        log.debug("Получение всех пользователей с пагинацией: {}", pageable);
        return userRepository.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<User> findByStatus(UserStatus status, Pageable pageable) {
        log.debug("Получение пользователей по статусу: {} с пагинацией: {}", status, pageable);
        return userRepository.findByStatus(status, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<User> findByRole(User.Role role, Pageable pageable) {
        log.debug("Получение пользователей по роли: {} с пагинацией: {}", role, pageable);
        return userRepository.findByRole(role, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<User> findByStatusAndRole(UserStatus status, User.Role role, Pageable pageable) {
        log.debug("Получение пользователей по статусу: {} и роли: {} с пагинацией: {}", status, role, pageable);
        return userRepository.findByStatusAndRole(status, role, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> findLockedUsersBefore(LocalDateTime lockedUntil) {
        log.debug("Получение заблокированных пользователей до: {}", lockedUntil);
        return userRepository.findByLockedUntilBefore(lockedUntil);
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> findByFailedLoginAttemptsGreaterThan(Integer failedAttempts) {
        log.debug("Получение пользователей с количеством неудачных попыток больше: {}", failedAttempts);
        return userRepository.findByFailedLoginAttemptsGreaterThan(failedAttempts);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<User> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        log.debug("Получение пользователей по диапазону дат: {} - {} с пагинацией: {}", startDate, endDate, pageable);
        return userRepository.findByCreatedAtBetween(startDate, endDate, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<User> findByFirstNameContainingOrLastNameContaining(String name, Pageable pageable) {
        log.debug("Получение пользователей по имени или фамилии: {} с пагинацией: {}", name, pageable);
        return userRepository.findByFirstNameContainingOrLastNameContaining(name, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public long countAll() {
        return userRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public long countByStatus(UserStatus status) {
        return userRepository.countByStatus(status);
    }

    @Override
    @Transactional(readOnly = true)
    public long countByRole(User.Role role) {
        return userRepository.countByRole(role);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public String encodePassword(String password) {
        return passwordEncoder.encode(password);
    }
}