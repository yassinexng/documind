from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.orm import declarative_base, validates
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
import re

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        CheckConstraint('LENGTH(TRIM(username)) > 0', name='username_not_empty'),
        CheckConstraint('LENGTH(TRIM(password_hash)) > 0', name='password_not_empty'),
    )
    
    @validates('username')
    def validate_username(self, key, username):
        if not username:
            raise ValueError("Username cannot be empty")
        
        if not username.strip():
            raise ValueError("Username cannot be empty")
        
        username = username.strip()
        
        if len(username) > 50:
            raise ValueError("Username cannot exceed 50 characters")
        
        pattern = r'^[a-zA-Z0-9_]+$'
        if not re.match(pattern, username):
            raise ValueError("Username can only contain letters, numbers, and underscores")
        
        return username
    
    @validates('password_hash')
    def validate_password(self, key, password_hash):
        if not password_hash:
            raise ValueError("Password cannot be empty")
        
        if not password_hash.strip():
            raise ValueError("Password cannot be empty")
        
        return password_hash.strip()

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(Text, nullable=False)
    file_type = Column(String(10))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        CheckConstraint('LENGTH(TRIM(file_name)) > 0', name='filename_not_empty'),
    )
    
    @validates('file_name')
    def validate_filename(self, key, file_name):
        if not file_name:
            raise ValueError("Filename cannot be empty")
        
        if not file_name.strip():
            raise ValueError("Filename cannot be empty")
        
        return file_name.strip()
    
    @validates('file_type')
    def validate_filetype(self, key, file_type):
        if file_type:
            if len(file_type) > 10:
                raise ValueError("File type cannot exceed 10 characters")
        
        return file_type

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(384))
    chunk_index = Column(Integer, nullable=False)
    
    __table_args__ = (
        CheckConstraint('LENGTH(TRIM(content)) > 0', name='content_not_empty'),
        CheckConstraint('chunk_index >= 0', name='chunk_index_non_negative'),
    )
    
    @validates('content')
    def validate_content(self, key, content):
        if not content:
            raise ValueError("Chunk content cannot be empty")
        
        if not content.strip():
            raise ValueError("Chunk content cannot be empty")
        
        return content.strip()
    
    @validates('chunk_index')
    def validate_chunk_index(self, key, chunk_index):
        if chunk_index < 0:
            raise ValueError("Chunk index cannot be negative")
        
        return chunk_index