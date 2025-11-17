"use client";

import { useState, useEffect } from "react";
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
  Loader,
  Filter,
  Download,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ResultsDashboardProps {
  data: any;
  onClustering: (data: any) => void;
  onBack: () => void;
}

export function ResultsDashboard({
  data: initialData,
  onClustering,
  onBack,
}: ResultsDashboardProps) {
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState(initialData);
  const [availableFiles, setAvailableFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Mock data for visualization
  const engagementData = [
    { hour: "0", posts: 12 },
    { hour: "6", posts: 19 },
    { hour: "12", posts: 24 },
    { hour: "18", posts: 31 },
    { hour: "24", posts: 28 },
  ];

  const questionStats = [
    { name: "Questions", value: 245 },
    { name: "Statements", value: 155 },
  ];

  const COLORS = ["hsl(var(--color-chart-1))", "hsl(var(--color-muted))"];

  // Load available files on mount
  useEffect(() => {
    loadAvailableFiles();
  }, []);

  const loadAvailableFiles = async () => {
    setLoadingFiles(true);
    try {
      const response = await fetch("/api/files");
      if (response.ok) {
        const result = await response.json();
        setAvailableFiles(result.files || []);
      }
    } catch (err) {
      console.error("Failed to load files:", err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleFileSelect = async (filename: string) => {
    if (!filename || filename === selectedFile) return;

    setProcessing(true);
    setError(null);
    setSelectedFile(filename);

    try {
      const response = await fetch(
        `/api/files/${encodeURIComponent(filename)}`
      );
      if (!response.ok) {
        throw new Error("Failed to load file");
      }

      const fileData = await response.json();
      setData({
        ...fileData,
        posts: fileData.posts || [],
        stats: fileData.stats || {},
        config: fileData.config || {},
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file");
      setProcessing(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleCluster = async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/cluster", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          posts: data.posts,
          brand: data.config?.searches?.[0] || "brand",
          sessionId: data.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process clustering");
      }

      const result = await response.json();

      // Transform API response to match InsightsPanel expected format
      onClustering({
        ...data,
        clusters: result.clusters,
        usingMockClustering: result.usingMockClustering,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

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
              Scraping Results
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {data.posts
                ? `${data.posts.length} posts`
                : data.maxItems
                ? `Analyzed ${data.maxItems} posts`
                : "No data loaded"}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export JSON
        </Button>
      </div>

      {/* File Selector */}
      <Card className="border border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Load Previous Scrape
          </CardTitle>
          <CardDescription>
            Select a CSV file from previous scraping sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Select
              value={selectedFile || ""}
              onValueChange={handleFileSelect}
              disabled={loadingFiles || processing}
            >
              <SelectTrigger className="flex-1">
                <SelectValue
                  placeholder={
                    loadingFiles
                      ? "Loading files..."
                      : "Select a file to analyze"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableFiles.length === 0 ? (
                  <SelectItem value="no-files" disabled>
                    No files available
                  </SelectItem>
                ) : (
                  availableFiles.map((file) => (
                    <SelectItem key={file.filename} value={file.filename}>
                      <div className="flex flex-col">
                        <span className="font-medium">{file.brand}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(file.created).toLocaleString()} •{" "}
                          {file.size > 0
                            ? `${(file.size / 1024).toFixed(1)} KB`
                            : "Empty"}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={loadAvailableFiles}
              disabled={loadingFiles}
              size="default"
            >
              {loadingFiles ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
          {selectedFile && (
            <p className="text-xs text-muted-foreground mt-2">
              Loaded: {selectedFile}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-border/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Total Posts</p>
            <p className="text-3xl font-bold text-foreground">
              {data.posts?.length ||
                data.stats?.totalPosts ||
                data.maxItems ||
                0}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              From Reddit scrape
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">
              Questions Found
            </p>
            <p className="text-3xl font-bold text-foreground">245</p>
            <p className="text-xs text-muted-foreground mt-2">~82% of posts</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Avg Engagement</p>
            <p className="text-3xl font-bold text-foreground">
              {data.stats?.avgEngagement
                ? `${(data.stats.avgEngagement / 1000).toFixed(1)}K`
                : "N/A"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              upvotes + comments
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Sentiment</p>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-1 bg-green-500/20 text-green-700 dark:text-green-400 text-xs rounded">
                +65%
              </span>
              <span className="px-2 py-1 bg-gray-500/20 text-gray-700 dark:text-gray-400 text-xs rounded">
                ~20%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 border border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Post Activity Over Time</CardTitle>
            <CardDescription>Posts per time period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={engagementData}
                margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--color-border))"
                />
                <XAxis
                  dataKey="hour"
                  stroke="hsl(var(--color-muted-foreground))"
                />
                <YAxis stroke="hsl(var(--color-muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--color-card))",
                    border: `1px solid hsl(var(--color-border))`,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="posts"
                  stroke="hsl(var(--color-chart-1))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--color-chart-1))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Question vs Statements</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={questionStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {questionStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Top Questions</CardTitle>
          <CardDescription>
            Most upvoted questions from your search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { q: "Is it worth the $3,500 price?", ups: 1240 },
              { q: "How long does the battery last?", ups: 892 },
              { q: "What apps are available?", ups: 756 },
              { q: "Can it replace my laptop?", ups: 634 },
              { q: "How does it compare to Meta Quest 3?", ups: 521 },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start justify-between pb-3 border-b border-border/30 last:border-0"
              >
                <p className="text-sm text-foreground">{item.q}</p>
                <span className="text-xs font-medium text-muted-foreground ml-4 flex-shrink-0">
                  {item.ups.toLocaleString()} ↑
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleCluster}
        disabled={processing}
        size="lg"
        className="w-full bg-gradient-to-r from-chart-1 to-chart-2 hover:from-chart-1/90 hover:to-chart-2/90 text-white font-medium gap-2"
      >
        {processing && <Loader className="w-4 h-4 animate-spin" />}
        {processing
          ? "Clustering Questions..."
          : "Proceed to Clustering & Analysis"}
      </Button>
    </div>
  );
}
