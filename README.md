# Auto-Redditor: Reddit Brand Analysis Tool

A powerful Next.js application that automatically scrapes Reddit to find and analyze user questions about brands, providing insights through semantic clustering and sentiment analysis.

## Features

- 🔍 **Reddit Scraping**: Real-time data collection via Apify Reddit Scraper
- 🧠 **AI-Powered Analysis**: OpenAI embeddings for semantic clustering
- 📊 **Sentiment Analysis**: Advanced NLP sentiment detection
- 💾 **Data Persistence**: SQLite database for session storage
- 📈 **Interactive Dashboards**: Rich data visualization with Recharts
- 📋 **Export Functionality**: Multiple formats (JSON, CSV, Markdown, Summary)
- 🎨 **Modern UI**: Built with Next.js 14, TypeScript, and Tailwind CSS

## Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Apify account and API token
- OpenAI API key (for advanced clustering)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository>
   cd auto-redditor
   npm install
   # or
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your API keys:
   ```env
   APIFY_TOKEN=your_apify_token_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## How It Works

### 1. Configuration
- Enter your brand name (e.g., "Apple Vision Pro")
- Add search terms and filters
- Set limits for posts and comments

### 2. Reddit Scraping
- Uses Apify's Reddit Scraper for data collection
- Retrieves posts, comments, metadata, and engagement metrics
- Fallback to mock data if API keys aren't configured

### 3. Question Analysis
- Automatically identifies question posts using NLP patterns
- Filters out statements and promotional content
- Calculates engagement scores and sentiment

### 4. Semantic Clustering
- Groups similar questions using OpenAI embeddings
- K-means clustering for theme identification
- AI-generated cluster names and insights

### 5. Export & Reports
- Multiple export formats available
- Detailed analysis and recommendations
- Historical session management

## API Configuration

### Apify Setup

1. Create account at [apify.com](https://apify.com)
2. Go to Settings → Integrations → API tokens
3. Generate new token and add to `.env.local`
4. The scraper costs ~$4 per 1,000 results

### OpenAI Setup

1. Create account at [platform.openai.com](https://platform.openai.com)
2. Generate API key in API Keys section
3. Add to `.env.local`
4. Uses text-embedding-3-small and gpt-3.5-turbo models

## Architecture

```
auto-redditor/
├── app/
│   ├── api/
│   │   ├── scrape/         # Reddit data collection
│   │   ├── cluster/        # Semantic clustering
│   │   ├── export/         # Report generation
│   │   └── sessions/       # Session management
│   ├── page.tsx            # Main application
│   └── layout.tsx          # Root layout
├── components/
│   ├── configuration-step.tsx    # Data input form
│   ├── results-dashboard.tsx     # Scraping results
│   ├── insights-panel.tsx        # Analysis & clustering
│   └── ui/                       # Shadcn/UI components
├── lib/
│   ├── database.ts               # SQLite persistence
│   ├── reddit-processor.ts      # Data processing utilities
│   └── utils.ts                  # Shared utilities
└── data/                         # SQLite database storage
```

## Database Schema

The application uses SQLite for data persistence:

- **sessions**: Scraping configurations and metadata
- **posts**: Reddit posts with engagement data
- **comments**: Post comments and replies
- **clusters**: Semantic analysis results

## Troubleshooting

### Common Issues

1. **"No Apify token found"**
   - Add APIFY_TOKEN to .env.local
   - Application works with mock data without token

2. **"OpenAI clustering failed"**
   - Add OPENAI_API_KEY to .env.local
   - Application falls back to keyword-based clustering

3. **Database errors**
   - Check if data/ directory is writable
   - Database is auto-created on first run

4. **Rate limiting**
   - OpenAI: Built-in delays between batches
   - Apify: Managed by their infrastructure

### Performance Tips

- **Limit search scope**: Start with 50-100 posts for testing
- **Use specific searches**: More targeted terms = better results
- **Monitor costs**: Each Apify run costs credits based on data volume

## Development

### Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript
- **UI**: Tailwind CSS, Shadcn/UI, Radix UI
- **Charts**: Recharts
- **Database**: Better-SQLite3
- **APIs**: Apify SDK, OpenAI API

### Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint checks
```

### Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## Cost Estimation

- **Apify**: ~$4 per 1,000 Reddit posts
- **OpenAI**:
  - Embeddings: ~$0.02 per 1,000 texts
  - GPT-3.5: ~$0.002 per 1,000 tokens
- **Total**: ~$5-10 per analysis of 1,000 posts

## Security & Privacy

- API keys stored in environment variables
- No personal data stored
- Reddit data used according to their terms
- SQLite database stored locally

## License

MIT License - see LICENSE file for details

---

For support, feature requests, or bug reports, please create an issue in the repository.