import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Cardiology', slug: 'cardiology', description: 'Heart health, ECG analysis, and vascular disease discussions.' },
    { name: 'Pediatrics', slug: 'pediatrics', description: 'Child development, neonatal care, and immunization topics.' },
    { name: 'Oncology', slug: 'oncology', description: 'Cancer research, chemotherapy updates, and oncology clinical discussions.' },
    { name: 'Neurology', slug: 'neurology', description: 'Brain health, neurological disorders, and neuro-surgery insights.' },
    { name: 'General Medicine', slug: 'general-medicine', description: 'General diagnosis, updates in family medicine, and clinical practice.' },
  ];

  for (const cat of categories) {
    await prisma.forumCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log('🌱 Forum categories seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
