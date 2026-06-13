import { Router } from 'express';
import { createJob, getJobs } from '../controllers/jobController';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { validateBody, jobSchema } from '../middleware/validation';
import { scrapeAndSeedJobs } from '../utils/jobScraper';

const router = Router();

router.post('/', authenticateJWT, authorizeRoles('RECRUITER'), validateBody(jobSchema), createJob);
router.get('/', getJobs);

router.get('/scrape-cron', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET || 'fallback_local_secret';
  
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized CRON request' });
  }

  try {
    console.log('[Cron Route] Triggering force jobs scrape & seed...');
    // Enable force seed check to run regardless of the 24 hour delay check
    process.env.FORCE_SEED = 'true';
    await scrapeAndSeedJobs();
    res.json({ success: true, message: 'Scrape and cleanup complete' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
