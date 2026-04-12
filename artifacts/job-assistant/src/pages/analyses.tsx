import { useState } from "react";
import { useLocation } from "wouter";
import { useListAnalyses, getListAnalysesQueryKey, useDeleteAnalysis } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

function MatchBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <Badge variant="secondary" className="text-xs">Pending</Badge>;
  if (score >= 70) return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">{score}%</Badge>;
  if (score >= 40) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">{score}%</Badge>;
  return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">{score}%</Badge>;
}

const PAGE_SIZE = 10;

export default function Analyses() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useListAnalyses(
    { page, limit: PAGE_SIZE },
    { query: { queryKey: getListAnalysesQueryKey({ page, limit: PAGE_SIZE }) } }
  );

  const deleteAnalysis = useDeleteAnalysis();

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    deleteAnalysis.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
          toast({ title: "Analysis deleted" });
        },
        onError: () => {
          toast({ title: "Failed to delete", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analysis History</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.total ?? 0} total {data?.total === 1 ? "analysis" : "analyses"}
          </p>
        </div>
        <Button onClick={() => setLocation("/analyze")} data-testid="button-new-analysis">
          New Analysis
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      ) : data?.analyses.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted/20">
          <p className="font-medium">No analyses yet</p>
          <p className="text-muted-foreground text-sm mt-1">
            Run your first analysis to get started.
          </p>
          <Button className="mt-4" onClick={() => setLocation("/analyze")} data-testid="button-first-analysis">
            Analyze a job
          </Button>
        </div>
      ) : (
        <>
          {/* Table header */}
          <div className="hidden md:grid md:grid-cols-[1fr_180px_100px_80px_80px] gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b mb-1">
            <span>Role</span>
            <span>Company</span>
            <span>Date</span>
            <span>Score</span>
            <span></span>
          </div>

          <div className="divide-y border rounded-lg overflow-hidden">
            {data?.analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="grid md:grid-cols-[1fr_180px_100px_80px_80px] gap-4 items-center px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => setLocation(`/analyses/${analysis.id}`)}
                data-testid={`row-analysis-${analysis.id}`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{analysis.jobTitle}</p>
                  {analysis.companyName && (
                    <p className="text-xs text-muted-foreground md:hidden truncate">{analysis.companyName}</p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate hidden md:block">
                  {analysis.companyName ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                </p>
                <MatchBadge score={analysis.matchScore} />
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(e, analysis.id)}
                    disabled={deleteAnalysis.isPending}
                    data-testid={`button-delete-${analysis.id}`}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
