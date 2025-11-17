import { NextRequest, NextResponse } from 'next/server'
import { ApifyClient } from 'apify'
import { ScrapingConfig } from '@/lib/reddit-processor'
import { savePostsToCSV, saveCommentsToCSV, saveMetadataToJSON } from '@/lib/csv-backup'

// Initialize Apify client (will be re-initialized in the route if token is available)
let apifyClient: ApifyClient | null = null

function getApifyClient(): ApifyClient {
  if (!process.env.APIFY_TOKEN) {
    throw new Error('APIFY_TOKEN is not configured')
  }
  if (!apifyClient) {
    apifyClient = new ApifyClient({
      token: process.env.APIFY_TOKEN,
    })
  }
  return apifyClient
}

export async function POST(request: NextRequest) {
  // Parse request body once at the start
  let data: any
  try {
    data = await request.json()
  } catch (parseError) {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    )
  }

  const {
    brand,
    searches,
    type = 'posts',
    sort = 'hot',
    time = 'month',
    maxItems = 100,
    maxComments = 10,
  } = data

  try {

    // Validate input
    if (!brand || !searches || searches.length === 0) {
      return NextResponse.json(
        { error: 'Brand and search terms are required' },
        { status: 400 }
      )
    }

    // Check if Apify token is configured
    if (!process.env.APIFY_TOKEN) {
      console.warn('⚠️ No Apify token found in environment variables, falling back to mock data')
      console.warn('Make sure APIFY_TOKEN is set in .env.local or .env')
      const mockPosts = generateMockPosts(brand, searches, maxItems)

      const stats = {
        totalPosts: mockPosts.length,
        totalComments: mockPosts.reduce((sum, p) => sum + p.comments.length, 0),
        avgEngagement: Math.round(
          mockPosts.reduce((sum, p) => sum + p.upvotes + p.comments.length, 0) /
            mockPosts.length
        ),
      }

      // Generate session ID and store in database
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const scrapingConfig: ScrapingConfig = {
        brand,
        searches,
        type,
        sort,
        time,
        maxItems,
        maxComments,
      }

      // Always save to CSV
      const csvPath = savePostsToCSV(mockPosts, scrapingConfig, sessionId)
      saveCommentsToCSV(mockPosts, scrapingConfig, sessionId)
      saveMetadataToJSON(scrapingConfig, stats, sessionId)
      console.log(`✅ Data saved to CSV at: ${csvPath}`)

      return NextResponse.json({
        success: true,
        sessionId,
        config: {},
        posts: mockPosts,
        stats,
        usingMockData: true,
        csvPath: csvPath || undefined,
      })
    }

    // Construct Apify Reddit Scraper config
    const apifyConfig = {
      searches: searches.map((search: string) => search.trim()),
      type,
      sort,
      time,
      maxItems,
      maxPostCount: maxItems,
      maxComments,
      maxCommunitiesCount: 0,
      maxUserCount: 0,
      maxLeaderBoardItems: 0,
      scrollTimeout: 40,
      proxy: {
        useApifyProxy: true,
      },
    }

    console.log('Starting Apify Reddit scraper with config:', apifyConfig)
    console.log(`APIFY_TOKEN present: ${!!process.env.APIFY_TOKEN}`)

    // Get Apify client (will throw if token is missing)
    const client = getApifyClient()

    // Call the Apify Reddit Scraper
    let run
    try {
      run = await client.actor('trudax/reddit-scraper').call(apifyConfig)
      console.log(`✅ Apify run started with ID: ${run.id}, status: ${run.status}`)
    } catch (actorError: any) {
      console.error('❌ Failed to start Apify actor:', actorError)
      throw new Error(`Failed to start Apify scraper: ${actorError.message || actorError}`)
    }

    // Wait for the run to finish by polling its status
    let runStatus = run.status
    let attempts = 0
    const maxAttempts = 120 // 10 minutes max (120 * 5 seconds)
    
    while (runStatus !== 'SUCCEEDED' && runStatus !== 'FAILED' && runStatus !== 'ABORTED' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      const updatedRun = await client.run(run.id).get()
      if (updatedRun) {
        runStatus = updatedRun.status
      }
      attempts++
      console.log(`Run status check ${attempts}/${maxAttempts}: ${runStatus}`)
    }

    if (runStatus !== 'SUCCEEDED') {
      throw new Error(`Apify run ${run.id} finished with status: ${runStatus}`)
    }

    console.log('Apify run completed successfully, fetching results...')

    // Get results from the dataset
    const dataset = client.dataset(run.defaultDatasetId)
    const { items } = await dataset.listItems()
    console.log(`Retrieved ${items.length} items from dataset`)

    // Transform Apify results to our format
    const posts = items
      .filter((item: any) => item.dataType === 'post')
      .map((item: any) => ({
        id: item.id || item.postId,
        title: item.title || 'Untitled',
        body: item.text || item.body || '',
        url: item.url,
        subreddit: item.subreddit,
        upvotes: item.numberOfUpvotes || item.upvotes || 0,
        createdAt: new Date(item.createdAt || Date.now()),
        dataType: (item.dataType || 'post') as 'post' | 'comment',
        comments: (item.comments || []).slice(0, maxComments).map((comment: any) => ({
          id: comment.id,
          body: comment.text || comment.body || '',
          upvotes: comment.numberOfUpvotes || comment.upvotes || 0,
        })),
      }))

    const totalComments = posts.reduce((sum, p) => sum + p.comments.length, 0)
    const avgEngagement = posts.length > 0 ? Math.round(
      posts.reduce((sum, p) => sum + p.upvotes + p.comments.length, 0) / posts.length
    ) : 0

    const stats = {
      totalPosts: posts.length,
      totalComments,
      avgEngagement,
    }

    // Generate session ID and store in database
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const scrapingConfig: ScrapingConfig = {
      brand,
      searches,
      type,
      sort,
      time,
      maxItems,
      maxComments,
    }

    // Always save to CSV
    const csvPath = savePostsToCSV(posts, scrapingConfig, sessionId)
    saveCommentsToCSV(posts, scrapingConfig, sessionId)
    saveMetadataToJSON(scrapingConfig, stats, sessionId)
    console.log(`✅ Data saved to CSV at: ${csvPath}`)

    return NextResponse.json({
      success: true,
      sessionId,
      config: apifyConfig,
      posts,
      stats,
      runId: run.id,
      usingMockData: false,
      csvPath: csvPath || undefined,
    })

  } catch (error: any) {
    console.error('❌ Apify scraping error:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    })

    // Only fall back to mock data if it's a real error, not if APIFY_TOKEN is missing
    if (!process.env.APIFY_TOKEN) {
      console.error('❌ APIFY_TOKEN is not set. Cannot proceed with real scraping.')
      return NextResponse.json(
        { 
          error: 'APIFY_TOKEN is not configured. Please set it in your .env.local file.',
          success: false 
        },
        { status: 500 }
      )
    }

    // Fallback to mock data if Apify fails
    // Use the already-parsed data instead of reading the request body again
    console.log('⚠️ Apify failed, falling back to mock data. Error:', error?.message || error)
    const mockPosts = generateMockPosts(brand, searches, maxItems)

    const stats = {
      totalPosts: mockPosts.length,
      totalComments: mockPosts.reduce((sum, p) => sum + p.comments.length, 0),
      avgEngagement: Math.round(
        mockPosts.reduce((sum, p) => sum + p.upvotes + p.comments.length, 0) /
          mockPosts.length
      ),
    }

    // Generate session ID and store in database
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const scrapingConfig: ScrapingConfig = {
      brand,
      searches,
      type,
      sort,
      time,
      maxItems,
      maxComments,
    }

    // Always save to CSV
    const csvPath = savePostsToCSV(mockPosts, scrapingConfig, sessionId)
    saveCommentsToCSV(mockPosts, scrapingConfig, sessionId)
    saveMetadataToJSON(scrapingConfig, stats, sessionId)
    console.log(`✅ Data saved to CSV at: ${csvPath}`)

    return NextResponse.json({
      success: true,
      sessionId,
      config: {},
      posts: mockPosts,
      stats,
      usingMockData: true,
      error: 'Apify integration failed, using mock data',
      csvPath: csvPath || undefined,
      sessionId,
    })
  }
}

