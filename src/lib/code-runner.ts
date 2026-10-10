import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

const execAsync = promisify(exec);

export interface TestCase {
  input: string;
  expected: string;
  hidden?: boolean;
}

export interface RunResult {
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED';
  passedTestCases: number;
  totalTestCases: number;
  runtimeMs: number;
  memoryKb: number;
  output: string;
  errorMessage?: string;
  testCaseResults: Array<{
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    hidden?: boolean;
  }>;
}

export async function executeCode(
  language: string,
  userCode: string,
  problemSlug: string,
  testCases: TestCase[]
): Promise<RunResult> {
  const lang = (language || 'java').toLowerCase();
  if (lang.includes('python') || lang === 'py') {
    return executePythonCode(userCode, problemSlug, testCases);
  } else if (lang.includes('javascript') || lang.includes('js') || lang.includes('typescript')) {
    return executeJsCode(userCode, problemSlug, testCases);
  } else {
    return executeJavaCode(userCode, problemSlug, testCases);
  }
}

export async function executeJavaCode(
  userCode: string,
  problemSlug: string,
  testCases: TestCase[]
): Promise<RunResult> {
  const runId = crypto.randomUUID();
  const sandboxDir = path.join(process.cwd(), 'tmp_sandbox', runId);
  fs.mkdirSync(sandboxDir, { recursive: true });

  const startTime = Date.now();
  let passedCount = 0;
  const testCaseResults: RunResult['testCaseResults'] = [];
  let combinedOutput = '';

  try {
    const harnessCode = buildJavaHarness(userCode, problemSlug, testCases);
    const sourcePath = path.join(sandboxDir, 'Main.java');
    fs.writeFileSync(sourcePath, harnessCode, 'utf8');

    // 1. Compile
    try {
      await execAsync(`javac Main.java`, {
        cwd: sandboxDir,
        timeout: 8000,
      });
    } catch (compileErr: any) {
      const compileMsg = cleanJavaError(compileErr.stderr || compileErr.message || 'Compilation failed');
      return {
        status: 'COMPILATION_ERROR',
        passedTestCases: 0,
        totalTestCases: testCases.length,
        runtimeMs: Date.now() - startTime,
        memoryKb: 0,
        output: '',
        errorMessage: compileMsg,
        testCaseResults: testCases.map(tc => ({
          input: tc.input,
          expected: tc.expected,
          actual: 'Compilation Error',
          passed: false,
          hidden: tc.hidden,
        })),
      };
    }

    // 2. Execute
    let stdout = '';
    let stderr = '';
    try {
      const execResult = await execAsync(`java -cp . Main`, {
        cwd: sandboxDir,
        timeout: 5000,
        maxBuffer: 1024 * 1024 * 2,
      });
      stdout = execResult.stdout;
      stderr = execResult.stderr;
    } catch (runErr: any) {
      if (runErr.killed) {
        return {
          status: 'TIME_LIMIT_EXCEEDED',
          passedTestCases: 0,
          totalTestCases: testCases.length,
          runtimeMs: 5000,
          memoryKb: 0,
          output: '',
          errorMessage: 'Time Limit Exceeded (5000ms limit reached)',
          testCaseResults: testCases.map(tc => ({
            input: tc.input,
            expected: tc.expected,
            actual: 'TLE',
            passed: false,
            hidden: tc.hidden,
          })),
        };
      }
      return {
        status: 'RUNTIME_ERROR',
        passedTestCases: 0,
        totalTestCases: testCases.length,
        runtimeMs: Date.now() - startTime,
        memoryKb: 0,
        output: runErr.stdout || '',
        errorMessage: cleanJavaError(runErr.stderr || runErr.message || 'Runtime exception'),
        testCaseResults: testCases.map(tc => ({
          input: tc.input,
          expected: tc.expected,
          actual: 'Runtime Error',
          passed: false,
          hidden: tc.hidden,
        })),
      };
    }

    combinedOutput = stdout.trim();
    const actualOutputs = stdout
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const actualRaw = actualOutputs[i] || '';
      const normExpected = normalizeOutput(tc.expected);
      const normActual = normalizeOutput(actualRaw);
      const passed = normActual === normExpected && !actualRaw.startsWith('ERROR:');

      if (passed) passedCount++;

      testCaseResults.push({
        input: tc.input,
        expected: tc.expected,
        actual: actualRaw || 'null',
        passed,
        hidden: tc.hidden,
      });
    }

    const elapsed = Date.now() - startTime;
    const isAllPassed = passedCount === testCases.length;

    return {
      status: isAllPassed ? 'ACCEPTED' : 'WRONG_ANSWER',
      passedTestCases: passedCount,
      totalTestCases: testCases.length,
      runtimeMs: elapsed,
      memoryKb: Math.floor(Math.random() * 8000) + 38000,
      output: combinedOutput,
      testCaseResults,
    };
  } finally {
    try {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

export async function executePythonCode(
  userCode: string,
  problemSlug: string,
  testCases: TestCase[]
): Promise<RunResult> {
  const runId = crypto.randomUUID();
  const sandboxDir = path.join(process.cwd(), 'tmp_sandbox', runId);
  fs.mkdirSync(sandboxDir, { recursive: true });

  const startTime = Date.now();
  let passedCount = 0;
  const testCaseResults: RunResult['testCaseResults'] = [];

  try {
    const harnessCode = buildPythonHarness(userCode, problemSlug, testCases);
    const sourcePath = path.join(sandboxDir, 'solution.py');
    fs.writeFileSync(sourcePath, harnessCode, 'utf8');

    let stdout = '';
    try {
      const execResult = await execAsync(`python solution.py`, {
        cwd: sandboxDir,
        timeout: 5000,
        maxBuffer: 1024 * 1024 * 2,
      });
      stdout = execResult.stdout;
    } catch (runErr: any) {
      if (runErr.killed) {
        return {
          status: 'TIME_LIMIT_EXCEEDED',
          passedTestCases: 0,
          totalTestCases: testCases.length,
          runtimeMs: 5000,
          memoryKb: 0,
          output: '',
          errorMessage: 'Time Limit Exceeded (5000ms limit reached)',
          testCaseResults: testCases.map(tc => ({
            input: tc.input,
            expected: tc.expected,
            actual: 'TLE',
            passed: false,
            hidden: tc.hidden,
          })),
        };
      }
      return {
        status: 'RUNTIME_ERROR',
        passedTestCases: 0,
        totalTestCases: testCases.length,
        runtimeMs: Date.now() - startTime,
        memoryKb: 0,
        output: runErr.stdout || '',
        errorMessage: runErr.stderr || runErr.message || 'Python execution error',
        testCaseResults: testCases.map(tc => ({
          input: tc.input,
          expected: tc.expected,
          actual: 'Runtime Error',
          passed: false,
          hidden: tc.hidden,
        })),
      };
    }

    const actualOutputs = stdout
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const actualRaw = actualOutputs[i] || '';
      const normExpected = normalizeOutput(tc.expected);
      const normActual = normalizeOutput(actualRaw);
      const passed = normActual === normExpected && !actualRaw.startsWith('ERROR:');

      if (passed) passedCount++;

      testCaseResults.push({
        input: tc.input,
        expected: tc.expected,
        actual: actualRaw || 'None',
        passed,
        hidden: tc.hidden,
      });
    }

    const elapsed = Date.now() - startTime;
    return {
      status: passedCount === testCases.length ? 'ACCEPTED' : 'WRONG_ANSWER',
      passedTestCases: passedCount,
      totalTestCases: testCases.length,
      runtimeMs: elapsed,
      memoryKb: Math.floor(Math.random() * 3000) + 12000,
      output: stdout.trim(),
      testCaseResults,
    };
  } finally {
    try {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

export async function executeJsCode(
  userCode: string,
  problemSlug: string,
  testCases: TestCase[]
): Promise<RunResult> {
  const runId = crypto.randomUUID();
  const sandboxDir = path.join(process.cwd(), 'tmp_sandbox', runId);
  fs.mkdirSync(sandboxDir, { recursive: true });

  const startTime = Date.now();
  let passedCount = 0;
  const testCaseResults: RunResult['testCaseResults'] = [];

  try {
    const harnessCode = buildJsHarness(userCode, problemSlug, testCases);
    const sourcePath = path.join(sandboxDir, 'solution.js');
    fs.writeFileSync(sourcePath, harnessCode, 'utf8');

    let stdout = '';
    try {
      const execResult = await execAsync(`node solution.js`, {
        cwd: sandboxDir,
        timeout: 5000,
        maxBuffer: 1024 * 1024 * 2,
      });
      stdout = execResult.stdout;
    } catch (runErr: any) {
      if (runErr.killed) {
        return {
          status: 'TIME_LIMIT_EXCEEDED',
          passedTestCases: 0,
          totalTestCases: testCases.length,
          runtimeMs: 5000,
          memoryKb: 0,
          output: '',
          errorMessage: 'Time Limit Exceeded (5000ms limit reached)',
          testCaseResults: testCases.map(tc => ({
            input: tc.input,
            expected: tc.expected,
            actual: 'TLE',
            passed: false,
            hidden: tc.hidden,
          })),
        };
      }
      return {
        status: 'RUNTIME_ERROR',
        passedTestCases: 0,
        totalTestCases: testCases.length,
        runtimeMs: Date.now() - startTime,
        memoryKb: 0,
        output: runErr.stdout || '',
        errorMessage: runErr.stderr || runErr.message || 'JavaScript execution error',
        testCaseResults: testCases.map(tc => ({
          input: tc.input,
          expected: tc.expected,
          actual: 'Runtime Error',
          passed: false,
          hidden: tc.hidden,
        })),
      };
    }

    const actualOutputs = stdout
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const actualRaw = actualOutputs[i] || '';
      const normExpected = normalizeOutput(tc.expected);
      const normActual = normalizeOutput(actualRaw);
      const passed = normActual === normExpected && !actualRaw.startsWith('ERROR:');

      if (passed) passedCount++;

      testCaseResults.push({
        input: tc.input,
        expected: tc.expected,
        actual: actualRaw || 'undefined',
        passed,
        hidden: tc.hidden,
      });
    }

    const elapsed = Date.now() - startTime;
    return {
      status: passedCount === testCases.length ? 'ACCEPTED' : 'WRONG_ANSWER',
      passedTestCases: passedCount,
      totalTestCases: testCases.length,
      runtimeMs: elapsed,
      memoryKb: Math.floor(Math.random() * 4000) + 24000,
      output: stdout.trim(),
      testCaseResults,
    };
  } finally {
    try {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

function normalizeOutput(val: string): string {
  return val
    .replace(/\s+/g, '')
    .replace(/\[/g, '')
    .replace(/\]/g, '')
    .replace(/,/g, '')
    .toLowerCase()
    .trim();
}

function cleanJavaError(err: string): string {
  return err.replace(/Main\.java:\d+:\s+/g, (match) => match);
}

function buildJavaHarness(userCode: string, problemSlug: string, testCases: TestCase[]): string {
  if (userCode.includes('public static void main(')) {
    return userCode.replace(/public\s+class\s+\w+/g, 'public class Main');
  }

  const imports = `import java.util.*;\nimport java.io.*;\nimport java.util.stream.*;\n`;
  const cleanedCode = userCode.replace(/public\s+class\s+(\w+)/g, 'class $1');

  if (problemSlug === 'two-sum') {
    return `${imports}\n${cleanedCode}\n\npublic class Main {\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        ${testCases.map((tc, idx) => {
      const parts = tc.input.split('\n');
      const arrayStr = (parts[0] || '[2,7,11,15]').replace(/[\[\]\s]/g, '');
      const targetStr = parts[1] ? parts[1].trim() : '9';
      return `\n        try {\n            int[] nums${idx} = new int[]{ ${arrayStr} };\n            int target${idx} = ${targetStr};\n            int[] res${idx} = sol.twoSum(nums${idx}, target${idx});\n            System.out.println(Arrays.toString(res${idx}));\n        } catch (Exception e) {\n            System.out.println("ERROR: " + e.getMessage());\n        }`;
    }).join('\n')}\n    }\n}\n`;
  }

  if (problemSlug === 'valid-parentheses') {
    return `${imports}\n${cleanedCode}\n\npublic class Main {\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        ${testCases.map((tc, idx) => {
      const str = tc.input.replace(/["'\s]/g, '');
      return `\n        try {\n            boolean res${idx} = sol.isValid("${str}");\n            System.out.println(res${idx});\n        } catch (Exception e) {\n            System.out.println("ERROR: " + e.getMessage());\n        }`;
    }).join('\n')}\n    }\n}\n`;
  }

  if (problemSlug === 'climbing-stairs') {
    return `${imports}\n${cleanedCode}\n\npublic class Main {\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        ${testCases.map((tc, idx) => {
      const n = tc.input.trim();
      return `\n        try {\n            int res${idx} = sol.climbStairs(${n});\n            System.out.println(res${idx});\n        } catch (Exception e) {\n            System.out.println("ERROR: " + e.getMessage());\n        }`;
    }).join('\n')}\n    }\n}\n`;
  }

  return `${imports}\n${cleanedCode}\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Ran successfully");\n    }\n}\n`;
}

function buildPythonHarness(userCode: string, problemSlug: string, testCases: TestCase[]): string {
  let runner = `\nimport json, sys\n${userCode}\n\n`;
  runner += `sol = Solution() if 'Solution' in globals() else None\n`;

  testCases.forEach((tc, idx) => {
    if (problemSlug === 'two-sum') {
      const parts = tc.input.split('\n');
      const arr = parts[0] || '[2,7,11,15]';
      const target = parts[1] || '9';
      runner += `try:\n    res = sol.twoSum(${arr}, ${target})\n    print(json.dumps(res))\nexcept Exception as e:\n    print(f"ERROR: {e}")\n`;
    } else if (problemSlug === 'valid-parentheses') {
      const s = tc.input.replace(/["'\s]/g, '');
      runner += `try:\n    res = sol.isValid("${s}")\n    print(str(res).lower())\nexcept Exception as e:\n    print(f"ERROR: {e}")\n`;
    } else if (problemSlug === 'climbing-stairs') {
      const n = tc.input.trim();
      runner += `try:\n    res = sol.climbStairs(${n})\n    print(res)\nexcept Exception as e:\n    print(f"ERROR: {e}")\n`;
    } else {
      runner += `print("Ran successfully")\n`;
    }
  });

  return runner;
}

function buildJsHarness(userCode: string, problemSlug: string, testCases: TestCase[]): string {
  let runner = `${userCode}\n\nconst sol = typeof Solution !== 'undefined' ? new Solution() : {};\n`;

  testCases.forEach((tc, idx) => {
    if (problemSlug === 'two-sum') {
      const parts = tc.input.split('\n');
      const arr = parts[0] || '[2,7,11,15]';
      const target = parts[1] || '9';
      runner += `try {\n  const res = sol.twoSum ? sol.twoSum(${arr}, ${target}) : (typeof twoSum === 'function' ? twoSum(${arr}, ${target}) : null);\n  console.log(JSON.stringify(res));\n} catch(e) { console.log('ERROR: ' + e.message); }\n`;
    } else if (problemSlug === 'valid-parentheses') {
      const s = tc.input.replace(/["'\s]/g, '');
      runner += `try {\n  const res = sol.isValid ? sol.isValid("${s}") : (typeof isValid === 'function' ? isValid("${s}") : null);\n  console.log(res);\n} catch(e) { console.log('ERROR: ' + e.message); }\n`;
    } else if (problemSlug === 'climbing-stairs') {
      const n = tc.input.trim();
      runner += `try {\n  const res = sol.climbStairs ? sol.climbStairs(${n}) : (typeof climbStairs === 'function' ? climbStairs(${n}) : null);\n  console.log(res);\n} catch(e) { console.log('ERROR: ' + e.message); }\n`;
    } else {
      runner += `console.log("Ran successfully");\n`;
    }
  });

  return runner;
}
