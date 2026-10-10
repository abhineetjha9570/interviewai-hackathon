import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const baselineAreas = [
  {
    topic: 'Dynamic Programming',
    category: 'DSA',
    accuracy: 38,
    priority: 'HIGH',
    questionsRecommended: 10,
    reason: 'Essential tier-1 company topic requiring practice on memoization and tabulation state transitions.',
    practiceUrl: '/practice?category=DSA&topic=Dynamic%20Programming&problem=climbing-stairs&autoStart=true',
  },
  {
    topic: 'Graph Algorithms',
    category: 'DSA',
    accuracy: 42,
    priority: 'HIGH',
    questionsRecommended: 8,
    reason: 'Requires revision on BFS/DFS traversal, Dijkstra shortest path, and Topological Sort.',
    practiceUrl: '/practice?category=DSA&topic=Graph&autoStart=true',
  },
  {
    topic: 'System Design Basics',
    category: 'TECHNICAL',
    accuracy: 48,
    priority: 'MEDIUM',
    questionsRecommended: 6,
    reason: 'Key placement requirement: caching hierarchies (Redis), database sharding, and latency tradeoffs.',
    practiceUrl: '/practice?category=Technical&topic=System%20Design%20Basics&autoStart=true',
  },
  {
    topic: 'DBMS Normalization & Indexing',
    category: 'TECHNICAL',
    accuracy: 52,
    priority: 'MEDIUM',
    questionsRecommended: 12,
    reason: 'Review BCNF, transitive dependencies, and B+ Tree indexing mechanics.',
    practiceUrl: '/practice?category=Technical&topic=DBMS%20%26%20SQL&autoStart=true',
  },
  {
    topic: 'Behavioral Communication (STAR)',
    category: 'HR',
    accuracy: 62,
    priority: 'LOW',
    questionsRecommended: 5,
    reason: 'Sharpen behavioral answers using the STAR method with quantifiable impact and metrics.',
    practiceUrl: '/practice?category=HR&topic=Behavioral%20(STAR%20Method)&autoStart=true',
  },
];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        weakAreas: baselineAreas,
        hasRealData: false,
      });
    }

    // 1. Fetch practice sessions to identify topics with low accuracy
    const practiceSessions = await prisma.practiceSession.findMany({
      where: { userId: user.id },
      include: { answers: true },
    });

    const topicStats: Record<string, { total: number; correct: number; category: string }> = {};

    practiceSessions.forEach((s) => {
      const topic = s.topic || 'General';
      if (!topicStats[topic]) {
        topicStats[topic] = { total: 0, correct: 0, category: s.category };
      }
      topicStats[topic].total += s.completedQuestions;
      topicStats[topic].correct += s.correctQuestions;
    });

    const identifiedWeakAreas: any[] = [];

    // Check low-accuracy topics from practice
    Object.entries(topicStats).forEach(([topic, stat]) => {
      if (stat.total >= 3) {
        const accuracy = Math.round((stat.correct / stat.total) * 100);
        if (accuracy < 70) {
          identifiedWeakAreas.push({
            topic,
            category: stat.category,
            accuracy,
            priority: accuracy < 50 ? 'HIGH' : 'MEDIUM',
            questionsRecommended: accuracy < 50 ? 10 : 6,
            reason: `Accuracy is currently ${accuracy}% based on ${stat.total} attempted questions.`,
            practiceUrl: `/practice?category=${encodeURIComponent(stat.category)}&topic=${encodeURIComponent(topic)}&autoStart=true`,
          });
        }
      }
    });

    // 2. Check failed coding submissions
    const failedCodings = await prisma.codingSubmission.findMany({
      where: {
        userId: user.id,
        status: { not: 'ACCEPTED' },
      },
      include: { problem: true },
      take: 5,
    });

    failedCodings.forEach((fc) => {
      if (!identifiedWeakAreas.some((w) => w.topic === fc.problem.title)) {
        identifiedWeakAreas.push({
          topic: fc.problem.title,
          category: 'DSA & Coding',
          accuracy: fc.totalTestCases > 0 ? Math.round((fc.passedTestCases / fc.totalTestCases) * 100) : 0,
          priority: 'HIGH',
          questionsRecommended: 5,
          reason: `Failed test cases in recent submission (${fc.status.replace('_', ' ')}).`,
          practiceUrl: `/practice?category=DSA&topic=Array&problem=${fc.problem.slug}&autoStart=true`,
        });
      }
    });

    const areasToReturn = identifiedWeakAreas.length > 0 ? identifiedWeakAreas : baselineAreas;

    return NextResponse.json({
      weakAreas: areasToReturn,
      hasRealData: identifiedWeakAreas.length > 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
