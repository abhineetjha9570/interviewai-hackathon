const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importAll() {
  const backupPath = path.join(__dirname, '..', 'prisma', 'backup-data.json');
  if (!fs.existsSync(backupPath)) {
    console.error('Backup file not found at:', backupPath);
    return;
  }

  const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  console.log('Restoring data from backup snapshot...');

  // Insertion in exact foreign key dependency order
  const order = [
    'user',
    'profile',
    'resume',
    'jobDescription',
    'question',
    'codingProblem',
    'practiceSession',
    'practiceAnswer',
    'codingSubmission',
    'mockInterview',
    'mockRound',
    'avatarInterview',
    'avatarMessage',
    'proctoringEvent',
    'recommendation',
    'subscription',
    'careerRoadmap',
    'roadmapPhase',
    'roadmapMilestone',
    'aptitudeRoom',
    'aptitudeParticipant',
    'aptitudeRoomQuestion',
    'aptitudeAnswerRecord',
    'aptitudeIntegrityEvent',
    'aptitudeGameResult',
    'gDRoom',
    'gDParticipant',
    'gDTranscriptEntry',
    'gDSessionReport',
  ];

  for (const m of order) {
    const records = data[m] || [];
    if (records.length === 0) continue;

    console.log(`Restoring ${records.length} records into ${m}...`);
    for (const record of records) {
      try {
        // Convert date strings back to Date objects
        const clean = { ...record };
        for (const [k, v] of Object.entries(clean)) {
          if (
            typeof v === 'string' &&
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)
          ) {
            clean[k] = new Date(v);
          }
        }

        // Upsert by ID if available, otherwise create
        if (clean.id && prisma[m]?.upsert) {
          await prisma[m].upsert({
            where: { id: clean.id },
            update: clean,
            create: clean,
          });
        } else if (clean.roomCode && m === 'aptitudeGameResult') {
          await prisma[m].create({ data: clean });
        } else if (prisma[m]?.create) {
          await prisma[m].create({ data: clean });
        }
      } catch (err) {
        // Ignore duplicate inserts on re-runs
        if (!err.message.includes('Unique constraint')) {
          console.warn(`Record insert warning on ${m}:`, err.message);
        }
      }
    }
  }

  console.log('\nData restoration completed successfully!');
}

importAll()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
