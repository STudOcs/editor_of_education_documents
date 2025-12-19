from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Базовая схема
class UserBase(BaseModel):
    """Базовые поля пользователя (для регистрации и ответа)"""
    email: EmailStr
    login: str
    last_name: str
    first_name: str
    middle_name: Optional[str] = None
    group_name: Optional[str] = None
    student_card: Optional[str] = None
    department: Optional[str] = None

# То, что приходит при регистрации
class UserCreate(UserBase):
    """То, что приходит при регистрации (добавляем пароль)"""
    password: str
    
# То, что отдаем обратно (без пароля!)
class UserResponse(UserBase):
    user_id: int
    registration_date: datetime
    
    class Config:
        from_attributes = True # Важно для работы с SQLAlchemy моделями

class TitlePageData(BaseModel):
    """Схема специально для титульного листа"""
    last_name: str
    first_name: str
    middle_name: Optional[str]
    initials: str  # Иванов И.П.
    group: Optional[str]
    student_card: Optional[str]
    department: Optional[str]
    
    class Config:
        from_attributes = True
        
# Схема для Токена
class Token(BaseModel):
    access_token: str
    token_type: str