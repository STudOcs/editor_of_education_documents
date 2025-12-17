from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.models import User

# Указываем, откуда FastAPI брать токен (из URL /auth/login)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Получение сессии БД
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# Главная функция: получить текущего юзера по токену
async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Декодируем токен
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        login: str = payload.get("sub")
        if login is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Ищем юзера в БД
    result = await db.execute(select(User).where(User.login == login))
    user = result.scalars().first()
    
    if user is None:
        raise credentials_exception
    return user