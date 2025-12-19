from fastapi import FastAPI
from app.api import auth, templates, documents 
from app.services.latex_compiler import check_latex_availability

app = FastAPI(title="Report Constructor API")

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