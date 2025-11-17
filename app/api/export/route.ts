import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { sessionId, format = 'json', includeRawData = false } = data

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const db = getDatabase()
    const session = db.getSession(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Generate report based on format
    let report: any
    let contentType: string
    let filename: string

    switch (format.toLowerCase()) {
      case 'json':
        report = generateJSONReport(session, includeRawData)
        contentType = 'application/json'
        filename = `reddit-analysis-${session.brand}-${sessionId}.json`
        break

      case 'csv':
        report = generateCSVReport(session)
        contentType = 'text/csv'
        filename = `reddit-analysis-${session.brand}-${sessionId}.csv`
        break

      case 'markdown':
        report = generateMarkdownReport(session)
        contentType = 'text/markdown'
        filename = `reddit-analysis-${session.brand}-${sessionId}.md`
        break

      case 'summary':
        report = generateSummaryReport(session)
        contentType = 'application/json'
        filename = `reddit-summary-${session.brand}-${sessionId}.json`
        break

      default:
        return NextResponse.json(
          { error: 'Unsupported format. Use: json, csv, markdown, or summary' },
          { status: 400 }
        )
    }

    return new NextResponse(
      typeof report === 'string' ? report : JSON.stringify(report, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      }
    )

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    )
  }
}

function generateJSONReport(session: any, includeRawData: boolean) {
  const report: any = {
    sessionInfo: {
      id: session.id,
      brand: session.brand,
      createdAt: session.createdAt,
      config: session.config,
    },
    summary: {
      totalPosts: session.posts.length,
      totalComments: session.posts.reduce((sum: number, p: any) => sum + p.comments.length, 0),
      totalClusters: session.clusters?.length || 0,
      avgEngagement: session.stats?.avgEngagement || 0,
    },
    clusters: session.clusters?.map((cluster: any) => ({
      name: cluster.name,
      count: cluster.count,
      sentiment: cluster.sentiment,
      topQuestions: cluster.topQuestions,
    })) || [],
    insights: generateInsights(session),
    recommendations: generateRecommendations(session),
  }

  if (includeRawData) {
    report.rawData = {
      posts: session.posts,
      fullClusters: session.clusters,
    }
  }

  return report
}

