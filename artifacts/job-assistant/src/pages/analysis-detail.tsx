import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetAnalysis,
  getGetAnalysisQueryKey,
  useDeleteAnalysis,
  useGenerateCoverLetter,
  useGenerateInterviewQuestions,
  getListAnalysesQueryKey,
  getGetRecentAnalysesQueryKey,
  getGetDashboardStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

function MatchScoreRing({ score }: { score: number | null | undefined }) {
  if (score == null) return null;

  const color = score >= 70 ? "text-green-600" : score >= 40 ? "text-yellow-600" : "text-red-600";
  const bgColor = score >= 70 ? "bg-green-50 border-green-200" : score >= 40 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200";

  return (
    <div className={`inline-flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 ${bgColor}`}>
      <span className={`text-3xl font-extrabold ${color}`}>{score}%</span>
      <span className="text-xs text-muted-foreground mt-0.5">match</span>
    </div>
  );
}

export default function AnalysisDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [coverLetterVisible, setCoverLetterVisible] = useState(false);
  const [questionsVisible, setQuestionsVisible] = useState(false);
  const [localCoverLetter, setLocalCoverLetter] = useState<string | null>(null);
  const [localQuestions, setLocalQuestions] = useState<string[] | null>(null);

  const { data: analysis, isLoading } = useGetAnalysis(id, {
    query: { enabled: !!id, queryKey: getGetAnalysisQueryKey(id) }
  });

  const deleteAnalysis = useDeleteAnalysis();
  const generateCoverLetter = useGenerateCoverLetter();
  const generateInterviewQuestions = useGenerateInterviewQuestions();

  function handleDelete() {
    deleteAnalysis.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentAnalysesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          toast({ title: "Analysis deleted" });
          setLocation("/analyses");
        },
        onError: () => {
          toast({ title: "Failed to delete", variant: "destructive" });
        },
      }
    );
  }

  function handleGenerateCoverLetter() {
    if (localCoverLetter) {
      setCoverLetterVisible(v => !v);
      return;
    }
    generateCoverLetter.mutate(
      { id },
      {
        onSuccess: (data) => {
          setLocalCoverLetter(data.coverLetter);
          setCoverLetterVisible(true);
        },
        onError: () => {
          toast({ title: "Failed to generate cover letter", variant: "destructive" });
        },
      }
    );
  }

  function handleGenerateQuestions() {
    if (localQuestions) {
      setQuestionsVisible(v => !v);
      return;
    }
    generateInterviewQuestions.mutate(
      { id },
      {
        onSuccess: (data) => {
          setLocalQuestions(data.questions);
          setQuestionsVisible(true);
        },
        onError: () => {
          toast({ title: "Failed to generate interview questions", variant: "destructive" });
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="px-6 py-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="px-6 py-8 max-w-4xl mx-auto text-center">
        <p className="text-muted-foreground">Analysis not found.</p>
        <Button className="mt-4" onClick={() => setLocation("/analyses")}>Back to history</Button>
      </div>
    );
  }

  // Parse JSON stored fields
  let missingSkills: string[] = [];
  try {
    if (analysis.missingSkills) missingSkills = JSON.parse(analysis.missingSkills);
  } catch {}

  const existingCoverLetter = localCoverLetter ?? analysis.coverLetter;
  let existingQuestions: string[] = localQuestions ?? [];
  if (!localQuestions) {
    try {
      if (analysis.interviewQuestions) existingQuestions = JSON.parse(analysis.interviewQuestions);
    } catch {}
  }

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-3 -ml-2 text-muted-foreground"
            onClick={() => setLocation("/analyses")}
            data-testid="button-back"
          >
            &larr; Back to history
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{analysis.jobTitle}</h1>
          {analysis.companyName && (
            <p className="text-muted-foreground mt-0.5">{analysis.companyName}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Analyzed {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleDelete}
          disabled={deleteAnalysis.isPending}
          data-testid="button-delete"
        >
          Delete
        </Button>
      </div>

      {/* Match Score + Status */}
      {analysis.status === "completed" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-8 flex-wrap">
              <MatchScoreRing score={analysis.matchScore} />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-3">AI Analysis Summary</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analysis.matchScore != null && analysis.matchScore >= 70 && "Strong match. Your CV aligns well with the key requirements for this role."}
                  {analysis.matchScore != null && analysis.matchScore >= 40 && analysis.matchScore < 70 && "Moderate match. There are some gaps but you meet several key requirements."}
                  {analysis.matchScore != null && analysis.matchScore < 40 && "Low match. Significant gaps exist between your CV and the job requirements."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis.status === "pending" && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-yellow-800">Analysis is still being processed...</p>
          </CardContent>
        </Card>
      )}

      {analysis.status === "failed" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-red-800">Analysis failed. The AI could not process this request.</p>
          </CardContent>
        </Card>
      )}

      {/* Missing Skills */}
      {missingSkills.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Missing Skills & Qualifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2" data-testid="missing-skills-list">
              {missingSkills.map((skill, i) => (
                <Badge key={i} variant="outline" className="text-xs text-muted-foreground">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {analysis.suggestions && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">CV Improvement Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line" data-testid="text-suggestions">
              {analysis.suggestions}
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Cover Letter Generator */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Cover Letter</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Tailored to this role and your CV</p>
          </div>
          <Button
            variant="outline"
            onClick={handleGenerateCoverLetter}
            disabled={generateCoverLetter.isPending}
            data-testid="button-generate-cover-letter"
          >
            {generateCoverLetter.isPending
              ? "Generating..."
              : existingCoverLetter
              ? coverLetterVisible ? "Hide" : "Show Cover Letter"
              : "Generate Cover Letter"}
          </Button>
        </div>

        {coverLetterVisible && existingCoverLetter && (
          <Card className="bg-muted/20">
            <CardContent className="pt-5">
              <p className="text-sm leading-relaxed whitespace-pre-line" data-testid="text-cover-letter">
                {existingCoverLetter}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(existingCoverLetter);
                  toast({ title: "Cover letter copied to clipboard" });
                }}
                data-testid="button-copy-cover-letter"
              >
                Copy to clipboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Interview Questions Generator */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Interview Questions</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Likely questions based on this role and your CV</p>
          </div>
          <Button
            variant="outline"
            onClick={handleGenerateQuestions}
            disabled={generateInterviewQuestions.isPending}
            data-testid="button-generate-questions"
          >
            {generateInterviewQuestions.isPending
              ? "Generating..."
              : existingQuestions.length > 0
              ? questionsVisible ? "Hide" : "Show Questions"
              : "Generate Interview Questions"}
          </Button>
        </div>

        {questionsVisible && existingQuestions.length > 0 && (
          <Card className="bg-muted/20">
            <CardContent className="pt-5">
              <ol className="space-y-3" data-testid="interview-questions-list">
                {existingQuestions.map((q, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed text-muted-foreground">{q}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
