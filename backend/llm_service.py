"""
LLM Integration Service for Doc Query

Handles OpenAI GPT-4 API integration, RAG query processing,
prompt engineering, and streaming response support.
"""

import os
import json
import logging
from typing import List, Dict, Optional, AsyncGenerator, Tuple
from datetime import datetime
import openai
from openai import AsyncOpenAI
from config import settings
from vector_store import VectorStore

logger = logging.getLogger(__name__)

class LLMService:
    """OpenAI GPT-4 LLM service with RAG capabilities"""
    
    def __init__(self):
        """Initialize LLM service with OpenAI client"""
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.vector_store = VectorStore()
        self.model = "gpt-4-turbo-preview"  # Latest GPT-4 model
        
        # Default system prompt for RAG
        self.default_system_prompt = """You are Doc Query, an intelligent document assistant. Your role is to help users find and understand information from their uploaded documents.

Key Guidelines:
1. Always base your responses on the provided document context
2. If the context doesn't contain relevant information, say so clearly
3. Provide accurate, helpful, and concise answers
4. Cite specific parts of documents when possible
5. If asked about something not in the documents, politely redirect to the document content
6. Use a friendly, professional tone
7. Structure responses clearly with proper formatting

Document Context: {context}

User Question: {question}"""
    
    async def generate_rag_response(
        self,
        query: str,
        n_context_chunks: int = 5,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Dict:
        """
        Generate RAG response using document context
        
        Args:
            query: User's question
            n_context_chunks: Number of context chunks to retrieve
            system_prompt: Custom system prompt (optional)
            temperature: Response creativity (0.0-1.0)
            max_tokens: Maximum response length
            
        Returns:
            Dictionary with response and metadata
        """
        try:
            # Retrieve relevant document chunks
            context_chunks = self.vector_store.search_similar(
                query=query,
                n_results=n_context_chunks
            )
            
            if not context_chunks:
                return {
                    'success': False,
                    'response': "I couldn't find any relevant information in your documents to answer this question. Please try rephrasing your query or upload relevant documents.",
                    'context_used': [],
                    'citations': [],
                    'metadata': {
                        'chunks_retrieved': 0,
                        'total_tokens': 0,
                        'model_used': self.model
                    }
                }
            
            # Prepare context from chunks
            context_text = self._prepare_context(context_chunks)
            
            # Use custom or default system prompt
            final_system_prompt = system_prompt or self.default_system_prompt.format(
                context=context_text,
                question=query
            )
            
            # Generate response
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": final_system_prompt},
                    {"role": "user", "content": query}
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            # Extract response content
            response_content = response.choices[0].message.content
            
            # Prepare citations from context chunks
            citations = self._prepare_citations(context_chunks)
            
            return {
                'success': True,
                'response': response_content,
                'context_used': context_chunks,
                'citations': citations,
                'metadata': {
                    'chunks_retrieved': len(context_chunks),
                    'total_tokens': response.usage.total_tokens,
                    'prompt_tokens': response.usage.prompt_tokens,
                    'completion_tokens': response.usage.completion_tokens,
                    'model_used': self.model,
                    'temperature': temperature
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to generate RAG response: {str(e)}")
            return {
                'success': False,
                'response': f"Sorry, I encountered an error while processing your request: {str(e)}",
                'context_used': [],
                'metadata': {'error': str(e)}
            }
    
    async def generate_streaming_rag_response(
        self,
        query: str,
        n_context_chunks: int = 5,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> AsyncGenerator[Dict, None]:
        """
        Generate streaming RAG response
        
        Args:
            query: User's question
            n_context_chunks: Number of context chunks to retrieve
            system_prompt: Custom system prompt (optional)
            temperature: Response creativity (0.0-1.0)
            max_tokens: Maximum response length
            
        Yields:
            Streaming response chunks
        """
        try:
            # Retrieve relevant document chunks
            context_chunks = self.vector_store.search_similar(
                query=query,
                n_results=n_context_chunks
            )
            
            if not context_chunks:
                yield {
                    'type': 'error',
                    'content': "I couldn't find any relevant information in your documents to answer this question.",
                    'metadata': {'chunks_retrieved': 0},
                    'citations': []
                }
                return
            
            # Prepare context from chunks
            context_text = self._prepare_context(context_chunks)
            
            # Use custom or default system prompt
            final_system_prompt = system_prompt or self.default_system_prompt.format(
                context=context_text,
                question=query
            )
            
            # Generate streaming response
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": final_system_prompt},
                    {"role": "user", "content": query}
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )
            
            # Stream response chunks
            full_response = ""
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    
                    yield {
                        'type': 'content',
                        'content': content,
                        'metadata': {
                            'chunks_retrieved': len(context_chunks),
                            'model_used': self.model
                        }
                    }
            
            # Prepare citations from context chunks
            citations = self._prepare_citations(context_chunks)
            
            # Send final metadata with citations
            yield {
                'type': 'complete',
                'content': full_response,
                'context_used': context_chunks,
                'citations': citations,
                'metadata': {
                    'chunks_retrieved': len(context_chunks),
                    'model_used': self.model,
                    'temperature': temperature,
                    'total_length': len(full_response)
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to generate streaming RAG response: {str(e)}")
            yield {
                'type': 'error',
                'content': f"Sorry, I encountered an error: {str(e)}",
                'metadata': {'error': str(e)}
            }
    
    def _prepare_context(self, context_chunks: List[Dict]) -> str:
        """
        Prepare context text from retrieved chunks
        
        Args:
            context_chunks: List of context chunks with metadata
            
        Returns:
            Formatted context string
        """
        if not context_chunks:
            return ""
        
        context_parts = []
        for i, chunk in enumerate(context_chunks, 1):
            metadata = chunk['metadata']
            content = chunk['content']
            similarity = chunk['similarity_score']
            
            # Format each chunk with metadata
            chunk_text = f"""Document {i}: {metadata.get('filename', 'Unknown')}
Relevance Score: {similarity:.3f}
Content: {content}

---"""
            context_parts.append(chunk_text)
        
        return "\n".join(context_parts)
    
    def _prepare_citations(self, context_chunks: List[Dict]) -> List[Dict]:
        """
        Prepare citations from context chunks for frontend display
        
        Args:
            context_chunks: List of context chunks with metadata
            
        Returns:
            List of citation objects
        """
        citations = []
        for i, chunk in enumerate(context_chunks):
            metadata = chunk['metadata']
            citation = {
                'id': f"citation_{i}_{chunk.get('id', 'unknown')}",
                'document_id': metadata.get('document_id'),
                'filename': metadata.get('filename', 'Unknown'),
                'content': chunk['content'],
                'page_number': metadata.get('page_number'),
                'chunk_index': metadata.get('chunk_index', i),
                'similarity_score': chunk['similarity_score'],
                'start_position': metadata.get('start_position'),
                'end_position': metadata.get('end_position')
            }
            citations.append(citation)
        
        return citations
    
    async def generate_summary(
        self,
        document_id: int,
        max_length: int = 500
    ) -> Dict:
        """
        Generate document summary using LLM
        
        Args:
            document_id: Database document ID
            max_length: Maximum summary length
            
        Returns:
            Dictionary with summary and metadata
        """
        try:
            # Get document chunks
            chunks = self.vector_store.get_document_chunks(document_id)
            
            if not chunks:
                return {
                    'success': False,
                    'summary': "No content available for summarization.",
                    'metadata': {'chunks_used': 0}
                }
            
            # Prepare content for summarization
            content = "\n\n".join([chunk['content'] for chunk in chunks])
            
            # Create summarization prompt
            summary_prompt = f"""Please provide a concise summary of the following document content. Focus on the main points and key information.

Document Content:
{content}

Summary (max {max_length} characters):"""
            
            # Generate summary
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that creates concise, accurate summaries of documents."},
                    {"role": "user", "content": summary_prompt}
                ],
                temperature=0.3,  # Lower temperature for more focused summaries
                max_tokens=max_length // 4  # Approximate token count
            )
            
            summary = response.choices[0].message.content
            
            return {
                'success': True,
                'summary': summary,
                'metadata': {
                    'chunks_used': len(chunks),
                    'total_tokens': response.usage.total_tokens,
                    'model_used': self.model,
                    'summary_length': len(summary)
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to generate summary: {str(e)}")
            return {
                'success': False,
                'summary': f"Failed to generate summary: {str(e)}",
                'metadata': {'error': str(e)}
            }
    
    async def generate_keywords(
        self,
        document_id: int,
        max_keywords: int = 10
    ) -> Dict:
        """
        Extract keywords from document using LLM
        
        Args:
            document_id: Database document ID
            max_keywords: Maximum number of keywords
            
        Returns:
            Dictionary with keywords and metadata
        """
        try:
            # Get document chunks
            chunks = self.vector_store.get_document_chunks(document_id)
            
            if not chunks:
                return {
                    'success': False,
                    'keywords': [],
                    'metadata': {'chunks_used': 0}
                }
            
            # Prepare content for keyword extraction
            content = "\n\n".join([chunk['content'] for chunk in chunks])
            
            # Create keyword extraction prompt
            keyword_prompt = f"""Extract the {max_keywords} most important keywords or key phrases from the following document content. Focus on terms that best represent the main topics and concepts.

Document Content:
{content}

Keywords (comma-separated):"""
            
            # Generate keywords
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that extracts relevant keywords from documents."},
                    {"role": "user", "content": keyword_prompt}
                ],
                temperature=0.2,  # Low temperature for consistent keyword extraction
                max_tokens=200
            )
            
            keywords_text = response.choices[0].message.content
            keywords = [kw.strip() for kw in keywords_text.split(',') if kw.strip()]
            
            return {
                'success': True,
                'keywords': keywords,
                'metadata': {
                    'chunks_used': len(chunks),
                    'total_tokens': response.usage.total_tokens,
                    'model_used': self.model,
                    'keywords_count': len(keywords)
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to generate keywords: {str(e)}")
            return {
                'success': False,
                'keywords': [],
                'metadata': {'error': str(e)}
            }
    
    async def test_connection(self) -> Dict:
        """
        Test OpenAI API connection
        
        Returns:
            Dictionary with connection status
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10
            )
            
            return {
                'success': True,
                'status': 'Connected',
                'model': self.model,
                'response_time': 'OK'
            }
            
        except Exception as e:
            return {
                'success': False,
                'status': 'Failed',
                'error': str(e)
            } 