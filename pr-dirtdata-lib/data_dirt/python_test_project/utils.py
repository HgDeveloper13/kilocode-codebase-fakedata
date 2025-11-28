"""
Утилитарный модуль для тестового Python проекта.
Содержит вспомогательные функции, декораторы, хелперы и общие утилиты.
"""

import os
import sys
import json
import csv
import hashlib
import logging
import functools
import time
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Callable, TypeVar, Generic, Iterator
from pathlib import Path
import uuid
from collections import defaultdict, Counter
import statistics

# ==================== TYPE VARIABLES ====================

T = TypeVar('T')
K = TypeVar('K')
V = TypeVar('V')

# ==================== DECORATORS ====================

def timing_decorator(func: Callable) -> Callable:
    """Декоратор для измерения времени выполнения функции"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        execution_time = end_time - start_time
        print(f"Function '{func.__name__}' executed in {execution_time:.4f} seconds")
        return result
    return wrapper

def retry_decorator(max_attempts: int = 3, delay: float = 1.0):
    """Декоратор для повторных попыток выполнения функции"""
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_attempts - 1:
                        time.sleep(delay * (attempt + 1))
                    else:
                        raise last_exception
        return wrapper
    return decorator

def cache_result(expire_seconds: int = 300):
    """Декоратор для кэширования результатов функции"""
    cache = {}
    
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Создаем ключ для кэша
            key = str(args) + str(sorted(kwargs.items()))
            current_time = time.time()
            
            # Проверяем кэш
            if key in cache:
                result, timestamp = cache[key]
                if current_time - timestamp < expire_seconds:
                    return result
            
            # Выполняем функцию и сохраняем результат
            result = func(*args, **kwargs)
            cache[key] = (result, current_time)
            return result
        return wrapper
    return decorator

def validate_input(**validators):
    """Декоратор для валидации входных параметров"""
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Получаем имена параметров функции
            sig = func.__annotations__
            param_names = list(sig.keys())
            
            # Создаем словарь аргументов
            bound_args = sig.copy()
            for i, arg in enumerate(args):
                if i < len(param_names):
                    bound_args[param_names[i]] = arg
            bound_args.update(kwargs)
            
            # Применяем валидаторы
            for param_name, validator in validators.items():
                if param_name in bound_args:
                    value = bound_args[param_name]
                    if not validator(value):
                        raise ValueError(f"Invalid value for parameter '{param_name}': {value}")
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

def singleton(cls):
    """Декоратор для создания singleton класса"""
    instances = {}
    
    @functools.wraps(cls)
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    
    return get_instance

# ==================== FILE UTILITIES ====================

class FileUtils:
    """Класс с утилитами для работы с файлами"""
    
    @staticmethod
    def ensure_directory(path: Union[str, Path]) -> Path:
        """Создает директорию если она не существует"""
        path = Path(path)
        path.mkdir(parents=True, exist_ok=True)
        return path
    
    @staticmethod
    def read_json_file(file_path: Union[str, Path]) -> Dict[str, Any]:
        """Читает JSON файл"""
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    
    @staticmethod
    def write_json_file(file_path: Union[str, Path], data: Any) -> None:
        """Записывает данные в JSON файл"""
        FileUtils.ensure_directory(Path(file_path).parent)
        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=2, default=str, ensure_ascii=False)
    
    @staticmethod
    def read_csv_file(file_path: Union[str, Path]) -> List[Dict[str, str]]:
        """Читает CSV файл"""
        with open(file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            return list(reader)
    
    @staticmethod
    def write_csv_file(file_path: Union[str, Path], data: List[Dict[str, Any]], 
                      fieldnames: Optional[List[str]] = None) -> None:
        """Записывает данные в CSV файл"""
        if not data:
            return
        
        FileUtils.ensure_directory(Path(file_path).parent)
        
        if not fieldnames:
            fieldnames = list(data[0].keys())
        
        with open(file_path, 'w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            for row in data:
                writer.writerow(row)
    
    @staticmethod
    def get_file_hash(file_path: Union[str, Path], algorithm: str = 'md5') -> str:
        """Вычисляет хеш файла"""
        hash_obj = hashlib.new(algorithm)
        with open(file_path, 'rb') as file:
            for chunk in iter(lambda: file.read(4096), b""):
                hash_obj.update(chunk)
        return hash_obj.hexdigest()
    
    @staticmethod
    def backup_file(file_path: Union[str, Path]) -> Path:
        """Создает резервную копию файла"""
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"File {file_path} does not exist")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = file_path.parent / f"{file_path.stem}_{timestamp}{file_path.suffix}"
        
        import shutil
        shutil.copy2(file_path, backup_path)
        return backup_path

# ==================== STRING UTILITIES ====================

class StringUtils:
    """Класс с утилитами для работы со строками"""
    
    @staticmethod
    def slugify(text: str) -> str:
        """Преобразует текст в slug"""
        # Заменяем не-алфавольно-цифровые символы на дефисы
        text = re.sub(r'[^a-zA-Z0-9\s-]', '', text)
        text = re.sub(r'[-\s]+', '-', text)
        return text.lower().strip('-')
    
    @staticmethod
    def truncate(text: str, max_length: int = 100, suffix: str = "...") -> str:
        """Обрезает текст до указанной длины"""
        if len(text) <= max_length:
            return text
        return text[:max_length - len(suffix)] + suffix
    
    @staticmethod
    def extract_emails(text: str) -> List[str]:
        """Извлекает email адреса из текста"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        return re.findall(email_pattern, text)
    
    @staticmethod
    def extract_urls(text: str) -> List[str]:
        """Извлекает URL из текста"""
        url_pattern = r'https?://[^\s]+'
        return re.findall(url_pattern, text)
    
    @staticmethod
    def highlight_keywords(text: str, keywords: List[str], 
                          highlight_color: str = "yellow") -> str:
        """Подсвечивает ключевые слова в тексте"""
        result = text
        for keyword in keywords:
            pattern = re.compile(re.escape(keyword), re.IGNORECASE)
            highlighted = f"<span style='background-color: {highlight_color}'>{keyword}</span>"
            result = pattern.sub(highlighted, result)
        return result
    
    @staticmethod
    def count_words(text: str) -> Dict[str, int]:
        """Подсчитывает частоту слов в тексте"""
        words = re.findall(r'\b\w+\b', text.lower())
        return dict(Counter(words))

