# Auto Redditor - Reddit Intelligence Platform

## 🎯 What It Does

**Auto Redditor** is an AI-powered Reddit scraping and analysis tool that helps brands and researchers understand conversations about products, topics, or trends on Reddit. It automatically:

- Scrapes Reddit posts and comments based on custom search terms
- Analyzes sentiment and engagement patterns
- Groups similar discussions using AI clustering
- Identifies key themes and pain points
- Provides actionable insights from thousands of conversations

## 🏗️ How It Works

### 1. **Smart Scraping**
- Enter a brand/product name (e.g., "Apple Vision Pro", "Tinder")
- Auto-generate intelligent search terms using GPT-3.5
- Configure scraping parameters (post limit, subreddits, sorting)
- Apify scraper fetches posts and comments in real-time

### 2. **AI-Powered Analysis**
- **Embeddings**: Uses OpenAI's `text-embedding-3-small` to convert text into vector representations
- **Clustering**: K-means algorithm groups similar discussions into themes
- **Sentiment Analysis**: Analyzes positive/negative/neutral sentiment across clusters
- **Engagement Metrics**: Tracks upvotes, comment counts, and discussion patterns

### 3. **Interactive Insights**
- Visual dashboard with charts and graphs
- Cluster-based theme exploration
- Top posts and comments per theme
- Export capabilities for further analysis

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **Recharts** - Data visualization

### Backend
- **Next.js API Routes** - Serverless functions
- **Apify Client** - Reddit scraping infrastructure
- **OpenAI API** - Embeddings and LLM capabilities
- **CSV/JSON Storage** - File-based data persistence

### AI/ML
- **OpenAI GPT-3.5-turbo** - Search term generation
- **OpenAI text-embedding-3-small** - Text vectorization
- **K-means Clustering** - Custom implementation for theme detection
- **Cosine Similarity** - Vector distance calculations

## 🚀 Key Features

### 1. **Auto-Generate Search Terms**
- Click "Auto-generate" to create smart search terms
- Powered by GPT-3.5 for context-aware keyword generation
- Includes variations, abbreviations, and related terms

### 2. **Flexible Scraping**
- Search specific subreddits or all of Reddit
- Filter by date range and post type
- Sort by hot, top, new, rising, or controversial
- Set custom post and comment limits

### 3. **Smart Clustering**
- Automatically groups similar discussions
- Identifies 3-8 key themes per dataset
- Shows representative posts for each cluster
- Sentiment breakdown per theme

### 4. **CSV Export & Import**
- Automatic CSV backup of all scraped data
- Load previous scraping sessions
- Share datasets with team members
- Includes metadata and configuration

### 5. **Real-Time Processing**
- Live progress tracking during scraping
- Polling mechanism for Apify job completion
- Incremental data loading
- Error handling with fallback mock data

## 📊 How We Built It

### Phase 1: Foundation (Initial Setup)
1. Created Next.js project with TypeScript
2. Set up shadcn/ui component library
3. Designed initial UI/UX with Tailwind CSS
4. Implemented basic routing and layout

### Phase 2: Scraping Infrastructure
1. Integrated Apify Client for Reddit scraping
2. Built API route for scraping (`/api/scrape`)
3. Implemented polling mechanism for job completion
4. Added error handling and fallback mock data
5. Created CSV backup system for data persistence

### Phase 3: AI & Analysis
1. Integrated OpenAI API for embeddings
2. Implemented k-means clustering algorithm
3. Built sentiment analysis pipeline
4. Created clustering API route (`/api/cluster`)
5. Added visualization with Recharts

### Phase 4: UX Improvements
1. Simplified workflow to 2 main steps (Scraping + Insights)
2. Added file selector for loading previous sessions
3. Implemented auto-generate search terms with LLM
4. Created interactive insights dashboard
5. Added CSV export functionality

### Phase 5: Data Management
1. Moved from SQLite to CSV-based storage
2. Built file listing and loading APIs
3. Created CSV parser with proper quote handling
4. Implemented metadata JSON files
5. Added `.gitignore` for local data

### Phase 6: Polish & Deploy
1. Fixed dependency conflicts (Apify, Vaul)
2. Resolved TypeScript type issues
3. Added comprehensive error handling
4. Removed API keys from git history
5. Created `.env.example` template
6. Cleaned up codebase and documentation

## 🎨 User Flow

```
1. Enter brand/product name
   ↓
2. Auto-generate or manually enter search terms
   ↓
3. Configure scraping parameters
   ↓
4. Start scraping (Apify runs in background)
   ↓
5. Data saved to CSV automatically
   ↓
6. View results dashboard with:
   - Total posts & comments
   - Average engagement
   - Sentiment breakdown
   ↓
7. Navigate to Insights page
   ↓
8. Explore AI-generated clusters
   ↓
9. Export or analyze further
```

## 💡 Technical Highlights

### CSV Parser
- Handles quoted fields with commas
- Supports multi-line content
- Escapes special characters
- Parses JSON-embedded comments

### K-means Clustering
- Custom implementation for Reddit data
- Cosine similarity distance metric
- Automatic cluster count optimization (3-8 clusters)
- Iterative refinement until convergence

### Lazy API Initialization
- Environment variables loaded at runtime
- Avoids module-level initialization issues
- Graceful fallback to mock data
- Better error messages for debugging

### File-Based Architecture
- No database required for MVP
- Easy data sharing and backups
- Git-friendly (ignored via `.gitignore`)
- Simple deployment

## 📦 Project Structure

```
auto-redditor/
├── app/
│   ├── api/
│   │   ├── scrape/         # Main scraping endpoint
│   │   ├── cluster/        # AI clustering endpoint
│   │   ├── files/          # CSV file management
│   │   └── generate-search-terms/  # LLM term generation
│   ├── page.tsx            # Main navigation
│   └── layout.tsx          # Root layout
├── components/
│   ├── scraping-page.tsx   # Scraping UI & results
│   ├── insights-panel.tsx  # Cluster visualization
│   └── ui/                 # shadcn components
├── lib/
│   ├── reddit-processor.ts # Data types & interfaces
│   ├── csv-backup.ts       # CSV export utilities
│   └── utils.ts            # Helper functions
├── data/exports/           # CSV storage (gitignored)
└── scripts/
    └── generate-mock-csv.js # Testing utilities
```

## 🔒 Security

- All API keys stored in `.env.local` (gitignored)
- Clean git history (no secrets committed)
- `.env.example` template for team setup
- GitHub push protection compatible

## 🚦 Current Status

**Production Ready** ✅
- Core features implemented
- Error handling in place
- CSV backup system working
- LLM integration complete
- Clean codebase pushed to GitHub

## 🔮 Future Enhancements

- [ ] Add user authentication
- [ ] Implement PostgreSQL for production
- [ ] Real-time updates via WebSockets
- [ ] Advanced filtering and search
- [ ] Team collaboration features
- [ ] Scheduled automated scraping
- [ ] Email reports and alerts
- [ ] Additional AI models (sentiment, summarization)

---

**Built with ❤️ using Next.js, OpenAI, and Apify**

