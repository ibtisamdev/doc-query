from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import uuid
import json
from database import get_db, ChatMessage, ChatSession

router = APIRouter()

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class FeedbackRequest(BaseModel):
    feedback: str  # 'positive' or 'negative'

class ChatResponse(BaseModel):
    response: str
    session_id: str
    message_id: int
    citations: List[Dict] = []

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

class FeedbackStatsResponse(BaseModel):
    total_messages: int
    positive_feedback: int
    negative_feedback: int
    no_feedback: int
    positive_percentage: float
    negative_percentage: float
    average_rating: float
    feedback_rate: float


class FeedbackTrendResponse(BaseModel):
    date: str
    positive: int
    negative: int
    total: int

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
    
    # Use RAG processing for the response
    try:
        from llm_service import LLMService
        llm_service = LLMService()
        
        # Generate RAG response
        result = await llm_service.generate_rag_response(
            query=request.message,
            n_context_chunks=5
        )
        
        if result['success']:
            response_text = result['response']
            citations = result.get('citations', [])
        else:
            response_text = f"Sorry, I couldn't process your request: {result.get('error', 'Unknown error')}"
            citations = []
            
    except Exception as e:
        response_text = f"Sorry, I encountered an error: {str(e)}"
    
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
        message_id=chat_message.id,
        citations=citations
    )

@router.post("/send/stream")
async def send_message_stream(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """Send a chat message and get streaming response with persistence"""
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
    
    async def generate_stream():
        full_response = ""
        
        try:
            from llm_service import LLMService
            llm_service = LLMService()
            
            # Generate streaming RAG response
            async for chunk in llm_service.generate_streaming_rag_response(
                query=request.message,
                n_context_chunks=5
            ):
                if chunk['type'] == 'content':
                    full_response += chunk['content']
                    yield f"data: {json.dumps(chunk)}\n\n"
                elif chunk['type'] == 'complete':
                    # Save the complete message to database
                    chat_message = ChatMessage(
                        session_id=session_id,
                        message=request.message,
                        response=chunk['content']
                    )
                    db.add(chat_message)
                    db.commit()
                    
                    # Send final chunk with session info and citations
                    final_chunk = {
                        'type': 'complete',
                        'content': chunk['content'],
                        'session_id': session_id,
                        'message_id': chat_message.id,
                        'citations': chunk.get('citations', [])
                    }
                    yield f"data: {json.dumps(final_chunk)}\n\n"
                    break
                elif chunk['type'] == 'error':
                    # Save error message to database
                    chat_message = ChatMessage(
                        session_id=session_id,
                        message=request.message,
                        response=chunk['content']
                    )
                    db.add(chat_message)
                    db.commit()
                    yield f"data: {json.dumps(chunk)}\n\n"
                    break
                    
        except Exception as e:
            error_message = f"Sorry, I encountered an error: {str(e)}"
            # Save error message to database
            chat_message = ChatMessage(
                session_id=session_id,
                message=request.message,
                response=error_message
            )
            db.add(chat_message)
            db.commit()
            
            error_chunk = {
                'type': 'error',
                'content': error_message,
                'session_id': session_id,
                'message_id': chat_message.id
            }
            yield f"data: {json.dumps(error_chunk)}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
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
    request: FeedbackRequest,
    db: Session = Depends(get_db)
):
    """Submit feedback for a chat message"""
    # Convert string feedback to integer
    feedback_value = 1 if request.feedback == 'positive' else -1 if request.feedback == 'negative' else None
    
    if feedback_value is None:
        raise HTTPException(status_code=400, detail="Feedback must be 'positive' or 'negative'")
    
    message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message.feedback = feedback_value
    db.commit()
    
    return {"message": "Feedback submitted successfully"} 

@router.get("/feedback/stats", response_model=FeedbackStatsResponse)
async def get_feedback_stats(db: Session = Depends(get_db)):
    """Get aggregated feedback statistics"""
    # Get total messages
    total_messages = db.query(ChatMessage).count()
    
    # Get feedback counts
    positive_feedback = db.query(ChatMessage).filter(ChatMessage.feedback == 1).count()
    negative_feedback = db.query(ChatMessage).filter(ChatMessage.feedback == -1).count()
    no_feedback = total_messages - positive_feedback - negative_feedback
    
    # Calculate percentages
    positive_percentage = (positive_feedback / total_messages * 100) if total_messages > 0 else 0
    negative_percentage = (negative_feedback / total_messages * 100) if total_messages > 0 else 0
    
    # Calculate average rating
    total_rating = positive_feedback - negative_feedback
    average_rating = total_rating / total_messages if total_messages > 0 else 0
    
    # Calculate feedback rate
    feedback_rate = ((positive_feedback + negative_feedback) / total_messages * 100) if total_messages > 0 else 0
    
    return FeedbackStatsResponse(
        total_messages=total_messages,
        positive_feedback=positive_feedback,
        negative_feedback=negative_feedback,
        no_feedback=no_feedback,
        positive_percentage=positive_percentage,
        negative_percentage=negative_percentage,
        average_rating=average_rating,
        feedback_rate=feedback_rate
    )


@router.get("/feedback/trends", response_model=List[FeedbackTrendResponse])
async def get_feedback_trends(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get feedback trends over time"""
    trends = []
    
    for i in range(days):
        date = datetime.utcnow() - timedelta(days=i)
        start_date = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=1)
        
        # Get messages for this date
        messages = db.query(ChatMessage).filter(
            ChatMessage.created_at >= start_date,
            ChatMessage.created_at < end_date
        ).all()
        
        positive = sum(1 for msg in messages if msg.feedback == 1)
        negative = sum(1 for msg in messages if msg.feedback == -1)
        total = len(messages)
        
        trends.append(FeedbackTrendResponse(
            date=start_date.strftime('%Y-%m-%d'),
            positive=positive,
            negative=negative,
            total=total
        ))
    
    # Reverse to get chronological order
    return list(reversed(trends)) 