const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
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
    'gDRoom',
    'gDParticipant',
    'gDTranscriptEntry',
    'gDSessionReport',
  ];

  console.log('--- Dev Database Record Counts ---');
  for (const m of models) {
    try {
      const count = await prisma[m].count();
      if (count > 0) {
        console.log(`${m}: ${count}`);
      }
    } catch (e) {
      console.warn(`Error on ${m}:`, e.message);
    }
  }
}

check().finally(() => prisma.$disconnect());
