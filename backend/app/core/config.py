class Settings:
    PROJECT_NAME: str = "Report Constructor"
    VERSION: str = "1.0.0"
    
    # Секретный ключ для шифрования токенов. 
    # В продакшене его надо генерировать случайно и прятать в .env
    # Сгенерировать можно командой в терминале: openssl rand -hex 32
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 дней

settings = Settings()
