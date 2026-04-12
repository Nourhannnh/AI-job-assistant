import { useLocation } from "wouter";
import { useGetDashboardStats, getGetDashboardStatsQueryKey, useGetRecentAnalyses, getGetRecentAnalysesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

function matchScoreBadge(score: number | null | undefined) {
  if (score == null) return <Badge variant="secondary">Pending</Badge>;
  if (score >= 70) return <Badge className="bg-green-100 text-green-800 border-green-200">{score}% Match</Badge>;
  if (score >= 40) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{score}% Match</Badge>;
  return <Badge className="bg-red-100 text-red-800 border-red-200">{score}% Match</Badge>;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() }
  });

  const { data: recentData, isLoading: recentLoading } = useGetRecentAnalyses({
    query: { queryKey: getGetRecentAnalysesQueryKey() }
  });

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your job application analyses</p>
        </div>
        <Button onClick={() => setLocation("/analyze")} data-testid="button-new-analysis">
          New Analysis
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-16" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card data-testid="stat-total-analyses">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Total Analyses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalAnalyses ?? 0}</div>
              </CardContent>
            </Card>
            <Card data-testid="stat-avg-score">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Avg Match Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats?.averageMatchScore != null ? `${Math.round(stats.averageMatchScore)}%` : "—"}
                </div>
              </CardContent>
            </Card>
            <Card data-testid="stat-high-match">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">High Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats?.highMatchCount ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Score &ge; 70%</p>
              </CardContent>
            </Card>
            <Card data-testid="stat-recent-activity">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Last 7 Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.recentActivity ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">New analyses</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Analyses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Analyses</h2>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/analyses")} data-testid="button-view-all">
            View all
          </Button>
        </div>

        {recentLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24 ml-auto" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : recentData?.analyses.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground text-sm">No analyses yet.</p>
            <Button className="mt-4" onClick={() => setLocation("/analyze")} data-testid="button-first-analysis">
              Run your first analysis
            </Button>
          </div>
        ) : (
          <div className="divide-y border rounded-lg overflow-hidden">
            {recentData?.analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => setLocation(`/analyses/${analysis.id}`)}
                data-testid={`row-analysis-${analysis.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{analysis.jobTitle}</p>
                  {analysis.companyName && (
                    <p className="text-xs text-muted-foreground truncate">{analysis.companyName}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                </span>
                {matchScoreBadge(analysis.matchScore)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
