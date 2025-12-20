import asyncio
import asyncpg
import sys

# Настройка Loop для Windows
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def test_connect():
    print("1. Начинаем подключение...")
    try:
        # Подключаемся напрямую через драйвер
        conn = await asyncpg.connect(
            user="postgres",
            password="postgres",
            database="report_app",
            host="127.0.0.1",
            port=5433
        )
        print("2. УСПЕХ! Соединение установлено.")
        
        # Делаем простой запрос
        version = await conn.fetchval("SELECT version()")
        print(f"3. Версия базы: {version}")
        
        await conn.close()
        print("4. Соединение закрыто корректно.")
        
    except Exception as e:
        print(f"!!! ОШИБКА !!!: {e}")

if __name__ == "__main__":
    asyncio.run(test_connect())