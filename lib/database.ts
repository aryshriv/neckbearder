/**
 * Database utilities for storing Reddit scraping results and analysis
 */

import Database from 'better-sqlite3'
import { RedditPost, RedditComment, ScrapingConfig } from './reddit-processor'

interface StoredScrapingSession {
  id: string
  brand: string
  config: ScrapingConfig
  createdAt: Date
  posts: RedditPost[]
  clusters?: any[]
  stats?: any
}

interface StoredCluster {
  id: number
  sessionId: string
  name: string
  count: number
  sentiment: {
    positive: number
    neutral: number
    negative: number
  }
  questions: string[]
  topQuestions: string[]
  createdAt: Date
}

class RedditDatabase {
  private db: Database.Database

  constructor(dbPath: string = './data/reddit-analysis.db') {
    // Create data directory if it doesn't exist
    const path = require('path')
    const fs = require('fs')
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    this.db = new Database(dbPath)
    this.initTables()
  }

  private initTables() {
    // Create sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        brand TEXT NOT NULL,
        config TEXT NOT NULL,
        stats TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create posts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        url TEXT,
        subreddit TEXT,
        upvotes INTEGER DEFAULT 0,
        created_at DATETIME NOT NULL,
        data_type TEXT DEFAULT 'post',
        FOREIGN KEY (session_id) REFERENCES sessions (id)
      )
    `)

    // Create comments table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        body TEXT NOT NULL,
        upvotes INTEGER DEFAULT 0,
        FOREIGN KEY (post_id) REFERENCES posts (id)
      )
    `)

    // Create clusters table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS clusters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        name TEXT NOT NULL,
        count INTEGER DEFAULT 0,
        sentiment TEXT,
        questions TEXT,
        top_questions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions (id)
      )
    `)

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_posts_session_id ON posts (session_id);
      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id);
      CREATE INDEX IF NOT EXISTS idx_clusters_session_id ON clusters (session_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_brand ON sessions (brand);
      CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions (created_at);
    `)
  }

  /**
   * Store a scraping session with all posts and comments
   */
  storeScrapeSession(
    sessionId: string,
    brand: string,
    config: ScrapingConfig,
    posts: RedditPost[],
    stats?: any
  ): void {
    const transaction = this.db.transaction(() => {
      // Insert session
      const insertSession = this.db.prepare(`
        INSERT OR REPLACE INTO sessions (id, brand, config, stats, created_at, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `)
      insertSession.run(
        sessionId,
        brand,
        JSON.stringify(config),
        stats ? JSON.stringify(stats) : null
      )

      // Insert posts
      const insertPost = this.db.prepare(`
        INSERT OR REPLACE INTO posts (id, session_id, title, body, url, subreddit, upvotes, created_at, data_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const insertComment = this.db.prepare(`
        INSERT OR REPLACE INTO comments (id, post_id, body, upvotes)
        VALUES (?, ?, ?, ?)
      `)

      for (const post of posts) {
        insertPost.run(
          post.id,
          sessionId,
          post.title,
          post.body || '',
          post.url,
          post.subreddit,
          post.upvotes,
          post.createdAt.toISOString(),
          post.dataType
        )

        // Insert comments for this post
        for (const comment of post.comments) {
          insertComment.run(
            comment.id,
            post.id,
            comment.body,
            comment.upvotes
          )
        }
      }
    })

    transaction()
  }

  /**
   * Store clustering results for a session
   */
  storeClusters(sessionId: string, clusters: any[]): void {
    const transaction = this.db.transaction(() => {
      // Delete existing clusters for this session
      const deleteExisting = this.db.prepare('DELETE FROM clusters WHERE session_id = ?')
      deleteExisting.run(sessionId)

      // Insert new clusters
      const insertCluster = this.db.prepare(`
        INSERT INTO clusters (session_id, name, count, sentiment, questions, top_questions)
        VALUES (?, ?, ?, ?, ?, ?)
      `)

      for (const cluster of clusters) {
        insertCluster.run(
          sessionId,
          cluster.name,
          cluster.count,
          JSON.stringify(cluster.sentiment),
          JSON.stringify(cluster.questions),
          JSON.stringify(cluster.topQuestions)
        )
      }
    })

    transaction()
  }

  /**
   * Retrieve a session with all its data
   */
  getSession(sessionId: string): StoredScrapingSession | null {
    const sessionQuery = this.db.prepare(`
      SELECT * FROM sessions WHERE id = ?
    `)
    const sessionRow = sessionQuery.get(sessionId)

    if (!sessionRow) return null

    // Get posts
    const postsQuery = this.db.prepare(`
      SELECT * FROM posts WHERE session_id = ? ORDER BY created_at DESC
    `)
    const postsRows = postsQuery.all(sessionId)

    // Get comments for each post
    const commentsQuery = this.db.prepare(`
      SELECT * FROM comments WHERE post_id = ?
    `)

    const posts: RedditPost[] = postsRows.map(row => ({
      id: row.id,
      title: row.title,
      body: row.body || '',
      url: row.url,
      subreddit: row.subreddit,
      upvotes: row.upvotes,
      createdAt: new Date(row.created_at),
      dataType: row.data_type as 'post' | 'comment',
      comments: commentsQuery.all(row.id).map(commentRow => ({
        id: commentRow.id,
        body: commentRow.body,
        upvotes: commentRow.upvotes
      }))
    }))

    // Get clusters
    const clustersQuery = this.db.prepare(`
      SELECT * FROM clusters WHERE session_id = ? ORDER BY id
    `)
    const clusterRows = clustersQuery.all(sessionId)
    const clusters = clusterRows.map(row => ({
      id: row.id,
      name: row.name,
      count: row.count,
      sentiment: JSON.parse(row.sentiment),
      questions: JSON.parse(row.questions),
      topQuestions: JSON.parse(row.top_questions),
      createdAt: new Date(row.created_at)
    }))

    return {
      id: sessionRow.id,
      brand: sessionRow.brand,
      config: JSON.parse(sessionRow.config),
      createdAt: new Date(sessionRow.created_at),
      posts,
      clusters,
      stats: sessionRow.stats ? JSON.parse(sessionRow.stats) : null
    }
  }

  /**
   * Get recent sessions for a brand
   */
  getRecentSessions(brand?: string, limit: number = 10): any[] {
    const query = brand
      ? this.db.prepare(`
          SELECT id, brand, config, stats, created_at, updated_at
          FROM sessions
          WHERE brand = ?
          ORDER BY created_at DESC
          LIMIT ?
        `)
      : this.db.prepare(`
          SELECT id, brand, config, stats, created_at, updated_at
          FROM sessions
          ORDER BY created_at DESC
          LIMIT ?
        `)

    const rows = brand ? query.all(brand, limit) : query.all(limit)

    return rows.map(row => ({
      id: row.id,
      brand: row.brand,
      config: JSON.parse(row.config),
      stats: row.stats ? JSON.parse(row.stats) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }))
  }

  /**
   * Search sessions by brand or keywords
   */
  searchSessions(query: string, limit: number = 20): any[] {
    const searchQuery = this.db.prepare(`
      SELECT DISTINCT s.id, s.brand, s.config, s.stats, s.created_at, s.updated_at
      FROM sessions s
      LEFT JOIN posts p ON s.id = p.session_id
      WHERE s.brand LIKE ?
        OR p.title LIKE ?
        OR p.body LIKE ?
      ORDER BY s.created_at DESC
      LIMIT ?
    `)

    const searchTerm = `%${query}%`
    const rows = searchQuery.all(searchTerm, searchTerm, searchTerm, limit)

    return rows.map(row => ({
      id: row.id,
      brand: row.brand,
      config: JSON.parse(row.config),
      stats: row.stats ? JSON.parse(row.stats) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }))
  }

  /**
   * Delete a session and all its data
   */
  deleteSession(sessionId: string): void {
    const transaction = this.db.transaction(() => {
      // Delete comments
      this.db.prepare(`
        DELETE FROM comments
        WHERE post_id IN (SELECT id FROM posts WHERE session_id = ?)
      `).run(sessionId)

      // Delete posts
      this.db.prepare('DELETE FROM posts WHERE session_id = ?').run(sessionId)

      // Delete clusters
      this.db.prepare('DELETE FROM clusters WHERE session_id = ?').run(sessionId)

      // Delete session
      this.db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
    })

    transaction()
  }

  /**
   * Get database statistics
   */
  getStats(): any {
    const sessionCount = this.db.prepare('SELECT COUNT(*) as count FROM sessions').get()
    const postCount = this.db.prepare('SELECT COUNT(*) as count FROM posts').get()
    const commentCount = this.db.prepare('SELECT COUNT(*) as count FROM comments').get()
    const clusterCount = this.db.prepare('SELECT COUNT(*) as count FROM clusters').get()

    const topBrands = this.db.prepare(`
      SELECT brand, COUNT(*) as count
      FROM sessions
      GROUP BY brand
      ORDER BY count DESC
      LIMIT 10
    `).all()

    return {
      sessions: sessionCount.count,
      posts: postCount.count,
      comments: commentCount.count,
      clusters: clusterCount.count,
      topBrands
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.db.close()
  }
}

// Singleton instance
let dbInstance: RedditDatabase | null = null

export function getDatabase(): RedditDatabase {
  if (!dbInstance) {
    dbInstance = new RedditDatabase()
  }
  return dbInstance
}

export { RedditDatabase, StoredScrapingSession, StoredCluster }