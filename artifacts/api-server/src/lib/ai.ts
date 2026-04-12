/**
 * AI service for job application analysis using OpenAI.
 * Handles CV-job matching, cover letter generation, and interview questions.
 */
import { openai } from "@workspace/integrations-openai-ai-server";

/**
 * Analyzes a CV against a job description using GPT.
 * Returns match score (0-100), missing skills array, and suggestions text.
 */
export async function analyzeCV(cvText: string, jobDescription: string, jobTitle: string): Promise<{
  matchScore: number;
  missingSkills: string[];
  suggestions: string;
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [
      {
        role: "system",
        content: `You are an expert recruiter and career coach. Analyze CVs against job descriptions and provide actionable feedback. Always respond with valid JSON only.`,
      },
      {
        role: "user",
        content: `Analyze this CV against the job description below and return a JSON response.

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}

CV:
${cvText}

Return ONLY a JSON object with these fields:
{
  "matchScore": <number 0-100 indicating how well the CV matches>,
  "missingSkills": <array of strings listing skills/qualifications missing from the CV>,
  "suggestions": <string with detailed suggestions to improve the CV for this role>
}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";

  // Parse the JSON response, stripping any markdown fences
  const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed = JSON.parse(cleaned);

  return {
    matchScore: Math.max(0, Math.min(100, parsed.matchScore ?? 0)),
    missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
    suggestions: parsed.suggestions ?? "",
  };
}

/**
 * Generates a tailored cover letter based on CV and job description.
 */
export async function generateCoverLetter(cvText: string, jobDescription: string, jobTitle: string, companyName?: string | null): Promise<string> {
  const companyPart = companyName ? ` at ${companyName}` : "";

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [
      {
        role: "system",
        content: `You are an expert career coach specializing in writing compelling, personalized cover letters. Write professional, engaging cover letters that highlight the candidate's most relevant skills and experience for the specific role.`,
      },
      {
        role: "user",
        content: `Write a professional cover letter for the following job application.

JOB TITLE: ${jobTitle}${companyPart}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S CV:
${cvText}

Write a compelling 3-4 paragraph cover letter that:
1. Opens with a strong hook mentioning the specific role
2. Highlights the most relevant skills and experiences from the CV
3. Shows enthusiasm for the company/role and addresses key job requirements
4. Closes with a confident call to action

Use professional language but make it feel personalized and authentic.`,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}

/**
 * Generates likely interview questions based on CV and job description.
 */
export async function generateInterviewQuestions(cvText: string, jobDescription: string, jobTitle: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [
      {
        role: "system",
        content: `You are an experienced interviewer and recruiter. Generate realistic, insightful interview questions based on a job description and candidate's CV. Always respond with valid JSON only.`,
      },
      {
        role: "user",
        content: `Generate 8-10 likely interview questions for this candidate applying for the following role.

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S CV:
${cvText}

Generate a mix of:
- Technical/skills-based questions specific to the role
- Behavioral questions based on the candidate's experience
- Questions that address any gaps or areas to probe further

Return ONLY a JSON array of question strings:
["question 1", "question 2", ...]`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "[]";
  const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const questions = JSON.parse(cleaned);
    return Array.isArray(questions) ? questions : [];
  } catch {
    return [];
  }
}