function generateMockPosts(brand: string, searches: string[], count: number) {
  const posts: any[] = []
  const questions = [
    `Is ${brand} worth the price?`,
    `How does ${brand} compare to competitors?`,
    `What are the pros and cons of ${brand}?`,
    `Should I buy ${brand} in 2025?`,
    `Anyone have experience with ${brand}?`,
    `${brand} battery life - how long?`,
    `Is ${brand} compatible with my setup?`,
    `${brand} customer support - any experiences?`,
    `Where to buy ${brand} at best price?`,
    `${brand} vs alternatives - which is better?`,
  ]

  for (let i = 0; i < count; i++) {
    posts.push({
      id: `post_${i}`,
      title: questions[i % questions.length],
      body: `Discussion about ${searches[i % searches.length]}. Many users are interested in learning more about this product.`,
      url: `https://reddit.com/r/example/post_${i}`,
      subreddit: `r/${['AskReddit', 'personalfinance', 'technology'][i % 3]}`,
      upvotes: Math.floor(Math.random() * 2000),
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      dataType: 'post' as const,
      comments: Array.from({ length: Math.floor(Math.random() * 25) }, (_, j) => ({
        id: `comment_${i}_${j}`,
        body: `Comment about ${brand}. This is a sample response.`,
        upvotes: Math.floor(Math.random() * 500),
      })),
    })
  }

  return posts
}
