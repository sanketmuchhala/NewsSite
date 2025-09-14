# 🔊 Weird Sounds Discovery

A viral web application for discovering and sharing the weirdest sounds on the internet. Built with Next.js 14, featuring interactive network visualizations and automated content scraping.

## 🌟 Features

### Core Functionality
- **Sound Discovery Feed**: Infinite scroll through curated weird sounds
- **Interactive Network Graph**: Visualize relationships between sounds using vis-network
- **Smart Audio Streaming**: Play sounds directly from YouTube, Freesound, and Archive.org without file storage
- **Advanced Search & Filtering**: Find sounds by tags, source, or keywords
- **Weird Sound Roulette**: Random discovery button for serendipitous finds

### Technical Features
- **Automated Scraping**: Daily GitHub Actions workflow to discover new content
- **AI Enhancement**: Google Gemini AI for sound descriptions, categorization, and weirdness scoring
- **Edge Caching**: Optimized API responses with Vercel edge functions
- **Real-time Visualization**: Dynamic network graphs showing sound relationships
- **Responsive Design**: Mobile-first dark theme with custom animations
- **Type-Safe**: Full TypeScript implementation with strict typing

### Easter Eggs 🥚
- **Konami Code**: Try the classic cheat code for a surprise
- **Glitch Effects**: Hover animations and loading states with retro vibes
- **Hidden Features**: Secret UI elements and special sound categories
- **Viral Shareability**: Optimized meta tags and social sharing

## 🚀 Live Demo

Visit the deployed application: [weird-sounds.vercel.app](https://weird-sounds.vercel.app)

## 📦 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Vercel Postgres with connection pooling
- **Styling**: Tailwind CSS with custom theme
- **Visualization**: vis-network for interactive graphs
- **Deployment**: Vercel with edge functions
- **Automation**: GitHub Actions for scraping
- **APIs**: YouTube Data API, Freesound API, Archive.org

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/weird-sounds-discovery.git
   cd weird-sounds-discovery
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your configuration:
   ```env
   # Required
   POSTGRES_URL="postgresql://..."

   # Optional (enables scrapers)
   YOUTUBE_API_KEY="your_youtube_api_key"
   FREESOUND_API_KEY="your_freesound_api_key"

   # Optional (enables AI features)
   GEMINI_API_KEY="your_gemini_api_key"

   # Application
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Initialize the database**
   ```bash
   # Run the SQL schema
   psql $POSTGRES_URL < lib/db/schema.sql
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🔧 Configuration

### API Keys Setup

**YouTube Data API**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create credentials (API key)
5. Add to environment variables

**Freesound API**
1. Create account at [Freesound.org](https://freesound.org/)
2. Go to [API page](https://freesound.org/apiv2/apply/)
3. Create new API key
4. Add to environment variables

### Database Schema

The application uses PostgreSQL with the following main tables:
- `sounds` - Sound metadata and information
- `sound_relationships` - Network graph connections
- `scraping_jobs` - Automation tracking

## 🤖 Automated Scraping

The application includes automated content discovery:

### GitHub Actions Workflow
- Runs daily at 2 AM UTC
- Scrapes from all enabled sources
- Generates relationship mappings
- Updates the sound network

### Manual Scraping
```bash
# Scrape from all sources
node scripts/scrape.js

# Scrape specific source
node scripts/scrape.js youtube 20

# Scrape specific item
node scripts/scrape.js specific youtube dQw4w9WgXcQ
```

### API Endpoints
```bash
# Trigger scraping job
POST /api/scrape

# Get specific item
GET /api/scrape?source=youtube&id=VIDEO_ID
```

## 🎨 Customization

### Themes
The app uses a custom dark theme with weird color palette:
- `weird-purple`: #8B5CF6
- `weird-pink`: #EC4899
- `weird-cyan`: #06B6D4
- `weird-dark`: #1F1B24

### Adding New Scrapers
1. Create scraper class in `lib/scrapers/`
2. Implement required interface methods
3. Add to `WeirdSoundsScraper` configuration
4. Update API routes and documentation

### Network Graph Customization
Modify `components/NetworkGraph.tsx` to:
- Change node/edge styling
- Add new relationship types
- Implement clustering algorithms
- Custom physics settings

## 📊 Architecture

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── graph/             # Network visualization page
│   └── sound/[id]/        # Individual sound pages
├── components/            # React components
│   ├── AudioPlayer.tsx    # Streaming audio player
│   ├── NetworkGraph.tsx   # vis-network wrapper
│   └── SoundCard.tsx      # Sound display component
├── lib/                   # Core functionality
│   ├── db/               # Database operations
│   └── scrapers/         # Content scraping modules
├── scripts/              # Automation scripts
└── .github/workflows/    # CI/CD automation
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Import project in Vercel dashboard
   - Add environment variables
   - Deploy automatically

3. **Database Setup**
   - Create Vercel Postgres database
   - Run schema initialization
   - Update connection strings

### Environment Variables for Production
```env
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
YOUTUBE_API_KEY=
FREESOUND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

## 🐛 Troubleshooting

### Common Issues

**Database Connection**
- Verify PostgreSQL URL format
- Check connection pooling settings
- Ensure schema is initialized

**API Rate Limits**
- YouTube: 10,000 requests/day
- Freesound: 2,000 requests/day
- Archive.org: No official limit (be respectful)

**Audio Playback**
- YouTube requires embed API
- CORS issues with direct audio files
- Browser autoplay policies

### Development Tips
```bash
# Check TypeScript
npm run typecheck

# Lint code
npm run lint

# Test scraping locally
node scripts/scrape.js --help
```

## 📈 Performance

- **Edge Caching**: API responses cached for 5 minutes
- **Image Optimization**: Next.js automatic optimization
- **Code Splitting**: Dynamic imports for large components
- **Database Indexing**: Optimized queries for sound discovery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Content Guidelines
- Focus on weird, experimental, or unusual sounds
- Respect copyright and licensing
- Avoid inappropriate or harmful content
- Prioritize discovery and serendipity

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **YouTube Data API** - Video metadata and streaming
- **Freesound.org** - Creative Commons audio content
- **Archive.org** - Historical and public domain recordings
- **vis-network** - Network visualization library
- **Vercel** - Hosting and edge functions
- **The weird internet** - For being wonderfully strange

## 📞 Support

- 🐛 [Report Bug](https://github.com/your-username/weird-sounds-discovery/issues)
- 💡 [Request Feature](https://github.com/your-username/weird-sounds-discovery/issues)
- 📧 [Contact](mailto:your-email@example.com)

---

*Made with 💜 for the weird side of the internet*