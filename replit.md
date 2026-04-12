# AI Job Application Assistant

## Overview

A full-stack SaaS web application that helps job seekers analyze their CVs against job descriptions using AI (OpenAI GPT-5.2). Features Clerk authentication, PostgreSQL database, and a clean professional UI.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/job-assistant)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Clerk (via `@clerk/react` + `@clerk/express`)
- **AI**: OpenAI via Replit AI Integrations (`@workspace/integrations-openai-ai-server`)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Features

1. **User Authentication** — Clerk-powered sign up/sign in
2. **CV Analysis** — Paste CV text + job description → AI returns match score (0-100%), missing skills, and improvement suggestions
3. **Cover Letter Generator** — AI-generated tailored cover letter per analysis
4. **Interview Questions** — AI generates 8-10 likely interview questions
5. **Dashboard** — Stats summary (total analyses, avg score, high matches, recent activity) + recent 5 analyses
6. **Analysis History** — Paginated list of all past analyses with delete support

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Schema

- `analyses` — Stores job application analyses per user (userId, jobTitle, companyName, jobDescription, cvText, matchScore, missingSkills, suggestions, coverLetter, interviewQuestions, status)

## API Routes

- `GET /api/healthz` — health check
- `GET /api/analyses` — list analyses (paginated, auth required)
- `POST /api/analyses` — create analysis + run AI (auth required)
- `GET /api/analyses/:id` — get single analysis (auth required)
- `DELETE /api/analyses/:id` — delete analysis (auth required)
- `POST /api/analyses/:id/cover-letter` — generate cover letter (auth required)
- `POST /api/analyses/:id/interview-questions` — generate interview questions (auth required)
- `GET /api/dashboard/stats` — dashboard statistics (auth required)
- `GET /api/dashboard/recent` — 5 most recent analyses (auth required)

## Environment Variables (Auto-Provisioned)

- `DATABASE_URL` — PostgreSQL connection string
- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — Clerk auth keys
- `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI integration via Replit

## Frontend Pages

- `/` — Landing page (unauthenticated) / redirects to dashboard (authenticated)
- `/sign-in`, `/sign-up` — Clerk auth pages
- `/dashboard` — Stats overview + recent analyses
- `/analyze` — New analysis form
- `/analyses` — Paginated analysis history
- `/analyses/:id` — Analysis detail + cover letter + interview questions

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
