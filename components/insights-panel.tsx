"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  TrendingUp,
  MessageCircle,
  Zap,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

interface InsightsPanelProps {
  data: any;
  onBack: () => void;
}

export function InsightsPanel({ data, onBack }: InsightsPanelProps) {
  const [selectedCluster, setSelectedCluster] = useState(0);
  const [exportFormat, setExportFormat] = useState("summary");
  const [isExporting, setIsExporting] = useState(false);

  // Safely access data properties with fallbacks
  const searches = Array.isArray(data?.searches) ? data.searches : [];
  const clusters = Array.isArray(data?.clusters) ? data.clusters : [];
  const brand = data?.brand || "the product";

  // Ensure selectedCluster is within bounds
  const safeSelectedCluster = Math.min(selectedCluster, clusters.length - 1);
  const cluster = clusters[safeSelectedCluster] || null;

  const sentimentData = clusters.map((c: any) => ({
    name: c.name || "Unknown",
    positive: c.sentiment?.positive || 0,
    neutral: c.sentiment?.neutral || 0,
    negative: c.sentiment?.negative || 0,
  }));

  const handleExport = async () => {
    if (!data.sessionId) {
      alert("No session ID available for export");
      return;
    }

    setIsExporting(true);

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: data.sessionId,
          format: exportFormat,
          includeRawData: exportFormat === "json",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate export");
      }

      // Get the filename from response headers
      const disposition = response.headers.get("content-disposition");
      const filename = disposition
        ? disposition.split("filename=")[1]?.replace(/"/g, "")
        : `reddit-analysis-${exportFormat}.${
            exportFormat === "markdown" ? "md" : exportFormat
          }`;

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Question Clusters & Insights
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Semantic analysis of{" "}
              {searches.length > 0 ? searches.join(", ") : "search results"}
            </p>
          </div>
        </div>
      </div>

      {/* Cluster Selector */}
      {clusters.length === 0 ? (
        <Card className="border border-border/50">
          <CardContent className="py-8 text-center text-muted-foreground">
            No clusters available. Please run clustering analysis first.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {clusters.map((c: any, i: number) => (
              <button
                key={i}
                onClick={() => setSelectedCluster(i)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors text-sm ${
                  selectedCluster === i
                    ? "bg-chart-1 text-white"
                    : "bg-muted/50 text-foreground hover:bg-muted"
                }`}
              >
                {c.name}
                <span className="ml-2 text-xs opacity-75">({c.count})</span>
              </button>
            ))}
          </div>

          {/* Selected Cluster Details */}
          {cluster ? (
            <Card className="border border-border/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{cluster.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {cluster.count} questions in this cluster
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {Object.entries(cluster.sentiment).map(
                      ([key, value]: [string, any]) => {
                        const colors = {
                          positive:
                            "bg-green-500/20 text-green-700 dark:text-green-400",
                          neutral:
                            "bg-gray-500/20 text-gray-700 dark:text-gray-400",
                          negative:
                            "bg-red-500/20 text-red-700 dark:text-red-400",
                        };
                        return (
                          <div
                            key={key}
                            className={`px-3 py-1.5 rounded text-sm font-medium ${
                              colors[key as keyof typeof colors]
                            }`}
                          >
                            {value} {key}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    Key Questions
                  </h4>
                  <ul className="space-y-2">
                    {cluster.questions.map((q: string, i: number) => (
                      <li
                        key={i}
                        className="flex gap-3 text-sm text-muted-foreground"
                      >
                        <span className="text-chart-1 font-bold flex-shrink-0">
                          {i + 1}.
                        </span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Sentiment Distribution */}
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">
                Sentiment Across All Clusters
              </CardTitle>
              <CardDescription>
                Distribution of sentiment by cluster
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={sentimentData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 40 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--color-border))"
                  />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--color-muted-foreground))"
                  />
                  <YAxis stroke="hsl(var(--color-muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--color-card))",
                      border: `1px solid hsl(var(--color-border))`,
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="positive"
                    fill="hsl(var(--color-chart-4))"
                    name="Positive"
                  />
                  <Bar
                    dataKey="neutral"
                    fill="hsl(var(--color-muted))"
                    name="Neutral"
                  />
                  <Bar
                    dataKey="negative"
                    fill="hsl(var(--color-destructive))"
                    name="Negative"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* LLM Prompts & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-chart-1" />
                  LLM Analysis Prompt
                </CardTitle>
                <CardDescription>
                  Copy and paste into ChatGPT or Claude
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg border border-border/50 font-mono text-xs text-muted-foreground overflow-auto max-h-64">
                  <p className="mb-3">
                    Summarize this cluster of Reddit questions about {brand}:
                  </p>
                  {cluster ? (
                    <>
                      <p className="mb-2 font-semibold">
                        Cluster: {cluster.name}
                      </p>
                      {cluster.questions?.map((q: string, i: number) => (
                        <p key={i}>
                          {i + 1}. {q}
                        </p>
                      )) || (
                        <p className="text-muted-foreground">
                          No questions available
                        </p>
                      )}
                      <p className="mt-3">
                        Return JSON with: cluster_name, summary_bullets (3-5),
                        brand_recommendations (2-3)
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No cluster selected</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-chart-1" />
                  Suggested Actions
                </CardTitle>
                <CardDescription>For the brand team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Create FAQ addressing top 3 questions",
                  "Develop comparison guide vs competitors",
                  "Write technical specs blog post",
                  "Record unboxing & comfort review",
                  "Launch community Discord channel",
                ].map((action, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-chart-1/20 text-chart-1 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                      {i + 1}
                    </div>
                    <span className="text-muted-foreground">{action}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Cluster Stats Overview */}
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">All Clusters Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clusters.map((c: any, i: number) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      selectedCluster === i
                        ? "border-chart-1 bg-chart-1/5"
                        : "border-border/50 bg-muted/20 hover:bg-muted/30"
                    }`}
                    onClick={() => setSelectedCluster(i)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-foreground">
                        {c.name}
                      </h4>
                      <span className="text-xs font-medium bg-muted px-2 py-1 rounded">
                        {c.count} Qs
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[
                        {
                          label: "Pos",
                          value: c.sentiment.positive,
                          color: "bg-green-500/30",
                        },
                        {
                          label: "Neu",
                          value: c.sentiment.neutral,
                          color: "bg-gray-500/30",
                        },
                        {
                          label: "Neg",
                          value: c.sentiment.negative,
                          color: "bg-red-500/30",
                        },
                      ].map((s, j) => (
                        <div
                          key={j}
                          className={`px-2 py-1 rounded text-xs font-medium text-foreground ${s.color}`}
                        >
                          {s.label}: {s.value}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back to Results
        </Button>
        <div className="flex-1 flex gap-2">
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Summary</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="markdown">Markdown</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="lg"
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 bg-gradient-to-r from-chart-1 to-chart-2 hover:from-chart-1/90 hover:to-chart-2/90 text-white font-medium gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Exporting..." : "Export Report"}
          </Button>
        </div>
      </div>
    </div>
  );
}
