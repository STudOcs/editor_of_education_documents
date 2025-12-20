from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

# Строка подключения: postgresql+asyncpg://USER:PASSWORD@HOST:PORT/DB_NAME
DATABASE_URL = "postgresql+asyncpg://postgres:postgres@127.0.0.1:5433/report_app"

engine = create_async_engine(
    DATABASE_URL, 
    echo=True,
    # Добавь эту настройку:
    pool_pre_ping=True
)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
)