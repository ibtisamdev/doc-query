#!/usr/bin/env python3
"""
Test script for Vector Database functionality
"""

import os
import tempfile
import json
from document_processor import DocumentProcessor
from vector_store import VectorStore

def create_sample_documents():
    """Create sample documents for testing"""
    documents = {
        "ai_guide.md": """# Artificial Intelligence Guide

This is a comprehensive guide to artificial intelligence and machine learning.

## What is AI?

Artificial Intelligence (AI) is the simulation of human intelligence in machines. It includes machine learning, deep learning, and neural networks.

## Machine Learning

Machine learning is a subset of AI that enables computers to learn without being explicitly programmed.

## Deep Learning

Deep learning uses neural networks with multiple layers to process complex patterns in data.

## Applications

- Natural Language Processing
- Computer Vision
- Robotics
- Healthcare
- Finance

This guide covers the fundamentals of AI and its practical applications.""",

        "python_tutorial.md": """# Python Programming Tutorial

Learn Python programming from basics to advanced concepts.

## Getting Started

Python is a high-level, interpreted programming language known for its simplicity and readability.

## Basic Syntax

Python uses indentation to define code blocks and has a clean, readable syntax.

## Data Structures

- Lists: Ordered, mutable sequences
- Tuples: Ordered, immutable sequences
- Dictionaries: Key-value pairs
- Sets: Unordered collections of unique elements

## Functions and Classes

Python supports both functional and object-oriented programming paradigms.

## Libraries and Frameworks

- NumPy for numerical computing
- Pandas for data manipulation
- Matplotlib for plotting
- Django for web development

This tutorial will help you master Python programming.""",

        "web_development.md": """# Web Development Fundamentals

Complete guide to modern web development technologies and practices.

## Frontend Technologies

HTML, CSS, and JavaScript form the foundation of web development.

## Backend Development

Server-side programming with languages like Python, Node.js, and PHP.

## Databases

Understanding SQL and NoSQL databases for data storage and retrieval.

## APIs and REST

Building and consuming RESTful APIs for web applications.

## Modern Frameworks

- React for frontend development
- Next.js for full-stack applications
- FastAPI for Python backends
- Express.js for Node.js backends

## Deployment and DevOps

Deploying web applications using cloud platforms and CI/CD pipelines.

This guide covers the complete web development stack."""
    }
    return documents

def test_vector_store():
    """Test vector store functionality"""
    print("Testing Vector Database Integration...")
    print("=" * 60)
    
    # Initialize components
    processor = DocumentProcessor(chunk_size=300, chunk_overlap=50)
    vector_store = VectorStore()
    
    # Create sample documents
    documents = create_sample_documents()
    
    print(f"Created {len(documents)} sample documents")
    
    # Process and index documents
    indexed_docs = []
    for filename, content in documents.items():
        print(f"\nProcessing {filename}...")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
            f.write(content)
            temp_path = f.name
        
        try:
            # Process document
            result = processor.process_document(temp_path)
            
            if result['success']:
                print(f"  ✅ Processing successful")
                print(f"  📄 Chunks: {len(result['chunks'])}")
                print(f"  📊 Words: {result['metadata']['total_words']}")
                
                # Index in vector database
                doc_id = len(indexed_docs) + 1
                indexed = vector_store.index_document(
                    document_id=doc_id,
                    chunks=result['chunks'],
                    metadata=result['metadata']
                )
                
                if indexed:
                    print(f"  🔍 Indexed in vector database")
                    indexed_docs.append({
                        'id': doc_id,
                        'filename': filename,
                        'chunks': len(result['chunks'])
                    })
                else:
                    print(f"  ❌ Failed to index")
                
            else:
                print(f"  ❌ Processing failed: {result['error']}")
        
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
        
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    print(f"\n📚 Successfully indexed {len(indexed_docs)} documents")
    
    # Test vector search
    print("\n" + "=" * 60)
    print("Testing Vector Search...")
    
    test_queries = [
        "What is machine learning?",
        "How to write Python functions?",
        "Explain web development frameworks",
        "What are neural networks?",
        "Database management systems"
    ]
    
    for query in test_queries:
        print(f"\n🔍 Searching for: '{query}'")
        
        try:
            results = vector_store.search_similar(query=query, n_results=3)
            
            if results:
                print(f"  📊 Found {len(results)} results:")
                for i, result in enumerate(results[:2]):  # Show top 2
                    print(f"    {i+1}. Score: {result['similarity_score']:.3f}")
                    print(f"       File: {result['metadata']['filename']}")
                    print(f"       Content: {result['content'][:100]}...")
            else:
                print("  ❌ No results found")
                
        except Exception as e:
            print(f"  ❌ Search failed: {str(e)}")
    
    # Test collection statistics
    print("\n" + "=" * 60)
    print("Testing Collection Statistics...")
    
    try:
        stats = vector_store.get_collection_stats()
        print(f"📊 Collection Statistics:")
        print(f"  Total chunks: {stats.get('total_chunks', 0)}")
        print(f"  Unique documents: {stats.get('unique_documents', 0)}")
        print(f"  Collection name: {stats.get('collection_name', 'N/A')}")
        
    except Exception as e:
        print(f"❌ Failed to get stats: {str(e)}")
    
    # Test document retrieval
    print("\n" + "=" * 60)
    print("Testing Document Retrieval...")
    
    if indexed_docs:
        test_doc_id = indexed_docs[0]['id']
        print(f"📄 Retrieving chunks for document {test_doc_id}...")
        
        try:
            chunks = vector_store.get_document_chunks(test_doc_id)
            print(f"  ✅ Retrieved {len(chunks)} chunks")
            
            if chunks:
                print(f"  📝 First chunk preview:")
                print(f"    {chunks[0]['content'][:150]}...")
                
        except Exception as e:
            print(f"  ❌ Failed to retrieve chunks: {str(e)}")
    
    print("\n" + "=" * 60)
    print("Vector Database Test Complete!")

def test_error_handling():
    """Test error handling scenarios"""
    print("\nTesting Error Handling...")
    print("=" * 30)
    
    vector_store = VectorStore()
    
    # Test search with empty query
    try:
        results = vector_store.search_similar("", n_results=5)
        print("✅ Empty query handled gracefully")
    except Exception as e:
        print(f"❌ Empty query failed: {str(e)}")
    
    # Test invalid document ID
    try:
        chunks = vector_store.get_document_chunks(99999)
        print("✅ Invalid document ID handled gracefully")
    except Exception as e:
        print(f"❌ Invalid document ID failed: {str(e)}")

if __name__ == "__main__":
    test_vector_store()
    test_error_handling() 