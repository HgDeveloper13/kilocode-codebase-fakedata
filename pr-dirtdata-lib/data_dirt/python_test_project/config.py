"""
Конфигурационный модуль для тестового Python проекта.
Содержит настройки, константы и конфигурацию приложения.
"""

import os
from typing import Dict, Any

class AppConfig:
    """Основной класс конфигурации приложения"""
    
    # Базовые настройки приложения
    APP_NAME = "Python Test Project"
    VERSION = "1.0.0"
    DEBUG = True
    
    # Настройки базы данных
    DATABASE_CONFIG = {
        "host": "localhost",
        "port": 5432,
        "database": "test_db",
        "user": "test_user",
        "password": "test_password"
    }
    
    # Настройки API
    API_SETTINGS = {
        "base_url": "https://api.example.com",
        "timeout": 30,
        "rate_limit": 100,
        "api_key": os.getenv("API_KEY", "default_key")
    }
    
    # Настройки логирования
    LOGGING_CONFIG = {
        "level": "INFO",
        "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        "file": "app.log"
    }
    
    def __init__(self):
        self.environment = os.getenv("ENVIRONMENT", "development")
    
    def get_database_url(self) -> str:
        """Формирует URL для подключения к базе данных"""
        config = self.DATABASE_CONFIG
        return f"postgresql://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"
    
    def is_production(self) -> bool:
        """Проверяет, является ли текущая среда продакшеном"""
        return self.environment == "production"
    
    @classmethod
    def from_dict(cls, config_dict: Dict[str, Any]) -> 'AppConfig':
        """Создает конфигурацию из словаря"""
        config = cls()
        for key, value in config_dict.items():
            if hasattr(config, key.upper()):
                setattr(config, key.upper(), value)
        return config

# Глобальный экземпляр конфигурации
config = AppConfig()

# Константы для валидации
VALIDATION_RULES = {
    "username": {
        "min_length": 3,
        "max_length": 20,
        "pattern": r"^[a-zA-Z0-9_]+$"
    },
    "email": {
        "pattern": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    },
    "password": {
        "min_length": 8,
        "require_uppercase": True,
        "require_lowercase": True,
        "require_numbers": True,
        "require_special": True
    }
}

# Настройки кэширования
CACHE_SETTINGS = {
    "default_timeout": 300,
    "max_entries": 1000,
    "cull_frequency": 3
}

# Настройки обработки файлов
FILE_PROCESSING = {
    "max_file_size": 10 * 1024 * 1024,  # 10MB
    "allowed_extensions": [".txt", ".csv", ".json", ".xml"],
    "temp_directory": "temp_files",
    "chunk_size": 8192
}

def get_config_value(key: str, default: Any = None) -> Any:
    """
    Получает значение конфигурации по ключу
    
    Args:
        key: Ключ конфигурации
        default: Значение по умолчанию
    
    Returns:
        Значение конфигурации или default
    """
    return getattr(config, key.upper(), default)

def load_environment_config() -> Dict[str, Any]:
    """
    Загружает конфигурацию из переменных окружения
    
    Returns:
        Словарь с настройками из окружения
    """
    env_config = {}
    
    # Чтение основных настроек из окружения
    env_mappings = {
        "APP_ENV": "environment",
        "DB_HOST": "database_host",
        "DB_PORT": "database_port",
        "DEBUG_MODE": "debug"
    }
    
    for env_var, config_key in env_mappings.items():
        value = os.getenv(env_var)
        if value:
            env_config[config_key] = value
    
    return env_config

# Экспорт основных элементов
__all__ = [
    "AppConfig",
    "config", 
    "VALIDATION_RULES",
    "CACHE_SETTINGS",
    "FILE_PROCESSING",
    "get_config_value",
    "load_environment_config"
]