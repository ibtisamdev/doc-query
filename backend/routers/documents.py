from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import shutil
import json
from database import get_db, Document
from config import settings
from document_processor import DocumentProcessor

router = APIRouter()

# Pydantic models
class DocumentResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    uploaded_at: datetime
    is_processed: bool
    metadata: Optional[dict] = None

class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int

class DocumentProcessResponse(BaseModel):
    success: bool
    message: str
    chunks_count: Optional[int] = None
    metadata: Optional[dict] = None

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a document file"""
    # Initialize document processor
    processor = DocumentProcessor()
    
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
    
    # Validate document
    validation = processor.validate_document(file_path)
    if not validation['valid']:
        # Clean up the file
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=validation['error'])
    
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
        "filename": document.filename,
        "file_size": validation['file_size'],
        "file_type": validation['file_type']
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
                is_processed=doc.is_processed,
                metadata=json.loads(doc.content) if doc.content and doc.is_processed else None
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

@router.post("/{document_id}/process", response_model=DocumentProcessResponse)
async def process_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Process a document using the document processor"""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if document.is_processed:
        raise HTTPException(status_code=400, detail="Document already processed")
    
    # Initialize document processor
    processor = DocumentProcessor()
    
    try:
        # Process the document
        result = processor.process_document(document.file_path)
        
        if not result['success']:
            raise HTTPException(status_code=500, detail=f"Processing failed: {result['error']}")
        
        # Update document with processed data
        document.is_processed = True
        document.content = json.dumps({
            'metadata': result['metadata'],
            'chunks_count': len(result['chunks']),
            'total_chars': result['metadata']['total_chars'],
            'total_words': result['metadata']['total_words']
        })
        
        db.commit()
        
        return DocumentProcessResponse(
            success=True,
            message="Document processed successfully",
            chunks_count=len(result['chunks']),
            metadata=result['metadata']
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@router.get("/{document_id}/chunks")
async def get_document_chunks(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Get processed chunks for a document"""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not document.is_processed:
        raise HTTPException(status_code=400, detail="Document not processed yet")
    
    # Initialize document processor
    processor = DocumentProcessor()
    
    try:
        # Process the document to get chunks
        result = processor.process_document(document.file_path)
        
        if not result['success']:
            raise HTTPException(status_code=500, detail=f"Failed to get chunks: {result['error']}")
        
        return {
            "document_id": document_id,
            "filename": document.filename,
            "chunks": result['chunks'],
            "metadata": result['metadata']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chunks: {str(e)}") 