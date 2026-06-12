import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const fallbackJobs = [
  {
    title: 'Senior Resident in Cardiology',
    description: 'Seeking an experienced Cardiology Senior Resident for clinical cardiology ward supervision, echocardiography reporting, and intensive care management. Candidates must hold MD/DNB in General Medicine or Cardiology.',
    specialty: 'Cardiology',
    location: 'Delhi NCR',
  },
  {
    title: 'Pediatrician (MD/DNB)',
    description: 'Seeking a compassionate Pediatrician for outpatient clinical care, immunization schedule management, and neonatal ICU support. Full-time position with competitive benefits.',
    specialty: 'Pediatrics',
    location: 'Mumbai',
  },
  {
    title: 'Clinical Oncology Consultant',
    description: 'Tata Memorial affiliated center is recruiting a Consultant in Clinical Oncology to manage chemotherapy plans, radiotherapy mapping, and inpatient oncology services.',
    specialty: 'Oncology',
    location: 'Mumbai',
  },
  {
    title: 'Consultant Neurosurgeon',
    description: 'NIMHANS is inviting applications for a Consultant Neurosurgeon to manage trauma neurosurgery and coordinate clinical research programs.',
    specialty: 'Neurology',
    location: 'Bengaluru',
  },
  {
    title: 'General Practitioner / MBBS Duty Doctor',
    description: 'Duties include primary patient triaging, emergency ward cover, and minor surgical procedures under supervision. Shift-based schedule.',
    specialty: 'General Medicine',
    location: 'Chennai',
  },
  {
    title: 'Clinical Pharmacist',
    description: 'Hospital pharmacist required for inpatient prescription audits, drug reconciliation, and medication counseling.',
    specialty: 'Pharmacist',
    location: 'Hyderabad',
  },
  {
    title: 'Senior Nurse - Intensive Care Unit',
    description: 'ICU Senior Nurse wanted for critical care monitoring, ventilator patient care, and assistant duties for senior intensivists.',
    specialty: 'Nurse',
    location: 'Pune',
  }
];

function extractTagContent(xml: string, tagName: string): string {
  const match = xml.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`));
  if (!match) return '';
  let content = match[1].trim();
  // Strip CDATA wrapper if present
  if (content.startsWith('<![CDATA[') && content.endsWith(']]>')) {
    content = content.substring(9, content.length - 3).trim();
  }
  return content;
}

const detectSpecialty = (title: string, desc: string): string => {
  const text = (title + ' ' + desc).toLowerCase();
  if (text.includes('cardio')) return 'Cardiology';
  if (text.includes('pedia') || text.includes('child')) return 'Pediatrics';
  if (text.includes('onco') || text.includes('cancer')) return 'Oncology';
  if (text.includes('neuro') || text.includes('brain')) return 'Neurology';
  if (text.includes('nurs')) return 'Nurse';
  if (text.includes('pharmac')) return 'Pharmacist';
  if (text.includes('dent') || text.includes('oral')) return 'Dentistry';
  if (text.includes('surg')) return 'Surgery';
  if (text.includes('psych')) return 'Psychiatry';
  if (text.includes('radiolog')) return 'Radiology';
  return 'General Medicine';
};

const detectLocation = (title: string): string => {
  const parts = title.split(' at ');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return 'Remote / Global';
};

export const scrapeAndSeedJobs = async (): Promise<void> => {
  try {
    const systemEmail = 'system-recruiter@linkedoc.com';
    
    // Find or create system recruiter user
    let recruiter = await prisma.user.findUnique({
      where: { email: systemEmail }
    });
    
    if (!recruiter) {
      const passwordHash = bcrypt.hashSync('SystemRecruiterSecurePassword123!', 10);
      recruiter = await prisma.user.create({
        data: {
          name: 'LinkeDoc Scraping System',
          email: systemEmail,
          passwordHash,
          role: 'RECRUITER',
          status: 'APPROVED',
        }
      });
    }

    // Rate limiting: check if listings were scraped recently
    const latestJob = await prisma.jobListing.findFirst({
      where: { recruiterId: recruiter.id },
      orderBy: { createdAt: 'desc' }
    });

    if (latestJob) {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      if (latestJob.createdAt > oneDayAgo) {
        console.log('[Scraper] Jobs were scraped/seeded recently (less than 24 hours ago). Skipping scraper run.');
        return;
      }
    }

    let jobsParsed: Array<{ title: string; description: string; specialty: string; location: string }> = [];

    try {
      console.log('[Scraper] Fetching medical/clinical vacancies from HigherEdJobs RSS...');
      // Set a short fetch timeout (10 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://www.higheredjobs.com/rss/categoryFeed.cfm?catID=29', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlText = await response.text();
      
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemXml = match[1];
        const title = extractTagContent(itemXml, 'title');
        const description = extractTagContent(itemXml, 'description');
        
        if (title) {
          jobsParsed.push({
            title,
            description: description || 'No description provided.',
            specialty: detectSpecialty(title, description),
            location: detectLocation(title)
          });
        }
      }
    } catch (err) {
      console.error('[Scraper] Network or parsing error. Falling back to local medical listings.', err);
    }

    if (jobsParsed.length === 0) {
      console.log('[Scraper] No jobs scraped from RSS feed. Using local clinical fallback database.');
      jobsParsed = fallbackJobs;
    }

    // Seed listings in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    let createdCount = 0;
    for (const job of jobsParsed) {
      const title = job.title.trim();
      const description = job.description.trim();

      const existing = await prisma.jobListing.findFirst({
        where: {
          recruiterId: recruiter.id,
          title
        }
      });

      if (!existing) {
        await prisma.jobListing.create({
          data: {
            recruiterId: recruiter.id,
            title,
            description,
            specialty: job.specialty,
            location: job.location,
            expiresAt,
          }
        });
        createdCount++;
      }
    }
    console.log(`[Scraper] Seeded ${createdCount} new medical vacancies successfully.`);

  } catch (err) {
    console.error('[Scraper] Fatal error in scrapeAndSeedJobs:', err);
  }
};
