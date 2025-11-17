import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    const db = getDatabase()

    let sessions
    if (query) {
      sessions = db.searchSessions(query, limit)
    } else {
      sessions = db.getRecentSessions(brand || undefined, limit)
    }

    return NextResponse.json({
      success: true,
      sessions,
      stats: db.getStats()
    })

  } catch (error) {
    console.error('Error retrieving sessions:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve sessions' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const db = getDatabase()
    db.deleteSession(sessionId)

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}