import hashlib
import logging
from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, logger, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.models import Document, Template, User
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse

from app.services.user_service import UserService
from app.services.compiler_services import CompilerService
from app.db.session import AsyncSessionLocal

router = APIRouter()

@router.post("/", response_model=DocumentResponse)
async def create_document(
    doc_in: DocumentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Ищем шаблон
    result = await db.execute(select(Template).where(Template.template_id == doc_in.template_id))
    template = result.scalars().first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # 2. Подготавливаем данные пользователя
    user_data = UserService.get_title_page_data(current_user)
    
    # 3. Берем исходный код шаблона
    source_latex = template.latex_preambula_tmp
    
    # 4. ВЫПОЛНЯЕМ ЗАМЕНУ МАРКЕРОВ
    # Если в шаблоне есть эти слова, они заменятся на данные. Если нет - текст останется как есть.
    filled_latex = source_latex.replace("VAR_GROUP", str(user_data["group"]))
    filled_latex = filled_latex.replace("VAR_CARD", str(user_data["student_card"]))
    # Можно использовать initials (Иванов И.И.) или signature_name (И.И. Иванов)
    filled_latex = filled_latex.replace("VAR_STUDENT_SIGNATURE", str(user_data["initials"]))

    # 5. Создаем документ уже с заполненными данными
    new_doc = Document(
        name_doc=doc_in.name_doc,
        user_id=current_user.user_id,
        template_id=template.template_id,
        latex_source=filled_latex, # <--- Сохраняем измененный текст
        content_json={} 
    )
    
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)
    return new_doc

# 2. Получить список МОИХ документов
@router.get("/", response_model=List[DocumentResponse])
async def read_documents(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Фильтруем по user_id
    query = select(Document).where(Document.user_id == current_user.user_id).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

# 3. Получить один документ по ID (Проверка, что он принадлежит юзеру)
@router.get("/{doc_id}", response_model=DocumentResponse)
async def read_document(
    doc_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Document).where(Document.doc_id == doc_id))
    doc = result.scalars().first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Чужой документ читать нельзя
    if doc.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not enough privileges")
        
    return doc

# 4. Обновить документ (Сохранение)
@router.put("/{doc_id}", response_model=DocumentResponse)
async def update_document(
    doc_id: int,
    doc_in: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Получаем документ
    result = await db.execute(select(Document).where(Document.doc_id == doc_id))
    doc = result.scalars().first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not enough privileges")

    # Обновляем поля, если они пришли
    if doc_in.name_doc is not None:
        doc.name_doc = doc_in.name_doc
    if doc_in.content_json is not None:
        doc.content_json = doc_in.content_json
    if doc_in.latex_source is not None:
        doc.latex_source = doc_in.latex_source # Фронт перезаписывает код

    await db.commit()
    await db.refresh(doc)
    return doc

# 5. Удалить документ
@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Document).where(Document.doc_id == doc_id))
    doc = result.scalars().first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if doc.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    
    await db.delete(doc)
    await db.commit()
    return None

