# Doc Query

A self-hosted, open-source application that allows teams and individuals to upload internal documentation (PDFs, Notion exports, Markdown, HTML) and chat with it using natural language queries. Built using Retrieval-Augmented Generation (RAG), it offers fast, contextual answers with citations.

## Features

- 📄 **Document Upload**: Support for PDFs, Markdown, and HTML files
- 🤖 **RAG-powered Chat**: Natural language queries with accurate, cited answers
- 🔍 **Vector Search**: Fast semantic search using ChromaDB
- 📱 **Modern UI**: Built with Next.js 14, TailwindCSS, and shadcn/ui
- 🚀 **Self-hosted**: Easy deployment with Docker support
- 🔒 **Privacy-focused**: All data stays on your infrastructure

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Backend**: FastAPI (Python) or Next.js API routes
- **Vector Database**: ChromaDB
- **LLM**: OpenAI GPT-4 (or local models)
- **Storage**: SQLite for chat history, local filesystem for documents

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Python 3.8+ (for backend)

### Frontend Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/doc-query.git
   cd doc-query
   ```

2. **Install frontend dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env.local
   ```

   Edit `.env.local` and add your OpenAI API key:

   ```
   OPENAI_API_KEY=your_api_key_here
   ```

4. **Run the frontend development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Backend Setup

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Create virtual environment**

   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install backend dependencies**

   ```bash
   pip install -r ../requirements.txt
   ```

4. **Set up environment variables**

   ```bash
   cp ../env.example .env
   # Edit .env with your configuration
   ```

5. **Run the backend server**

   ```bash
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

6. **Test the API**

   ```bash
   python test_api.py
   ```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Project Structure

```
doc-query/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility functions
├── backend/              # FastAPI backend
│   ├── main.py           # FastAPI application
│   ├── config.py         # Configuration
│   ├── database.py       # Database models
│   ├── routers/          # API routes
│   └── venv/             # Python virtual environment
├── docs/                 # Documentation
└── public/               # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

- [ ] File upload and parsing
- [ ] Vector database integration
- [ ] Chat interface with RAG
- [ ] Citation system
- [ ] Chat history
- [ ] User feedback system
- [ ] Docker deployment
- [ ] Notion integration (post-MVP)

## Support

If you have any questions or need help, please open an issue on GitHub.
