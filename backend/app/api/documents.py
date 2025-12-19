from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.models import Document, Template, User
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse

router = APIRouter()

# 1. Создать документ (Самая важная логика)
@router.post("/", response_model=DocumentResponse)
async def create_document(
    doc_in: DocumentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # А. Ищем шаблон, чтобы взять из него исходный код
    result = await db.execute(select(Template).where(Template.template_id == doc_in.template_id))
    template = result.scalars().first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Б. Создаем документ, копируя latex_preambula_tmp в latex_source
    new_doc = Document(
        name_doc=doc_in.name_doc,
        user_id=current_user.user_id,
        template_id=template.template_id,
        latex_source=template.latex_preambula_tmp, # <--- КОПИРОВАНИЕ
        content_json={} # Пустой JSON редактора пока
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