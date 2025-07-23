📄 Product Requirements Document
Product Name: DocuChat Pro
Owner: [Your Name]
Stage: MVP (Open Source Portfolio Project)
Last Updated: July 23, 2025

🎯 1. Overview
DocuChat Pro is a self-hosted, open-source application that allows teams and individuals to upload internal documentation (PDFs, Notion exports, Markdown, HTML) and chat with it using natural language queries. Built using Retrieval-Augmented Generation (RAG), it offers fast, contextual answers with citations.

🧩 2. Goals
Primary Goals
Enable users to upload or sync documents.

Allow users to ask natural language questions based on document content.

Provide accurate, cited answers using RAG with an LLM (e.g., GPT-4 or open models).

Be open-source, easily deployable, and extendable.

Secondary Goals
Offer multi-file document support.

Enable team-based document collections (e.g., marketing, engineering).

Support chat history and feedback (thumbs up/down).

🚫 3. Out of Scope (MVP)
Real-time collaborative editing.

Document annotations.

Enterprise SSO integration.

Mobile apps.

🧪 4. Use Cases
Engineer onboarding
Ask: “How do we deploy the staging environment?”

Product manager Q&A
Ask: “What was decided in the Q2 roadmap?”

Support bot for internal tools
Ask: “What are the known bugs in AppX v2?”

🖥️ 5. User Flows

1. Upload and Chat
   User uploads PDFs/MD files.

System parses, chunks, and embeds into vector DB.

User asks a question → matched chunks retrieved → passed to LLM.

Answer shown with citations to source docs.

2. Sync with Notion/GDrive (Post-MVP)
   🛠️ 6. Technical Architecture (MVP)
   Frontend
   Framework: Next.js 14 (app router)

UI: TailwindCSS + shadcn/ui

State: React context or Redux Toolkit

Features:

Drag & drop file upload

Chat interface

Citations display

Backend
Framework: FastAPI (or Next.js API routes)

Features:

File parsing (PDF/MD/HTML)

Text chunking (LangChain or custom)

Embedding via OpenAI / HuggingFace

Retrieval with ChromaDB / FAISS

LLM call (OpenAI / local model)

Storage
Vector DB: ChromaDB (local)

File Storage: Local filesystem or Cloud storage (optional)

Chat history: SQLite or Postgres

🧠 7. AI/RAG Pipeline
mermaid
Copy
Edit
graph TD
A[Upload Doc] --> B[Parse & Chunk]
B --> C[Embed via OpenAI]
C --> D[Store in Vector DB (Chroma)]
E[User Query] --> F[Embed Question]
F --> G[Retrieve Top-k Chunks]
G --> H[Pass chunks + query to LLM]
H --> I[Generate & Display Answer + Citations]
✅ 8. Feature List
Feature Priority Notes
File Upload (PDF, MD, HTML) High Drag & drop + parse
Text Chunking & Embedding High Use LangChain or custom logic
Vector Store Integration High Use ChromaDB (or FAISS)
Chat UI + LLM Integration High Streamable response with source links
Simple Auth (Email/Token) Medium Optional for self-hosted
Chat History Medium Stored in local DB
Feedback Thumbs (👍/👎) Low For training insights
Notion Sync Low Post-MVP

🧪 9. Evaluation
Accuracy: Are answers semantically correct?

Latency: Total time from query to answer.

Relevance: Are citations actually related to answer?

Deployability: Can others easily self-host the tool?

📦 10. Deliverables
Milestone Deliverable
M1 – Repo Bootstrap GitHub project with README + MIT License
M2 – Working MVP Upload → Embed → Chat Flow
M3 – UI Polish Responsive, citations, chat UX
M4 – Deployable Setup Dockerfile + Vercel/Render instructions
M5 – Launch & Demo GIFs, YouTube walkthrough, dev.to post

🧪 11. Open Datasets (Optional for Demo)
Internal Notion docs (export)

Public project documentation (e.g., Vercel, Supabase)

Sample HR handbooks or policy PDFs
