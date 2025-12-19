from pydantic import BaseModel
from typing import Optional
from pathlib import Path

# 1. Определяем путь к файлу
# (предполагаем, что папка templates лежит в корне backend, рядом с app и venv)
template_path = Path("templates/report.tex") 

# 2. ЧИТАЕМ файл в строку. 
# Базе нужен текст, а не путь.
if template_path.exists():
    DEFAULT_LATEX_TEMPLATE = template_path.read_text(encoding="utf-8")
else:
    # Запасной вариант, если файл не найден, чтобы сервер не упал
    print(f"WARNING: Файл шаблона не найден по пути {template_path.absolute()}")
    DEFAULT_LATEX_TEMPLATE = r"\documentclass{article} \begin{document} Error: Template file not found \end{document}"

class TemplateBase(BaseModel):
    name_tmp: str
    definition_tmp: Optional[str] = None
    # Pydantic теперь получит строку (содержимое файла), а не объект WindowsPath
    latex_preambula_tmp: str = DEFAULT_LATEX_TEMPLATE 

class TemplateCreate(TemplateBase):
    pass

class TemplateResponse(TemplateBase):
    template_id: int

    class Config:
        from_attributes = True