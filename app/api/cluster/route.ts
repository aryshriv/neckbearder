import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getDatabase } from '@/lib/database'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface TextWithEmbedding {
  text: string
  embedding: number[]
  post: any
}

interface Cluster {
  id: number
  name: string
  count: number
  questions: string[]
  sentiment: {
    positive: number
    neutral: number
    negative: number
  }
  topQuestions: string[]
}

export async function POST(request: NextRequest) {
  let data: any = null
  let posts: any[] = []
  let brand = ''
  let sessionId = ''

  try {
    data = await request.json()
    posts = data.posts || []
    brand = data.brand || ''
    sessionId = data.sessionId || ''

    if (!posts || posts.length === 0) {
      return NextResponse.json(
        { error: 'No posts provided for clustering' },
        { status: 400 }
      )
    }

    // Filter for questions
    const questions = filterQuestions(posts)

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found in posts' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('No OpenAI API key found, falling back to mock clustering')
      const clusters = generateMockClusters(questions, brand)

      // Store clusters in database if sessionId is provided
      if (sessionId) {
        try {
          const db = getDatabase()
          db.storeClusters(sessionId, clusters)
          console.log(`Stored ${clusters.length} mock clusters for session ${sessionId}`)
        } catch (dbError) {
          console.error('Failed to store mock clusters in database:', dbError)
          // Continue without database storage
        }
      }

      return NextResponse.json({
        success: true,
        questionsFound: questions.length,
        clusters,
        stats: {
          totalClusters: clusters.length,
          averageClusterSize: Math.round(questions.length / clusters.length),
        },
        usingMockClustering: true,
      })
    }

    // Generate embeddings and perform real clustering
    const clusters = await performSemanticClustering(questions, brand)

    // Store clusters in database if sessionId is provided
    if (sessionId) {
      try {
        const db = getDatabase()
        db.storeClusters(sessionId, clusters)
        console.log(`Stored ${clusters.length} clusters for session ${sessionId}`)
      } catch (dbError) {
        console.error('Failed to store clusters in database:', dbError)
        // Continue without database storage
      }
    }

    return NextResponse.json({
      success: true,
      questionsFound: questions.length,
      clusters,
      stats: {
        totalClusters: clusters.length,
        averageClusterSize: Math.round(questions.length / clusters.length),
      },
      usingMockClustering: false,
    })

  } catch (error) {
    console.error('Clustering error:', error)

    // Fallback to mock clustering on error - use already parsed data
    const questions = posts.length > 0 ? filterQuestions(posts) : []
    const clusters = generateMockClusters(questions, brand || 'brand')

    // Store clusters in database if sessionId is provided
    if (sessionId) {
      try {
        const db = getDatabase()
        db.storeClusters(sessionId, clusters)
        console.log(`Stored ${clusters.length} fallback clusters for session ${sessionId}`)
      } catch (dbError) {
        console.error('Failed to store fallback clusters in database:', dbError)
        // Continue without database storage
      }
    }

    return NextResponse.json({
      success: true,
      questionsFound: questions.length,
      clusters,
      stats: {
        totalClusters: clusters.length,
        averageClusterSize: questions.length > 0 ? Math.round(questions.length / clusters.length) : 0,
      },
      usingMockClustering: true,
      error: 'OpenAI clustering failed, using mock data',
    })
  }
}

async function performSemanticClustering(questions: any[], brand: string): Promise<Cluster[]> {
  try {
    console.log(`Generating embeddings for ${questions.length} questions...`)

    // Generate embeddings for all questions
    const textsWithEmbeddings: TextWithEmbedding[] = []

    // Process in batches to avoid rate limits
    const batchSize = 10
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize)
      const batchTexts = batch.map(q => q.title || q.body || '').filter(text => text.length > 0)

      if (batchTexts.length === 0) continue

      const embeddings = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batchTexts,
      })

      for (let j = 0; j < batchTexts.length; j++) {
        textsWithEmbeddings.push({
          text: batchTexts[j],
          embedding: embeddings.data[j].embedding,
          post: batch[j],
        })
      }
    }

    console.log(`Generated ${textsWithEmbeddings.length} embeddings, performing clustering...`)

    // Perform k-means clustering
    const numClusters = Math.min(5, Math.ceil(textsWithEmbeddings.length / 5))
    const clusters = await performKMeansClustering(textsWithEmbeddings, numClusters)

    // Generate cluster names and analysis
    const namedClusters = await generateClusterNames(clusters, brand)

    return namedClusters

  } catch (error) {
    console.error('Error in semantic clustering:', error)
    throw error
  }
}

async function performKMeansClustering(data: TextWithEmbedding[], k: number): Promise<TextWithEmbedding[][]> {
  // Simple k-means implementation
  const dimensions = data[0].embedding.length

  // Initialize centroids randomly
  let centroids = Array.from({ length: k }, () =>
    Array.from({ length: dimensions }, () => Math.random() - 0.5)
  )

  let assignments = new Array(data.length).fill(0)
  let changed = true
  let iterations = 0
  const maxIterations = 20

  while (changed && iterations < maxIterations) {
    changed = false
    iterations++

    // Assign each point to the nearest centroid
    for (let i = 0; i < data.length; i++) {
      let minDistance = Infinity
      let bestCluster = 0

      for (let j = 0; j < k; j++) {
        const distance = cosineSimilarity(data[i].embedding, centroids[j])
        if (distance < minDistance) {
          minDistance = distance
          bestCluster = j
        }
      }

      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster
        changed = true
      }
    }

    // Update centroids
    for (let j = 0; j < k; j++) {
      const clusterPoints = data.filter((_, i) => assignments[i] === j)
      if (clusterPoints.length > 0) {
        for (let d = 0; d < dimensions; d++) {
          centroids[j][d] = clusterPoints.reduce((sum, point) => sum + point.embedding[d], 0) / clusterPoints.length
        }
      }
    }
  }

  // Group data by cluster
  const clusters: TextWithEmbedding[][] = Array.from({ length: k }, () => [])
  for (let i = 0; i < data.length; i++) {
    clusters[assignments[i]].push(data[i])
  }

  return clusters.filter(cluster => cluster.length > 0)
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return 1 - dotProduct / (magnitudeA * magnitudeB)
}

