from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
from database import get_db, ChatMessage, ChatSession

router = APIRouter()

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    message_id: int

class ChatMessageResponse(BaseModel):
    id: int
    message: str
    response: str
    created_at: datetime
    feedback: Optional[int] = None

class ChatSessionResponse(BaseModel):
    session_id: str
    created_at: datetime
    updated_at: datetime
    message_count: int

@router.post("/send", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """Send a chat message and get response"""
    # Generate session ID if not provided
    if not request.session_id:
        session_id = str(uuid.uuid4())
        # Create new session
        new_session = ChatSession(session_id=session_id)
        db.add(new_session)
        db.commit()
    else:
        session_id = request.session_id
        # Update session timestamp
        session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
        if session:
            session.updated_at = datetime.utcnow()
            db.commit()
    
    # TODO: Implement RAG processing here
    # For now, return a placeholder response
    response_text = f"Received your message: {request.message}. RAG processing will be implemented in the next phase."
    
    # Save message to database
    chat_message = ChatMessage(
        session_id=session_id,
        message=request.message,
        response=response_text
    )
    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)
    
    return ChatResponse(
        response=response_text,
        session_id=session_id,
        message_id=chat_message.id
    )

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(db: Session = Depends(get_db)):
    """Get all chat sessions"""
    sessions = db.query(ChatSession).all()
    result = []
    
    for session in sessions:
        message_count = db.query(ChatMessage).filter(
            ChatMessage.session_id == session.session_id
        ).count()
        
        result.append(ChatSessionResponse(
            session_id=session.session_id,
            created_at=session.created_at,
            updated_at=session.updated_at,
            message_count=message_count
        ))
    
    return result

@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
async def get_session_messages(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Get all messages for a specific session"""
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).all()
    
    return [
        ChatMessageResponse(
            id=msg.id,
            message=msg.message,
            response=msg.response,
            created_at=msg.created_at,
            feedback=msg.feedback
        )
        for msg in messages
    ]

@router.post("/messages/{message_id}/feedback")
async def submit_feedback(
    message_id: int,
    feedback: int,  # 1 for thumbs up, -1 for thumbs down
    db: Session = Depends(get_db)
):
    """Submit feedback for a chat message"""
    if feedback not in [1, -1]:
        raise HTTPException(status_code=400, detail="Feedback must be 1 or -1")
    
    message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message.feedback = feedback
    db.commit()
    
    return {"message": "Feedback submitted successfully"} 