# KnowledgeHub – AI Document Assistant

KnowledgeHub is a full-stack AI-powered document management and assistant platform. It allows users to upload documents, extract their contents, split them into smaller chunks, generate vector embeddings, and prepare document data for semantic search and Retrieval-Augmented Generation (RAG).

The project is being developed as a practical learning project to explore modern full-stack development, backend architecture, AI integrations, document processing, and LLM-powered applications.

## Project Goals

The main goals of KnowledgeHub are:

- Build a complete full-stack application using Next.js and NestJS.
- Learn production-oriented NestJS backend architecture.
- Implement secure authentication using JWT and HTTP-only cookies.
- Upload and process PDF and DOCX documents.
- Extract and divide document text into manageable chunks.
- Generate and persist text embeddings.
- Prepare the backend for semantic search and RAG-based question answering.
- Build a foundation for AI-powered document conversations.

## Technology Stack

| Category | Technology | Purpose |
|---|---|---|
| Frontend | Next.js | React-based application and routing |
| Language | TypeScript | Type safety across the application |
| Styling | Tailwind CSS | Responsive user interface |
| UI Components | Shadcn UI | Reusable interface components |
| Backend | NestJS | Modular REST API architecture |
| Database | PostgreSQL | Persistent relational data |
| ORM | Prisma 7 | Database access and migrations |
| Authentication | JWT, Passport | User authentication and authorization |
| Password Security | bcryptjs | Password hashing |
| File Upload | Multer | Document upload handling |
| PDF Processing | pdf-parse | PDF text extraction |
| DOCX Processing | Mammoth | DOCX text extraction |
| AI Integration | OpenAI API | Text embedding generation |
| Testing | Jest | Unit and automated tests |
| API Documentation | Swagger | API exploration and documentation |
| Version Control | Git and GitHub | Source control and collaboration |

## Project Architecture

KnowledgeHub uses a monorepo structure containing separate frontend and backend applications.

```text
knowledgehub/
│
├── apps/
│   ├── web/                         # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── context/
│   │   │   └── lib/
│   │   └── package.json
│   │
│   └── api/                         # NestJS backend
│       ├── src/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── documents/
│       │   ├── health/
│       │   ├── prisma/
│       │   └── generated/
│       ├── uploads/
│       └── package.json
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── prisma.config.ts
├── .env
├── .gitignore
└── README.md
```

## How KnowledgeHub Works

The document processing workflow consists of several stages.

### 1. User Authentication

Users register and log in through the backend API.

Authentication uses:

- JWT access tokens.
- HTTP-only authentication cookies.
- Refresh token rotation.
- bcryptjs password hashing.
- Passport JWT strategy.
- Protected API routes.

Access tokens and refresh tokens are stored in HTTP-only cookies rather than exposed to frontend JavaScript.

### 2. Document Upload

Authenticated users can upload PDF and DOCX files.

The backend:

1. Receives the document through Multer.
2. Validates the file extension and MIME type.
3. Checks the file signature.
4. Applies a 10 MB upload size limit.
5. Saves the file using a generated filename.
6. Creates a document record in PostgreSQL.

Supported formats:

- PDF
- DOCX

### 3. Text Extraction

The uploaded document is processed by `DocumentTextExtractorService`.

Different libraries handle different formats:

- `pdf-parse` extracts text from PDF files.
- `mammoth` extracts raw text from DOCX files.

The extracted text is saved in the document record.

Documents move through processing statuses:

```text
UPLOADED
    |
    v
PROCESSING
    |
    v
READY

If processing fails:
    |
    v
FAILED
```

### 4. Document Chunking

Large documents are divided into smaller text segments.

The `DocumentChunkingService` currently uses:

| Setting | Value |
|---|---:|
| Chunk size | 1,200 characters |
| Chunk overlap | 200 characters |

The service attempts to split text at paragraph, sentence, or word boundaries.

Overlap preserves some context between neighboring chunks.

Each chunk is stored separately in PostgreSQL.

### 5. Embedding Generation

Embeddings convert text into numerical vectors that can later be compared mathematically.

The `EmbeddingsService` supports two providers:

**OpenAI provider**

Uses:

- Model: `text-embedding-3-small`
- Dimensions: 1,536

**Mock provider**

Uses deterministic SHA-256-based vectors for local development and testing.

The mock provider does not understand the meaning of text. It is intended to test the embedding pipeline and database storage without requiring OpenAI API credits.

### 6. Embedding Storage

Generated embeddings are persisted in PostgreSQL using JSONB.

The `DocumentChunk` model includes:

| Field | Purpose |
|---|---|
| `content` | Original chunk text |
| `chunkIndex` | Position of the chunk |
| `charCount` | Number of characters |
| `embedding` | Generated numerical vector |
| `embeddingModel` | Embedding provider/model identifier |
| `embeddedAt` | Embedding generation timestamp |

This allows the application to retrieve previously generated embeddings without generating them again.

### 7. Future: Semantic Search and RAG

The next development stages will introduce:

- Semantic document search.
- Query embedding generation.
- Vector similarity comparison.
- Relevant document chunk retrieval.
- LLM-based question answering.
- Conversation history.
- Source citations.

