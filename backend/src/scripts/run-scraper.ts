import { scrapeAndSeedJobs } from '../utils/jobScraper';

async function run() {
  console.log('[Runner] Starting job scraper & seeder force run...');
  await scrapeAndSeedJobs();
  console.log('[Runner] Finished scraper & seeder run!');
}

run().catch(console.error);
