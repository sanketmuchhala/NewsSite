# Funny News Aggregator

A modern, AI-powered news aggregation platform that discovers and curates the funniest, most absurd news stories from across the internet. Built with Next.js 14 and featuring an interactive network graph visualization of story relationships.

# Demo

<img width="1680" height="1050" alt="Screenshot 2025-09-14 at 4 54 05 PM" src="https://github.com/user-attachments/assets/9d8f44fa-0252-4e64-a362-f2edde25fffe" />
<img width="1680" height="1050" alt="Screenshot 2025-09-14 at 4 54 16 PM" src="https://github.com/user-attachments/assets/7da03af1-76e2-4ce7-a939-45f1e922a779" />
<img width="1680" height="1050" alt="Screenshot 2025-09-14 at 4 54 26 PM" src="https://github.com/user-attachments/assets/b5584bd1-88e5-4439-9045-c3a937fffb15" />

## Features

### Core Functionality
- **AI-Enhanced Content Curation** - Powered by Google Gemini for intelligent funny score calculation and categorization
- **Interactive Network Graph** - Visualize relationships between news stories using vis-network
- **Multi-Source Aggregation** - Automatically scrapes from Reddit, RSS feeds, and other news sources
- **Infinite Scroll Feed** - Smooth, responsive browsing experience with lazy loading
- **Advanced Filtering** - Filter by source, funny score, tags, and publication date
- **Real-time Updates** - Fresh content delivered through automated scraping workflows

### Technical Highlights
- **Next.js 14 App Router** - Modern React framework with server-side rendering
- **TypeScript** - Full type safety across the entire codebase
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Vercel Postgres** - Scalable database with connection pooling
- **Professional UI/UX** - Clean design inspired by Linear, Vercel, and Stripe

## Tech Stack

### Frontend
- **Next.js 14.2.5** - React framework with App Router
- **React 18** - Modern React with concurrent features
- **TypeScript 5+** - Static type checking
- **Tailwind CSS 3.4.4** - Utility-first CSS framework
- **shadcn/ui** - Modern component library
- **vis-network 9.1.9** - Interactive network graph visualization

### Backend
- **Node.js** - JavaScript runtime
- **Next.js API Routes** - Server-side API endpoints
- **Vercel Postgres** - Managed PostgreSQL database
- **Google Gemini AI** - Content enhancement and scoring

### Development Tools
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **GitHub Actions** - CI/CD and automated scraping

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- PostgreSQL client (optional, for local database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/funny-news-aggregator.git
   cd funny-news-aggregator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables in `.env.local`:
   ```env
   # Database
   POSTGRES_URL=your_postgres_connection_string
   
   # AI Enhancement
   GEMINI_API_KEY=your_gemini_api_key
   
   # Optional: External APIs
   REDDIT_CLIENT_ID=your_reddit_client_id
   REDDIT_CLIENT_SECRET=your_reddit_client_secret
   ```

4. **Set up the database** (optional - the app works with mock data)
   ```bash
   psql $POSTGRES_URL < lib/db/schema.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   │   ├── stories/       # News stories CRUD
│   │   └── graph/         # Network graph data
│   ├── graph/             # Network visualization page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── NetworkGraph.tsx  # Interactive graph visualization
│   ├── StoryCard.tsx     # Individual story display
│   └── Filters.tsx       # Search and filter controls
├── lib/                   # Core functionality
│   ├── db/               # Database operations
│   ├── scrapers/         # Content scraping modules
│   └── ai/               # AI integration (Gemini)
├── types/                 # TypeScript type definitions
├── public/               # Static assets
└── scripts/              # Utility scripts
```

## Database Schema

### news_stories
```sql
CREATE TABLE news_stories (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  url TEXT UNIQUE NOT NULL,
  source VARCHAR(200),
  source_type VARCHAR(50),
  published_at TIMESTAMPTZ,
  summary TEXT,
  funny_score INTEGER DEFAULT 50,
  tags TEXT[],
  upvotes INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### story_relationships
```sql
CREATE TABLE story_relationships (
  id SERIAL PRIMARY KEY,
  source_id INTEGER REFERENCES news_stories(id),
  target_id INTEGER REFERENCES news_stories(id),
  relationship_type VARCHAR(50),
  strength DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### Stories
- `GET /api/stories` - Fetch paginated news stories
- `POST /api/stories` - Create a new story (admin)

### Graph Data
- `GET /api/graph` - Get network graph data for visualization

## Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler check

# Database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
```

## Content Sources

The platform aggregates content from:

### Reddit Communities
- r/nottheonion - Real news that sounds fake
- r/FloridaMan - Florida's most bizarre stories
- r/offbeat - Unusual and quirky news
- r/NewsOfTheStupid - Questionable decision making

### RSS Feeds
- The Onion - Satirical news
- Babylon Bee - Conservative satire
- ClickHole - Absurdist humor
- NewsThump - British satire

## AI Enhancement

Stories are processed through Google Gemini AI for:
- **Funny Score Calculation** (0-100) based on absurdity and humor
- **Smart Categorization** with relevant tags
- **Content Summarization** for better readability
- **Relationship Detection** between similar stories

## Network Graph Features

The interactive visualization shows:
- **Node Size** - Proportional to funny score
- **Node Color** - Different colors for source types
- **Edge Connections** - Relationships between stories
- **Clustering** - Natural grouping of similar content
- **Interactive Controls** - Zoom, pan, focus, and exploration tools

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_URL` | PostgreSQL connection string | No* |
| `GEMINI_API_KEY` | Google Gemini AI API key | Yes |
| `REDDIT_CLIENT_ID` | Reddit API client ID | No |
| `REDDIT_CLIENT_SECRET` | Reddit API client secret | No |

*App works with mock data if database is not configured

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm start
```

## Performance

- **Server-side rendering** for fast initial page loads
- **Edge caching** for API responses (5-minute TTL)
- **Optimized database queries** with proper indexing
- **Lazy loading** for images and infinite scroll
- **Responsive design** optimized for all devices

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in the `/docs` folder
- Review the API documentation at `/api/docs`

## Acknowledgments

- [vis-network](https://visjs.github.io/vis-network/) for the amazing graph visualization
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Next.js](https://nextjs.org/) for the incredible React framework
- [Google Gemini](https://ai.google.dev/) for AI-powered content enhancement

---

Built with care for anyone who loves hilariously absurd news stories.