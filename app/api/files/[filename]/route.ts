import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

/**
 * GET /api/files/[filename] - Load a CSV file and parse it
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> | { filename: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const filename = resolvedParams.filename
    const exportsDir = path.join(process.cwd(), 'data', 'exports')
    const filePath = path.join(exportsDir, filename)

    // Security check - ensure file is in exports directory and is a valid backup file
    if (!filePath.startsWith(exportsDir) || !filename.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      )
    }

    // Only allow main backup files, not comments or metadata files
    if (filename.startsWith('backup-comments-') || filename.startsWith('backup-metadata-')) {
      return NextResponse.json(
        { error: 'Cannot load comments or metadata files directly. Please select the main backup file.' },
        { status: 400 }
      )
    }

    // Ensure it's a backup file
    if (!filename.startsWith('backup-')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only backup CSV files are supported.' },
        { status: 400 }
      )
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Read and parse CSV
    const csvContent = fs.readFileSync(filePath, 'utf-8')
    
    // Parse CSV properly handling quoted fields with newlines
    const rows = parseCSV(csvContent)
    
    if (rows.length < 2) {
      return NextResponse.json(
        { error: 'Invalid CSV file format - need at least header and one row' },
        { status: 400 }
      )
    }

    // Parse headers
    const headers = rows[0]
    console.log(`Parsed ${rows.length} rows, headers:`, headers)
    
    // Parse rows
    const posts: any[] = []
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i]
      if (values.length < headers.length) {
        console.warn(`Row ${i} has ${values.length} values, expected ${headers.length}, skipping`)
        continue
      }

      try {
        const post: any = {
          id: values[0] || '',
          title: values[1] || '',
          body: values[2] || '',
          url: values[3] || '',
          subreddit: values[4] || '',
          upvotes: parseInt(values[5]) || 0,
          createdAt: new Date(values[6]) || new Date(),
          dataType: 'post' as const,
          comments: [],
        }

        // Parse comments from JSON string (index 8)
        if (values.length > 8 && values[8]) {
          try {
            const commentsJson = values[8]
            post.comments = JSON.parse(commentsJson)
          } catch (e) {
            console.warn(`Failed to parse comments for post ${i}:`, e)
            post.comments = []
          }
        }

        posts.push(post)
      } catch (e) {
        console.error(`Error parsing row ${i}:`, e)
        continue
      }
    }
    
    console.log(`Successfully parsed ${posts.length} posts`)

    // Try to load metadata file
    const metadataFilename = filename.replace('backup-', 'backup-metadata-')
    const metadataPath = path.join(exportsDir, metadataFilename)
    let config: any = {}
    let stats: any = {}

    if (fs.existsSync(metadataPath)) {
      try {
        const metadataContent = fs.readFileSync(metadataPath, 'utf-8')
        const metadata = JSON.parse(metadataContent)
        config = metadata.config || {}
        stats = metadata.stats || {}
      } catch (e) {
        console.error('Failed to parse metadata:', e)
      }
    }

    // Calculate stats if not available
    if (!stats.totalPosts) {
      stats = {
        totalPosts: posts.length,
        totalComments: posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0),
        avgEngagement: posts.length > 0
          ? Math.round(
              posts.reduce((sum, p) => sum + p.upvotes + (p.comments?.length || 0), 0) / posts.length
            )
          : 0,
      }
    }

    return NextResponse.json({
      success: true,
      filename,
      posts,
      config,
      stats,
      sessionId: config.sessionId || filename.split('-').pop()?.replace('.csv', '') || '',
    })
  } catch (error: any) {
    console.error('Error loading file:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: 'Failed to load file', 
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Parse CSV content handling quoted fields with newlines
 */
function parseCSV(csvContent: string): string[][] {
  const rows: string[][] = []
  const lines = csvContent.split(/\r?\n/)
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"'
          i++ // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        currentRow.push(currentField.trim())
        currentField = ''
      } else {
        currentField += char
      }
    }

    // If we're not in quotes, we've finished a row
    if (!inQuotes) {
      // Add the last field
      currentRow.push(currentField.trim())
      currentField = ''
      
      // Only add non-empty rows
      if (currentRow.some(field => field.length > 0)) {
        rows.push(currentRow)
      }
      currentRow = []
    } else {
      // We're still in quotes, add newline and continue
      currentField += '\n'
    }
  }

  // Handle case where file doesn't end with newline
  if (currentField.trim() || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    if (currentRow.some(field => field.length > 0)) {
      rows.push(currentRow)
    }
  }

  return rows
}

