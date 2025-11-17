import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { brand } = await request.json()

    if (!brand || !brand.trim()) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      // Fallback to simple generation
      return NextResponse.json({
        terms: generateSimpleTerms(brand),
        usingLLM: false,
      })
    }

    // Use LLM to generate smart search terms
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a search optimization expert. Generate 8-12 relevant search terms for Reddit scraping based on a brand/product name. 
            Include: the exact brand name, common variations, abbreviations, related product names, and terms people might use when searching or discussing this product.
            Return ONLY a JSON array of strings, no other text. Example: ["Apple Vision Pro", "vision pro", "AVP", "spatial computing", "mixed reality headset"]`
          },
          {
            role: 'user',
            content: `Generate search terms for: ${brand}`
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      })

      const responseText = completion.choices[0]?.message?.content?.trim() || '[]'
      
      // Try to parse JSON array
      let terms: string[] = []
      try {
        // Remove markdown code blocks if present
        const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        terms = JSON.parse(cleaned)
        
        if (!Array.isArray(terms)) {
          throw new Error('Response is not an array')
        }
        
        // Ensure all terms are strings and filter out empty ones
        terms = terms
          .filter((term: any) => typeof term === 'string' && term.trim().length > 0)
          .map((term: string) => term.trim())
          .slice(0, 12) // Limit to 12 terms
      } catch (parseError) {
        console.error('Failed to parse LLM response:', parseError)
        // Fallback to simple generation
        terms = generateSimpleTerms(brand)
      }

      return NextResponse.json({
        terms,
        usingLLM: true,
      })
    } catch (llmError: any) {
      console.error('LLM error:', llmError)
      // Fallback to simple generation
      return NextResponse.json({
        terms: generateSimpleTerms(brand),
        usingLLM: false,
        error: 'LLM generation failed, using fallback',
      })
    }
  } catch (error: any) {
    console.error('Error generating search terms:', error)
    return NextResponse.json(
      { error: 'Failed to generate search terms', message: error.message },
      { status: 500 }
    )
  }
}

function generateSimpleTerms(brand: string): string[] {
  const brandLower = brand.toLowerCase().trim()
  const brandWords = brandLower.split(/\s+/)
  const terms: string[] = []

  // Add the full brand name
  terms.push(brand.trim())

  // Add lowercase version
  if (brandLower !== brand.trim().toLowerCase()) {
    terms.push(brandLower)
  }

  // Add individual significant words
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
  brandWords.forEach(word => {
    if (word.length > 2 && !commonWords.includes(word) && !terms.includes(word)) {
      terms.push(word)
    }
  })

  // Add acronym
  if (brandWords.length > 1) {
    const acronym = brandWords.map(w => w[0]).join('').toUpperCase()
    if (acronym.length >= 2 && !terms.includes(acronym)) {
      terms.push(acronym)
    }
  }

  return Array.from(new Set(terms)).filter(term => term.length > 0).slice(0, 10)
}