async function generateClusterNames(clusters: TextWithEmbedding[][], brand: string): Promise<Cluster[]> {
  const namedClusters: Cluster[] = []

  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i]
    if (cluster.length === 0) continue

    const sampleTexts = cluster.slice(0, 5).map(item => item.text).join('\n')

    try {
      // Use OpenAI to generate cluster name and theme
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are analyzing customer questions about ${brand}. Generate a concise, 2-4 word theme name for a cluster of similar questions. Focus on the main topic or concern.`
          },
          {
            role: 'user',
            content: `Analyze these questions and provide a short theme name:\n\n${sampleTexts}`
          }
        ],
        max_tokens: 20,
        temperature: 0.3,
      })

      const clusterName = completion.choices[0]?.message?.content?.trim() || `Theme ${i + 1}`

      // Calculate basic sentiment distribution
      const sentiments = await calculateSentimentDistribution(cluster)

      namedClusters.push({
        id: i,
        name: clusterName,
        count: cluster.length,
        questions: cluster.slice(0, 3).map(item => item.text),
        sentiment: sentiments,
        topQuestions: cluster.slice(0, 5).map(item => item.text),
      })

    } catch (error) {
      console.error(`Error generating name for cluster ${i}:`, error)

      namedClusters.push({
        id: i,
        name: `Theme ${i + 1}`,
        count: cluster.length,
        questions: cluster.slice(0, 3).map(item => item.text),
        sentiment: {
          positive: Math.floor(cluster.length * 0.4),
          neutral: Math.floor(cluster.length * 0.4),
          negative: Math.floor(cluster.length * 0.2),
        },
        topQuestions: cluster.slice(0, 5).map(item => item.text),
      })
    }
  }

  return namedClusters
}

async function calculateSentimentDistribution(cluster: TextWithEmbedding[]): Promise<{positive: number, neutral: number, negative: number}> {
  // Simple keyword-based sentiment for now
  const sentiments = cluster.map(item => {
    const text = item.text.toLowerCase()
    const positiveWords = ['good', 'great', 'love', 'amazing', 'excellent', 'perfect']
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'horrible', 'worst', 'problem', 'issue']

    const positiveCount = positiveWords.filter(word => text.includes(word)).length
    const negativeCount = negativeWords.filter(word => text.includes(word)).length

    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  })

  return {
    positive: sentiments.filter(s => s === 'positive').length,
    neutral: sentiments.filter(s => s === 'neutral').length,
    negative: sentiments.filter(s => s === 'negative').length,
  }
}

function filterQuestions(posts: any[]): any[] {
  const questionWords = [
    'what',
    'why',
    'how',
    'should',
    'is',
    'are',
    'can',
    'could',
    'would',
    'does',
    'do',
    'anyone',
  ]

  return posts.filter((post) => {
    const text = (post.title || '').toLowerCase()
    return text.includes('?') || questionWords.some((w) => text.startsWith(w))
  })
}

function generateMockClusters(questions: any[], brand: string) {
  const themeTemplates = [
    {
      name: 'Price & Value',
      keywords: ['price', 'worth', 'cost', 'expensive', 'cheaper'],
      sampleQuestions: [
        `Is ${brand} worth the price?`,
        `How does ${brand} compare in value?`,
        `Will ${brand} price drop?`,
      ],
    },
    {
      name: 'Features & Specifications',
      keywords: ['feature', 'spec', 'battery', 'performance', 'capability'],
      sampleQuestions: [
        `What are ${brand} key features?`,
        `How long is ${brand} battery life?`,
        `What specs does ${brand} have?`,
      ],
    },
    {
      name: 'User Experience & Comfort',
      keywords: ['comfortable', 'usable', 'easy', 'experience', 'design'],
      sampleQuestions: [
        `Is ${brand} comfortable to use?`,
        `How is the ${brand} user experience?`,
        `Is ${brand} easy to set up?`,
      ],
    },
    {
      name: 'Compatibility & Integration',
      keywords: ['compatible', 'works', 'integrate', 'support', 'connect'],
      sampleQuestions: [
        `Is ${brand} compatible with my device?`,
        `What does ${brand} work with?`,
        `Can ${brand} integrate with X?`,
      ],
    },
    {
      name: 'Comparison & Alternatives',
      keywords: ['vs', 'compare', 'better', 'alternative', 'instead'],
      sampleQuestions: [
        `${brand} vs competitor - which is better?`,
        `Alternatives to ${brand}?`,
        `How does ${brand} compare?`,
      ],
    },
  ]

  // Distribute questions across themes
  const clusters = themeTemplates.slice(0, 4).map((theme, index) => {
    const clusterQuestions = questions.slice(
      Math.floor((index * questions.length) / 4),
      Math.floor(((index + 1) * questions.length) / 4)
    )

    return {
      id: index,
      name: theme.name,
      count: clusterQuestions.length,
      questions: theme.sampleQuestions,
      sentiment: {
        positive: Math.floor(clusterQuestions.length * 0.5),
        neutral: Math.floor(clusterQuestions.length * 0.3),
        negative: Math.floor(clusterQuestions.length * 0.2),
      },
      topQuestions: clusterQuestions.slice(0, 3).map((q) => q.title),
    }
  })

  return clusters
}
