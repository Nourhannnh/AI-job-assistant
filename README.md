# AI Job Assistant — AI-powered CV & Job Match Tool

AI Job Assistant is a full-stack web application that helps users evaluate how well their CV matches a job description using LLM-based analysis. It provides a structured breakdown of skill gaps, CV improvement suggestions, and generates tailored cover letters and interview questions.

---

## Features

- **CV–Job Match Score** — Calculates compatibility between a CV and job description (0–100%)
- **Skill Gap Analysis** — Identifies missing or underrepresented skills
- **CV Feedback** — Structured suggestions to improve CV alignment with job requirements
- **Cover Letter Generation** — Generates role-specific cover letters using OpenAI
- **Interview Preparation** — Generates likely interview questions based on the job description
- **Analysis History** — Stores past analyses for review and comparison
- **Dashboard Overview** — Summarizes user activity and application progress

---

## Tech Stack

| Layer | Technology |
|------|------------|
| Frontend | React, Vite, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| Authentication | Clerk |
| AI Integration | OpenAI API |
| Monorepo | pnpm workspaces |

The project is fully written in TypeScript across both frontend and backend for consistency and type safety.

---

## Architecture

frontend/
  src/
    pages/
      home.tsx
      dashboard.tsx
      analyze.tsx
      analyses.tsx
      analysis-detail.tsx
    App.tsx

backend/
  src/
    routes/
      analyses/
      dashboard/
    lib/
      ai.ts

shared/
  db/
  api-spec/

---

## Setup

### Requirements
- Node.js 20+
- pnpm
- PostgreSQL database
- Clerk account
- OpenAI API key

### Environment Variables

Create a `.env` file:

DATABASE_URL=

CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
VITE_CLERK_PUBLISHABLE_KEY=

OPENAI_API_KEY=

---

### Installation

pnpm install

pnpm --filter @workspace/db run push

pnpm --filter @workspace/api-server run dev

pnpm --filter @workspace/job-assistant run dev

Frontend:
http://localhost:5173

Backend:
http://localhost:8080

---

## API Overview

GET /api/healthz
GET /api/analyses
POST /api/analyses
GET /api/analyses/:id
DELETE /api/analyses/:id
POST /api/analyses/:id/cover-letter
POST /api/analyses/:id/interview-questions
GET /api/dashboard/stats
GET /api/dashboard/recent

---

## AI Logic

The backend uses OpenAI with structured prompts to:

- Analyze CV vs job description
- Return match score
- Extract missing skills
- Suggest improvements

All logic is centralized in backend/src/lib/ai.ts

---

## Purpose

Built to demonstrate:
- Full-stack TypeScript development
- AI integration in production workflows
- Authentication and user-specific data handling
- Structured API design
