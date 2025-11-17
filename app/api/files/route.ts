import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

/**
 * GET /api/files - List all CSV files in data/exports
 */
export async function GET(request: NextRequest) {
  try {
    const exportsDir = path.join(process.cwd(), 'data', 'exports')
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true })
      return NextResponse.json({ files: [] })
    }

    // Read all files in the exports directory
    // Only show main backup files (not comments or metadata files)
    const files = fs.readdirSync(exportsDir)
      .filter(file => 
        file.endsWith('.csv') && 
        file.startsWith('backup-') && 
        !file.startsWith('backup-comments-') && 
        !file.startsWith('backup-metadata-')
      )
      .map(file => {
        const filePath = path.join(exportsDir, file)
        const stats = fs.statSync(filePath)
        
        // Parse filename to extract metadata
        // Format: backup-{brand}-{timestamp}-{sessionId}.csv
        const match = file.match(/^backup-(.+?)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})-(.+)\.csv$/)
        
        return {
          filename: file,
          brand: match ? match[1] : 'Unknown',
          timestamp: match ? match[2].replace(/-/g, ':').replace('T', 'T').slice(0, -3) : '',
          sessionId: match ? match[3] : '',
          size: stats.size,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
        }
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()) // Sort by newest first

    return NextResponse.json({ files })
  } catch (error: any) {
    console.error('Error listing files:', error)
    return NextResponse.json(
      { error: 'Failed to list files', message: error.message },
      { status: 500 }
    )
  }
}

