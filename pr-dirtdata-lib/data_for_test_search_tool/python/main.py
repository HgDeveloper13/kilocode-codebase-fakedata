# main.py
from utils.user_data import load_user_profile, save_user_profile

def initialize_user_session(user_id):
    """
    Инициализирует сессию нового пользователя.
    """
    print("Инициализация сессии...")
    user_data = load_user_profile(user_id)
    print(f"Пользователь {user_data['name']} вошел в систему.")
    return user_data

def handle_user_action(user_id, action):
    """
    Обрабатывает действие, выполненное пользователем.
    """
    if action == "save":
        # Просто для примера, данные не меняются
        current_data = {"level": 5, "gold": 110}
        save_user_profile(user_id, current_data)
        print(f"Действие '{action}' для пользователя {user_id} обработано.")
    else:
        print(f"Неизвестное действие: {action}")

if __name__ == "__main__":
    test_user_id = 123
    initialize_user_session(test_user_id)
    handle_user_action(test_user_id, "save")