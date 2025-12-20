import uvicorn
import sys
import asyncio

if __name__ == "__main__":
    # 1. Принудительно меняем политику ДО запуска сервера
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    # 2. Запускаем uvicorn программно
    # reload=True позволяет серверу перезагружаться при изменении кода
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)