# ==================== DATA UTILITIES ====================

class DataUtils:
    """Класс с утилитами для работы с данными"""
    
    @staticmethod
    def chunk_list(lst: List[T], chunk_size: int) -> Iterator[List[T]]:
        """Разбивает список на части заданного размера"""
        for i in range(0, len(lst), chunk_size):
            yield lst[i:i + chunk_size]
    
    @staticmethod
    def flatten_dict(d: Dict[str, Any], parent_key: str = '', sep: str = '.') -> Dict[str, Any]:
        """Разворачивает вложенный словарь"""
        items = []
        for k, v in d.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(DataUtils.flatten_dict(v, new_key, sep=sep).items())
            else:
                items.append((new_key, v))
        return dict(items)
    
    @staticmethod
    def deep_merge(dict1: Dict[str, Any], dict2: Dict[str, Any]) -> Dict[str, Any]:
        """Глубоко объединяет два словаря"""
        result = dict1.copy()
        for key, value in dict2.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = DataUtils.deep_merge(result[key], value)
            else:
                result[key] = value
        return result
    
    @staticmethod
    def get_nested_value(data: Dict[str, Any], path: str, default: Any = None) -> Any:
        """Получает значение из вложенного словаря по пути"""
        keys = path.split('.')
        current = data
        for key in keys:
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return default
        return current
    
    @staticmethod
    def group_by_key(items: List[Dict[str, Any]], key: str) -> Dict[Any, List[Dict[str, Any]]]:
        """Группирует элементы по ключу"""
        groups = defaultdict(list)
        for item in items:
            groups[item.get(key)].append(item)
        return dict(groups)
    
    @staticmethod
    def calculate_statistics(numbers: List[Union[int, float]]) -> Dict[str, float]:
        """Вычисляет статистические показатели для списка чисел"""
        if not numbers:
            return {}
        
        return {
            "count": len(numbers),
            "sum": sum(numbers),
            "mean": statistics.mean(numbers),
            "median": statistics.median(numbers),
            "min": min(numbers),
            "max": max(numbers),
            "std_dev": statistics.stdev(numbers) if len(numbers) > 1 else 0
        }

# ==================== VALIDATION UTILITIES ====================

