# Doc Query Backend

FastAPI backend for Doc Query - Document chat with RAG capabilities.

## Features

- **FastAPI Framework**: Modern, fast web framework for building APIs
- **SQLite Database**: Lightweight database for storing documents and chat history
- **Document Management**: Upload, process, and manage documents (PDF, MD, HTML)
- **Chat System**: Session-based chat with message history and feedback
- **Health Monitoring**: Comprehensive health check endpoints
- **CORS Support**: Configured for frontend integration

## Tech Stack

- **Framework**: FastAPI 0.104.1
- **Database**: SQLite with SQLAlchemy ORM
- **Document Processing**: PyPDF2, Markdown, BeautifulSoup4, html2text
- **Text Chunking**: LangChain RecursiveCharacterTextSplitter
- **AI/ML**: OpenAI, LangChain, ChromaDB (for future RAG implementation)
- **Server**: Uvicorn with hot reload

## Setup

### Prerequisites

- Python 3.8+
- Virtual environment (recommended)

### Installation

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Create virtual environment**

   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**

   ```bash
   cp ../env.example .env
   # Edit .env with your configuration
   ```

5. **Run the server**
   ```bash
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

## API Endpoints

### Health Checks

- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health check with database status

### Documents

- `GET /api/documents/` - List all documents
- `POST /api/documents/upload` - Upload a new document
- `GET /api/documents/{document_id}` - Get specific document
- `DELETE /api/documents/{document_id}` - Delete document
- `POST /api/documents/{document_id}/process` - Process document with text extraction and chunking
- `GET /api/documents/{document_id}/chunks` - Get processed chunks for a document

### Chat

- `POST /api/chat/send` - Send a chat message
- `GET /api/chat/sessions` - List all chat sessions
- `GET /api/chat/sessions/{session_id}/messages` - Get session messages
- `POST /api/chat/messages/{message_id}/feedback` - Submit feedback

## Database Models

### Document

- `id`: Primary key
- `filename`: Original filename
- `file_path`: Path to stored file
- `file_type`: File extension (pdf, md, html)
- `content`: Extracted text content
- `uploaded_at`: Upload timestamp
- `is_processed`: Processing status

### ChatMessage

- `id`: Primary key
- `session_id`: Chat session identifier
- `message`: User message
- `response`: AI response
- `created_at`: Message timestamp
- `feedback`: User feedback (1/-1)

### ChatSession

- `id`: Primary key
- `session_id`: Unique session identifier
- `created_at`: Session creation time
- `updated_at`: Last activity time

## Configuration

Environment variables in `.env`:

```env
# Database
DATABASE_URL=sqlite:///./doc-query.db

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Vector Database
CHROMA_DB_PATH=./chroma_db

# File Storage
UPLOAD_DIR=./uploads

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Development

### Running in Development Mode

```bash
# With auto-reload
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Or use the start script
python start.py
```

### Testing the API

```bash
# Run the API test script
python test_api.py

# Test document processing
python test_document_processor.py

# Or test manually with curl
curl http://localhost:8000/api/health
```

### API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Project Structure

```
backend/
├── main.py                    # FastAPI application entry point
├── config.py                  # Configuration and settings
├── database.py                # Database models and connection
├── document_processor.py      # Document processing and text chunking
├── start.py                   # Server startup script
├── test_api.py                # API testing script
├── test_document_processor.py # Document processing test script
├── routers/                   # API route modules
│   ├── health.py              # Health check endpoints
│   ├── chat.py                # Chat functionality
│   └── documents.py           # Document management
├── venv/                      # Virtual environment
└── README.md                  # This file
```

## Document Processing

The backend includes a comprehensive document processing system that supports:

### Supported File Types

- **PDF**: Text extraction with page separation
- **Markdown**: Structured text extraction with formatting preservation
- **HTML**: Clean text extraction with link handling
- **Plain Text**: Direct text processing

### Features

- **Text Chunking**: Intelligent text splitting using LangChain
- **Metadata Extraction**: Document statistics and title extraction
- **Validation**: File type and size validation
- **Error Handling**: Comprehensive error handling and fallbacks

### Usage

```python
from document_processor import DocumentProcessor

processor = DocumentProcessor(chunk_size=1000, chunk_overlap=200)
result = processor.process_document("document.pdf")

if result['success']:
    chunks = result['chunks']
    metadata = result['metadata']
```

## Next Steps

1. **Vector Database Integration**: ChromaDB setup and embedding storage
2. **LLM Integration**: OpenAI API integration for RAG responses
3. **Authentication**: User management and session handling
4. **Enhanced Processing**: OCR for scanned PDFs, table extraction

## Troubleshooting

### Common Issues

1. **Port already in use**: Change port in uvicorn command
2. **Import errors**: Ensure virtual environment is activated
3. **Database errors**: Check file permissions for SQLite database
4. **CORS issues**: Verify frontend URL in CORS configuration

### Logs

Check the console output for detailed error messages and server logs.
