from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

# Базовая схема
class DocumentBase(BaseModel):
    name_doc: str

# Для создания (Фронт шлет имя и ID шаблона)
class DocumentCreate(DocumentBase):
    template_id: int

# Для обновления (Фронт шлет структуру редактора и готовый LaTeX)
class DocumentUpdate(BaseModel):
    name_doc: Optional[str] = None
    content_json: Optional[Dict[str, Any]] = None # JSON от React-редактора
    latex_source: Optional[str] = None # Текст для компиляции

# Для ответа (Отдаем всё, включая даты)
class DocumentResponse(DocumentBase):
    doc_id: int
    user_id: int
    template_id: int
    content_json: Optional[Dict[str, Any]]
    latex_source: Optional[str]
    creation_data_doc: datetime
    changes_data_doc: Optional[datetime]
    
    # Поля для PDF компиляции
    pdf_path: Optional[str] = None
    compilation_status: str = "not_compiled"  # Дефолтное значение
    compilation_log: Optional[str] = None
    pdf_generated_at: Optional[datetime] = None

    class Config:
        from_attributes = True