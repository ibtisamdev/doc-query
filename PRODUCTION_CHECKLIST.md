# 🚀 Production Deployment Checklist

## Pre-Deployment Checklist

### ✅ Environment Setup

- [ ] Set `OPENAI_API_KEY` in environment
- [ ] Set `DEBUG=false` for production
- [ ] Configure `DATABASE_URL` (default: SQLite)
- [ ] Set `CHROMA_DB_PATH` and `UPLOAD_DIR`
- [ ] Configure `NEXT_PUBLIC_APP_URL`

### ✅ Security Configuration

- [ ] Review and update `.gitignore` (sensitive files excluded)
- [ ] Ensure `.env` file is not committed to version control
- [ ] Set up proper file permissions for uploads and database
- [ ] Configure CORS settings if needed
- [ ] Review API key authentication

### ✅ Database Setup

- [ ] Database file is writable
- [ ] ChromaDB directory exists and is writable
- [ ] Uploads directory exists and is writable
- [ ] Run initial database setup if needed

### ✅ Dependencies

- [ ] Node.js 18+ installed
- [ ] Python 3.8+ installed
- [ ] All npm dependencies installed
- [ ] All Python dependencies installed

## Deployment Steps

### 1. Frontend Deployment

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test production build
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
# Edit .env with production values

# Create directories
mkdir -p uploads chroma_db

# Start server
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 3. Docker Deployment (Alternative)

```bash
# Build and run with Docker
docker-compose up -d

# Or build manually
docker build -t doc-query .
docker run -p 8000:8000 -e OPENAI_API_KEY=your_key doc-query
```

## Post-Deployment Verification

### ✅ Health Checks

- [ ] Frontend accessible at http://localhost:3000
- [ ] Backend API accessible at http://localhost:8000
- [ ] API documentation at http://localhost:8000/docs
- [ ] Health endpoint responds: `GET /api/health`

### ✅ Tenant Setup

- [ ] Create first tenant via API
- [ ] Verify API key generation
- [ ] Test tenant authentication
- [ ] Verify tenant isolation

### ✅ Core Functionality

- [ ] Document upload works
- [ ] Chat functionality works
- [ ] Vector search works
- [ ] File storage works

### ✅ Security Verification

- [ ] API key authentication works
- [ ] Tenant data isolation works
- [ ] File upload validation works
- [ ] No sensitive data exposed

## Monitoring & Maintenance

### ✅ Logging

- [ ] Application logs are accessible
- [ ] Error logs are monitored
- [ ] Performance metrics tracked

### ✅ Backup Strategy

- [ ] Database backup configured
- [ ] Upload files backup configured
- [ ] ChromaDB backup configured
- [ ] Backup restoration tested

### ✅ Updates

- [ ] Dependencies update strategy
- [ ] Security patches process
- [ ] Version control strategy

## Troubleshooting

### Common Issues

1. **Database Issues**: Check file permissions and disk space
2. **ChromaDB Issues**: Verify directory permissions
3. **File Upload Issues**: Check uploads directory permissions
4. **API Key Issues**: Verify Authorization header format
5. **Memory Issues**: Monitor resource usage

### Emergency Procedures

- [ ] Backup procedures documented
- [ ] Rollback procedures tested
- [ ] Support contact information available
- [ ] Incident response plan ready

## Production URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

## Support

For production issues:

1. Check application logs
2. Verify environment configuration
3. Test API endpoints
4. Review error messages
5. Check system resources
