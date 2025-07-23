"""
Document Processing Module for Doc Query

Handles parsing of PDF, Markdown, and HTML documents with text chunking
and validation capabilities.
"""

import os
import re
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import logging

# Document parsing libraries
import PyPDF2
import markdown
from bs4 import BeautifulSoup
import html2text

# Text processing
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document as LangChainDocument

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Main document processing class"""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        """
        Initialize document processor
        
        Args:
            chunk_size: Size of text chunks in characters
            chunk_overlap: Overlap between chunks in characters
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
        # Supported file types
        self.supported_types = {
            '.pdf': self._parse_pdf,
            '.md': self._parse_markdown,
            '.markdown': self._parse_markdown,
            '.html': self._parse_html,
            '.htm': self._parse_html,
            '.txt': self._parse_text
        }
    
    def process_document(self, file_path: str) -> Dict:
        """
        Process a document file and return structured data
        
        Args:
            file_path: Path to the document file
            
        Returns:
            Dictionary containing processed document data
        """
        try:
            # Validate file exists
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
            
            # Get file extension
            file_ext = Path(file_path).suffix.lower()
            
            # Validate file type
            if file_ext not in self.supported_types:
                raise ValueError(f"Unsupported file type: {file_ext}")
            
            # Parse document
            raw_text = self.supported_types[file_ext](file_path)
            
            # Clean and validate text
            cleaned_text = self._clean_text(raw_text)
            
            if not cleaned_text.strip():
                raise ValueError("Document contains no readable text")
            
            # Chunk the text
            chunks = self._chunk_text(cleaned_text)
            
            # Extract metadata
            metadata = self._extract_metadata(file_path, file_ext, cleaned_text)
            
            return {
                'success': True,
                'raw_text': raw_text,
                'cleaned_text': cleaned_text,
                'chunks': chunks,
                'metadata': metadata,
                'file_path': file_path,
                'file_type': file_ext
            }
            
        except Exception as e:
            logger.error(f"Error processing document {file_path}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'file_path': file_path
            }
    
    def _parse_pdf(self, file_path: str) -> str:
        """Parse PDF file and extract text"""
        try:
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                for page_num, page in enumerate(pdf_reader.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            text += f"\n\n--- Page {page_num + 1} ---\n\n"
                            text += page_text
                    except Exception as e:
                        logger.warning(f"Error extracting text from page {page_num + 1}: {e}")
                        continue
            
            return text
            
        except Exception as e:
            raise Exception(f"Failed to parse PDF: {str(e)}")
    
    def _parse_markdown(self, file_path: str) -> str:
        """Parse Markdown file and extract text"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Convert markdown to HTML first, then extract text
            html = markdown.markdown(content)
            soup = BeautifulSoup(html, 'html.parser')
            
            # Extract text while preserving some structure
            text = ""
            for element in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'blockquote']):
                if element.name.startswith('h'):
                    text += f"\n\n{element.get_text().strip()}\n"
                elif element.name == 'p':
                    text += f"\n{element.get_text().strip()}"
                elif element.name == 'li':
                    text += f"\n• {element.get_text().strip()}"
                elif element.name == 'blockquote':
                    text += f"\n> {element.get_text().strip()}"
            
            return text.strip()
            
        except Exception as e:
            raise Exception(f"Failed to parse Markdown: {str(e)}")
    
    def _parse_html(self, file_path: str) -> str:
        """Parse HTML file and extract text"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Use html2text for better text extraction
            h = html2text.HTML2Text()
            h.ignore_links = False
            h.ignore_images = False
            h.body_width = 0  # No line wrapping
            
            text = h.handle(content)
            
            # Clean up the text
            text = re.sub(r'\n\s*\n', '\n\n', text)  # Remove excessive newlines
            text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)  # Remove markdown links
            
            return text.strip()
            
        except Exception as e:
            raise Exception(f"Failed to parse HTML: {str(e)}")
    
    def _parse_text(self, file_path: str) -> str:
        """Parse plain text file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except UnicodeDecodeError:
            # Try with different encoding
            try:
                with open(file_path, 'r', encoding='latin-1') as file:
                    return file.read()
            except Exception as e:
                raise Exception(f"Failed to read text file: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to parse text file: {str(e)}")
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove excessive newlines
        text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
        
        # Remove special characters that might cause issues
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
        
        # Normalize quotes and dashes
        text = text.replace('"', '"').replace('"', '"')
        text = text.replace(''', "'").replace(''', "'")
        text = text.replace('–', '-').replace('—', '-')
        
        return text.strip()
    
    def _chunk_text(self, text: str) -> List[Dict]:
        """Split text into chunks using LangChain text splitter"""
        try:
            # Create LangChain document
            doc = LangChainDocument(page_content=text, metadata={})
            
            # Split into chunks
            chunks = self.text_splitter.split_documents([doc])
            
            # Convert to our format
            result = []
            for i, chunk in enumerate(chunks):
                result.append({
                    'id': i,
                    'content': chunk.page_content,
                    'metadata': {
                        'chunk_id': i,
                        'chunk_size': len(chunk.page_content),
                        'start_char': text.find(chunk.page_content) if chunk.page_content in text else 0
                    }
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error chunking text: {str(e)}")
            # Fallback: simple chunking
            return self._simple_chunk_text(text)
    
    def _simple_chunk_text(self, text: str) -> List[Dict]:
        """Simple text chunking as fallback"""
        chunks = []
        chunk_id = 0
        
        # Split by paragraphs first
        paragraphs = text.split('\n\n')
        
        current_chunk = ""
        for paragraph in paragraphs:
            if len(current_chunk) + len(paragraph) <= self.chunk_size:
                current_chunk += paragraph + "\n\n"
            else:
                if current_chunk.strip():
                    chunks.append({
                        'id': chunk_id,
                        'content': current_chunk.strip(),
                        'metadata': {
                            'chunk_id': chunk_id,
                            'chunk_size': len(current_chunk),
                            'method': 'simple'
                        }
                    })
                    chunk_id += 1
                current_chunk = paragraph + "\n\n"
        
        # Add the last chunk
        if current_chunk.strip():
            chunks.append({
                'id': chunk_id,
                'content': current_chunk.strip(),
                'metadata': {
                    'chunk_id': chunk_id,
                    'chunk_size': len(current_chunk),
                    'method': 'simple'
                }
            })
        
        return chunks
    
    def _extract_metadata(self, file_path: str, file_type: str, text: str) -> Dict:
        """Extract metadata from document"""
        filename = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        
        metadata = {
            'filename': filename,
            'file_type': file_type,
            'file_size': file_size,
            'total_chars': len(text),
            'total_words': len(text.split()),
            'total_sentences': len(re.split(r'[.!?]+', text)),
            'processing_timestamp': None  # Will be set by caller
        }
        
        # Extract title if possible
        if file_type in ['.md', '.html']:
            title = self._extract_title(text, file_type)
            if title:
                metadata['title'] = title
        
        return metadata
    
    def _extract_title(self, text: str, file_type: str) -> Optional[str]:
        """Extract title from document"""
        lines = text.split('\n')
        
        if file_type == '.md':
            # Look for markdown headers
            for line in lines[:10]:  # Check first 10 lines
                if line.startswith('# '):
                    return line[2:].strip()
                elif line.startswith('## '):
                    return line[3:].strip()
        
        elif file_type in ['.html', '.htm']:
            # Look for HTML title tags
            soup = BeautifulSoup(text, 'html.parser')
            title_tag = soup.find('title')
            if title_tag:
                return title_tag.get_text().strip()
        
        # Fallback: use first non-empty line
        for line in lines:
            if line.strip() and len(line.strip()) > 3:
                return line.strip()[:100]  # Limit to 100 chars
        
        return None
    
    def validate_document(self, file_path: str) -> Dict:
        """Validate document before processing"""
        try:
            # Check file exists
            if not os.path.exists(file_path):
                return {'valid': False, 'error': 'File does not exist'}
            
            # Check file size
            file_size = os.path.getsize(file_path)
            if file_size == 0:
                return {'valid': False, 'error': 'File is empty'}
            
            if file_size > 50 * 1024 * 1024:  # 50MB limit
                return {'valid': False, 'error': 'File too large (max 50MB)'}
            
            # Check file type
            file_ext = Path(file_path).suffix.lower()
            if file_ext not in self.supported_types:
                return {
                    'valid': False, 
                    'error': f'Unsupported file type: {file_ext}',
                    'supported_types': list(self.supported_types.keys())
                }
            
            return {'valid': True, 'file_size': file_size, 'file_type': file_ext}
            
        except Exception as e:
            return {'valid': False, 'error': str(e)} 