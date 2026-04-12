import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Stores each job application analysis for a user
export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Clerk user ID
  jobTitle: text("job_title").notNull(),
  companyName: text("company_name"),
  jobDescription: text("job_description").notNull(),
  cvText: text("cv_text").notNull(),
  matchScore: integer("match_score"), // 0-100
  missingSkills: text("missing_skills"), // JSON array stored as text
  suggestions: text("suggestions"), // AI suggestions text
  coverLetter: text("cover_letter"), // Generated cover letter
  interviewQuestions: text("interview_questions"), // JSON array stored as text
  status: text("status").notNull().default("pending"), // pending | completed | failed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
