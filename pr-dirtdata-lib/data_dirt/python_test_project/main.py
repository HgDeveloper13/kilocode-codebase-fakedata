"""
Главный модуль тестового Python проекта.
Демонстрирует использование всех созданных модулей и паттернов программирования.
"""

import sys
import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import uuid
from pathlib import Path

# Импорты из локальных модулей
from config import config, AppConfig, VALIDATION_RULES, load_environment_config
from models import (
    User, UserRole, Task, TaskStatus, Priority, Project,
    InMemoryUserRepository, UserValidator, EmailNotificationService,
    ModelFactory, DataMapper, ProjectException, UserNotFoundException
)
from utils import (
    FileUtils, StringUtils, DataUtils, ValidationUtils, LoggerUtils,
    timing_decorator, retry_decorator, cache_result, safe_divide,
    ProgressTracker, find_duplicates, clean_string, process_data_batch,
    expensive_computation
)

# ==================== BUSINESS LOGIC CLASSES ====================

class ProjectManager:
    """Менеджер проектов - основная бизнес-логика"""
    
    def __init__(self, user_repo: InMemoryUserRepository, notification_service: EmailNotificationService):
        self.user_repo = user_repo
        self.notification_service = notification_service
        self.projects: Dict[uuid.UUID, Project] = {}
        self.tasks: Dict[uuid.UUID, Task] = {}
        self.logger = LoggerUtils.setup_logger(self.__class__.__name__)
        
    @timing_decorator
    def create_user(self, username: str, email: str, role: UserRole = UserRole.USER) -> User:
        """Создает нового пользователя с валидацией"""
        try:
            # Валидация данных пользователя
            user_data = {"username": username, "email": email, "role": role.value}
            validator = UserValidator()
            
            if not validator.validate(user_data):
                errors = validator.get_validation_errors(user_data)
                raise ProjectException(f"Validation failed: {', '.join(errors)}")
            
            # Проверка уникальности
            if self.user_repo.find_by_username(username):
                raise ProjectException(f"Username '{username}' already exists")
            
            if self.user_repo.find_by_email(email):
                raise ProjectException(f"Email '{email}' already exists")
            
            # Создание пользователя
            user = ModelFactory.create_user(username, email, role)
            self.user_repo.create(user)
            
            # Отправка уведомления
            self.notification_service.send_notification(
                user.id, 
                f"Welcome to the system, {username}!", 
                "welcome"
            )
            
            self.logger.info(f"Created user: {username} ({email})")
            return user
            
        except Exception as e:
            self.logger.error(f"Failed to create user {username}: {e}")
            raise
    
    @retry_decorator(max_attempts=3, delay=1.0)
    def create_project(self, name: str, description: str, owner_id: uuid.UUID) -> Project:
        """Создает новый проект"""
        try:
            # Проверка существования владельца
            owner = self.user_repo.get_by_id(owner_id)
            if not owner:
                raise UserNotFoundException(f"Owner with id {owner_id} not found")
            
            # Создание проекта
            project = ModelFactory.create_project(name, description, owner_id)
            self.projects[project.id] = project
            project.add_member(owner_id)
            
            # Уведомление владельца
            self.notification_service.send_notification(
                owner_id,
                f"Project '{name}' has been created successfully!",
                "project_created"
            )
            
            self.logger.info(f"Created project: {name} (ID: {project.id})")
            return project
            
        except Exception as e:
            self.logger.error(f"Failed to create project {name}: {e}")
            raise
    
    def create_task(self, title: str, description: str, 
                   priority: Priority = Priority.MEDIUM,
                   assignee_id: Optional[uuid.UUID] = None,
                   project_id: Optional[uuid.UUID] = None) -> Task:
        """Создает новую задачу"""
        try:
            task = ModelFactory.create_task(title, description, priority, assignee_id)
            self.tasks[task.id] = task
            
            # Привязка к проекту если указан
            if project_id and project_id in self.projects:
                self.projects[project_id].tasks.append(task.id)
            
            # Уведомление назначенного
            if assignee_id:
                self.notification_service.send_notification(
                    assignee_id,
                    f"You have been assigned a new task: '{title}'",
                    "task_assigned"
                )
            
            self.logger.info(f"Created task: {title} (ID: {task.id})")
            return task
            
        except Exception as e:
            self.logger.error(f"Failed to create task {title}: {e}")
            raise
    
    def assign_task(self, task_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Назначает задачу пользователю"""
        try:
            if task_id not in self.tasks:
                raise ProjectException(f"Task {task_id} not found")
            
            if not self.user_repo.get_by_id(user_id):
                raise UserNotFoundException(f"User {user_id} not found")
            
            task = self.tasks[task_id]
            task.assign_to(user_id)
            
            self.notification_service.send_notification(
                user_id,
                f"Task '{task.title}' has been assigned to you",
                "task_assigned"
            )
            
            self.logger.info(f"Assigned task {task_id} to user {user_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to assign task {task_id}: {e}")
            return False
    
    def complete_task(self, task_id: uuid.UUID) -> bool:
        """Отмечает задачу как выполненную"""
        try:
            if task_id not in self.tasks:
                raise ProjectException(f"Task {task_id} not found")
            
            task = self.tasks[task_id]
            task.mark_completed()
            
            # Уведомление владельца задачи
            if task.created_by:
                self.notification_service.send_notification(
                    task.created_by,
                    f"Task '{task.title}' has been completed",
                    "task_completed"
                )
            
            self.logger.info(f"Completed task {task_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to complete task {task_id}: {e}")
            return False
    
    def get_user_tasks(self, user_id: uuid.UUID) -> List[Task]:
        """Получает все задачи пользователя"""
        user_tasks = []
        for task in self.tasks.values():
            if task.assignee_id == user_id and task.status != TaskStatus.COMPLETED:
                user_tasks.append(task)
        return sorted(user_tasks, key=lambda t: t.priority.value, reverse=True)
    
    def get_project_statistics(self, project_id: uuid.UUID) -> Dict[str, Any]:
        """Получает статистику проекта"""
        if project_id not in self.projects:
            raise ProjectException(f"Project {project_id} not found")
        
        project = self.projects[project_id]
        project_tasks = [self.tasks[task_id] for task_id in project.tasks if task_id in self.tasks]
        
        status_counts = {}
        priority_counts = {}
        
        for task in project_tasks:
            # Подсчет по статусам
            status = task.status.value
            status_counts[status] = status_counts.get(status, 0) + 1
            
            # Подсчет по приоритетам
            priority = task.priority.name
            priority_counts[priority] = priority_counts.get(priority, 0) + 1
        
        return {
            "project_id": str(project_id),
            "project_name": project.name,
            "total_tasks": len(project_tasks),
            "member_count": project.get_member_count(),
            "status_distribution": status_counts,
            "priority_distribution": priority_counts,
            "completion_rate": safe_divide(
                status_counts.get('completed', 0), 
                len(project_tasks)
            ) * 100
        }
    
    def export_project_data(self, project_id: uuid.UUID, format_type: str = "json") -> str:
        """Экспортирует данные проекта"""
        if project_id not in self.projects:
            raise ProjectException(f"Project {project_id} not found")
        
        project = self.projects[project_id]
        project_tasks = [self.tasks[task_id] for task_id in project.tasks if task_id in self.tasks]
        
        export_data = {
            "project": project,
            "tasks": project_tasks,
            "members": [self.user_repo.get_by_id(uid) for uid in project.members if self.user_repo.get_by_id(uid)]
        }
        
        if format_type.lower() == "json":
            return json.dumps([item.to_dict() for item in export_data["tasks"]], indent=2, default=str)
        elif format_type.lower() == "csv":
            return DataMapper.tasks_to_csv(project_tasks)
        else:
            raise ProjectException(f"Unsupported export format: {format_type}")

class DataAnalyzer:
    """Класс для анализа данных системы"""
    
    def __init__(self, project_manager: ProjectManager):
        self.pm = project_manager
        self.logger = LoggerUtils.setup_logger(self.__class__.__name__)
    
    @cache_result(expire_seconds=300)
    def analyze_user_productivity(self, user_id: uuid.UUID) -> Dict[str, Any]:
        """Анализирует продуктивность пользователя"""
        try:
            user_tasks = self.pm.get_user_tasks(user_id)
            completed_tasks = [t for t in self.pm.tasks.values() 
                             if t.assignee_id == user_id and t.status == TaskStatus.COMPLETED]
            
            if not completed_tasks:
                return {"message": "No completed tasks found"}
            
            # Анализ времени выполнения
            completion_times = []
            overdue_tasks = 0
            
            for task in completed_tasks:
                if hasattr(task, 'created_at') and task.due_date:
                    completion_time = task.updated_at - task.created_at
                    completion_times.append(completion_time.total_seconds() / 3600)  # в часах
                
                if task.is_overdue:
                    overdue_tasks += 1
            
            # Статистика по приоритетам
            priority_stats = {}
            for task in user_tasks:
                priority = task.priority.name
                priority_stats[priority] = priority_stats.get(priority, 0) + 1
            
            # Используем нашу утилиту для вычисления статистики
            time_stats = DataUtils.calculate_statistics(completion_times) if completion_times else {}
            
            analysis = {
                "user_id": str(user_id),
                "total_assigned_tasks": len(user_tasks),
                "completed_tasks": len(completed_tasks),
                "completion_rate": safe_divide(len(completed_tasks), len(user_tasks) + len(completed_tasks)) * 100,
                "average_completion_time_hours": time_stats.get("mean", 0),
                "overdue_tasks": overdue_tasks,
                "priority_distribution": priority_stats,
                "most_productive_day": self._find_most_productive_day(completed_tasks),
                "recommendations": self._generate_recommendations(completed_tasks, overdue_tasks)
            }
            
            return analysis
            
        except Exception as e:
            self.logger.error(f"Failed to analyze user productivity: {e}")
            return {"error": str(e)}
    
    def _find_most_productive_day(self, tasks: List[Task]) -> str:
        """Находит наиболее продуктивный день недели"""
        day_counts = {}
        for task in tasks:
            day_name = task.updated_at.strftime("%A")
            day_counts[day_name] = day_counts.get(day_name, 0) + 1
        
        return max(day_counts.items(), key=lambda x: x[1])[0] if day_counts else "Unknown"
    
    def _generate_recommendations(self, completed_tasks: List[Task], overdue_tasks: int) -> List[str]:
        """Генерирует рекомендации для улучшения продуктивности"""
        recommendations = []
        
        if overdue_tasks > 0:
            recommendations.append("Focus on completing overdue tasks to improve time management")
        
        if len(completed_tasks) < 5:
            recommendations.append("Consider taking on more tasks to increase productivity")
        
        # Анализ по времени
        recent_tasks = [t for t in completed_tasks if t.updated_at > datetime.now() - timedelta(days=7)]
        if len(recent_tasks) < 3:
            recommendations.append("Try to complete more tasks this week")
        
        return recommendations
    
    def generate_system_report(self) -> Dict[str, Any]:
        """Генерирует общий отчет по системе"""
        try:
            total_users = len(self.pm.user_repo.get_all())
            total_projects = len(self.pm.projects)
            total_tasks = len(self.pm.tasks)
            
            # Статистика по пользователям
            user_roles = {}
            for user in self.pm.user_repo.get_all():
                role = user.role.value
                user_roles[role] = user_roles.get(role, 0) + 1
            
            # Статистика по задачам
            task_status = {}
            task_priority = {}
            
            for task in self.pm.tasks.values():
                status = task.status.value
                priority = task.priority.name
                
                task_status[status] = task_status.get(status, 0) + 1
                task_priority[priority] = task_priority.get(priority, 0) + 1
            
            # Топ пользователей по количеству задач
            user_task_counts = {}
            for task in self.pm.tasks.values():
                if task.assignee_id:
                    user_task_counts[task.assignee_id] = user_task_counts.get(task.assignee_id, 0) + 1
            
            top_users = sorted(user_task_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            
            return {
                "generated_at": datetime.now().isoformat(),
                "summary": {
                    "total_users": total_users,
                    "total_projects": total_projects,
                    "total_tasks": total_tasks,
                    "user_role_distribution": user_roles,
                    "task_status_distribution": task_status,
                    "task_priority_distribution": task_priority
                },
                "top_contributors": [
                    {
                        "user_id": str(user_id),
                        "task_count": count,
                        "username": self.pm.user_repo.get_by_id(user_id).username if self.pm.user_repo.get_by_id(user_id) else "Unknown"
                    }
                    for user_id, count in top_users
                ],
                "system_health": {
                    "active_tasks": task_status.get('in_progress', 0),
                    "completed_tasks": task_status.get('completed', 0),
                    "overdue_tasks": sum(1 for task in self.pm.tasks.values() if task.is_overdue),
                    "completion_rate": safe_divide(
                        task_status.get('completed', 0), 
                        total_tasks
                    ) * 100 if total_tasks > 0 else 0
                }
            }
            
        except Exception as e:
            self.logger.error(f"Failed to generate system report: {e}")
            return {"error": str(e)}

# ==================== DEMO AND TESTING FUNCTIONS ====================

def setup_demo_data(pm: ProjectManager) -> None:
    """Создает демонстрационные данные"""
    print("Setting up demo data...")
    
    # Создание пользователей
    admin = pm.create_user("admin", "admin@example.com", UserRole.ADMIN)
    manager = pm.create_user("manager", "manager@example.com", UserRole.MODERATOR)
    user1 = pm.create_user("john_doe", "john@example.com", UserRole.USER)
    user2 = pm.create_user("jane_smith", "jane@example.com", UserRole.USER)
    guest = pm.create_user("guest_user", "guest@example.com", UserRole.GUEST)
    
    # Создание проектов
    project1 = pm.create_project("Website Redesign", "Complete redesign of company website", admin.id)
    project2 = pm.create_project("Mobile App", "Development of mobile application", manager.id)
    
    # Создание задач
    task1 = pm.create_task("Design Mockups", "Create initial design mockups", Priority.HIGH, user1.id, project1.id)
    task2 = pm.create_task("Frontend Development", "Develop frontend components", Priority.HIGH, user2.id, project1.id)
    task3 = pm.create_task("Backend API", "Develop REST API endpoints", Priority.CRITICAL, manager.id, project2.id)
    task4 = pm.create_task("Database Design", "Design database schema", Priority.MEDIUM, user1.id, project2.id)
    task5 = pm.create_task("Testing", "Write unit and integration tests", Priority.MEDIUM, user2.id, project2.id)
    
    # Назначение дополнительных задач
    pm.assign_task(task1.id, user2.id)
    pm.assign_task(task4.id, manager.id)
    
    # Выполнение некоторых задач
    pm.complete_task(task1.id)
    pm.complete_task(task5.id)
    
    print(f"Created {len(pm.user_repo.get_all())} users, {len(pm.projects)} projects, {len(pm.tasks)} tasks")

def demonstrate_utilities():
    """Демонстрирует работу утилит"""
    print("\n=== DEMONSTRATING UTILITIES ===")
    
    # File utilities
    print("\n1. File Utilities:")
    config_data = {"app_name": "Test App", "version": "1.0.0"}
    FileUtils.write_json_file("data_dirt/python_test_project/demo_config.json", config_data)
    loaded_config = FileUtils.read_json_file("data_dirt/python_test_project/demo_config.json")
    print(f"Config loaded: {loaded_config}")
    
    # String utilities
    print("\n2. String Utilities:")
    text = "Hello World! Email: test@example.com URL: https://example.com"
    emails = StringUtils.extract_emails(text)
    urls = StringUtils.extract_urls(text)
    word_count = StringUtils.count_words(text)
    print(f"Emails found: {emails}")
    print(f"URLs found: {urls}")
    print(f"Word count: {word_count}")
    
    # Data utilities
    print("\n3. Data Utilities:")
    numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    stats = DataUtils.calculate_statistics(numbers)
    print(f"Statistics: {stats}")
    
    # Validation utilities
    print("\n4. Validation Utilities:")
    email_valid = ValidationUtils.is_valid_email("test@example.com")
    password_check = ValidationUtils.is_strong_password("MySecure123!")
    print(f"Email valid: {email_valid}")
    print(f"Password strong: {password_check}")
    
    # Progress tracking
    print("\n5. Progress Tracking:")
    tracker = ProgressTracker(5, "Demo processing")
    for i in range(5):
        tracker.update()
    
    print("\nUtilities demonstration completed!")

@timing_decorator
def run_performance_test():
    """Запускает тест производительности"""
    print("\n=== PERFORMANCE TEST ===")
    
    # Тест кэширования
    print("Testing cache decorator...")
    result1 = expensive_computation(10, 5)
    result2 = expensive_computation(10, 5)  # Должен взять из кэша
    print(f"Results: {result1}, {result2}")
    
    # Тест обработки данных
    test_data = [{"id": i, "value": i * 2} for i in range(1000)]
    
    def process_item(item):
        return {"processed_id": item["id"], "doubled_value": item["value"] * 2}
    
    processed = process_data_batch(test_data, process_item)
    print(f"Processed {len(processed)} items")
    
    print("Performance test completed!")

def main():
    """Главная функция приложения"""
    print("=" * 60)
    print("PYTHON TEST PROJECT - DEMONSTRATION")
    print("=" * 60)
    
    # Инициализация системы логирования
    LoggerUtils.setup_logger("MainApp", "data_dirt/python_test_project/app.log")
    logger = logging.getLogger("MainApp")
    
    try:
        # Загрузка конфигурации
        print(f"Application: {config.APP_NAME} v{config.VERSION}")
        print(f"Environment: {config.environment}")
        print(f"Debug mode: {config.DEBUG}")
        
        # Инициализация компонентов
        print("\nInitializing system components...")
        user_repo = InMemoryUserRepository()
        notification_service = EmailNotificationService({"host": "localhost", "port": 587})
        
        # Создание менеджера проектов
        pm = ProjectManager(user_repo, notification_service)
        analyzer = DataAnalyzer(pm)
        
        # Создание демонстрационных данных
        setup_demo_data(pm)
        
        # Демонстрация утилит
        demonstrate_utilities()
        
        # Анализ данных
        print("\n=== DATA ANALYSIS ===")
        
        # Получение статистики проекта
        first_project = list(pm.projects.keys())[0]
        project_stats = pm.get_project_statistics(first_project)
        print(f"Project statistics: {project_stats}")
        
        # Анализ продуктивности пользователя
        first_user = pm.user_repo.get_all()[0]
        productivity = analyzer.analyze_user_productivity(first_user.id)
        print(f"User productivity analysis: {productivity}")
        
        # Генерация системного отчета
        system_report = analyzer.generate_system_report()
        print(f"System report generated: {len(system_report)} sections")
        
        # Экспорт данных
        print("\n=== DATA EXPORT ===")
        json_export = pm.export_project_data(first_project, "json")
        print(f"JSON export preview: {json_export[:200]}...")
        
        # Демонстрация декораторов
        print("\n=== DECORATOR DEMONSTRATION ===")
        
        @retry_decorator(max_attempts=2, delay=0.5)
        def unreliable_function():
            import random
            if random.random() < 0.7:  # 70% chance of failure
                raise Exception("Random failure")
            return "Success!"
        
        try:
            result = unreliable_function()
            print(f"Function result: {result}")
        except Exception as e:
            print(f"Function failed: {e}")
        
        # Тест производительности
        run_performance_test()
        
        # Демонстрация работы с исключениями
        print("\n=== EXCEPTION HANDLING ===")
        try:
            pm.create_user("duplicate", "admin@example.com")  # Должно провалиться
        except ProjectException as e:
            print(f"Caught expected exception: {e}")
        
        print("\n" + "=" * 60)
        print("DEMONSTRATION COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        
        # Сохранение финального отчета
        final_report = {
            "demo_completed_at": datetime.now().isoformat(),
            "statistics": system_report,
            "notification_history": notification_service.get_notification_history()
        }
        
        FileUtils.write_json_file(
            "data_dirt/python_test_project/demo_report.json", 
            final_report
        )
        
        print(f"Demo report saved to demo_report.json")
        
    except Exception as e:
        logger.error(f"Application failed: {e}")
        print(f"Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)