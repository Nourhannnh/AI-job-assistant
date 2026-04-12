import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateAnalysis, getListAnalysesQueryKey, getGetRecentAnalysesQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const analyzeSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  companyName: z.string().optional(),
  jobDescription: z.string().min(50, "Please provide a detailed job description (at least 50 characters)"),
  cvText: z.string().min(100, "Please paste your full CV text (at least 100 characters)"),
});

type AnalyzeForm = z.infer<typeof analyzeSchema>;

export default function Analyze() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const createAnalysis = useCreateAnalysis();

  const form = useForm<AnalyzeForm>({
    resolver: zodResolver(analyzeSchema),
    defaultValues: {
      jobTitle: "",
      companyName: "",
      jobDescription: "",
      cvText: "",
    },
  });

  async function onSubmit(values: AnalyzeForm) {
    setIsAnalyzing(true);
    createAnalysis.mutate(
      {
        data: {
          jobTitle: values.jobTitle,
          companyName: values.companyName || null,
          jobDescription: values.jobDescription,
          cvText: values.cvText,
        },
      },
      {
        onSuccess: (analysis) => {
          // Invalidate cached queries so dashboard and history update
          queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentAnalysesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });

          toast({
            title: "Analysis complete",
            description: `Match score: ${analysis.matchScore ?? "N/A"}%`,
          });

          setLocation(`/analyses/${analysis.id}`);
        },
        onError: () => {
          setIsAnalyzing(false);
          toast({
            title: "Analysis failed",
            description: "Something went wrong. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  }

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">New Analysis</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Paste your CV and the job description to get an AI-powered match analysis.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Senior Software Engineer" {...field} data-testid="input-job-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Corp" {...field} data-testid="input-company-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="jobDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Description *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Paste the full job description here..."
                    className="min-h-[200px] font-mono text-sm resize-y"
                    {...field}
                    data-testid="textarea-job-description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cvText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your CV *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Paste your full CV text here (copy-paste from your CV document)..."
                    className="min-h-[300px] font-mono text-sm resize-y"
                    {...field}
                    data-testid="textarea-cv-text"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              disabled={isAnalyzing || createAnalysis.isPending}
              className="w-full md:w-auto"
              data-testid="button-analyze"
            >
              {isAnalyzing || createAnalysis.isPending ? "Analyzing with AI..." : "Analyze my CV"}
            </Button>
            {(isAnalyzing || createAnalysis.isPending) && (
              <p className="text-xs text-muted-foreground mt-2">
                This may take 10–30 seconds. The AI is analyzing your CV against the job description.
              </p>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
