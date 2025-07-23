"""
Vector Database Integration for Doc Query

Handles ChromaDB setup, OpenAI embeddings, document indexing,
and vector similarity search functionality.
"""

import os
import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import chromadb
from chromadb.config import Settings
import openai
from config import settings

logger = logging.getLogger(__name__)

class VectorStore:
    """ChromaDB vector store with OpenAI embeddings"""
    
    def __init__(self, collection_name: str = "documents"):
        """
        Initialize vector store
        
        Args:
            collection_name: Name of the ChromaDB collection
        """
        self.collection_name = collection_name
        self.client = None
        self.collection = None
        
        # Initialize OpenAI client
        if settings.openai_api_key:
            openai.api_key = settings.openai_api_key
            self.openai_client = openai.OpenAI(api_key=settings.openai_api_key)
        else:
            logger.warning("OpenAI API key not configured")
            self.openai_client = None
        
        # Initialize ChromaDB
        self._initialize_chromadb()
    
    def _initialize_chromadb(self):
        """Initialize ChromaDB client and collection"""
        try:
            # Create ChromaDB client with persistent storage
            self.client = chromadb.PersistentClient(
                path=settings.chroma_db_path,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Get or create collection
            try:
                self.collection = self.client.get_collection(name=self.collection_name)
                logger.info(f"Using existing collection: {self.collection_name}")
            except Exception:
                self.collection = self.client.create_collection(
                    name=self.collection_name,
                    metadata={"description": "Document embeddings for Doc Query"}
                )
                logger.info(f"Created new collection: {self.collection_name}")
                
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {str(e)}")
            raise
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings using OpenAI API
        
        Args:
            texts: List of text chunks to embed
            
        Returns:
            List of embedding vectors
        """
        if not self.openai_client:
            raise ValueError("OpenAI client not initialized. Check API key configuration.")
        
        try:
            # Use OpenAI embeddings API
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=texts
            )
            
            # Extract embeddings
            embeddings = [embedding.embedding for embedding in response.data]
            return embeddings
            
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {str(e)}")
            raise
    
    def index_document(self, document_id: int, chunks: List[Dict], metadata: Dict) -> bool:
        """
        Index document chunks in vector database
        
        Args:
            document_id: Database document ID
            chunks: List of text chunks with content and metadata
            metadata: Document metadata
            
        Returns:
            True if indexing successful, False otherwise
        """
        try:
            if not chunks:
                logger.warning(f"No chunks to index for document {document_id}")
                return False
            
            # Extract text content from chunks
            texts = [chunk['content'] for chunk in chunks]
            
            # Generate embeddings
            embeddings = self.generate_embeddings(texts)
            
            # Prepare IDs and metadata for ChromaDB
            ids = [f"doc_{document_id}_chunk_{chunk['id']}" for chunk in chunks]
            
            # Enhanced metadata for each chunk
            chunk_metadata = []
            for chunk in chunks:
                chunk_meta = {
                    'document_id': document_id,
                    'chunk_id': chunk['id'],
                    'chunk_size': chunk['metadata']['chunk_size'],
                    'filename': metadata.get('filename', ''),
                    'file_type': metadata.get('file_type', ''),
                    'title': metadata.get('title', ''),
                    'total_chunks': len(chunks),
                    'indexed_at': datetime.utcnow().isoformat()
                }
                chunk_metadata.append(chunk_meta)
            
            # Add to ChromaDB collection
            self.collection.add(
                embeddings=embeddings,
                documents=texts,
                metadatas=chunk_metadata,
                ids=ids
            )
            
            logger.info(f"Successfully indexed {len(chunks)} chunks for document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to index document {document_id}: {str(e)}")
            return False
    
    def search_similar(self, query: str, n_results: int = 5, filter_metadata: Optional[Dict] = None) -> List[Dict]:
        """
        Search for similar documents using vector similarity
        
        Args:
            query: Search query text
            n_results: Number of results to return
            filter_metadata: Optional metadata filters
            
        Returns:
            List of similar documents with scores and metadata
        """
        try:
            # Generate embedding for query
            query_embedding = self.generate_embeddings([query])[0]
            
            # Prepare where clause for filtering
            where_clause = None
            if filter_metadata:
                where_clause = {}
                for key, value in filter_metadata.items():
                    where_clause[key] = value
            
            # Search in ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_clause,
                include=['documents', 'metadatas', 'distances']
            )
            
            # Format results
            formatted_results = []
            if results['documents'] and results['documents'][0]:
                for i, (doc, metadata, distance) in enumerate(zip(
                    results['documents'][0],
                    results['metadatas'][0],
                    results['distances'][0]
                )):
                    # Convert distance to similarity score (1 - distance)
                    similarity_score = 1 - distance
                    
                    formatted_results.append({
                        'rank': i + 1,
                        'content': doc,
                        'metadata': metadata,
                        'similarity_score': similarity_score,
                        'distance': distance
                    })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Failed to search similar documents: {str(e)}")
            return []
    
    def get_document_chunks(self, document_id: int) -> List[Dict]:
        """
        Get all chunks for a specific document
        
        Args:
            document_id: Database document ID
            
        Returns:
            List of document chunks with metadata
        """
        try:
            results = self.collection.get(
                where={'document_id': document_id},
                include=['documents', 'metadatas']
            )
            
            chunks = []
            for i, (doc, metadata) in enumerate(zip(results['documents'], results['metadatas'])):
                chunks.append({
                    'chunk_id': metadata['chunk_id'],
                    'content': doc,
                    'metadata': metadata
                })
            
            # Sort by chunk_id
            chunks.sort(key=lambda x: x['chunk_id'])
            return chunks
            
        except Exception as e:
            logger.error(f"Failed to get chunks for document {document_id}: {str(e)}")
            return []
    
    def delete_document(self, document_id: int) -> bool:
        """
        Delete all chunks for a specific document
        
        Args:
            document_id: Database document ID
            
        Returns:
            True if deletion successful, False otherwise
        """
        try:
            # Get all IDs for the document
            results = self.collection.get(
                where={'document_id': document_id},
                include=['ids']
            )
            
            if results['ids']:
                # Delete all chunks for the document
                self.collection.delete(ids=results['ids'])
                logger.info(f"Deleted {len(results['ids'])} chunks for document {document_id}")
                return True
            else:
                logger.warning(f"No chunks found for document {document_id}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to delete document {document_id}: {str(e)}")
            return False
    
    def get_collection_stats(self) -> Dict:
        """
        Get statistics about the vector collection
        
        Returns:
            Dictionary with collection statistics
        """
        try:
            count = self.collection.count()
            
            # Get unique document IDs
            results = self.collection.get(include=['metadatas'])
            unique_docs = set()
            for metadata in results['metadatas']:
                unique_docs.add(metadata['document_id'])
            
            return {
                'total_chunks': count,
                'unique_documents': len(unique_docs),
                'collection_name': self.collection_name,
                'last_updated': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get collection stats: {str(e)}")
            return {}
    
    def reset_collection(self) -> bool:
        """
        Reset the entire collection (delete all data)
        
        Returns:
            True if reset successful, False otherwise
        """
        try:
            self.client.delete_collection(name=self.collection_name)
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"description": "Document embeddings for Doc Query"}
            )
            logger.info(f"Reset collection: {self.collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to reset collection: {str(e)}")
            return False 