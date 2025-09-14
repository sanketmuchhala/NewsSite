import { NextRequest, NextResponse } from 'next/server';
import { WeirdSoundsScraper, ScraperConfig } from '@/lib/scrapers';
import { createScrapingJob, updateScrapingJob } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, manual, maxSounds = 20 } = body;

    // Create scraping job record
    const jobResult = await createScrapingJob(
      source || 'all',
      manual ? 'Manual scrape' : 'Automated scrape'
    );

    if (!jobResult.success || !jobResult.data) {
      return NextResponse.json(
        { error: 'Failed to create scraping job' },
        { status: 500 }
      );
    }

    const job = jobResult.data;

    // Update job status to running
    await updateScrapingJob(job.id, {
      status: 'running',
      started_at: new Date().toISOString()
    });

    // Initialize scraper configuration
    const config: ScraperConfig = {
      youtube: {
        apiKey: process.env.YOUTUBE_API_KEY || '',
        enabled: !!process.env.YOUTUBE_API_KEY && (!source || source === 'youtube' || source === 'all'),
      },
      freesound: {
        apiKey: process.env.FREESOUND_API_KEY || '',
        enabled: !!process.env.FREESOUND_API_KEY && (!source || source === 'freesound' || source === 'all'),
      },
      archive: {
        enabled: !source || source === 'archive' || source === 'all',
      },
    };

    const scraper = new WeirdSoundsScraper(config);

    // Start scraping (don't await - run in background)
    performScraping(scraper, job.id, maxSounds).catch(console.error);

    return NextResponse.json({
      success: true,
      message: 'Scraping job started',
      jobId: job.id,
    });
  } catch (error) {
    console.error('Scraping API error:', error);
    return NextResponse.json(
      { error: 'Failed to start scraping job' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const id = searchParams.get('id');

    // Manual scraping endpoints
    if (source && id) {
      const config: ScraperConfig = {
        youtube: {
          apiKey: process.env.YOUTUBE_API_KEY || '',
          enabled: !!process.env.YOUTUBE_API_KEY,
        },
        freesound: {
          apiKey: process.env.FREESOUND_API_KEY || '',
          enabled: !!process.env.FREESOUND_API_KEY,
        },
        archive: {
          enabled: true,
        },
      };

      const scraper = new WeirdSoundsScraper(config);
      let result;

      switch (source) {
        case 'youtube':
          result = await scraper.scrapeYouTubeVideo(id);
          break;
        case 'freesound':
          result = await scraper.scrapeFreesoundById(parseInt(id));
          break;
        case 'archive':
          result = await scraper.scrapeArchiveItem(id);
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid source' },
            { status: 400 }
          );
      }

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `Successfully scraped ${source} item: ${id}`,
        });
      } else {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
    }

    // If no specific scraping requested, return scraper status
    return NextResponse.json({
      success: true,
      message: 'Scraper API ready',
      availableScrapers: {
        youtube: !!process.env.YOUTUBE_API_KEY,
        freesound: !!process.env.FREESOUND_API_KEY,
        archive: true,
      },
    });
  } catch (error) {
    console.error('Scraping GET API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function performScraping(scraper: WeirdSoundsScraper, jobId: string, maxSounds: number) {
  try {
    console.log(`🚀 Starting scraping job ${jobId}`);

    // Perform the scraping
    const scrapingResult = await scraper.scrapeAll(maxSounds);

    // Generate relationships between sounds
    const relationshipResult = await scraper.generateSoundRelationships();

    // Update job with results
    await updateScrapingJob(jobId, {
      status: scrapingResult.success ? 'completed' : 'failed',
      results_count: scrapingResult.totalScraped,
      error_message: scrapingResult.errors.length > 0 ? scrapingResult.errors.join('; ') : undefined,
      completed_at: new Date().toISOString(),
    });

    console.log(`✅ Scraping job ${jobId} completed:`, {
      scraped: scrapingResult.totalScraped,
      relationships: relationshipResult.created,
      errors: scrapingResult.errors.length + relationshipResult.errors.length,
    });
  } catch (error) {
    console.error(`❌ Scraping job ${jobId} failed:`, error);

    await updateScrapingJob(jobId, {
      status: 'failed',
      error_message: String(error),
      completed_at: new Date().toISOString(),
    });
  }
}