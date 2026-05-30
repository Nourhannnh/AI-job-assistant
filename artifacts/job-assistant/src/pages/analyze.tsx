import { useState, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast";

const analyzeSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  companyName: z.string().optional(),
  jobDescription: z.string().min(50, "Please provide a detailed job description (at least 50 characters)"),
  cvText: z.string().min(100, "Please provide your full CV (at least 100 characters)"),
});

type AnalyzeForm = z.infer<typeof analyzeSchema>;

type CvInputMode = "paste" | "upload";

export default function Analyze() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cvMode, setCvMode] = useState<CvInputMode>("paste");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function parsePdf(file: File) {
    setIsParsing(true);
    setUploadedFile(file);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/cv/parse", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to parse PDF");
      }

      form.setValue("cvText", data.text, { shouldValidate: true });
      toast({ title: "CV uploaded", description: "Text extracted from your PDF successfully." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to parse PDF";
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
      setUploadedFile(null);
    } finally {
      setIsParsing(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parsePdf(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type === "application/pdf") {
      parsePdf(file);
    } else {
      toast({ title: "Invalid file", description: "Please drop a PDF file.", variant: "destructive" });
    }
  }

  function switchMode(mode: CvInputMode) {
    setCvMode(mode);
    form.setValue("cvText", "");
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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
          Paste or upload your CV and the job description to get an AI-powered match analysis.
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your CV *</span>
              <div className="flex rounded-md border text-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => switchMode("paste")}
                  className={`px-3 py-1 transition-colors ${cvMode === "paste" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
                >
                  Paste text
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("upload")}
                  className={`px-3 py-1 border-l transition-colors ${cvMode === "upload" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
                >
                  Upload PDF
                </button>
              </div>
            </div>

            {cvMode === "paste" ? (
              <FormField
                control={form.control}
                name="cvText"
                render={({ field }) => (
                  <FormItem>
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
            ) : (
              <FormField
                control={form.control}
                name="cvText"
                render={() => (
                  <FormItem>
                    <FormControl>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => !uploadedFile && fileInputRef.current?.click()}
                        className={`min-h-[200px] rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer
                          ${isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}
                          ${uploadedFile ? "cursor-default" : ""}`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        {isParsing ? (
                          <>
                            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            <p className="text-sm text-muted-foreground">Extracting text from PDF...</p>
                          </>
                        ) : uploadedFile ? (
                          <>
                            <div className="size-10 rounded-full bg-green-100 flex items-center justify-center">
                              <svg className="size-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium">{uploadedFile.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Text extracted successfully</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); switchMode("upload"); }}
                              className="text-xs text-muted-foreground underline hover:text-foreground"
                            >
                              Upload a different file
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                              <svg className="size-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium">Drop your CV here or click to browse</p>
                              <p className="text-xs text-muted-foreground mt-0.5">PDF files only, up to 10MB</p>
                            </div>
                          </>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              disabled={isAnalyzing || createAnalysis.isPending || isParsing}
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
