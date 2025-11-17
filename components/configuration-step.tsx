'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Zap, AlertCircle } from 'lucide-react'

interface ConfigurationStepProps {
  onSubmit: (data: any) => void
}

export function ConfigurationStep({ onSubmit }: ConfigurationStepProps) {
  const [brand, setBrand] = useState('apple vision pro')
  const [searches, setSearches] = useState(['apple vision pro', 'apple vr', 'spatial computing'])
  const [newSearch, setNewSearch] = useState('')
  const [type, setType] = useState('posts')
  const [sort, setSort] = useState('new')
  const [time, setTime] = useState('month')
  const [maxItems, setMaxItems] = useState('300')
  const [maxComments, setMaxComments] = useState('25')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addSearch = () => {
    if (newSearch.trim() && !searches.includes(newSearch)) {
      setSearches([...searches, newSearch])
      setNewSearch('')
    }
  }

  const removeSearch = (index: number) => {
    setSearches(searches.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      })

      if (!response.ok) {
        throw new Error('Failed to start scraping')
      }

      const result = await response.json()
      onSubmit(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Configure Your Search</h2>
        <p className="text-muted-foreground">Set up parameters to scrape Reddit for brand insights</p>
      </div>

      {error && (
        <div className="flex gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid gap-6">
        {/* Brand & Keywords */}
        <Card className="border border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Brand & Keywords</CardTitle>
            <CardDescription>Enter your brand name and search terms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Primary Brand</label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., Nike, Apple Vision Pro"
                className="bg-background border-border/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Search Terms</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newSearch}
                    onChange={(e) => setNewSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSearch()}
                    placeholder="Add a search term..."
                    className="bg-background border-border/50"
                  />
                  <Button
                    onClick={addSearch}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {searches.map((search, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full text-sm"
                    >
                      <span className="text-foreground">{search}</span>
                      <button
                        onClick={() => removeSearch(i)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scraping Options */}
        <Card className="border border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Scraping Options</CardTitle>
            <CardDescription>Configure search parameters</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm text-foreground"
              >
                <option value="posts">Posts Only</option>
                <option value="comments">Comments Only</option>
                <option value="all">Posts & Comments</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Sort By</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm text-foreground"
              >
                <option value="new">Newest</option>
                <option value="top">Top</option>
                <option value="hot">Hot</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Time Window</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm text-foreground"
              >
                <option value="day">Last Day</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-sm font-medium text-foreground block mb-2">Content Type</label>
              <select
                className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm text-foreground"
              >
                <option>All Communities</option>
                <option>r/AskReddit</option>
                <option>r/personalfinance</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Limits */}
        <Card className="border border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Collection Limits</CardTitle>
            <CardDescription>Control data volume and processing</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Max Posts</label>
              <Input
                type="number"
                value={maxItems}
                onChange={(e) => setMaxItems(e.target.value)}
                min="10"
                max="1000"
                className="bg-background border-border/50"
              />
              <p className="text-xs text-muted-foreground mt-1">Recommended: 200-500</p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Max Comments per Post</label>
              <Input
                type="number"
                value={maxComments}
                onChange={(e) => setMaxComments(e.target.value)}
                min="5"
                max="100"
                className="bg-background border-border/50"
              />
              <p className="text-xs text-muted-foreground mt-1">Recommended: 20-50</p>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="border border-border/50 bg-muted/20">
          <CardContent className="pt-6 flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-chart-1/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-chart-1" />
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Pro Tip</p>
              <p>Use 300-500 posts with 20-25 comments for balanced insights. Processing typically takes 2-5 minutes.</p>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSubmit}
          disabled={loading || searches.length === 0}
          size="lg"
          className="w-full bg-gradient-to-r from-chart-1 to-chart-2 hover:from-chart-1/90 hover:to-chart-2/90 text-white font-medium"
        >
          {loading ? 'Scraping Reddit...' : 'Start Scraping'}
        </Button>
      </div>
    </div>
  )
}
