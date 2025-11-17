/**
 * Utilities for processing Reddit scraping data
 */

export interface RedditPost {
  id: string
  title: string
  body: string
  url: string
  subreddit: string
  upvotes: number
  createdAt: Date
  dataType: 'post' | 'comment'
  comments: RedditComment[]
}

export interface RedditComment {
  id: string
  body: string
  upvotes: number
}

export interface ScrapingConfig {
  brand: string
  searches: string[]
  type: 'posts' | 'comments' | 'all'
  sort: 'new' | 'top' | 'hot'
  time: 'day' | 'week' | 'month' | 'year'
  maxItems: number
  maxComments: number
}

/**
 * Filters posts to find those that look like questions
 */
export function filterQuestions(posts: RedditPost[]): RedditPost[] {
  const questionPatterns = [
    /\?/, // Contains question mark
    /^(what|why|how|should|is|are|can|could|would|does|do|anyone|where|when|which)\s/i,
    /\b(anyone|help|advice|thoughts|opinion)\b/i,
  ]

  return posts.filter((post) => {
    const text = `${post.title} ${post.body}`.toLowerCase()
    return questionPatterns.some((pattern) => pattern.test(text))
  })
}

/**
 * Cleans text by removing URLs, markdown, and extra whitespace
 */
export function cleanText(text: string): string {
  return text
    .replace(/http\S+/g, '') // Remove URLs
    .replace(/u\/[A-Za-z0-9_-]+/g, '') // Remove user mentions
    .replace(/r\/[A-Za-z0-9_-]+/g, '') // Remove subreddit mentions
    .replace(/\*+/g, ' ') // Remove markdown
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calculates sentiment score for text (-1 to 1) using basic keyword matching
 */
export function calculateSentiment(text: string): number {
  const positive = /\b(great|amazing|awesome|love|excellent|perfect|best|fantastic|wonderful|good|nice|helpful|useful|recommend|works|satisfied|happy|pleased)\b/i
  const negative = /\b(hate|terrible|awful|worst|horrible|bad|poor|useless|waste|disappointing|broken|fail|issues|problems|sucks|annoying|frustrated|regret)\b/i
  const neutral = /\b(okay|fine|decent|average|meh|alright)\b/i

  const positiveMatches = text.match(positive) || []
  const negativeMatches = text.match(negative) || []
  const neutralMatches = text.match(neutral) || []

  const totalMatches = positiveMatches.length + negativeMatches.length + neutralMatches.length

  if (totalMatches === 0) return 0

  const positiveScore = positiveMatches.length / totalMatches
  const negativeScore = negativeMatches.length / totalMatches

  return positiveScore - negativeScore
}

/**
 * Enhanced sentiment analysis using OpenAI (if available) with fallback to basic analysis
 */
export async function calculateEnhancedSentiment(
  texts: string[],
  openaiApiKey?: string
): Promise<number[]> {
  // If no OpenAI key, use basic sentiment analysis
  if (!openaiApiKey) {
    return texts.map(text => calculateSentiment(text))
  }

  try {
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey: openaiApiKey })

    // Process in batches to avoid rate limits
    const batchSize = 5
    const results: number[] = []

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a sentiment analysis expert. Analyze the sentiment of each text and return a score between -1 (very negative) and 1 (very positive), with 0 being neutral. Return only the numerical scores, one per line, without any other text.'
            },
            {
              role: 'user',
              content: `Analyze the sentiment of these texts:\n\n${batch.map((text, idx) => `${idx + 1}. ${text}`).join('\n')}`
            }
          ],
          max_tokens: 100,
          temperature: 0.1,
        })

        const response = completion.choices[0]?.message?.content?.trim() || ''
        const scores = response.split('\n').map(line => {
          const score = parseFloat(line.trim())
          return isNaN(score) ? 0 : Math.max(-1, Math.min(1, score))
        })

        results.push(...scores)

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error('Error in OpenAI sentiment analysis for batch:', error)
        // Fallback to basic analysis for this batch
        const fallbackScores = batch.map(text => calculateSentiment(text))
        results.push(...fallbackScores)
      }
    }

    return results

  } catch (error) {
    console.error('Error setting up OpenAI for sentiment analysis:', error)
    // Fallback to basic sentiment analysis
    return texts.map(text => calculateSentiment(text))
  }
}

/**
 * Advanced sentiment categorization with confidence scores
 */
export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative'
  score: number
  confidence: number
}

export async function analyzeSentimentAdvanced(
  texts: string[],
  openaiApiKey?: string
): Promise<SentimentResult[]> {
  const scores = await calculateEnhancedSentiment(texts, openaiApiKey)

  return scores.map(score => {
    const absScore = Math.abs(score)
    const confidence = Math.min(absScore * 2, 1) // Confidence based on distance from neutral

    let sentiment: 'positive' | 'neutral' | 'negative'
    if (score > 0.2) sentiment = 'positive'
    else if (score < -0.2) sentiment = 'negative'
    else sentiment = 'neutral'

    return {
      sentiment,
      score,
      confidence
    }
  })
}

/**
 * Groups posts by sentiment category
 */
export function categorizeBySentiment(
  posts: RedditPost[]
): {
  positive: RedditPost[]
  neutral: RedditPost[]
  negative: RedditPost[]
} {
  const positive: RedditPost[] = []
  const neutral: RedditPost[] = []
  const negative: RedditPost[] = []

  posts.forEach((post) => {
    const sentiment = calculateSentiment(post.title + ' ' + post.body)

    if (sentiment > 0.1) positive.push(post)
    else if (sentiment < -0.1) negative.push(post)
    else neutral.push(post)
  })

  return { positive, neutral, negative }
}

/**
 * Extracts top engaging posts
 */
export function getTopPosts(posts: RedditPost[], limit: number = 10): RedditPost[] {
  return [...posts]
    .sort((a, b) => {
      const aEngagement = a.upvotes + a.comments.length
      const bEngagement = b.upvotes + b.comments.length
      return bEngagement - aEngagement
    })
    .slice(0, limit)
}

/**
 * Generates a summary prompt for LLM analysis
 */
export function generateLLMPrompt(
  brand: string,
  clusterName: string,
  questions: string[]
): string {
  const lines = [
    `You are analyzing Reddit questions about "${brand}".`,
    ``,
    `Here is a semantic cluster of real user questions:`,
    `Cluster: "${clusterName}"`,
    ``,
    `Sample questions:`,
    ...questions.map((q, i) => `${i + 1}. ${q}`),
    ``,
    `Please provide:`,
    `1. A brief summary of what users are asking`,
    `2. 3-5 key themes or concerns`,
    `3. 2-3 recommendations for the brand team`,
    ``,
    `Format as JSON:`,
    `{`,
    `  "summary": "...",`,
    `  "themes": ["...", "..."],`,
    `  "recommendations": ["...", "..."]`,
    `}`,
  ]

  return lines.join('\n')
}