# 6. Компиляция документа
@router.post("/{doc_id}/compile")
async def compile_document(
    doc_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Скомпилировать документ в PDF (работает только на Windows хосте)"""
    from sqlalchemy import select
    import platform
    
    # Проверяем, что мы на Windows (TeX Live установлен на хосте)
    if platform.system() != "Windows":
        raise HTTPException(
            status_code=501,
            detail="Компиляция PDF доступна только на Windows хосте с установленным TeX Live"
        )
    
    # Получаем документ из базы
    result = await db.execute(
        select(Document).where(
            Document.doc_id == doc_id,
            Document.user_id == current_user.user_id
        )
    )
    document = result.scalars().first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Документ не найден")
    
    if not document.latex_source:
        raise HTTPException(status_code=400, detail="Нет LaTeX кода для компиляции")
    
    # Валидация LaTeX кода
    is_valid, validation_msg = CompilerService.validate_latex_content(document.latex_source)
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Невалидный LaTeX: {validation_msg}")
    
    # Проверяем доступность компилятора на хосте
    available, compiler_msg = CompilerService.verify_compiler_available()
    if not available:
        raise HTTPException(
            status_code=503,
            detail=f"TeX Live компилятор недоступен на хосте: {compiler_msg}"
        )
    
    # Обновляем статус на "compiling"
    await db.execute(
        update(Document)
        .where(Document.doc_id == doc_id)
        .values(compilation_status="compiling")
    )
    await db.commit()
    
    # Запускаем компиляцию в фоновом режиме
    background_tasks.add_task(
        compile_document_background_task,
        doc_id=doc_id,
        latex_content=document.latex_source
    )
    
    return {
        "doc_id": doc_id,
        "status": "compilation_started",
        "message": "Компиляция начата в фоновом режиме",
        "compiler_info": compiler_msg
    }

async def compile_document_background_task(
    doc_id: int,
    latex_content: str
):
    """Фоновая задача компиляции с новой сессией БД"""
    from sqlalchemy import update, select
    from sqlalchemy.sql import func
    import asyncio
    
    # Создаем новую сессию для фоновой задачи
    async with AsyncSessionLocal() as db:
        try:
            # Компилируем LaTeX в PDF
            pdf_content, log = await asyncio.to_thread(
                CompilerService.compile_latex_to_pdf,
                latex_content
            )
            
            # Получаем документ для проверки
            result = await db.execute(
                select(Document).where(Document.doc_id == doc_id)
            )
            document = result.scalars().first()
            
            if not document:
                logger.error(f"Документ {doc_id} не найден при компиляции")
                return
            
            if pdf_content:
                # Создаем хэш контента для уникального имени
                content_hash = hashlib.md5(latex_content.encode()).hexdigest()[:8]
                
                # Сохраняем PDF
                media_dir = Path("media") / "documents"
                media_dir.mkdir(parents=True, exist_ok=True)
                pdf_filename = f"document_{doc_id}_{content_hash}.pdf"
                pdf_path = media_dir / pdf_filename
                
                pdf_path.write_bytes(pdf_content)
                
                # Обновляем документ в БД (сохраняем относительный путь)
                await db.execute(
                    update(Document)
                    .where(Document.doc_id == doc_id)
                    .values(
                        pdf_path=f"documents/{pdf_filename}",
                        compilation_status="success",
                        compilation_log=log[:5000],
                        pdf_generated_at=func.now()
                    )
                )
                logging.info(f"PDF успешно создан для документа {doc_id}: {pdf_filename}")
            else:
                # Ошибка компиляции
                await db.execute(
                    update(Document)
                    .where(Document.doc_id == doc_id)
                    .values(
                        compilation_status="error",
                        compilation_log=log[:5000]
                    )
                )
                logger.error(f"Ошибка компиляции документа {doc_id}: {log}")
            
            await db.commit()
            
        except Exception as e:
            # Логируем ошибку
            logging.error(f"Ошибка компиляции документа {doc_id}: {str(e)}", exc_info=True)
            
            try:
                # Обновляем статус ошибки
                await db.execute(
                    update(Document)
                    .where(Document.doc_id == doc_id)
                    .values(
                        compilation_status="error",
                        compilation_log=f"Системная ошибка: {str(e)}"
                    )
                )
                await db.commit()
            except Exception as db_error:
                logger.error(f"Не удалось обновить статус ошибки: {db_error}")

# 7. Получить скомпилированный PDF
@router.get("/{doc_id}/pdf")
async def get_document_pdf(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить скомпилированный PDF документа"""
    from sqlalchemy import select
    
    result = await db.execute(
        select(Document).where(
            Document.doc_id == doc_id,
            Document.user_id == current_user.user_id
        )
    )
    document = result.scalars().first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Документ не найден")
    
    if not document.pdf_path or document.compilation_status != "success":
        raise HTTPException(status_code=404, detail="PDF не скомпилирован или компиляция не завершена")
    
    # Собираем полный путь из относительного
    pdf_full_path = Path("media") / document.pdf_path
    
    if not pdf_full_path.exists():
        raise HTTPException(status_code=404, detail="PDF файл не найден на диске")
    
    return FileResponse(
        path=pdf_full_path,
        filename=f"{document.name_doc}.pdf",
        media_type='application/pdf'
    )

# 8. Получить статус компиляции
@router.get("/{doc_id}/compile-status")
async def get_compile_status(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить статус компиляции документа"""
    from sqlalchemy import select
    
    result = await db.execute(
        select(Document).where(
            Document.doc_id == doc_id,
            Document.user_id == current_user.user_id
        )
    )
    document = result.scalars().first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Документ не найден")
    
    # Проверяем существование файла
    pdf_exists = False
    if document.pdf_path:
        pdf_full_path = Path("media") / document.pdf_path
        pdf_exists = pdf_full_path.exists()
    
    return {
        "doc_id": doc_id,
        "status": document.compilation_status,
        "generated_at": document.pdf_generated_at,
        "pdf_exists": pdf_exists,
        "pdf_path": document.pdf_path
    }