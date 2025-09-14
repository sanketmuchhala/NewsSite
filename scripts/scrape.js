#!/usr/bin/env node

/**
 * Manual scraping script for weird sounds
 * Usage: node scripts/scrape.js [source] [maxSounds]
 */

const { WeirdSoundsScraper } = require('../lib/scrapers');

async function main() {
  const args = process.argv.slice(2);
  const source = args[0] || 'all';
  const maxSounds = parseInt(args[1]) || 20;

  console.log('🔊 Weird Sounds Manual Scraping Script');
  console.log('=====================================');
  console.log(`Source: ${source}`);
  console.log(`Max Sounds: ${maxSounds}`);
  console.log('');

  // Check environment variables
  const requiredEnvVars = [
    'POSTGRES_URL',
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(envVar => {
      console.error(`  - ${envVar}`);
    });
    process.exit(1);
  }

  // Optional API keys
  const optionalEnvVars = {
    YOUTUBE_API_KEY: 'YouTube scraping',
    FREESOUND_API_KEY: 'Freesound scraping',
  };

  console.log('🔧 Configuration:');
  Object.entries(optionalEnvVars).forEach(([envVar, description]) => {
    const isAvailable = !!process.env[envVar];
    console.log(`  ${isAvailable ? '✅' : '❌'} ${description}: ${isAvailable ? 'Enabled' : 'Disabled'}`);
  });
  console.log('');

  try {
    // Initialize scraper
    const config = {
      youtube: {
        apiKey: process.env.YOUTUBE_API_KEY || '',
        enabled: !!process.env.YOUTUBE_API_KEY && (source === 'all' || source === 'youtube'),
      },
      freesound: {
        apiKey: process.env.FREESOUND_API_KEY || '',
        enabled: !!process.env.FREESOUND_API_KEY && (source === 'all' || source === 'freesound'),
      },
      archive: {
        enabled: source === 'all' || source === 'archive',
      },
    };

    const scraper = new WeirdSoundsScraper(config);

    // Start scraping
    console.log('🚀 Starting scraping process...');
    const startTime = Date.now();

    const results = await scraper.scrapeAll(maxSounds);

    const duration = Math.round((Date.now() - startTime) / 1000);

    // Display results
    console.log('');
    console.log('📊 Scraping Results:');
    console.log('====================');
    console.log(`✅ Success: ${results.success}`);
    console.log(`🎵 Total Scraped: ${results.totalScraped}`);
    console.log(`⏱️  Duration: ${duration}s`);

    if (results.errors.length > 0) {
      console.log(`⚠️  Errors: ${results.errors.length}`);
      console.log('');
      console.log('Error Details:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    // Generate relationships
    if (results.totalScraped > 0) {
      console.log('');
      console.log('🕸️ Generating sound relationships...');

      const relationshipResults = await scraper.generateSoundRelationships();

      console.log(`🔗 Relationships Created: ${relationshipResults.created}`);

      if (relationshipResults.errors.length > 0) {
        console.log(`⚠️  Relationship Errors: ${relationshipResults.errors.length}`);
        relationshipResults.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }
    }

    console.log('');
    console.log('🎉 Scraping completed!');

  } catch (error) {
    console.error('');
    console.error('❌ Scraping failed:');
    console.error(error);
    process.exit(1);
  }
}

// Handle specific source scraping
async function scrapeSpecific() {
  const args = process.argv.slice(2);

  if (args.length < 3 || args[0] !== 'specific') {
    return false;
  }

  const source = args[1];
  const id = args[2];

  console.log('🎯 Specific Item Scraping');
  console.log('=========================');
  console.log(`Source: ${source}`);
  console.log(`ID: ${id}`);
  console.log('');

  const config = {
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

  try {
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
        throw new Error(`Invalid source: ${source}`);
    }

    if (result.success) {
      console.log('✅ Successfully scraped and saved item!');
    } else {
      console.error('❌ Failed to scrape item:', result.error);
    }

  } catch (error) {
    console.error('❌ Specific scraping failed:', error);
    process.exit(1);
  }

  return true;
}

// Check if running specific scraping
if (process.argv[2] === 'specific') {
  scrapeSpecific().catch(console.error);
} else {
  main().catch(console.error);
}

// Display usage information
if (process.argv[2] === '--help' || process.argv[2] === '-h') {
  console.log('🔊 Weird Sounds Scraping Script');
  console.log('===============================');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/scrape.js [source] [maxSounds]');
  console.log('  node scripts/scrape.js specific <source> <id>');
  console.log('');
  console.log('Sources:');
  console.log('  all        - Scrape from all available sources (default)');
  console.log('  youtube    - Scrape only from YouTube');
  console.log('  freesound  - Scrape only from Freesound');
  console.log('  archive    - Scrape only from Archive.org');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/scrape.js');
  console.log('  node scripts/scrape.js youtube 10');
  console.log('  node scripts/scrape.js specific youtube dQw4w9WgXcQ');
  console.log('  node scripts/scrape.js specific freesound 123456');
  console.log('  node scripts/scrape.js specific archive example_item');
  console.log('');
  console.log('Environment Variables:');
  console.log('  POSTGRES_URL      - Required: Database connection');
  console.log('  YOUTUBE_API_KEY   - Optional: YouTube Data API key');
  console.log('  FREESOUND_API_KEY - Optional: Freesound API key');
  process.exit(0);
}