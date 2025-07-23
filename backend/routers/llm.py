"""
LLM Router for Doc Query

Handles RAG queries, streaming responses, document analysis,
and LLM service management.
"""

import json
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from database import get_db
from llm_service import LLMService

logger = logging.getLogger(__name__)
router = APIRouter()

# Request/Response models
class RAGQueryRequest(BaseModel):
    query: str = Field(..., description="User's question or query")
    n_context_chunks: int = Field(5, ge=1, le=20, description="Number of context chunks to retrieve")
    system_prompt: Optional[str] = Field(None, description="Custom system prompt (optional)")
    temperature: float = Field(0.7, ge=0.0, le=1.0, description="Response creativity")
    max_tokens: int = Field(1000, ge=100, le=4000, description="Maximum response length")

class RAGQueryResponse(BaseModel):
    success: bool
    response: str
    context_used: list
    metadata: dict

class DocumentAnalysisRequest(BaseModel):
    document_id: int = Field(..., description="Database document ID")
    analysis_type: str = Field(..., description="Type of analysis: 'summary' or 'keywords'")
    max_length: Optional[int] = Field(500, description="Maximum length for summary")
    max_keywords: Optional[int] = Field(10, description="Maximum number of keywords")

class DocumentAnalysisResponse(BaseModel):
    success: bool
    result: str
    metadata: dict

class LLMStatusResponse(BaseModel):
    success: bool
    status: str
    model: Optional[str] = None
    error: Optional[str] = None

@router.post("/query", response_model=RAGQueryResponse)
async def rag_query(
    request: RAGQueryRequest,
    db: Session = Depends(get_db)
):
    """Generate RAG response using document context"""
    try:
        llm_service = LLMService()
        
        result = await llm_service.generate_rag_response(
            query=request.query,
            n_context_chunks=request.n_context_chunks,
            system_prompt=request.system_prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        return RAGQueryResponse(
            success=result['success'],
            response=result['response'],
            context_used=result['context_used'],
            metadata=result['metadata']
        )
        
    except Exception as e:
        logger.error(f"RAG query failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

@router.post("/query/stream")
async def rag_query_stream(
    request: RAGQueryRequest,
    db: Session = Depends(get_db)
):
    """Generate streaming RAG response"""
    try:
        llm_service = LLMService()
        
        async def generate_stream():
            async for chunk in llm_service.generate_streaming_rag_response(
                query=request.query,
                n_context_chunks=request.n_context_chunks,
                system_prompt=request.system_prompt,
                temperature=request.temperature,
                max_tokens=request.max_tokens
            ):
                yield f"data: {json.dumps(chunk)}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )
        
    except Exception as e:
        logger.error(f"Streaming RAG query failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Streaming query failed: {str(e)}")

@router.post("/analyze", response_model=DocumentAnalysisResponse)
async def analyze_document(
    request: DocumentAnalysisRequest,
    db: Session = Depends(get_db)
):
    """Analyze document (summary or keywords)"""
    try:
        llm_service = LLMService()
        
        if request.analysis_type == "summary":
            result = await llm_service.generate_summary(
                document_id=request.document_id,
                max_length=request.max_length or 500
            )
            
            return DocumentAnalysisResponse(
                success=result['success'],
                result=result['summary'],
                metadata=result['metadata']
            )
            
        elif request.analysis_type == "keywords":
            result = await llm_service.generate_keywords(
                document_id=request.document_id,
                max_keywords=request.max_keywords or 10
            )
            
            return DocumentAnalysisResponse(
                success=result['success'],
                result=", ".join(result['keywords']),
                metadata=result['metadata']
            )
            
        else:
            raise HTTPException(
                status_code=400, 
                detail="Invalid analysis type. Use 'summary' or 'keywords'"
            )
        
    except Exception as e:
        logger.error(f"Document analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/status", response_model=LLMStatusResponse)
async def get_llm_status():
    """Test LLM service connection and status"""
    try:
        llm_service = LLMService()
        result = await llm_service.test_connection()
        
        return LLMStatusResponse(
            success=result['success'],
            status=result['status'],
            model=result.get('model'),
            error=result.get('error')
        )
        
    except Exception as e:
        logger.error(f"LLM status check failed: {str(e)}")
        return LLMStatusResponse(
            success=False,
            status="Failed",
            error=str(e)
        )

@router.post("/chat/simple")
async def simple_chat(
    request: RAGQueryRequest,
    db: Session = Depends(get_db)
):
    """Simple chat without RAG (for testing)"""
    try:
        llm_service = LLMService()
        
        # Simple chat without document context
        response = await llm_service.client.chat.completions.create(
            model=llm_service.model,
            messages=[
                {"role": "system", "content": "You are Doc Query, a helpful document assistant."},
                {"role": "user", "content": request.query}
            ],
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        response_content = response.choices[0].message.content
        
        return {
            'success': True,
            'response': response_content,
            'metadata': {
                'model_used': llm_service.model,
                'total_tokens': response.usage.total_tokens,
                'temperature': request.temperature
            }
        }
        
    except Exception as e:
        logger.error(f"Simple chat failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@router.get("/models")
async def get_available_models():
    """Get available OpenAI models"""
    try:
        llm_service = LLMService()
        
        # List available models
        models = await llm_service.client.models.list()
        
        # Filter for chat models
        chat_models = [
            {
                'id': model.id,
                'name': model.id,
                'type': 'chat'
            }
            for model in models.data
            if 'gpt' in model.id.lower()
        ]
        
        return {
            'models': chat_models,
            'current_model': llm_service.model
        }
        
    except Exception as e:
        logger.error(f"Failed to get models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get models: {str(e)}") 