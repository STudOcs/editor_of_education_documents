from fastapi import FastAPI
from app.api import auth

app = FastAPI(title="Report Constructor API")

# Подключаем роутер авторизации
app.include_router(auth.router, prefix="/auth", tags=["Auth"])

@app.get("/")
def root():
    return {"message": "Hello from FastAPI Report Constructor"}