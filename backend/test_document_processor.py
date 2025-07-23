#!/usr/bin/env python3
"""
Test script for Document Processing functionality
"""

import os
import tempfile
from document_processor import DocumentProcessor

def create_sample_markdown():
    """Create a sample markdown file for testing"""
    content = """# Sample Document

This is a sample markdown document for testing the document processor.

## Features

- **PDF Parsing**: Extract text from PDF files
- **Markdown Processing**: Handle markdown files with proper formatting
- **HTML Parsing**: Convert HTML to readable text
- **Text Chunking**: Split documents into manageable chunks

## Code Example

```python
processor = DocumentProcessor()
result = processor.process_document("sample.pdf")
```

## Conclusion

This document demonstrates the capabilities of the document processor.
"""
    return content

def create_sample_html():
    """Create a sample HTML file for testing"""
    content = """<!DOCTYPE html>
<html>
<head>
    <title>Sample HTML Document</title>
</head>
<body>
    <h1>Sample HTML Document</h1>
    <p>This is a sample HTML document for testing the document processor.</p>
    
    <h2>Features</h2>
    <ul>
        <li><strong>PDF Parsing</strong>: Extract text from PDF files</li>
        <li><strong>Markdown Processing</strong>: Handle markdown files</li>
        <li><strong>HTML Parsing</strong>: Convert HTML to readable text</li>
    </ul>
    
    <blockquote>
        This is a blockquote demonstrating HTML parsing capabilities.
    </blockquote>
    
    <p>For more information, visit <a href="https://example.com">our website</a>.</p>
</body>
</html>"""
    return content

def create_sample_text():
    """Create a sample text file for testing"""
    content = """Sample Text Document

This is a sample plain text document for testing the document processor.

Features:
- PDF Parsing: Extract text from PDF files
- Markdown Processing: Handle markdown files with proper formatting
- HTML Parsing: Convert HTML to readable text
- Text Chunking: Split documents into manageable chunks

The document processor supports multiple file formats and provides comprehensive text processing capabilities.

This concludes our sample text document."""
    return content

def test_document_processor():
    """Test the document processor with different file types"""
    print("Testing Document Processor...")
    print("=" * 50)
    
    # Initialize processor
    processor = DocumentProcessor(chunk_size=500, chunk_overlap=100)
    
    # Test files
    test_files = [
        ("sample.md", create_sample_markdown()),
        ("sample.html", create_sample_html()),
        ("sample.txt", create_sample_text())
    ]
    
    for filename, content in test_files:
        print(f"\nTesting {filename}...")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix=os.path.splitext(filename)[1], delete=False) as f:
            f.write(content)
            temp_path = f.name
        
        try:
            # Validate document
            validation = processor.validate_document(temp_path)
            print(f"  Validation: {'✅ PASS' if validation['valid'] else '❌ FAIL'}")
            if not validation['valid']:
                print(f"    Error: {validation['error']}")
                continue
            
            # Process document
            result = processor.process_document(temp_path)
            
            if result['success']:
                print(f"  Processing: ✅ PASS")
                print(f"  File Type: {result['file_type']}")
                print(f"  Total Chars: {result['metadata']['total_chars']}")
                print(f"  Total Words: {result['metadata']['total_words']}")
                print(f"  Total Sentences: {result['metadata']['total_sentences']}")
                print(f"  Chunks Generated: {len(result['chunks'])}")
                
                # Show first chunk
                if result['chunks']:
                    first_chunk = result['chunks'][0]
                    print(f"  First Chunk Preview: {first_chunk['content'][:100]}...")
                
                # Show metadata
                if 'title' in result['metadata']:
                    print(f"  Title: {result['metadata']['title']}")
                
            else:
                print(f"  Processing: ❌ FAIL")
                print(f"    Error: {result['error']}")
        
        except Exception as e:
            print(f"  Processing: ❌ FAIL")
            print(f"    Exception: {str(e)}")
        
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    print("\n" + "=" * 50)
    print("Document Processor Test Complete!")

def test_validation():
    """Test document validation"""
    print("\nTesting Document Validation...")
    print("=" * 30)
    
    processor = DocumentProcessor()
    
    # Test cases
    test_cases = [
        ("nonexistent.pdf", "Non-existent file"),
        ("", "Empty filename"),
        ("test.xyz", "Unsupported file type"),
    ]
    
    for filename, description in test_cases:
        print(f"\n{description}:")
        validation = processor.validate_document(filename)
        print(f"  Result: {'✅ Valid' if validation['valid'] else '❌ Invalid'}")
        if not validation['valid']:
            print(f"  Error: {validation['error']}")

if __name__ == "__main__":
    test_document_processor()
    test_validation() 