/**
 * Analysis routes - CRUD for job application analyses with AI processing.
 */
import { Router } from "express";
import { eq, and, desc, count, avg, gte } from "drizzle-orm";
import { db, analysesTable } from "@workspace/db";
import {
  CreateAnalysisBody,
  GetAnalysisParams,
  DeleteAnalysisParams,
  GenerateCoverLetterParams,
  GenerateInterviewQuestionsParams,
  ListAnalysesQueryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../../lib/auth";
import { analyzeCV, generateCoverLetter, generateInterviewQuestions } from "../../lib/ai";
import type { IRouter } from "express";

const router: IRouter = Router();

/**
 * GET /analyses - List all analyses for the authenticated user with pagination.
 */
router.get("/analyses", requireAuth, async (req, res): Promise<void> => {
  const params = ListAnalysesQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 10) : 10;
  const offset = (page - 1) * limit;

  const userId = req.userId!;

  const [analyses, totalResult] = await Promise.all([
    db
      .select()
      .from(analysesTable)
      .where(eq(analysesTable.userId, userId))
      .orderBy(desc(analysesTable.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(analysesTable)
      .where(eq(analysesTable.userId, userId)),
  ]);

  const total = totalResult[0]?.count ?? 0;

  res.json({ analyses, total, page, limit });
});

/**
 * POST /analyses - Create a new analysis and run AI processing.
 */
router.post("/analyses", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.userId!;
  const { jobTitle, companyName, jobDescription, cvText } = parsed.data;

  // Insert the analysis first with pending status
  const [analysis] = await db
    .insert(analysesTable)
    .values({
      userId,
      jobTitle,
      companyName: companyName ?? null,
      jobDescription,
      cvText,
      status: "pending",
    })
    .returning();

  // Run AI analysis synchronously
  try {
    const aiResult = await analyzeCV(cvText, jobDescription, jobTitle);

    const [updated] = await db
      .update(analysesTable)
      .set({
        matchScore: aiResult.matchScore,
        missingSkills: JSON.stringify(aiResult.missingSkills),
        suggestions: aiResult.suggestions,
        status: "completed",
      })
      .where(eq(analysesTable.id, analysis.id))
      .returning();

    res.status(201).json(updated);
  } catch (err) {
    req.log.error({ err }, "AI analysis failed");

    // Mark as failed but still return the record
    const [updated] = await db
      .update(analysesTable)
      .set({ status: "failed" })
      .where(eq(analysesTable.id, analysis.id))
      .returning();

    res.status(201).json(updated);
  }
});

/**
 * GET /analyses/:id - Get a single analysis by ID (must belong to the user).
 */
router.get("/analyses/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetAnalysisParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.userId!;

  const [analysis] = await db
    .select()
    .from(analysesTable)
    .where(and(eq(analysesTable.id, params.data.id), eq(analysesTable.userId, userId)));

  if (!analysis) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.json(analysis);
});

/**
 * DELETE /analyses/:id - Delete an analysis (must belong to the user).
 */
router.delete("/analyses/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteAnalysisParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.userId!;

  const [deleted] = await db
    .delete(analysesTable)
    .where(and(eq(analysesTable.id, params.data.id), eq(analysesTable.userId, userId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.sendStatus(204);
});

/**
 * POST /analyses/:id/cover-letter - Generate a cover letter for an analysis.
 */
router.post("/analyses/:id/cover-letter", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GenerateCoverLetterParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.userId!;

  const [analysis] = await db
    .select()
    .from(analysesTable)
    .where(and(eq(analysesTable.id, params.data.id), eq(analysesTable.userId, userId)));

  if (!analysis) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  // If cover letter already exists, return it
  if (analysis.coverLetter) {
    res.json({ coverLetter: analysis.coverLetter });
    return;
  }

  const coverLetter = await generateCoverLetter(
    analysis.cvText,
    analysis.jobDescription,
    analysis.jobTitle,
    analysis.companyName,
  );

  // Save the generated cover letter
  await db
    .update(analysesTable)
    .set({ coverLetter })
    .where(eq(analysesTable.id, analysis.id));

  res.json({ coverLetter });
});

/**
 * POST /analyses/:id/interview-questions - Generate interview questions for an analysis.
 */
router.post("/analyses/:id/interview-questions", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GenerateInterviewQuestionsParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.userId!;

  const [analysis] = await db
    .select()
    .from(analysesTable)
    .where(and(eq(analysesTable.id, params.data.id), eq(analysesTable.userId, userId)));

  if (!analysis) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  // Return cached questions if already generated
  if (analysis.interviewQuestions) {
    try {
      const questions = JSON.parse(analysis.interviewQuestions);
      res.json({ questions });
      return;
    } catch {
      // Fall through to regenerate
    }
  }

  const questions = await generateInterviewQuestions(
    analysis.cvText,
    analysis.jobDescription,
    analysis.jobTitle,
  );

  // Save the generated questions
  await db
    .update(analysesTable)
    .set({ interviewQuestions: JSON.stringify(questions) })
    .where(eq(analysesTable.id, analysis.id));

  res.json({ questions });
});

export default router;
