from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Базовая схема
class UserBase(BaseModel):
    email: EmailStr
    login: str

# То, что приходит при регистрации
class UserCreate(UserBase):
    password: str
    name_user: Optional[str] = None

# То, что отдаем обратно (без пароля!)
class UserResponse(UserBase):
    user_id: int
    name_user: Optional[str]
    registration_date: datetime
    
    class Config:
        from_attributes = True # Важно для работы с SQLAlchemy моделями

# Схема для Токена
class Token(BaseModel):
    access_token: str
    token_type: str