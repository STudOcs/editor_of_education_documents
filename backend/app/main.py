from fastapi import FastAPI
import asyncio
import sys
from app.api import auth, templates, documents 
from app.services.latex_compiler import check_latex_availability
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Report Constructor API")

# Определяем список разрешенных адресов
origins = [
    "http://localhost:3000",    # Адрес твоего React-приложения
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # Разрешаем запросы с этих адресов
    allow_credentials=True,           # Разрешаем передачу кук и заголовков авторизации
    allow_methods=["*"],               # Разрешаем все методы (GET, POST, PATCH, DELETE и т.д.)
    allow_headers=["*"],               # Разрешаем все заголовки
)

# Проверка LaTeX при запуске
@app.on_event("startup")
async def startup_event():
    is_installed, msg = check_latex_availability()
    print(f"LaTeX Check: {msg}")

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(templates.router, prefix="/templates", tags=["Templates"])
app.include_router(documents.router, prefix="/documents", tags=["Documents"])

@app.get("/")
def root():
    return {"message": "System is running"}