import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const fallbackJobs = [
  {
    title: 'Senior Resident in Cardiology',
    description: 'Seeking an experienced Cardiology Senior Resident for clinical cardiology ward supervision, echocardiography reporting, and intensive care management. Candidates must hold MD/DNB in General Medicine or Cardiology.',
    specialty: 'Cardiology',
    location: 'Delhi NCR',
    applyUrl: 'mailto:hr@aiims.edu',
  },
  {
    title: 'Pediatrician (MD/DNB)',
    description: 'Seeking a compassionate Pediatrician for outpatient clinical care, immunization schedule management, and neonatal ICU support. Full-time position with competitive benefits.',
    specialty: 'Pediatrics',
    location: 'Mumbai',
    applyUrl: 'mailto:careers@fortishealthcare.com',
  },
  {
    title: 'Clinical Oncology Consultant',
    description: 'Tata Memorial affiliated center is recruiting a Consultant in Clinical Oncology to manage chemotherapy plans, radiotherapy mapping, and inpatient oncology services.',
    specialty: 'Oncology',
    location: 'Mumbai',
    applyUrl: 'https://tmc.gov.in/m_events/Events/JobVacancies',
  },
  {
    title: 'Consultant Neurosurgeon',
    description: 'NIMHANS is inviting applications for a Consultant Neurosurgeon to manage trauma neurosurgery and coordinate clinical research programs.',
    specialty: 'Neurology',
    location: 'Bengaluru',
    applyUrl: 'https://nimhans.ac.in/careers',
  },
  {
    title: 'General Practitioner / MBBS Duty Doctor',
    description: 'Duties include primary patient triaging, emergency ward cover, and minor surgical procedures under supervision. Shift-based schedule.',
    specialty: 'General Medicine',
    location: 'Chennai',
    applyUrl: 'mailto:careers@apollohospitals.com',
  },
  {
    title: 'Clinical Pharmacist',
    description: 'Hospital pharmacist required for inpatient prescription audits, drug reconciliation, and medication counseling.',
    specialty: 'Pharmacist',
    location: 'Hyderabad',
    applyUrl: 'mailto:hr@maxhealthcare.com',
  },
  {
    title: 'Senior Nurse - Intensive Care Unit',
    description: 'ICU Senior Nurse wanted for critical care monitoring, ventilator patient care, and assistant duties for senior intensivists.',
    specialty: 'Nurse',
    location: 'Pune',
    applyUrl: 'mailto:nursing.careers@medanta.org',
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

    if (latestJob && process.env.FORCE_SEED !== 'true') {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      if (latestJob.createdAt > oneDayAgo) {
        console.log('[Scraper] Jobs were scraped/seeded recently (less than 24 hours ago). Skipping scraper run.');
        return;
      }
    }

    let jobsParsed: Array<{ title: string; description: string; specialty: string; location: string; applyUrl?: string }> = [];

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
        const link = extractTagContent(itemXml, 'link');
        
        if (title) {
          jobsParsed.push({
            title,
            description: description || 'No description provided.',
            specialty: detectSpecialty(title, description),
            location: detectLocation(title),
            applyUrl: link || 'https://www.higheredjobs.com'
          });
        }
      }
    } catch (err) {
      console.error('[Scraper] Network or parsing error. Falling back to local medical listings.', err);
    }

    // Combine local Indian fallback jobs and any scraped jobs
    const allJobsToSeed = [...fallbackJobs, ...jobsParsed];

    // Seed listings in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    let createdCount = 0;
    let updatedCount = 0;
    for (const job of allJobsToSeed) {
      const title = job.title.trim();
      const description = job.description.trim();

      const existing = await prisma.jobListing.findFirst({
        where: {
          recruiterId: recruiter.id,
          title
        }
      });

      if (existing) {
        if (existing.applyUrl !== (job.applyUrl || null)) {
          await prisma.jobListing.update({
            where: { id: existing.id },
            data: { applyUrl: job.applyUrl || null }
          });
          updatedCount++;
        }
      } else {
        await prisma.jobListing.create({
          data: {
            recruiterId: recruiter.id,
            title,
            description,
            specialty: job.specialty,
            location: job.location,
            applyUrl: job.applyUrl || null,
            expiresAt,
          }
        });
        createdCount++;
      }
    }
    
    // Cleanup: remove expired jobs from DB
    const deleted = await prisma.jobListing.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    
    console.log(`[Scraper] Seeding complete: Created ${createdCount}, updated ${updatedCount}, and cleaned up ${deleted.count} expired listings.`);

  } catch (err) {
    console.error('[Scraper] Fatal error in scrapeAndSeedJobs:', err);
  }
};
