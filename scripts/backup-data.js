const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportAll() {
  console.log('Exporting all existing data from SQLite dev.db...');
  const data = {};

  const models = [
    'user',
    'profile',
    'resume',
    'jobDescription',
    'question',
    'practiceSession',
    'practiceAnswer',
    'codingProblem',
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

  for (const m of models) {
    if (prisma[m]) {
      try {
        data[m] = await prisma[m].findMany();
        console.log(`Exported ${data[m].length} records from ${m}`);
      } catch (err) {
        console.warn(`Skipped ${m}:`, err.message);
      }
    }
  }

  const outPath = path.join(__dirname, '..', 'prisma', 'backup-data.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\nSuccessfully exported full database backup to: ${outPath}`);
}

exportAll()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
