from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime
import os
import shutil
from database import get_db, Document
from config import settings

router = APIRouter()

# Pydantic models
class DocumentResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    uploaded_at: datetime
    is_processed: bool

class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a document file"""
    # Validate file type
    allowed_types = [".pdf", ".md", ".html", ".txt"]
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Save file to upload directory
    file_path = os.path.join(settings.upload_dir, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Create document record in database
    document = Document(
        filename=file.filename,
        file_path=file_path,
        file_type=file_extension[1:],  # Remove the dot
        content="",  # Will be populated during processing
        is_processed=False
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    return {
        "message": "Document uploaded successfully",
        "document_id": document.id,
        "filename": document.filename
    }

@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all uploaded documents"""
    documents = db.query(Document).offset(skip).limit(limit).all()
    total = db.query(Document).count()
    
    return DocumentListResponse(
        documents=[
            DocumentResponse(
                id=doc.id,
                filename=doc.filename,
                file_type=doc.file_type,
                uploaded_at=doc.uploaded_at,
                is_processed=doc.is_processed
            )
            for doc in documents
        ],
        total=total
    )

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific document by ID"""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return DocumentResponse(
        id=document.id,
        filename=document.filename,
        file_type=document.file_type,
        uploaded_at=document.uploaded_at,
        is_processed=document.is_processed
    )

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Delete a document"""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file from filesystem
    try:
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
    
    # Delete from database
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"}

@router.post("/{document_id}/process")
async def process_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Process a document (placeholder for RAG pipeline)"""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if document.is_processed:
        raise HTTPException(status_code=400, detail="Document already processed")
    
    # TODO: Implement document processing (parsing, chunking, embedding)
    # For now, just mark as processed
    document.is_processed = True
    document.content = f"Processed content from {document.filename}"
    db.commit()
    
    return {"message": "Document processing started", "document_id": document_id} 