The intended RAG workflow:

```text
User asks a question
        |
        v
Generate query embedding
        |
        v
Find relevant document chunks
        |
        v
Build context from retrieved chunks
        |
        v
Send context and question to an LLM
        |
        v
Generate an answer
        |
        v
Return answer with source references
```

These are planned features, not yet completed functionality.

## Database Design

The current database contains the following core entities:

### User

Stores registered user information and authentication relationships.

### RefreshToken

Stores hashed refresh tokens and their expiration/revocation information.

### Document

Stores uploaded document metadata, processing status, and extracted text.

### DocumentChunk

Stores individual document chunks and their associated embeddings.

The main relationships are:

```text
User
 |
 | 1:N
 |
Document
 |
 | 1:N
 |
DocumentChunk
```

Deleting a document cascades to its associated chunks.

## API Endpoints

All API routes use the `/api` global prefix.

### Health

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/refresh` | Refresh authentication |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Get authenticated user |

### Documents

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/documents/upload` | Upload a document |
| GET | `/api/documents` | List user documents |
| GET | `/api/documents/:id` | Get document details |
| GET | `/api/documents/:id/chunks` | Get document chunks |
| POST | `/api/documents/:id/embed` | Generate and store embeddings |
| DELETE | `/api/documents/:id` | Delete a document |

Protected endpoints require authentication.

API documentation is available through Swagger when the backend is running:

`http://localhost:3001/api/docs`

## Getting Started

### Prerequisites

Install the following tools:

- Node.js
- npm
- PostgreSQL
- Git
- A code editor such as VS Code

### 1. Clone the Repository

```bash
git clone https://github.com/raselcsedev/knowledgehub.git

cd knowledgehub
```

### 2. Install Dependencies

Install dependencies for the frontend and backend according to their respective package files.

```bash
cd apps/api
npm install

cd ../web
npm install
```

### 3. Configure Environment Variables

Create a root `.env` file:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/knowledgehub?schema=public"
JWT_SECRET="your-secure-secret"
```

Create `apps/api/.env`:

```env
OPENAI_API_KEY="your-openai-api-key"
EMBEDDINGS_PROVIDER="mock"
```

Never commit real API keys, passwords, JWT secrets, or environment files.

### 4. Configure the Database

From the project root:

```bash
npx prisma migrate dev
npx prisma generate
```

Open Prisma Studio:

```bash
npx prisma studio
```

### 5. Start the Backend

```bash
cd apps/api
npm run start:dev
```

Backend:

`http://localhost:3001/api`

Swagger:

`http://localhost:3001/api/docs`

### 6. Start the Frontend

Open another terminal:

```bash
cd apps/web
npm run dev
```

Frontend:

`http://localhost:3000`

## Development and Testing

### Build Backend

```bash
cd apps/api
npm run build
```

### Run All Tests

```bash
npm test -- --runInBand
```

### Run a Specific Test

```bash
npm test -- documents.service.spec.ts --runInBand
```

### Check Prisma Migration Status

From the project root:

```bash
npx prisma migrate status
```

## Important Development Notes

- PostgreSQL is currently used for persistent document and embedding storage.
- Embeddings are stored as JSONB.
- pgvector integration is planned for a future stage.
- Mock embeddings are not suitable for validating real semantic-search quality.
- To use OpenAI embeddings, configure a valid API key and set `EMBEDDINGS_PROVIDER=openai`.
- OpenAI API usage may require separate API billing.
- Uploaded documents should be treated as private user data.
- Authentication and document ownership checks are applied to protected document operations.

## Development Roadmap

| Stage | Feature | Status |
|---|---|---|
| 1 | Monorepo and project setup | Completed |
| 2 | PostgreSQL and Prisma setup | Completed |
| 3 | User registration and authentication | Completed |
| 4 | Dashboard and document interface | Implemented |
| 5 | PDF/DOCX upload and extraction | Implemented |
| 6 | Document chunking | Completed |
| 7 | Document chunk retrieval API | Completed |
| 8 | Automated backend tests | In progress |
| 9 | OpenAI embedding service | Implemented |
| 10 | Mock embedding provider | Completed |
| 11 | PostgreSQL JSONB embedding storage | Completed |
| 12 | pgvector integration | Planned |
| 13 | Semantic search | Planned |
| 14 | RAG question answering | Planned |
| 15 | Chat history and source citations | Planned |
| 16 | Frontend integration and deployment | Planned |

## Learning Outcomes

This project is designed to provide practical experience with:

- Next.js App Router and frontend architecture.
- NestJS modules, controllers, providers, and dependency injection.
- REST API design.
- Authentication and authorization.
- PostgreSQL database design.
- Prisma ORM and migrations.
- File uploads and document parsing.
- Text chunking and embeddings.
- OpenAI API integration.
- Vector search and RAG architecture.
- Automated testing and deployment.

## Author

**Rasel Aktar**

Frontend Developer | Full-Stack Developer in Progress

- GitHub: https://github.com/raselcsedev
- Project: https://github.com/raselcsedev/knowledgehub

---

**KnowledgeHub – Building the foundation for intelligent document understanding.**