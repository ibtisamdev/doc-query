#!/usr/bin/env python3
"""
Test script for LLM Integration functionality
"""

import asyncio
import json
import tempfile
import os
from document_processor import DocumentProcessor
from vector_store import VectorStore
from llm_service import LLMService

def create_sample_documents():
    """Create sample documents for testing"""
    documents = {
        "machine_learning.md": """# Machine Learning Fundamentals

Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions without being explicitly programmed.

## Types of Machine Learning

### Supervised Learning
Supervised learning uses labeled training data to learn patterns and make predictions on new, unseen data.

### Unsupervised Learning
Unsupervised learning finds hidden patterns in data without predefined labels.

### Reinforcement Learning
Reinforcement learning learns through interaction with an environment, receiving rewards for good actions.

## Key Concepts

- **Training Data**: The dataset used to train the model
- **Features**: Input variables used for prediction
- **Labels**: Output variables we want to predict
- **Model**: The algorithm that learns from data
- **Overfitting**: When model performs well on training data but poorly on new data

## Popular Algorithms

1. **Linear Regression**: For predicting continuous values
2. **Logistic Regression**: For binary classification
3. **Decision Trees**: For both classification and regression
4. **Random Forest**: Ensemble method using multiple decision trees
5. **Neural Networks**: Deep learning models for complex patterns

Machine learning is transforming industries from healthcare to finance.""",

        "python_advanced.md": """# Advanced Python Programming

Python is a versatile programming language with powerful features for advanced development.

## Advanced Features

### Decorators
Decorators are functions that modify other functions, providing a clean way to add functionality.

### Generators
Generators create iterators using yield statements, enabling memory-efficient iteration.

### Context Managers
Context managers handle resource management with the 'with' statement.

### Metaclasses
Metaclasses allow you to customize class creation and behavior.

## Data Structures

### Collections Module
- **defaultdict**: Dictionary with default values
- **Counter**: Count occurrences of elements
- **OrderedDict**: Dictionary that remembers insertion order
- **deque**: Double-ended queue for efficient operations

### Advanced Data Types
- **dataclasses**: Automatic generation of special methods
- **typing**: Type hints for better code documentation
- **enums**: Enumerated types for constants

## Performance Optimization

### Profiling
Use cProfile and line_profiler to identify bottlenecks.

### Caching
Implement caching with functools.lru_cache or custom solutions.

### Memory Management
Understand Python's garbage collection and memory usage.

Advanced Python techniques enable building robust, efficient applications.""",

        "web_development.md": """# Modern Web Development

Modern web development encompasses frontend, backend, and full-stack technologies.

## Frontend Technologies

### React
React is a JavaScript library for building user interfaces with component-based architecture.

### Next.js
Next.js is a React framework that provides server-side rendering and static site generation.

### TypeScript
TypeScript adds static typing to JavaScript, improving code quality and developer experience.

## Backend Technologies

### Node.js
Node.js enables server-side JavaScript development with event-driven architecture.

### FastAPI
FastAPI is a modern Python web framework for building APIs with automatic documentation.

### Django
Django is a high-level Python web framework with built-in admin interface.

## Database Technologies

### SQL Databases
- **PostgreSQL**: Advanced open-source relational database
- **MySQL**: Popular relational database management system
- **SQLite**: Lightweight, serverless database

### NoSQL Databases
- **MongoDB**: Document-oriented database
- **Redis**: In-memory data structure store
- **Cassandra**: Distributed database for large-scale applications

## DevOps and Deployment

### Containerization
Docker enables consistent deployment across different environments.

### Cloud Platforms
- **AWS**: Comprehensive cloud services
- **Google Cloud**: Advanced AI and ML capabilities
- **Azure**: Microsoft's cloud platform

Modern web development requires understanding both frontend and backend technologies."""

    }
    return documents