function generateCSVReport(session: any): string {
  const headers = [
    'Cluster Name',
    'Question Count',
    'Positive Sentiment',
    'Neutral Sentiment',
    'Negative Sentiment',
    'Top Question',
  ]

  const rows = session.clusters?.map((cluster: any) => [
    cluster.name,
    cluster.count,
    cluster.sentiment?.positive || 0,
    cluster.sentiment?.neutral || 0,
    cluster.sentiment?.negative || 0,
    cluster.topQuestions?.[0] || '',
  ]) || []

  const csvContent = [
    headers.join(','),
    ...rows.map((row: any[]) =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  return csvContent
}

function generateMarkdownReport(session: any): string {
  const clusters = session.clusters || []
  const insights = generateInsights(session)
  const recommendations = generateRecommendations(session)

  return `# Reddit Analysis Report: ${session.brand}

## Summary
- **Analysis Date**: ${new Date(session.createdAt).toLocaleDateString()}
- **Total Posts Analyzed**: ${session.posts.length}
- **Total Comments**: ${session.posts.reduce((sum: number, p: any) => sum + p.comments.length, 0)}
- **Question Clusters Found**: ${clusters.length}
- **Average Engagement**: ${session.stats?.avgEngagement || 0}

## Question Clusters

${clusters.map((cluster: any) => `### ${cluster.name}
- **Questions in cluster**: ${cluster.count}
- **Sentiment**: ${cluster.sentiment?.positive || 0} positive, ${cluster.sentiment?.neutral || 0} neutral, ${cluster.sentiment?.negative || 0} negative

**Top Questions:**
${cluster.topQuestions?.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n') || 'None'}

`).join('')}

## Key Insights
${insights.map((insight: string, i: number) => `${i + 1}. ${insight}`).join('\n')}

## Recommendations
${recommendations.map((rec: string, i: number) => `${i + 1}. ${rec}`).join('\n')}

---
*Generated on ${new Date().toISOString()} by Auto-Redditor*
`
}

function generateSummaryReport(session: any) {
  const clusters = session.clusters || []
  const totalQuestions = clusters.reduce((sum: number, c: any) => sum + c.count, 0)

  const sentimentTotals = clusters.reduce((acc: any, cluster: any) => {
    acc.positive += cluster.sentiment?.positive || 0
    acc.neutral += cluster.sentiment?.neutral || 0
    acc.negative += cluster.sentiment?.negative || 0
    return acc
  }, { positive: 0, neutral: 0, negative: 0 })

  const topClusters = clusters
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 3)

  return {
    brand: session.brand,
    analysisDate: session.createdAt,
    overview: {
      totalPosts: session.posts.length,
      totalQuestions: totalQuestions,
      clustersFound: clusters.length,
      avgEngagement: session.stats?.avgEngagement || 0,
    },
    sentiment: {
      positive: sentimentTotals.positive,
      neutral: sentimentTotals.neutral,
      negative: sentimentTotals.negative,
      positivePercentage: totalQuestions > 0 ? Math.round((sentimentTotals.positive / totalQuestions) * 100) : 0,
    },
    topConcerns: topClusters.map((cluster: any) => ({
      name: cluster.name,
      questionCount: cluster.count,
      topQuestion: cluster.topQuestions?.[0] || '',
    })),
    insights: generateInsights(session),
    recommendations: generateRecommendations(session),
  }
}

function generateInsights(session: any): string[] {
  const clusters = session.clusters || []
  const insights: string[] = []

  if (clusters.length === 0) {
    insights.push('No question clusters were identified in this analysis')
    return insights
  }

  // Most popular concern
  const topCluster = clusters.reduce((max: any, cluster: any) =>
    cluster.count > (max?.count || 0) ? cluster : max, null)

  if (topCluster) {
    insights.push(`The most discussed topic is "${topCluster.name}" with ${topCluster.count} questions`)
  }

  // Sentiment analysis
  const totalQuestions = clusters.reduce((sum: number, c: any) => sum + c.count, 0)
  const sentimentTotals = clusters.reduce((acc: any, cluster: any) => {
    acc.positive += cluster.sentiment?.positive || 0
    acc.negative += cluster.sentiment?.negative || 0
    return acc
  }, { positive: 0, negative: 0 })

  const positivePercentage = totalQuestions > 0 ? (sentimentTotals.positive / totalQuestions) * 100 : 0
  const negativePercentage = totalQuestions > 0 ? (sentimentTotals.negative / totalQuestions) * 100 : 0

  if (positivePercentage > 60) {
    insights.push(`Overall sentiment is positive (${Math.round(positivePercentage)}% positive)`)
  } else if (negativePercentage > 40) {
    insights.push(`Significant negative sentiment detected (${Math.round(negativePercentage)}% negative)`)
  } else {
    insights.push(`Mixed sentiment with ${Math.round(positivePercentage)}% positive and ${Math.round(negativePercentage)}% negative`)
  }

  // Question volume
  if (totalQuestions > 50) {
    insights.push(`High question volume (${totalQuestions} questions) indicates strong user interest`)
  } else if (totalQuestions < 10) {
    insights.push(`Low question volume (${totalQuestions} questions) suggests limited discussion`)
  }

  return insights
}

function generateRecommendations(session: any): string[] {
  const clusters = session.clusters || []
  const recommendations: string[] = []

  if (clusters.length === 0) {
    recommendations.push('Increase brand visibility to generate more user discussions')
    return recommendations
  }

  // Top cluster recommendations
  const topCluster = clusters.reduce((max: any, cluster: any) =>
    cluster.count > (max?.count || 0) ? cluster : max, null)

  if (topCluster) {
    recommendations.push(`Address "${topCluster.name}" concerns through targeted content or FAQ updates`)
  }

  // Sentiment-based recommendations
  const totalQuestions = clusters.reduce((sum: number, c: any) => sum + c.count, 0)
  const sentimentTotals = clusters.reduce((acc: any, cluster: any) => {
    acc.negative += cluster.sentiment?.negative || 0
    acc.positive += cluster.sentiment?.positive || 0
    return acc
  }, { positive: 0, negative: 0 })

  const negativePercentage = totalQuestions > 0 ? (sentimentTotals.negative / totalQuestions) * 100 : 0

  if (negativePercentage > 30) {
    recommendations.push('Proactively address negative feedback and pain points')
    recommendations.push('Consider customer support improvements or product enhancements')
  }

  // Cluster diversity
  if (clusters.length > 4) {
    recommendations.push('Create comprehensive documentation addressing diverse user questions')
  } else if (clusters.length <= 2) {
    recommendations.push('Expand product information to address broader user concerns')
  }

  // Engagement recommendations
  const avgEngagement = session.stats?.avgEngagement || 0
  if (avgEngagement < 5) {
    recommendations.push('Increase community engagement through more active participation')
  }

  return recommendations
}