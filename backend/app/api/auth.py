from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta

from app.api.deps import get_db, get_current_user
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings
from app.models.models import User
from app.schemas.user import UserCreate, UserResponse, Token

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # 1. Проверяем, есть ли такой email или login
    result = await db.execute(select(User).where((User.email == user_in.email) | (User.login == user_in.login)))
    if result.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="User with this email or login already exists"
        )
    
    # 2. Создаем нового юзера
    new_user = User(
        email=user_in.email,
        login=user_in.login,
        name_user=user_in.name_user,
        password_hash=get_password_hash(user_in.password), # Хешируем!
        role="user"
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # OAuth2PasswordRequestForm требует поля username и password
    # У нас login вместо username, но форма шлет "username"
    
    # 1. Ищем юзера
    result = await db.execute(select(User).where(User.login == form_data.username))
    user = result.scalars().first()
    
    # 2. Проверяем пароль
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect login or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Генерируем токен
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.login}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Тестовая защищенная ручка
@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user