async def test_llm_service():
    """Test LLM service functionality"""
    print("Testing LLM Integration...")
    print("=" * 60)
    
    # Initialize components
    processor = DocumentProcessor(chunk_size=300, chunk_overlap=50)
    vector_store = VectorStore()
    
    try:
        llm_service = LLMService()
        print("✅ LLM Service initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize LLM Service: {str(e)}")
        return
    
    # Test connection
    print("\n🔗 Testing OpenAI Connection...")
    try:
        status = await llm_service.test_connection()
        if status['success']:
            print(f"✅ Connected to OpenAI API")
            print(f"   Model: {status['model']}")
        else:
            print(f"❌ Connection failed: {status.get('error', 'Unknown error')}")
            return
    except Exception as e:
        print(f"❌ Connection test failed: {str(e)}")
        return
    
    # Create and index sample documents
    print("\n📚 Setting up test documents...")
    documents = create_sample_documents()
    indexed_docs = []
    
    for filename, content in documents.items():
        print(f"Processing {filename}...")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
            f.write(content)
            temp_path = f.name
        
        try:
            # Process document
            result = processor.process_document(temp_path)
            
            if result['success']:
                # Index in vector database
                doc_id = len(indexed_docs) + 1
                indexed = vector_store.index_document(
                    document_id=doc_id,
                    chunks=result['chunks'],
                    metadata=result['metadata']
                )
                
                if indexed:
                    indexed_docs.append({
                        'id': doc_id,
                        'filename': filename,
                        'chunks': len(result['chunks'])
                    })
                    print(f"  ✅ Indexed {len(result['chunks'])} chunks")
                else:
                    print(f"  ❌ Failed to index")
            
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
        
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    if not indexed_docs:
        print("❌ No documents indexed. Cannot proceed with LLM tests.")
        return
    
    print(f"✅ Successfully indexed {len(indexed_docs)} documents")
    
    # Test RAG queries
    print("\n" + "=" * 60)
    print("Testing RAG Queries...")
    
    test_queries = [
        "What is machine learning?",
        "Explain Python decorators",
        "What are the benefits of React?",
        "How does supervised learning work?",
        "What is TypeScript used for?"
    ]
    
    for query in test_queries:
        print(f"\n🔍 Query: '{query}'")
        
        try:
            result = await llm_service.generate_rag_response(
                query=query,
                n_context_chunks=3,
                temperature=0.7
            )
            
            if result['success']:
                print(f"✅ Response generated")
                print(f"   Chunks used: {result['metadata']['chunks_retrieved']}")
                print(f"   Total tokens: {result['metadata']['total_tokens']}")
                print(f"   Response preview: {result['response'][:150]}...")
            else:
                print(f"❌ Failed to generate response")
                
        except Exception as e:
            print(f"❌ Query failed: {str(e)}")
    
    # Test document analysis
    print("\n" + "=" * 60)
    print("Testing Document Analysis...")
    
    if indexed_docs:
        test_doc_id = indexed_docs[0]['id']
        
        # Test summary generation
        print(f"\n📄 Generating summary for document {test_doc_id}...")
        try:
            summary_result = await llm_service.generate_summary(
                document_id=test_doc_id,
                max_length=300
            )
            
            if summary_result['success']:
                print(f"✅ Summary generated")
                print(f"   Length: {summary_result['metadata']['summary_length']} chars")
                print(f"   Preview: {summary_result['summary'][:150]}...")
            else:
                print(f"❌ Summary generation failed")
                
        except Exception as e:
            print(f"❌ Summary failed: {str(e)}")
        
        # Test keyword extraction
        print(f"\n🔑 Extracting keywords for document {test_doc_id}...")
        try:
            keyword_result = await llm_service.generate_keywords(
                document_id=test_doc_id,
                max_keywords=8
            )
            
            if keyword_result['success']:
                print(f"✅ Keywords extracted")
                print(f"   Count: {keyword_result['metadata']['keywords_count']}")
                print(f"   Keywords: {', '.join(keyword_result['keywords'])}")
            else:
                print(f"❌ Keyword extraction failed")
                
        except Exception as e:
            print(f"❌ Keywords failed: {str(e)}")
    
    # Test streaming (simulated)
    print("\n" + "=" * 60)
    print("Testing Streaming Response...")
    
    test_stream_query = "Explain the difference between supervised and unsupervised learning"
    print(f"🔍 Streaming query: '{test_stream_query}'")
    
    try:
        stream_count = 0
        full_response = ""
        
        async for chunk in llm_service.generate_streaming_rag_response(
            query=test_stream_query,
            n_context_chunks=3
        ):
            if chunk['type'] == 'content':
                stream_count += 1
                full_response += chunk['content']
                print(f"   Chunk {stream_count}: {len(chunk['content'])} chars")
            elif chunk['type'] == 'complete':
                print(f"✅ Streaming completed")
                print(f"   Total chunks: {stream_count}")
                print(f"   Total length: {len(full_response)} chars")
                print(f"   Preview: {full_response[:150]}...")
                break
            elif chunk['type'] == 'error':
                print(f"❌ Streaming error: {chunk['content']}")
                break
                
    except Exception as e:
        print(f"❌ Streaming failed: {str(e)}")
    
    print("\n" + "=" * 60)
    print("LLM Integration Test Complete!")

async def test_error_handling():
    """Test error handling scenarios"""
    print("\nTesting Error Handling...")
    print("=" * 30)
    
    try:
        llm_service = LLMService()
        
        # Test with empty query
        result = await llm_service.generate_rag_response("")
        print("✅ Empty query handled gracefully")
        
        # Test with very long query
        long_query = "What is " + "very " * 1000 + "long query?"
        result = await llm_service.generate_rag_response(long_query)
        print("✅ Long query handled gracefully")
        
    except Exception as e:
        print(f"❌ Error handling test failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_llm_service())
    asyncio.run(test_error_handling()) 