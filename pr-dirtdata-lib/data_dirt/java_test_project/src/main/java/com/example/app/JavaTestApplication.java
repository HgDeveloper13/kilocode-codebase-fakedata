package com.example.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * Главный класс приложения для тестового Java проекта
 * 
 * Этот класс содержит точку входа в Spring Boot приложение,
 * настраивает компоненты Spring Data JPA и управление транзакциями.
 * 
 * @author Test Application
 * @version 1.0.0
 */
@SpringBootApplication(
    scanBasePackages = {
        "com.example.app.config",
        "com.example.app.controller", 
        "com.example.app.service",
        "com.example.app.utils"
    }
)
@EntityScan("com.example.app.model")
@EnableJpaRepositories("com.example.app.repository")
@EnableTransactionManagement
public class JavaTestApplication {

    /**
     * Точка входа в приложение
     * 
     * @param args аргументы командной строки
     */
    public static void main(String[] args) {
        SpringApplication.run(JavaTestApplication.class, args);
    }
}