import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getQuestionsForCategoryAndTopic,
  CODING_PROBLEMS_BANK,
  CodingProblemDef
} from '@/lib/question-generator';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'DSA & Coding';
    const topic = searchParams.get('topic') || '';
    const difficulty = searchParams.get('difficulty') || 'Medium';
    const problemSlug = searchParams.get('problem') || '';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const normCat = category.toUpperCase().trim();
    const isDsa = normCat.includes('DSA') || normCat.includes('CODING');
    const isAptitude = normCat.includes('APTITUDE') || normCat.includes('QUANT') || normCat.includes('LOGIC') || normCat.includes('VERBAL');
    const isTechnical = normCat.includes('TECH') || normCat.includes('CORE') || normCat.includes('CS') || normCat.includes('DBMS') || normCat.includes('SYSTEM') || normCat.includes('OS');
    const isHr = normCat.includes('HR') || normCat.includes('BEHAVIOR');

    // ==========================================
    // 1. DSA & CODING CATEGORY
    // ==========================================
    if (isDsa) {
      // Fetch coding problems from DB
      const dbProblems = await prisma.codingProblem.findMany();

      // Convert DB problems to unified format
      const unifiedDb: CodingProblemDef[] = dbProblems.map(cp => ({
        id: cp.id,
        title: cp.title,
        slug: cp.slug,
        difficulty: cp.difficulty as any,
        tags: JSON.parse(cp.tags || '[]'),
        description: cp.description,
        examples: JSON.parse(cp.examples || '[]'),
        constraints: JSON.parse(cp.constraints || '[]'),
        hints: JSON.parse(cp.hints || '[]'),
        explanation: cp.explanation,
        starterCodeJava: cp.starterCodeJava,
        solutionJava: cp.solutionJava,
        testCases: JSON.parse(cp.testCases || '[]'),
      }));

      // Combine DB problems and comprehensive offline bank, deduplicating by slug
      const poolMap = new Map<string, CodingProblemDef>();
      unifiedDb.forEach(p => poolMap.set(p.slug.toLowerCase(), p));
      CODING_PROBLEMS_BANK.forEach(p => {
        if (!poolMap.has(p.slug.toLowerCase())) {
          poolMap.set(p.slug.toLowerCase(), p);
        }
      });
      const allProblems = Array.from(poolMap.values());

      let ordered: CodingProblemDef[] = [];

      // 1. If a specific problem slug was requested, place it at the beginning
      if (problemSlug) {
        const targetNorm = problemSlug.toLowerCase().replace(/[-_]/g, ' ');
        const matched = allProblems.find(
          p => p.slug.toLowerCase() === problemSlug.toLowerCase() ||
               p.title.toLowerCase().includes(targetNorm)
        );
        if (matched) {
          ordered.push(matched);
        }
      }

      // 2. Add topic-matching problems
      if (topic && topic !== 'All' && topic !== 'Mixed Practice') {
        const topicNorm = topic.toLowerCase();
        const topicMatches = allProblems.filter(p =>
          !ordered.some(o => o.slug === p.slug) &&
          (p.tags.some(t => t.toLowerCase().includes(topicNorm)) ||
           p.title.toLowerCase().includes(topicNorm))
        );
        ordered.push(...topicMatches);
      }

      // 3. Fill up to `limit` with other distinct coding problems from the pool
      for (const p of allProblems) {
        if (ordered.length >= limit) break;
        if (!ordered.some(o => o.slug === p.slug)) {
          ordered.push(p);
        }
      }

      const finalQuestions = ordered.slice(0, limit);

      return NextResponse.json({
        type: 'CODING',
        category: 'DSA & Coding',
        topic: topic || 'DSA',
        questions: finalQuestions.map(cp => ({
          id: cp.id,
          title: cp.title,
          slug: cp.slug,
          difficulty: cp.difficulty,
          tags: cp.tags,
          description: cp.description,
          examples: cp.examples,
          constraints: cp.constraints,
          hints: cp.hints,
          explanation: cp.explanation,
          starterCodeJava: cp.starterCodeJava,
          solutionJava: cp.solutionJava,
          testCases: cp.testCases,
        })),
      });
    }

    // ==========================================
    // 2. APTITUDE CATEGORY
    // ==========================================
    if (isAptitude) {
      const dbQuestions = await prisma.question.findMany({
        where: { category: 'APTITUDE' },
      });

      const generated = getQuestionsForCategoryAndTopic('Aptitude', topic, difficulty, problemSlug, limit);

      const combined = [
        ...dbQuestions.map(q => ({
          id: q.id,
          title: q.title,
          category: 'APTITUDE',
          topic: q.topic,
          difficulty: q.difficulty,
          description: q.description,
          options: q.options ? JSON.parse(q.options) : [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          hints: q.hints ? JSON.parse(q.hints) : [],
          companyTags: q.companyTags ? JSON.parse(q.companyTags) : [],
        })),
        ...generated
      ];

      // Deduplicate by title
      const uniqueMap = new Map<string, any>();
      // Place specific slug / topic matches first
      combined.forEach(q => {
        const key = q.title.toLowerCase().trim();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, q);
        }
      });

      const uniqueList = Array.from(uniqueMap.values());
      const finalQuestions = uniqueList.slice(0, limit);

      return NextResponse.json({
        type: 'APTITUDE',
        category: 'Aptitude',
        topic: topic || 'Quantitative Aptitude',
        questions: finalQuestions,
      });
    }

    // ==========================================
    // 3. TECHNICAL (CORE CS) CATEGORY
    // ==========================================
    if (isTechnical) {
      const dbQuestions = await prisma.question.findMany({
        where: { category: 'TECHNICAL' },
      });

      const generated = getQuestionsForCategoryAndTopic('Technical', topic, difficulty, problemSlug, limit);

      const combined = [
        ...dbQuestions.map(q => ({
          id: q.id,
          title: q.title,
          category: 'TECHNICAL',
          topic: q.topic,
          difficulty: q.difficulty,
          description: q.description,
          options: q.options ? JSON.parse(q.options) : [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          hints: q.hints ? JSON.parse(q.hints) : [],
          companyTags: q.companyTags ? JSON.parse(q.companyTags) : [],
        })),
        ...generated
      ];

      const uniqueMap = new Map<string, any>();
      combined.forEach(q => {
        const key = q.title.toLowerCase().trim();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, q);
        }
      });

      const uniqueList = Array.from(uniqueMap.values());
      const finalQuestions = uniqueList.slice(0, limit);

      return NextResponse.json({
        type: 'TECHNICAL',
        category: 'Technical',
        topic: topic || 'DBMS & SQL',
        questions: finalQuestions,
      });
    }

    // ==========================================
    // 4. HR / BEHAVIORAL CATEGORY
    // ==========================================
    if (isHr) {
      const dbQuestions = await prisma.question.findMany({
        where: { category: 'HR' },
      });

      const generated = getQuestionsForCategoryAndTopic('HR', topic, difficulty, problemSlug, limit);

      const combined = [
        ...dbQuestions.map(q => ({
          id: q.id,
          title: q.title,
          category: 'HR',
          topic: q.topic,
          difficulty: q.difficulty,
          description: q.description,
          options: q.options ? JSON.parse(q.options) : [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          hints: q.hints ? JSON.parse(q.hints) : [],
          companyTags: q.companyTags ? JSON.parse(q.companyTags) : [],
        })),
        ...generated
      ];

      const uniqueMap = new Map<string, any>();
      combined.forEach(q => {
        const key = q.title.toLowerCase().trim();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, q);
        }
      });

      const uniqueList = Array.from(uniqueMap.values());
      const finalQuestions = uniqueList.slice(0, limit);

      return NextResponse.json({
        type: 'HR',
        category: 'HR / Behavioral',
        topic: topic || 'Behavioral (STAR Method)',
        questions: finalQuestions,
      });
    }

    // Default fallback
    const fallback = await prisma.question.findMany({ take: limit });
    return NextResponse.json({
      type: 'STANDARD',
      questions: fallback.map(q => ({
        id: q.id,
        title: q.title,
        category: q.category,
        topic: q.topic,
        difficulty: q.difficulty,
        description: q.description,
        options: q.options ? JSON.parse(q.options) : [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        hints: q.hints ? JSON.parse(q.hints) : [],
        companyTags: q.companyTags ? JSON.parse(q.companyTags) : [],
      }))
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
