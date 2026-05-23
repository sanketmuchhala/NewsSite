import { RssScraper } from './lib/scrapers/rss';

async function main() {
  const scraper = new RssScraper();
  console.log('Fetching feeds...');
  const feeds = scraper.getDefaultFunnyNewsFeeds();
  console.log('Feeds:', feeds);
  
  // Just test the first few
  const scraper2 = new RssScraper(feeds.slice(0, 3));
  const results = await scraper2.parseAllFeeds(2);
  console.log(`Got ${results.length} results:`);
  results.forEach(r => console.log(`- ${r.title} (${r.source})`));
}

main().catch(console.error);
