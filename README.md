

# DocuMind AI

DocuMind AI is a full-stack Retrieval-Augmented Generation (RAG) system designed to perform semantic search and question-answering across heterogeneous document formats. It leverages local vector embeddings and the Google Gemini API to provide context-aware responses grounded strictly in user-uploaded data.

## Overview

This project implements a complete RAG pipeline involving document ingestion, chunking, vectorization, and retrieval. It is built with a microservices architecture orchestrated via Docker Compose, ensuring environment consistency across development and deployment.

## Tech Stack

* **Frontend:** React, TypeScript, Vite
* **Backend:** FastAPI (Python), SQLAlchemy
* **Database:** PostgreSQL 15 with `pgvector` extension
* **ML/AI:**

  * Embeddings: `sentence-transformers/all-MiniLM-L6-v2` (384d)
  * LLM: Google Gemini API
* **Infrastructure:** Docker, Docker Compose

## System Architecture

The application follows a standard RAG workflow:

1. **Ingestion:** Supports PDF, TXT, CSV, and XLSX formats.
2. **Processing:** Documents are parsed and split into 500-character windows to maintain semantic context.
3. **Embedding:** Text chunks are converted into 384-dimensional vectors using the `all-MiniLM-L6-v2` model running locally.
4. **Storage:** Vectors and metadata are stored in PostgreSQL using the HNSW index for efficient similarity search.
5. **Retrieval:** User queries are embedded and compared against the database using cosine distance.
6. **Generation:** Relevant context chunks are retrieved and injected into the Gemini prompt for response generation.

## Project Structure

```text
.
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── routers/          # API endpoints (Auth, Documents)
│   │   ├── models.py         # SQLAlchemy definitions
│   │   └── main.py           # Application entry point
│   ├── init_db.py            # Database initialization script
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── components/       # Reusable UI components
    │   ├── pages/            # Page views (Dashboard, Login)
    │   └── App.tsx           # State management
    └── Dockerfile
```

## Setup & Installation

### Prerequisites

* Docker & Docker Compose installed
* Google Gemini API Key

### Configuration

1. Clone the repository.
2. Navigate to the `backend/` directory.
3. Create a `.env` file with the following variables:

```env
# Database Connection
DATABASE_URL=postgresql://postgres:2040@db:5432/documind

# External Services
GEMINI_API_KEY=your_gemini_key_here

# Security
SECRET_KEY=your_generated_secret_key
```

### Deployment

Run the application stack using Docker Compose:

```bash
docker-compose up --build
```

The services will be available at:

* **Frontend:** `http://localhost:5173`
* **Backend API:** `http://localhost:8000`

## Database Schema

The data model consists of three core entities with cascading deletion to ensure data integrity:

* **Users:** Stores authentication credentials (bcrypt hashed).
* **Documents:** Metadata for uploaded files.
* **DocumentChunks:** Stores text segments and their corresponding vector embeddings (`vector(384)`).

## Current Limitations

* **Session Persistence:** Sessions are currently managed in-memory; restarting the backend service will invalidate active sessions.
* **File Handling:** No strict file size limits are enforced on uploads.
* **Concurrency:** Background processing for large file uploads is not yet implemented; processing occurs synchronously.


