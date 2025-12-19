from fastapi import FastAPI
from app.api import auth, templates # <--- Импортируем templates
from app.services.latex_compiler import check_latex_availability

app = FastAPI(title="Report Constructor API")

# Проверка LaTeX при запуске
@app.on_event("startup")
async def startup_event():
    is_installed, msg = check_latex_availability()
    print(f"LaTeX Check: {msg}")

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(templates.router, prefix="/templates", tags=["Templates"]) # <--- Подключаем

@app.get("/")
def root():
    return {"message": "System is running"}