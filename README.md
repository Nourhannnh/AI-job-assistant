# AI Job Assistant

Paste a job description and your CV. Get a match score, a list of what's missing, suggestions to fix it, a cover letter, and the questions they're probably going to ask you.

Built with TypeScript, Node.js, Express, PostgreSQL, and React. Powered by OpenAI.

---

## What it does

You submit a CV, by either pasting text directly or uploading a PDF, and a job description. The backend runs them through GPT and comes back with:

- A **match score** from 0 to 100
- A list of **missing skills or qualifications** the job asks for that your CV doesn't cover
- **Suggestions** for how to improve your CV for that specific role
- A **cover letter** tailored to the role and company (generated on request, cached after)
- **Interview questions** the interviewer is likely to ask based on the job and your background (also cached)

Everything is saved to PostgreSQL per user, so you can come back and review past analyses through the dashboard.

---

## Stack

- **Backend:** Node.js, Express, TypeScript
- **Frontend:** React, TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** Clerk
- **AI:** OpenAI API (GPT)
- **Monorepo:** pnpm workspaces with shared packages for DB schema, API types, and the OpenAI client

---

## Project structure

```
├── artifacts/
│   ├── api-server/          # Express backend
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── ai.ts    # All OpenAI calls live here
│   │       │   └── auth.ts  # Clerk auth middleware
│   │       └── routes/
│   │           ├── analyses/ # Main CRUD + AI endpoints
│   │           ├── cv/       # PDF upload and text extraction
│   │           └── dashboard/ # Stats and recent activity
│   └── job-assistant/       # React frontend
├── lib/
│   ├── db/                  # Drizzle schema and DB client
│   ├── api-zod/             # Zod schemas for request validation
│   └── api-client-react/    # Generated API client for the frontend
```

---

## API endpoints

```
GET    /api/healthz                                 Health check
GET    /api/analyses                                List all analyses for the user
POST   /api/analyses                                Create a new analysis (runs AI immediately)
GET    /api/analyses/:id                            Get a specific analysis
DELETE /api/analyses/:id                            Delete an analysis
POST   /api/analyses/:id/cover-letter               Generate (or return cached) cover letter
POST   /api/analyses/:id/interview-questions        Generate (or return cached) interview questions
GET    /api/dashboard/stats                         Aggregated stats across all analyses
GET    /api/dashboard/recent                        Recent analyses for the dashboard
POST   /api/cv/parse                                Upload a PDF CV and extract its text
```

---

## How to run it locally

Clone the repo and install dependencies:

```
pnpm install
```

Set up your environment variables in `.env`:

```
OPENAI_API_KEY=your_key_here
DATABASE_URL=your_postgres_url
CLERK_SECRET_KEY=your_clerk_key
```

Push the database schema:

```
pnpm --filter @workspace/db run push
```

Start the backend:

```
pnpm --filter @workspace/api-server run dev
```

Start the frontend:

```
pnpm --filter @workspace/job-assistant run dev
```

Backend runs on port 8080, frontend on port 5173.

---

## A few things worth noting

Cover letters and interview questions are generated lazily, only when you ask for them, and then cached in the database so you don't burn API calls on repeat requests.

PDF CV uploads go through `POST /cv/parse`. The file is accepted as multipart form data, parsed in memory using pdf-parse (max 10MB, PDFs only), and the extracted text is returned to the frontend to pre-fill the CV field. If the PDF is scanned or password-protected and can't be parsed, the endpoint returns a 422 with a message telling the user to paste manually instead.

The AI module (`lib/ai.ts`) handles all three OpenAI calls independently. Each one uses a structured prompt that asks the model to return JSON, then strips any markdown fencing before parsing. Match scores are clamped to 0-100 on the server side.

Auth is handled by Clerk. Every route that touches user data runs through `requireAuth` middleware which validates the session and attaches `userId` to the request.