class ValidationUtils:
    """Класс с утилитами для валидации данных"""
    
    @staticmethod
    def is_valid_email(email: str) -> bool:
        """Проверяет валидность email"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def is_valid_uuid(uuid_str: str) -> bool:
        """Проверяет валидность UUID"""
        try:
            uuid.UUID(uuid_str)
            return True
        except ValueError:
            return False
    
    @staticmethod
    def is_strong_password(password: str, min_length: int = 8) -> Dict[str, bool]:
        """Проверяет надежность пароля"""
        checks = {
            "length_ok": len(password) >= min_length,
            "has_uppercase": bool(re.search(r'[A-Z]', password)),
            "has_lowercase": bool(re.search(r'[a-z]', password)),
            "has_numbers": bool(re.search(r'\d', password)),
            "has_special": bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password))
        }
        checks["is_strong"] = all(checks.values())
        return checks
    
    @staticmethod
    def sanitize_html(html_text: str) -> str:
        """Очищает HTML от потенциально опасных тегов"""
        # Удаляем script теги и их содержимое
        html_text = re.sub(r'<script[^>]*>.*?</script>', '', html_text, flags=re.IGNORECASE | re.DOTALL)
        # Удаляем javascript: ссылки
        html_text = re.sub(r'javascript:[^"\']*', '', html_text, flags=re.IGNORECASE)
        # Удаляем опасные теги
        dangerous_tags = ['script', 'object', 'embed', 'link', 'style', 'iframe', 'frame', 'frameset', 'noscript']
        for tag in dangerous_tags:
            html_text = re.sub(f'<{tag}[^>]*>.*?</{tag}>', '', html_text, flags=re.IGNORECASE | re.DOTALL)
            html_text = re.sub(f'<{tag}[^>]*/?>', '', html_text, flags=re.IGNORECASE)
        return html_text

# ==================== LOGGING UTILITIES ====================

class LoggerUtils:
    """Класс с утилитами для логирования"""
    
    @staticmethod
    def setup_logger(name: str, log_file: Optional[str] = None, 
                    level: int = logging.INFO) -> logging.Logger:
        """Настраивает логгер"""
        logger = logging.getLogger(name)
        logger.setLevel(level)
        
        # Создаем форматтер
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # Добавляем консольный хендлер
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        
        # Добавляем файловый хендлер если указан файл
        if log_file:
            FileUtils.ensure_directory(Path(log_file).parent)
            file_handler = logging.FileHandler(log_file)
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
        
        return logger
    
    @staticmethod
    def log_function_call(func: Callable) -> Callable:
        """Декоратор для логирования вызовов функций"""
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            logger = LoggerUtils.setup_logger(func.__module__)
            logger.info(f"Calling function '{func.__name__}' with args: {args}, kwargs: {kwargs}")
            try:
                result = func(*args, **kwargs)
                logger.info(f"Function '{func.__name__}' completed successfully")
                return result
            except Exception as e:
                logger.error(f"Function '{func.__name__}' failed with error: {e}")
                raise
        return wrapper

# ==================== GENERAL UTILITY FUNCTIONS ====================

def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """Безопасное деление с возвратом значения по умолчанию"""
    try:
        return numerator / denominator
    except ZeroDivisionError:
        return default

def generate_unique_filename(prefix: str = "", extension: str = "") -> str:
    """Генерирует уникальное имя файла"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    uuid_part = str(uuid.uuid4())[:8]
    return f"{prefix}{timestamp}_{uuid_part}{extension}"

def calculate_age(birth_date: datetime) -> int:
    """Вычисляет возраст на основе даты рождения"""
    today = datetime.now()
    age = today.year - birth_date.year
    if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
        age -= 1
    return age

def format_file_size(size_bytes: int) -> str:
    """Форматирует размер файла в читаемый вид"""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"

def parse_duration(duration_str: str) -> timedelta:
    """Парсит строковое представление продолжительности"""
    # Поддерживаем форматы: "1h 30m", "90m", "5400s"
    pattern = r'(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?'
    match = re.match(pattern, duration_str.strip())
    
    if not match:
        raise ValueError(f"Invalid duration format: {duration_str}")
    
    hours, minutes, seconds = match.groups()
    total_seconds = 0
    
    if hours:
        total_seconds += int(hours) * 3600
    if minutes:
        total_seconds += int(minutes) * 60
    if seconds:
        total_seconds += int(seconds)
    
    return timedelta(seconds=total_seconds)

class ProgressTracker:
    """Класс для отслеживания прогресса выполнения задач"""
    
    def __init__(self, total: int, description: str = "Processing"):
        self.total = total
        self.current = 0
        self.description = description
    
    def update(self, increment: int = 1):
        """Обновляет прогресс"""
        self.current = min(self.current + increment, self.total)
        percentage = (self.current / self.total) * 100
        print(f"\r{self.description}: {self.current}/{self.total} ({percentage:.1f}%)", end="")
        
        if self.current >= self.total:
            print()  # Перевод строки после завершения

# ==================== MAIN HELPER FUNCTIONS ====================

@timing_decorator
def process_data_batch(data: List[Dict[str, Any]], processor_func: Callable) -> List[Any]:
    """Обрабатывает батч данных с отслеживанием прогресса"""
    results = []
    tracker = ProgressTracker(len(data), "Processing data batch")
    
    for item in data:
        try:
            result = processor_func(item)
            results.append(result)
        except Exception as e:
            logging.error(f"Error processing item {item}: {e}")
        finally:
            tracker.update()
    
    return results

@cache_result(expire_seconds=60)
def expensive_computation(x: int, y: int) -> int:
    """Пример дорогой вычислительной операции"""
    time.sleep(0.1)  # Имитация долгой операции
    return x ** y + y ** x

def find_duplicates(items: List[T]) -> List[T]:
    """Находит дубликаты в списке"""
    seen = set()
    duplicates = set()
    
    for item in items:
        if item in seen:
            duplicates.add(item)
        else:
            seen.add(item)
    
    return list(duplicates)

def clean_string(text: str, remove_special: bool = True) -> str:
    """Очищает строку от лишних символов"""
    if remove_special:
        text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

# Экспорт основных утилит
__all__ = [
    # Decorators
    "timing_decorator", "retry_decorator", "cache_result", "validate_input", "singleton",
    
    # Utility classes
    "FileUtils", "StringUtils", "DataUtils", "ValidationUtils", "LoggerUtils",
    
    # Helper functions
    "safe_divide", "generate_unique_filename", "calculate_age", "format_file_size",
    "parse_duration", "ProgressTracker", "process_data_batch", "expensive_computation",
    "find_duplicates", "clean_string"
]