"""
Python Test Project
===================

Полноценный тестовый проект для демонстрации различных паттернов программирования и архитектуры Python.

Содержит:
- Модели данных (User, Task, Project)
- Конфигурация приложения
- Утилитарные функции и декораторы
- Бизнес-логика управления проектами
- Анализ данных и отчетность
- Обработка исключений и логирование

Автор: Test Project Generator
Версия: 1.0.0
"""

__version__ = "1.0.0"
__author__ = "Test Project Generator"

# Импорты основных компонентов
from .config import config, AppConfig
from .models import User, Task, Project, UserRole, TaskStatus, Priority
from .utils import FileUtils, StringUtils, DataUtils, ValidationUtils

__all__ = [
    "config",
    "AppConfig", 
    "User",
    "Task", 
    "Project",
    "UserRole",
    "TaskStatus", 
    "Priority",
    "FileUtils",
    "StringUtils", 
    "DataUtils",
    "ValidationUtils"
]