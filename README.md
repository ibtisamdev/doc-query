# Doc Query - Production

A self-hosted, multi-tenant document chat application with RAG capabilities. Upload internal documentation and chat with it using natural language queries with accurate citations.

## 🚀 Production Features

- 📄 **Multi-tenant Document Management**: Isolated document storage per tenant
- 🤖 **RAG-powered Chat**: Natural language queries with accurate, cited answers
- 🔍 **Vector Search**: Fast semantic search using ChromaDB
- 📱 **Modern UI**: Built with Next.js 14, TailwindCSS, and shadcn/ui
- 🔒 **Enterprise Security**: API key authentication, tenant isolation
- 📊 **Usage Tracking**: Monitor tenant usage and limits
- 🚀 **Self-hosted**: Complete control over your data

## 🏗️ Architecture

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: FastAPI (Python) with multi-tenant middleware
- **Vector Database**: ChromaDB for document embeddings
- **LLM**: OpenAI GPT-4 (configurable)
- **Storage**: SQLite for metadata, local filesystem for documents

## 📦 Production Deployment

### Prerequisites

- Node.js 18+
- Python 3.8+
- OpenAI API key

### 1. Frontend Deployment

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

### 2. Backend Deployment

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp env.example .env
# Edit .env with your configuration

# Start production server
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 3. Environment Configuration

Create `.env` file in backend directory:

```env
# Database
DATABASE_URL=sqlite:///./doc-query.db

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Vector Database
CHROMA_DB_PATH=./chroma_db

# File Storage
UPLOAD_DIR=./uploads

# Application
APP_NAME=Doc Query
DEBUG=false
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🔧 Production Configuration

### Multi-Tenant Setup

1. **Create First Tenant**:

   ```bash
   curl -X POST http://localhost:8000/api/tenants/ \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Your Company",
       "max_documents": 1000,
       "max_chat_messages": 100000,
       "max_storage_mb": 10000,
       "features_enabled": ["basic", "chat", "documents", "analytics"]
     }'
   ```

2. **Use API Key**: The response will include an API key for authentication

### Security Considerations

- ✅ API key authentication for all endpoints
- ✅ Tenant data isolation
- ✅ Rate limiting (configurable per tenant)
- ✅ File upload validation
- ✅ SQL injection protection

## 📁 Production File Structure

```
doc-query/
├── app/                    # Next.js frontend
├── components/            # React components
├── lib/                  # Utilities
├── backend/              # FastAPI backend
│   ├── main.py           # Application entry point
│   ├── config.py         # Configuration
│   ├── database.py       # Database models
│   ├── tenant_middleware.py # Multi-tenant logic
│   ├── tenant_provisioning.py # Tenant management
│   ├── routers/          # API endpoints
│   ├── chroma_db/        # Vector database
│   ├── uploads/          # Document storage
│   └── requirements.txt  # Python dependencies
├── package.json          # Node.js dependencies
└── README.md            # This file
```

## 🔍 API Endpoints

### Tenant Management

- `POST /api/tenants/` - Create tenant
- `GET /api/tenants/` - List tenants
- `GET /api/tenants/{id}` - Get tenant
- `PUT /api/tenants/{id}` - Update tenant
- `DELETE /api/tenants/{id}` - Delete tenant

### Document Management

- `POST /api/documents/upload` - Upload document
- `GET /api/documents/` - List documents
- `DELETE /api/documents/{id}` - Delete document

### Chat

- `POST /api/chat/send` - Send message
- `GET /api/chat/sessions` - Get chat sessions

## 📊 Monitoring

- **Health Check**: `GET /api/health`
- **Tenant Usage**: `GET /api/tenants/{id}/usage`
- **Current Usage**: `GET /api/tenants/current/usage`

## 🚨 Troubleshooting

### Common Issues

1. **Database Issues**: Ensure SQLite file is writable
2. **ChromaDB Issues**: Check chroma_db directory permissions
3. **File Upload Issues**: Verify uploads directory exists and is writable
4. **API Key Issues**: Ensure Authorization header format: `Bearer sk_...`

### Logs

Check server logs for detailed error information:

```bash
# Frontend logs
npm start

# Backend logs
python -m uvicorn main:app --log-level debug
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Support

For production support, please check the logs and ensure all environment variables are properly configured.
