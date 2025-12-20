import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

# Enum для ролей (вместо наследования Admin от User)
class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    login = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    
    last_name = Column(String, nullable=False)  # Фамилия (обязательно)
    first_name = Column(String, nullable=False)  # Имя (обязательно)
    middle_name = Column(String, nullable=True)  # Отчество (необязательно)
    
    group_name = Column(String, nullable=True)   # Группа
    student_card = Column(String, nullable=True) # Номер зачетки
    department = Column(String, nullable=True)   # Кафедра
    
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    registration_date = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    documents = relationship("Document", back_populates="user")
    images = relationship("Image", back_populates="user")
    feedbacks = relationship("Feedback", back_populates="user")

class Template(Base):
    __tablename__ = "templates"

    template_id = Column(Integer, primary_key=True, index=True)
    name_tmp = Column(String, nullable=False)
    definition_tmp = Column(String, nullable=True)
    latex_preambula_tmp = Column(Text, nullable=False) # Вся шапка LaTeX

    documents = relationship("Document", back_populates="template")
    elements = relationship("Element", back_populates="template")

class Document(Base):
    __tablename__ = "documents"

    doc_id = Column(Integer, primary_key=True, index=True)
    name_doc = Column(String, nullable=False)
    
    # Храним данные редактора (JSON) и итоговый LaTeX код
    content_json = Column(JSON, nullable=True) 
    latex_source = Column(Text, nullable=True)
    
    # PDF генерация
    pdf_path = Column(String, nullable=True)  # путь к PDF файлу
    pdf_generated_at = Column(DateTime(timezone=True), nullable=True)
    compilation_status = Column(String, default="not_compiled")  # not_compiled, success, error
    compilation_log = Column(Text, nullable=True)  # логи компиляции
    
    creation_data_doc = Column(DateTime(timezone=True), server_default=func.now())
    changes_data_doc = Column(DateTime(timezone=True), onupdate=func.now())
    
    user_id = Column(Integer, ForeignKey("users.user_id"))
    template_id = Column(Integer, ForeignKey("templates.template_id"))

    user = relationship("User", back_populates="documents")
    template = relationship("Template", back_populates="documents")

class Image(Base):
    __tablename__ = "images"

    image_id = Column(Integer, primary_key=True, index=True)
    name_img = Column(String)
    url_img = Column(String) # Путь к файлу на сервере
    heading_img = Column(String, nullable=True)
    upload_data_img = Column(DateTime(timezone=True), server_default=func.now())
    
    user_id = Column(Integer, ForeignKey("users.user_id"))
    user = relationship("User", back_populates="images")

class Feedback(Base):
    __tablename__ = "feedbacks"

    feedback_id = Column(Integer, primary_key=True, index=True)
    content_fb = Column(Text)
    type_fb = Column(String) # Например: "error", "suggestion"
    creation_date_fb = Column(DateTime(timezone=True), server_default=func.now())
    
    user_id = Column(Integer, ForeignKey("users.user_id"))
    user = relationship("User", back_populates="feedbacks")

class Element(Base):
    __tablename__ = "elements"
    
    element_id = Column(Integer, primary_key=True, index=True)
    name_elem = Column(String)
    content_elem = Column(Text) # LaTeX код элемента
    template_id = Column(Integer, ForeignKey("templates.template_id"))
    
    template = relationship("Template", back_populates="elements")