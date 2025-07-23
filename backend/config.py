from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./doc-query.db"
    
    # OpenAI
    openai_api_key: Optional[str] = None
    
    # Vector Database
    chroma_db_path: str = "./chroma_db"
    
    # File Storage
    upload_dir: str = "./uploads"
    
    # Application
    app_name: str = "Doc Query"
    debug: bool = True
    
    # Frontend URL (for CORS)
    next_public_app_url: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra fields in .env file

# Create settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.upload_dir, exist_ok=True)
os.makedirs(settings.chroma_db_path, exist_ok=True) 