import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { executeCode, TestCase } from '@/lib/code-runner';

export async function POST(req: Request) {
  try {
    const { code, problemSlug, language = 'java' } = await req.json();

    if (!code || !problemSlug) {
      return NextResponse.json({ error: 'Code and problemSlug required' }, { status: 400 });
    }

    const problem = await prisma.codingProblem.findUnique({
      where: { slug: problemSlug },
    });

    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    const testCases: TestCase[] = JSON.parse(problem.testCases || '[]');

    // Execute real code (Java, Python, JS) in sandbox
    const result = await executeCode(language, code, problem.slug, testCases);

    // Save submission record
    const user = await getCurrentUser();
    if (user) {
      await prisma.codingSubmission.create({
        data: {
          userId: user.id,
          problemId: problem.id,
          language,
          code,
          status: result.status,
          passedTestCases: result.passedTestCases,
          totalTestCases: result.totalTestCases,
          runtimeMs: result.runtimeMs,
          memoryKb: result.memoryKb,
          output: result.output,
          errorMessage: result.errorMessage,
        },
      });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Code execution error:', err);
    return NextResponse.json(
      {
        status: 'RUNTIME_ERROR',
        passedTestCases: 0,
        totalTestCases: 0,
        runtimeMs: 0,
        memoryKb: 0,
        errorMessage: err.message || 'Execution failed on server',
        testCaseResults: [],
      },
      { status: 500 }
    );
  }
}
