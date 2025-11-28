package com.example.app.controller;

import com.example.app.exception.UserAlreadyExistsException;
import com.example.app.model.dto.ApiResponse;
import com.example.app.model.entity.User;
import com.example.app.security.CustomUserDetailsService;
import com.example.app.security.JwtTokenProvider;
import com.example.app.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.Map;

/**
 * Контроллер аутентификации
 * 
 * Обрабатывает endpoints для регистрации, входа и управления сессией пользователя
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthenticationController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final CustomUserDetailsService customUserDetailsService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Регистрация нового пользователя
     * 
     * @param user данные пользователя для регистрации
     * @return ответ с информацией о результате регистрации
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> registerUser(@Valid @RequestBody User user) {
        log.info("Регистрация пользователя: {}", user.getUsername());
        
        try {
            User newUser = userService.createUser(user);
            
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("userId", newUser.getId());
            responseData.put("username", newUser.getUsername());
            responseData.put("email", newUser.getEmail());
            responseData.put("status", newUser.getStatus());
            
            log.info("Пользователь успешно зарегистрирован: {}", newUser.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(responseData));
            
        } catch (UserAlreadyExistsException e) {
            log.warn("Попытка регистрации с уже существующими учетными данными: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Ошибка при регистрации пользователя: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Ошибка при регистрации пользователя"));
        }
    }

    /**
     * Аутентификация пользователя
     * 
     * @param loginRequest данные для входа (username и password)
     * @return ответ с JWT токеном и информацией о пользователе
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> authenticateUser(@RequestBody LoginRequest loginRequest) {
        log.info("Аутентификация пользователя: {}", loginRequest.getUsername());
        
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            String jwt = jwtTokenProvider.generateToken(authentication);
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("token", jwt);
            responseData.put("tokenType", "Bearer");
            responseData.put("expiresIn", jwtTokenProvider.getJwtExpiration());
            responseData.put("userId", userDetails.getUserId());
            responseData.put("username", userDetails.getUsername());
            responseData.put("email", userDetails.getEmail());
            responseData.put("displayName", userDetails.getDisplayName());
            responseData.put("roles", userDetails.getRoleNames());
            
            log.info("Пользователь успешно аутентифицирован: {}", userDetails.getUsername());
            return ResponseEntity.ok(ApiResponse.success(responseData));
            
        } catch (Exception e) {
            log.warn("Ошибка аутентификации пользователя {}: {}", loginRequest.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Неверное имя пользователя или пароль"));
        }
    }

    /**
     * Выход пользователя
     * 
     * @return ответ об успешном выходе
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logoutUser() {
        log.info("Пользователь вышел из системы");
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(ApiResponse.success("Выход выполнен успешно"));
    }

    /**
     * Проверка валидности JWT токена
     * 
     * @param token JWT токен
     * @return ответ с информацией о валидности токена
     */
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateToken(@RequestBody TokenValidationRequest token) {
        log.debug("Проверка валидности токена");
        
        try {
            boolean isValid = jwtTokenProvider.validateToken(token.getToken());
            
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("valid", isValid);
            
            if (isValid) {
                String username = jwtTokenProvider.getUsernameFromToken(token.getToken());
                Long userId = jwtTokenProvider.getUserIdFromToken(token.getToken());
                
                responseData.put("username", username);
                responseData.put("userId", userId);
                
                log.debug("Токен валиден для пользователя: {}", username);
            }
            
            return ResponseEntity.ok(ApiResponse.success(responseData));
            
        } catch (Exception e) {
            log.error("Ошибка при проверке токена: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Ошибка при проверке токена"));
        }
    }

    /**
     * Обновление пароля пользователя
     * 
     * @param passwordRequest данные для обновления пароля
     * @return ответ об успешном обновлении
     */
    @PutMapping("/password")
    public ResponseEntity<ApiResponse<String>> updatePassword(@Valid @RequestBody PasswordUpdateRequest passwordRequest) {
        log.info("Обновление пароля для пользователя");
        
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Пользователь не аутентифицирован"));
            }
            
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            User updatedUser = userService.updatePassword(userDetails.getUserId(), passwordRequest.getNewPassword());
            
            log.info("Пароль успешно обновлен для пользователя: {}", updatedUser.getUsername());
            return ResponseEntity.ok(ApiResponse.success("Пароль успешно обновлен"));
            
        } catch (Exception e) {
            log.error("Ошибка при обновлении пароля: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Ошибка при обновлении пароля"));
        }
    }

    /**
     * Внутренний класс для запроса входа
     */
    public static class LoginRequest {
        private String username;
        private String password;

        // Геттеры и сеттеры
        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    /**
     * Внутренний класс для запроса проверки токена
     */
    public static class TokenValidationRequest {
        private String token;

        // Геттеры и сеттеры
        public String getToken() {
            return token;
        }

        public void setToken(String token) {
            this.token = token;
        }
    }

    /**
     * Внутренний класс для запроса обновления пароля
     */
    public static class PasswordUpdateRequest {
        private String newPassword;

        // Геттеры и сеттеры
        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }
}