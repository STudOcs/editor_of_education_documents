from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta

from app.api.deps import get_db, get_current_user
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings
from app.models.models import User, UserRole
from app.schemas.user import UserCreate, UserResponse, Token, TitlePageData
from app.services.user_service import UserService

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(
    user_in: UserCreate, 
    db: AsyncSession = Depends(get_db)
):
    """
    Регистрация нового пользователя.
    
    Принимает данные пользователя включая ФИО, учебные данные и пароль.
    Возвращает созданного пользователя (без пароля).
    """
    # 1. Проверяем существование пользователя с таким email или login
    result = await db.execute(
        select(User).where(
            (User.email == user_in.email) | (User.login == user_in.login)
        )
    )
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email или логином уже существует"
        )
    
    # 2. Валидация данных студента
    validation_errors = UserService.validate_student_data(
        last_name=user_in.last_name,
        first_name=user_in.first_name,
        group=user_in.group_name,
        student_card=user_in.student_card
    )
    
    if validation_errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=validation_errors
        )
    
    # 3. Создаем нового пользователя
    new_user = User(
        email=user_in.email,
        login=user_in.login,
        password_hash=get_password_hash(user_in.password),
        
        # Личные данные
        last_name=user_in.last_name,
        first_name=user_in.first_name,
        middle_name=user_in.middle_name,
        
        # Учебные данные
        group_name=user_in.group_name,
        student_card=user_in.student_card,
        department=user_in.department,
        
        # Роль по умолчанию
        role=UserRole.USER
    )
    
    try:
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при создании пользователя: {str(e)}"
        )
    
    return new_user

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Аутентификация пользователя.
    
    Принимает логин и пароль, возвращает JWT токен.
    OAuth2 форма использует 'username' для логина.
    """
    # 1. Ищем пользователя по логину
    result = await db.execute(
        select(User).where(User.login == form_data.username)
    )
    user = result.scalars().first()
    
    # 2. Проверяем существование пользователя и пароль
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Генерируем JWT токен
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.login},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: User = Depends(get_current_user)
):
    """
    Получить данные текущего аутентифицированного пользователя.
    
    Требует действительный JWT токен в заголовке Authorization.
    """
    return current_user

@router.get("/me/title-data", response_model=TitlePageData)
async def get_my_title_data(
    current_user: User = Depends(get_current_user)
):
    """
    Получить форматированные данные пользователя для титульного листа.
    
    Возвращает данные в формате, готовом для подстановки в LaTeX шаблон.
    """
    title_data = UserService.get_title_page_data(current_user)
    return TitlePageData(**title_data)

# Тестовая защищенная ручка
@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user