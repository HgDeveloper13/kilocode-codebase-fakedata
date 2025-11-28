"""
Модуль моделей данных для тестового Python проекта.
Содержит классы данных, модели, исключения и интерфейсы.
"""

from abc import ABC, abstractmethod
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field
import json
import uuid

# ==================== ENUMS ====================

class UserRole(Enum):
    """Роли пользователей в системе"""
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"
    GUEST = "guest"

class TaskStatus(Enum):
    """Статусы задач"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Priority(Enum):
    """Приоритеты задач"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

# ==================== DATA CLASSES ====================

@dataclass
class User:
    """Модель пользователя системы"""
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    username: str = ""
    email: str = ""
    role: UserRole = UserRole.USER
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.now)
    last_login: Optional[datetime] = None
    preferences: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Пост-инициализация для валидации данных"""
        if not self.username or len(self.username) < 3:
            raise ValueError("Username must be at least 3 characters long")
        if "@" not in self.email:
            raise ValueError("Invalid email format")
    
    @property
    def is_admin(self) -> bool:
        """Проверяет, является ли пользователь администратором"""
        return self.role == UserRole.ADMIN
    
    def to_dict(self) -> Dict[str, Any]:
        """Преобразует объект в словарь"""
        return {
            "id": str(self.id),
            "username": self.username,
            "email": self.email,
            "role": self.role.value,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "preferences": self.preferences
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'User':
        """Создает объект User из словаря"""
        data["id"] = uuid.UUID(data["id"])
        data["role"] = UserRole(data["role"])
        if data.get("created_at"):
            data["created_at"] = datetime.fromisoformat(data["created_at"])
        if data.get("last_login"):
            data["last_login"] = datetime.fromisoformat(data["last_login"])
        return cls(**data)

@dataclass
class Task:
    """Модель задачи в системе"""
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    title: str = ""
    description: str = ""
    status: TaskStatus = TaskStatus.PENDING
    priority: Priority = Priority.MEDIUM
    assignee_id: Optional[uuid.UUID] = None
    created_by: Optional[uuid.UUID] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    due_date: Optional[datetime] = None
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Валидация задачи после инициализации"""
        if not self.title:
            raise ValueError("Task title cannot be empty")
        if self.due_date and self.due_date < datetime.now():
            raise ValueError("Due date cannot be in the past")
    
    @property
    def is_overdue(self) -> bool:
        """Проверяет, просрочена ли задача"""
        if not self.due_date:
            return False
        return datetime.now() > self.due_date and self.status != TaskStatus.COMPLETED
    
    @property
    def is_high_priority(self) -> bool:
        """Проверяет, является ли задача высокоприоритетной"""
        return self.priority in [Priority.HIGH, Priority.CRITICAL]
    
    def mark_completed(self) -> None:
        """Отмечает задачу как выполненную"""
        self.status = TaskStatus.COMPLETED
        self.updated_at = datetime.now()
    
    def assign_to(self, user_id: uuid.UUID) -> None:
        """Назначает задачу пользователю"""
        self.assignee_id = user_id
        self.status = TaskStatus.IN_PROGRESS
        self.updated_at = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Преобразует объект в словарь"""
        return {
            "id": str(self.id),
            "title": self.title,
            "description": self.description,
            "status": self.status.value,
            "priority": self.priority.value,
            "assignee_id": str(self.assignee_id) if self.assignee_id else None,
            "created_by": str(self.created_by) if self.created_by else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "tags": self.tags,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Task':
        """Создает объект Task из словаря"""
        data["id"] = uuid.UUID(data["id"])
        data["status"] = TaskStatus(data["status"])
        data["priority"] = Priority(data["priority"])
        if data.get("assignee_id"):
            data["assignee_id"] = uuid.UUID(data["assignee_id"])
        if data.get("created_by"):
            data["created_by"] = uuid.UUID(data["created_by"])
        if data.get("created_at"):
            data["created_at"] = datetime.fromisoformat(data["created_at"])
        if data.get("updated_at"):
            data["updated_at"] = datetime.fromisoformat(data["updated_at"])
        if data.get("due_date"):
            data["due_date"] = datetime.fromisoformat(data["due_date"])
        return cls(**data)

@dataclass
class Project:
    """Модель проекта"""
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    name: str = ""
    description: str = ""
    owner_id: uuid.UUID = field(default_factory=uuid.uuid4)
    members: List[uuid.UUID] = field(default_factory=list)
    tasks: List[uuid.UUID] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    is_active: bool = True
    
    def add_member(self, user_id: uuid.UUID) -> None:
        """Добавляет участника в проект"""
        if user_id not in self.members:
            self.members.append(user_id)
    
    def remove_member(self, user_id: uuid.UUID) -> None:
        """Удаляет участника из проекта"""
        if user_id in self.members:
            self.members.remove(user_id)
    
    def get_member_count(self) -> int:
        """Возвращает количество участников"""
        return len(self.members)
    
    def to_dict(self) -> Dict[str, Any]:
        """Преобразует объект в словарь"""
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "owner_id": str(self.owner_id),
            "members": [str(m) for m in self.members],
            "tasks": [str(t) for t in self.tasks],
            "created_at": self.created_at.isoformat(),
            "is_active": self.is_active
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Project':
        """Создает объект Project из словаря"""
        data["id"] = uuid.UUID(data["id"])
        data["owner_id"] = uuid.UUID(data["owner_id"])
        data["members"] = [uuid.UUID(m) for m in data.get("members", [])]
        data["tasks"] = [uuid.UUID(t) for t in data.get("tasks", [])]
        if data.get("created_at"):
            data["created_at"] = datetime.fromisoformat(data["created_at"])
        return cls(**data)

# ==================== ABSTRACT CLASSES ====================

class DataRepository(ABC):
    """Абстрактный репозиторий для работы с данными"""
    
    @abstractmethod
    def create(self, entity: Any) -> Any:
        """Создает новую запись"""
        pass
    
    @abstractmethod
    def get_by_id(self, entity_id: Union[str, uuid.UUID]) -> Optional[Any]:
        """Получает запись по ID"""
        pass
    
    @abstractmethod
    def update(self, entity: Any) -> bool:
        """Обновляет запись"""
        pass
    
    @abstractmethod
    def delete(self, entity_id: Union[str, uuid.UUID]) -> bool:
        """Удаляет запись"""
        pass
    
    @abstractmethod
    def get_all(self) -> List[Any]:
        """Получает все записи"""
        pass

class NotificationService(ABC):
    """Абстрактный сервис уведомлений"""
    
    @abstractmethod
    def send_notification(self, user_id: uuid.UUID, message: str, 
                         notification_type: str = "info") -> bool:
        """Отправляет уведомление пользователю"""
        pass
    
    @abstractmethod
    def broadcast_notification(self, message: str, 
                             notification_type: str = "info") -> bool:
        """Рассылает уведомление всем пользователям"""
        pass

class Validator(ABC):
    """Абстрактный валидатор данных"""
    
    @abstractmethod
    def validate(self, data: Any) -> bool:
        """Валидирует данные"""
        pass
    
    @abstractmethod
    def get_validation_errors(self, data: Any) -> List[str]:
        """Возвращает список ошибок валидации"""
        pass

# ==================== CONCRETE IMPLEMENTATIONS ====================

class InMemoryUserRepository(DataRepository):
    """Реализация репозитория пользователей в памяти"""
    
    def __init__(self):
        self._users: Dict[uuid.UUID, User] = {}
    
    def create(self, user: User) -> User:
        """Создает нового пользователя"""
        if user.id in self._users:
            raise ValueError(f"User with id {user.id} already exists")
        self._users[user.id] = user
        return user
    
    def get_by_id(self, user_id: Union[str, uuid.UUID]) -> Optional[User]:
        """Получает пользователя по ID"""
        if isinstance(user_id, str):
            user_id = uuid.UUID(user_id)
        return self._users.get(user_id)
    
    def update(self, user: User) -> bool:
        """Обновляет пользователя"""
        if user.id not in self._users:
            return False
        self._users[user.id] = user
        return True
    
    def delete(self, user_id: Union[str, uuid.UUID]) -> bool:
        """Удаляет пользователя"""
        if isinstance(user_id, str):
            user_id = uuid.UUID(user_id)
        if user_id in self._users:
            del self._users[user_id]
            return True
        return False
    
    def get_all(self) -> List[User]:
        """Получает всех пользователей"""
        return list(self._users.values())
    
    def find_by_username(self, username: str) -> Optional[User]:
        """Находит пользователя по имени"""
        for user in self._users.values():
            if user.username == username:
                return user
        return None
    
    def find_by_email(self, email: str) -> Optional[User]:
        """Находит пользователя по email"""
        for user in self._users.values():
            if user.email == email:
                return user
        return None

class UserValidator(Validator):
    """Валидатор данных пользователя"""
    
    def validate(self, user_data: Dict[str, Any]) -> bool:
        """Валидирует данные пользователя"""
        errors = self.get_validation_errors(user_data)
        return len(errors) == 0
    
    def get_validation_errors(self, user_data: Dict[str, Any]) -> List[str]:
        """Возвращает ошибки валидации пользователя"""
        errors = []
        
        # Проверка обязательных полей
        required_fields = ["username", "email"]
        for field in required_fields:
            if field not in user_data or not user_data[field]:
                errors.append(f"Field '{field}' is required")
        
        # Проверка длины имени пользователя
        if "username" in user_data:
            username = user_data["username"]
            if len(username) < 3:
                errors.append("Username must be at least 3 characters long")
            if len(username) > 20:
                errors.append("Username must not exceed 20 characters")
        
        # Проверка формата email
        if "email" in user_data:
            email = user_data["email"]
            if "@" not in email:
                errors.append("Invalid email format")
        
        # Проверка роли
        if "role" in user_data:
            try:
                UserRole(user_data["role"])
            except ValueError:
                errors.append("Invalid user role")
        
        return errors

class EmailNotificationService(NotificationService):
    """Сервис email уведомлений"""
    
    def __init__(self, smtp_config: Dict[str, Any]):
        self.smtp_config = smtp_config
        self.sent_notifications: List[Dict[str, Any]] = []
    
    def send_notification(self, user_id: uuid.UUID, message: str, 
                         notification_type: str = "info") -> bool:
        """Отправляет email уведомление"""
        notification = {
            "user_id": str(user_id),
            "message": message,
            "type": notification_type,
            "timestamp": datetime.now(),
            "method": "email"
        }
        self.sent_notifications.append(notification)
        # Здесь была бы реальная отправка email
        return True
    
    def broadcast_notification(self, message: str, 
                             notification_type: str = "info") -> bool:
        """Рассылает email уведомление всем пользователям"""
        # Имитация рассылки всем пользователям
        notification = {
            "broadcast": True,
            "message": message,
            "type": notification_type,
            "timestamp": datetime.now(),
            "method": "email"
        }
        self.sent_notifications.append(notification)
        return True
    
    def get_notification_history(self) -> List[Dict[str, Any]]:
        """Возвращает историю отправленных уведомлений"""
        return self.sent_notifications.copy()

# ==================== EXCEPTIONS ====================

class ProjectException(Exception):
    """Базовый класс исключений проекта"""
    pass

class UserNotFoundException(ProjectException):
    """Исключение - пользователь не найден"""
    pass

class TaskNotFoundException(ProjectException):
    """Исключение - задача не найдена"""
    pass

class InvalidUserDataException(ProjectException):
    """Исключение - неверные данные пользователя"""
    pass

class AccessDeniedException(ProjectException):
    """Исключение - доступ запрещен"""
    pass

# ==================== UTILITY CLASSES ====================

class ModelFactory:
    """Фабрика для создания моделей"""
    
    @staticmethod
    def create_user(username: str, email: str, role: UserRole = UserRole.USER) -> User:
        """Создает пользователя с валидацией"""
        user_data = {
            "username": username,
            "email": email,
            "role": role
        }
        validator = UserValidator()
        if not validator.validate(user_data):
            raise InvalidUserDataException(f"Invalid user data: {validator.get_validation_errors(user_data)}")
        return User(username=username, email=email, role=role)
    
    @staticmethod
    def create_task(title: str, description: str = "", 
                   priority: Priority = Priority.MEDIUM,
                   assignee_id: Optional[uuid.UUID] = None) -> Task:
        """Создает задачу"""
        return Task(
            title=title,
            description=description,
            priority=priority,
            assignee_id=assignee_id
        )
    
    @staticmethod
    def create_project(name: str, description: str, 
                      owner_id: uuid.UUID) -> Project:
        """Создает проект"""
        return Project(
            name=name,
            description=description,
            owner_id=owner_id
        )

class DataMapper:
    """Маппер для преобразования данных между форматами"""
    
    @staticmethod
    def user_to_json(user: User) -> str:
        """Преобразует пользователя в JSON"""
        return json.dumps(user.to_dict(), indent=2, default=str)
    
    @staticmethod
    def json_to_user(json_str: str) -> User:
        """Создает пользователя из JSON"""
        data = json.loads(json_str)
        return User.from_dict(data)
    
    @staticmethod
    def tasks_to_csv(tasks: List[Task]) -> str:
        """Преобразует список задач в CSV"""
        if not tasks:
            return "No tasks to export"
        
        lines = ["ID,Title,Status,Priority,Created At"]
        for task in tasks:
            line = f"{task.id},{task.title},{task.status.value},{task.priority.value},{task.created_at.isoformat()}"
            lines.append(line)
        
        return "\n".join(lines)

# Экспорт основных классов
__all__ = [
    # Enums
    "UserRole", "TaskStatus", "Priority",
    
    # Data classes
    "User", "Task", "Project",
    
    # Abstract classes
    "DataRepository", "NotificationService", "Validator",
    
    # Concrete implementations
    "InMemoryUserRepository", "UserValidator", "EmailNotificationService",
    
    # Exceptions
    "ProjectException", "UserNotFoundException", "TaskNotFoundException",
    "InvalidUserDataException", "AccessDeniedException",
    
    # Utility classes
    "ModelFactory", "DataMapper"
]