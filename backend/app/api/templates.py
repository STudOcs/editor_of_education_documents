from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.models import Template, User, UserRole
from app.schemas.template import TemplateCreate, TemplateResponse

router = APIRouter()

# 1. Получить список всех шаблонов (Используется при создании документа, чтобы выбрать базу)
@router.get("/", response_model=List[TemplateResponse])
async def read_templates(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Template).offset(skip).limit(limit))
    return result.scalars().all()

# 2. Создать шаблон (Админка / Настройка системы)
@router.post("/", response_model=TemplateResponse)
async def create_template(
    template_in: TemplateCreate,  
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # if current_user.role != UserRole.ADMIN:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Not enough privileges. Only admins can create templates."
    #     )

    new_template = Template(
        name_tmp=template_in.name_tmp,
        definition_tmp=template_in.definition_tmp,
        latex_preambula_tmp=template_in.latex_preambula_tmp 
    )
    db.add(new_template)
    await db.commit()
    await db.refresh(new_template)
    return new_template

# 3. Удалить шаблон
@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # # ПРОВЕРКА ПРАВ
    # if current_user.role != UserRole.ADMIN:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Not enough privileges. Only admins can delete templates."
    #     )

    result = await db.execute(select(Template).where(Template.template_id == template_id))
    template = result.scalars().first()
    
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    
    await db.delete(template)
    await db.commit()
    return None