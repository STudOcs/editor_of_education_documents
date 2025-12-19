from typing import Dict, Optional, Any
from app.models.models import User


class UserService:
    """Сервис для бизнес-логики пользователей"""
    
    @staticmethod
    def format_initials(last_name: str, first_name: str, middle_name: Optional[str] = None) -> str:
        """
        Форматирует фамилию и инициалы.
        
        Пример:
        - Иванов Иван Петрович → "Иванов И.П."
        - Петров Алексей → "Петров А."
        - Сидорова (без имени) → "Сидорова"
        """
        if not last_name:
            return ""
        
        result = last_name.strip()
        
        # Добавляем инициал имени
        if first_name and first_name.strip():
            result += f" {first_name.strip()[0]}."
        
        # Добавляем инициал отчества
        if middle_name and middle_name.strip():
            # Если уже есть точка от имени, не ставим пробел
            if result.endswith('.'):
                result += f"{middle_name.strip()[0]}."
            else:
                result += f" {middle_name.strip()[0]}."
        
        return result
    
    @staticmethod
    def format_initials_reverse(last_name: str, first_name: str, middle_name: Optional[str] = None) -> str:
        """
        Формат: И.П. Иванов (часто нужно для подписей)
        """
        initials = ""
        if first_name and first_name.strip():
            initials += f"{first_name.strip()[0]}."
        if middle_name and middle_name.strip():
            initials += f"~{middle_name.strip()[0]}." # Тильда в LaTeX это неразрывный пробел
        
        if not last_name:
            return ""
            
        return f"{initials} {last_name.strip()}" if initials else last_name.strip()

    @staticmethod
    def get_title_page_data(user: User) -> Dict[str, Any]:
        """
        Извлекает данные пользователя для автозаполнения титульного листа.
        
        Возвращает словарь с ключами:
        - last_name, first_name, middle_name (отдельно)
        - initials (форматированные: "Иванов И.П.")
        - group, student_card, department
        """
        return {
            "last_name": user.last_name or "",           # должно быть
            "first_name": user.first_name or "",         # должно быть
            "middle_name": user.middle_name or "",   
            "initials": UserService.format_initials(
                user.last_name, 
                user.first_name, 
                user.middle_name
            ),
            "group": user.group_name or "",
            "student_card": user.student_card or "",
            "department": user.department or ""
        }
    
    @staticmethod
    def validate_student_data(
        last_name: str,
        first_name: str,
        group: Optional[str] = None,
        student_card: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Валидация данных студента.
        
        Возвращает словарь с ошибками или пустой если все ок.
        """
        errors = {}
        
        # Проверка обязательных полей
        if not last_name or len(last_name.strip()) < 2:
            errors["last_name"] = "Фамилия должна содержать минимум 2 символа"
        
        if not first_name or len(first_name.strip()) < 2:
            errors["first_name"] = "Имя должно содержать минимум 2 символа"
        
        # Проверка необязательных полей
        if group and len(group.strip()) < 3:
            errors["group"] = "Название группы слишком короткое"
        
        if student_card and not student_card.strip().isdigit():
            errors["student_card"] = "Номер зачетки должен содержать только цифры"
        
        return errors
    
    @staticmethod
    def prepare_user_for_response(user: User) -> Dict[str, Any]:
        """
        Подготавливает данные пользователя для ответа API.
        Можно добавлять/убирать поля для разных эндпоинтов.
        """
        return {
            "user_id": user.user_id,
            "login": user.login,
            "email": user.email,
            "last_name": user.last_name,
            "first_name": user.first_name,
            "middle_name": user.middle_name,
            "group_name": user.group_name,
            "student_card": user.student_card,
            "department": user.department,
            "registration_date": user.registration_date.isoformat() if user.registration_date else None
        }