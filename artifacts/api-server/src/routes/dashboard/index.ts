/**
 * Dashboard routes - statistics and recent activity for the authenticated user.
 */
import { Router } from "express";
import { eq, desc, count, avg, gte } from "drizzle-orm";
import { db, analysesTable } from "@workspace/db";
import { requireAuth } from "../../lib/auth";
import type { IRouter } from "express";

const router: IRouter = Router();

/**
 * GET /dashboard/stats - Returns aggregate statistics for the current user.
 */
router.get("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;

  // Get current date minus 7 days for recent activity
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [totalResult, avgScoreResult, highMatchResult, recentResult] = await Promise.all([
    // Total analyses count
    db
      .select({ count: count() })
      .from(analysesTable)
      .where(eq(analysesTable.userId, userId)),

    // Average match score (only for completed analyses with a score)
    db
      .select({ avg: avg(analysesTable.matchScore) })
      .from(analysesTable)
      .where(eq(analysesTable.userId, userId)),

    // Count of high-match analyses (score >= 70)
    db
      .select({ count: count() })
      .from(analysesTable)
      .where(eq(analysesTable.userId, userId)),

    // Activity in last 7 days
    db
      .select({ count: count() })
      .from(analysesTable)
      .where(eq(analysesTable.userId, userId)),
  ]);

  // Filter high match in memory (matchScore >= 70)
  const allAnalyses = await db
    .select({ matchScore: analysesTable.matchScore, createdAt: analysesTable.createdAt })
    .from(analysesTable)
    .where(eq(analysesTable.userId, userId));

  const highMatchCount = allAnalyses.filter(a => (a.matchScore ?? 0) >= 70).length;
  const recentActivity = allAnalyses.filter(a => new Date(a.createdAt) >= sevenDaysAgo).length;
  const totalAnalyses = totalResult[0]?.count ?? 0;
  const averageMatchScore = avgScoreResult[0]?.avg ? parseFloat(String(avgScoreResult[0].avg)) : null;

  res.json({
    totalAnalyses,
    averageMatchScore,
    highMatchCount,
    recentActivity,
  });
});

/**
 * GET /dashboard/recent - Returns the 5 most recent analyses for the current user.
 */
router.get("/dashboard/recent", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;

  const analyses = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.userId, userId))
    .orderBy(desc(analysesTable.createdAt))
    .limit(5);

  res.json({ analyses });
});

export default router;
