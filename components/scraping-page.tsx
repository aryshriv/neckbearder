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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Loader,
  FileText,
  AlertCircle,
  Zap,
  Sparkles,
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

interface ScrapingPageProps {
  onAnalyze: (data: any) => void;
}

export function ScrapingPage({ onAnalyze }: ScrapingPageProps) {
  // Configuration state
  const [brand, setBrand] = useState("apple vision pro");
  const [searches, setSearches] = useState([
    "apple vision pro",
    "apple vr",
    "spatial computing",
  ]);
  const [newSearch, setNewSearch] = useState("");
  const [type, setType] = useState("posts");
  const [sort, setSort] = useState("new");
  const [time, setTime] = useState("month");
  const [maxItems, setMaxItems] = useState("300");
  const [maxComments, setMaxComments] = useState("25");

  // Scraping state
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [availableFiles, setAvailableFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

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

  const addSearch = () => {
    if (newSearch.trim() && !searches.includes(newSearch)) {
      setSearches([...searches, newSearch]);
      setNewSearch("");
    }
  };

  const removeSearch = (index: number) => {
    setSearches(searches.filter((_, i) => i !== index));
  };

  const generateSearchTerms = async () => {
    if (!brand.trim()) {
      setError("Please enter a brand/product name first");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-search-terms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brand: brand.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate search terms");
      }

      const result = await response.json();
      setSearches(result.terms || []);

      if (!result.usingLLM) {
        console.log(
          "Using fallback search term generation (OpenAI not configured)"
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate search terms"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    setError(null);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brand,
          searches,
          type,
          sort,
          time,
          maxItems: parseInt(maxItems),
          maxComments: parseInt(maxComments),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start scraping");
      }

      const result = await response.json();
      setData(result);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setScraping(false);
    }
  };

  const handleAnalyze = async () => {
    if (!data || !data.posts || data.posts.length === 0) {
      setError("No data to analyze. Please scrape or load a file first.");
      return;
    }

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
          brand: data.config?.brand || data.config?.searches?.[0] || brand,
          sessionId: data.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process clustering");
      }

      const result = await response.json();

      // Transform API response to match InsightsPanel expected format
      onAnalyze({
        ...data,
        clusters: result.clusters,
        usingMockClustering: result.usingMockClustering,
        searches: data.config?.searches || searches,
        brand: data.config?.brand || brand,
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
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

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

      {/* Configuration Form */}
      <Card className="border border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Scrape Reddit
          </CardTitle>
          <CardDescription>
            Configure your search parameters and start scraping
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Brand/Product Name
            </label>
            <div className="flex gap-2">
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., Apple Vision Pro"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateSearchTerms}
                disabled={!brand.trim() || processing}
                className="gap-2"
                title="Auto-generate smart search terms using AI"
              >
                {processing ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {processing ? "Generating..." : "Auto-generate"}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Search Terms
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newSearch}
                onChange={(e) => setNewSearch(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSearch()}
                placeholder="Add search term"
              />
              <Button onClick={addSearch} size="default" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searches.map((search, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-3 py-1 bg-muted rounded-lg text-sm"
                >
                  <span>{search}</span>
                  <button
                    onClick={() => removeSearch(index)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Type
              </label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="posts">Posts</SelectItem>
                  <SelectItem value="comments">Comments</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Sort
              </label>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="top">Top</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Time Range
              </label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Max Items
              </label>
              <Input
                type="number"
                value={maxItems}
                onChange={(e) => setMaxItems(e.target.value)}
                placeholder="300"
              />
            </div>
          </div>

          <Button
            onClick={handleScrape}
            disabled={scraping || !brand || searches.length === 0}
            size="lg"
            className="w-full bg-gradient-to-r from-chart-1 to-chart-2 hover:from-chart-1/90 hover:to-chart-2/90 text-white font-medium gap-2"
          >
            {scraping && <Loader className="w-4 h-4 animate-spin" />}
            {scraping ? "Scraping..." : "Start Scraping"}
          </Button>
        </CardContent>
      </Card>

      {/* Results Display */}
      {data && data.posts && data.posts.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border border-border/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">
                  Total Posts
                </p>
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
                <p className="text-xs text-muted-foreground mt-2">
                  ~82% of posts
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">
                  Avg Engagement
                </p>
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

          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Top Questions</CardTitle>
              <CardDescription>
                Most upvoted questions from your search
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.posts.slice(0, 5).map((post: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-start justify-between pb-3 border-b border-border/30 last:border-0"
                  >
                    <p className="text-sm text-foreground">{post.title}</p>
                    <span className="text-xs font-medium text-muted-foreground ml-4 shrink-0">
                      {post.upvotes?.toLocaleString() || 0} ↑
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleAnalyze}
            disabled={processing}
            size="lg"
            className="w-full bg-gradient-to-r from-chart-1 to-chart-2 hover:from-chart-1/90 hover:to-chart-2/90 text-white font-medium gap-2"
          >
            {processing && <Loader className="w-4 h-4 animate-spin" />}
            {processing ? "Analyzing..." : "Proceed to Insights & Analysis"}
          </Button>
        </>
      )}
    </div>
  );
}
