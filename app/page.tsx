"use client";

import { useState } from "react";
import { ScrapingPage } from "@/components/scraping-page";
import { InsightsPanel } from "@/components/insights-panel";

type Step = "scrape" | "insights";

export default function Page() {
  const [currentStep, setCurrentStep] = useState<Step>("scrape");
  const [insightsData, setInsightsData] = useState(null);

  const handleAnalyze = (data: any) => {
    setInsightsData(data);
    setCurrentStep("insights");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-chart-1 to-chart-2 flex items-center justify-center">
              <span className="text-white font-bold text-sm">RI</span>
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Reddit Insights</h1>
              <p className="text-xs text-muted-foreground">
                Brand sentiment & question analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentStep("scrape")}
                className={`px-3 py-1 rounded-full transition-colors ${
                  currentStep === "scrape"
                    ? "bg-chart-1 text-white"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                Scraping
              </button>
              <button
                onClick={() => setCurrentStep("insights")}
                className={`px-3 py-1 rounded-full transition-colors ${
                  currentStep === "insights"
                    ? "bg-chart-1 text-white"
                    : insightsData || currentStep === "insights"
                    ? "bg-muted/50 hover:bg-muted cursor-pointer"
                    : "bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
                }`}
                disabled={!insightsData && currentStep !== "insights"}
              >
                Insights
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentStep === "scrape" && <ScrapingPage onAnalyze={handleAnalyze} />}
        {currentStep === "insights" && (
          <InsightsPanel
            data={insightsData || { clusters: [], searches: [], brand: "" }}
            onBack={() => setCurrentStep("scrape")}
          />
        )}
      </main>
    </div>
  );
}
