/**
 * CSV backup utility for saving scraped data when database operations fail
 */

import * as fs from 'fs'
import * as path from 'path'

interface RedditPost {
  id: string
  title: string
  body: string
  url: string
  subreddit: string
  upvotes: number
  createdAt: Date
  dataType: string
  comments: Array<{
    id: string
    body: string
    upvotes: number
  }>
}

interface ScrapingConfig {
  brand: string
  searches: string[]
  type: string
  sort: string
  time: string
  maxItems: number
  maxComments: number
}

/**
 * Escape CSV field - handles quotes and commas
 */
function escapeCSVField(field: any): string {
  if (field === null || field === undefined) {
    return ''
  }
  const str = String(field)
  // Escape quotes by doubling them, then wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Save posts to CSV file as backup
 */
export function savePostsToCSV(
  posts: RedditPost[],
  config: ScrapingConfig,
  sessionId: string
): string | null {
  try {
    // Create exports directory if it doesn't exist
    const exportsDir = path.join(process.cwd(), 'data', 'exports')
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true })
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `backup-${config.brand}-${timestamp}-${sessionId.slice(-8)}.csv`
    const filepath = path.join(exportsDir, filename)

    // CSV Headers
    const headers = [
      'Post ID',
      'Title',
      'Body',
      'URL',
      'Subreddit',
      'Upvotes',
      'Created At',
      'Comment Count',
      'Comments (JSON)',
    ]

    // Convert posts to CSV rows
    const rows = posts.map((post) => {
      const commentsJson = JSON.stringify(
        post.comments.map((c) => ({
          id: c.id,
          body: c.body,
          upvotes: c.upvotes,
        }))
      )

      return [
        post.id,
        post.title,
        post.body,
        post.url,
        post.subreddit,
        post.upvotes,
        post.createdAt.toISOString(),
        post.comments.length,
        commentsJson,
      ]
    })

    // Combine headers and rows
    const csvLines = [
      headers.map(escapeCSVField).join(','),
      ...rows.map((row) => row.map(escapeCSVField).join(',')),
    ]

    // Write to file
    fs.writeFileSync(filepath, csvLines.join('\n'), 'utf-8')

    console.log(`✅ CSV backup saved to: ${filepath}`)
    return filepath
  } catch (error) {
    console.error('❌ Failed to save CSV backup:', error)
    return null
  }
}

/**
 * Save a separate CSV file with just comments (flattened)
 */
export function saveCommentsToCSV(
  posts: RedditPost[],
  config: ScrapingConfig,
  sessionId: string
): string | null {
  try {
    const exportsDir = path.join(process.cwd(), 'data', 'exports')
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `backup-comments-${config.brand}-${timestamp}-${sessionId.slice(-8)}.csv`
    const filepath = path.join(exportsDir, filename)

    const headers = [
      'Comment ID',
      'Post ID',
      'Post Title',
      'Post URL',
      'Comment Body',
      'Comment Upvotes',
    ]

    const rows: any[] = []
    for (const post of posts) {
      for (const comment of post.comments) {
        rows.push([
          comment.id,
          post.id,
          post.title,
          post.url,
          comment.body,
          comment.upvotes,
        ])
      }
    }

    const csvLines = [
      headers.map(escapeCSVField).join(','),
      ...rows.map((row) => row.map(escapeCSVField).join(',')),
    ]

    fs.writeFileSync(filepath, csvLines.join('\n'), 'utf-8')

    console.log(`✅ Comments CSV backup saved to: ${filepath}`)
    return filepath
  } catch (error) {
    console.error('❌ Failed to save comments CSV backup:', error)
    return null
  }
}

/**
 * Save metadata/config to a separate JSON file
 */
export function saveMetadataToJSON(
  config: ScrapingConfig,
  stats: any,
  sessionId: string
): string | null {
  try {
    const exportsDir = path.join(process.cwd(), 'data', 'exports')
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `backup-metadata-${config.brand}-${timestamp}-${sessionId.slice(-8)}.json`
    const filepath = path.join(exportsDir, filename)

    const metadata = {
      sessionId,
      config,
      stats,
      exportedAt: new Date().toISOString(),
      note: 'This file was created as a backup due to database operation failure',
    }

    fs.writeFileSync(filepath, JSON.stringify(metadata, null, 2), 'utf-8')

    console.log(`✅ Metadata backup saved to: ${filepath}`)
    return filepath
  } catch (error) {
    console.error('❌ Failed to save metadata backup:', error)
    return null
  }
}

