from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from config import settings

router = APIRouter()

@router.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "service": "Doc Query API",
        "version": "1.0.0"
    }

@router.get("/health/detailed")
async def detailed_health_check(db: Session = Depends(get_db)):
    """Detailed health check with database connectivity"""
    try:
        # Test database connection
        db.execute("SELECT 1")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "service": "Doc Query API",
        "version": "1.0.0",
        "database": db_status,
        "config": {
            "upload_dir": settings.upload_dir,
            "chroma_db_path": settings.chroma_db_path,
            "openai_configured": bool(settings.openai_api_key)
        }
    } 