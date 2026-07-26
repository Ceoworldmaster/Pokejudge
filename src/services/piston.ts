import type { LanguageMeta } from '@/lib/constants';
import type { TestCase, Verdict } from '@/types';
import { supabase } from '@/lib/supabase';

export interface PistonRunResult {
  stdout: string;
  stderr: string;
  compileOutput: string;
  runtimeMs: number;
  signal: string | null;
  code: number;
  ok: boolean;
  backend?: string;
}

export async function runCode(
  language: LanguageMeta,
  source: string,
  stdin: string,
): Promise<PistonRunResult> {
  const { data, error } = await supabase.functions.invoke('run-code', {
    body: {
      language: language.piston,
      version: language.pistonVersion,
      wandbox: language.wandbox,
      source,
      stdin,
    },
  });

  if (error) {
    throw new Error(`Execution service error: ${error.message}`);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return {
    stdout: data.stdout ?? '',
    stderr: data.stderr ?? '',
    compileOutput: data.compileOutput ?? '',
    runtimeMs: data.runtimeMs ?? 0,
    signal: data.signal ?? null,
    code: data.code ?? 0,
    ok: data.ok ?? false,
    backend: data.backend,
  };
}

function normalize(s: string): string {
  return s.replace(/\r\n/g, '\n').replace(/\s+$/g, '').trim();
}

export type TestCaseStatus = 'AC' | 'WA' | 'TLE' | 'CE';

export interface TestCaseResult {
  testCaseIndex: number;
  status: TestCaseStatus;
  verdictBadge: string;
  executionTimeMs: number;
  inputData?: string;
  expectedOutput?: string;
  actualOutput?: string;
  stderr?: string;
}

export interface JudgeResult {
  verdict: Verdict;
  passed: number;
  total: number;
  runtimeMs: number;
  memoryKb: number;
  failedAt: number;
  detail: string;
  testCaseResults: TestCaseResult[];
}

const VERDICT_BADGES: Record<TestCaseStatus, string> = {
  AC: 'Super Effective!',
  WA: 'Attack Missed!',
  TLE: 'Pokémon Fainted (TLE)!',
  CE: 'Confusion Status!',
};

export async function judgeSubmission(
  language: LanguageMeta,
  source: string,
  testCases: TestCase[],
  timeLimitMs: number,
): Promise<JudgeResult> {
  if (testCases.length === 0) {
    return {
      verdict: 'Wrong Answer',
      passed: 0,
      total: 0,
      runtimeMs: 0,
      memoryKb: 0,
      failedAt: -1,
      detail: 'No test cases available.',
      testCaseResults: [],
    };
  }

  const results: TestCaseResult[] = [];
  let maxRuntime = 0;
  let maxMemory = 0;
  let compileError = false;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    let result: PistonRunResult;
    try {
      result = await runCode(language, source, tc.input_data);
    } catch (e) {
      const tr: TestCaseResult = {
        testCaseIndex: i,
        status: 'CE',
        verdictBadge: VERDICT_BADGES.CE,
        executionTimeMs: maxRuntime,
        inputData: tc.input_data,
        expectedOutput: tc.expected_output,
        actualOutput: '',
        stderr: (e as Error).message,
      };
      results.push(tr);
      return {
        verdict: 'Runtime Error',
        passed: i,
        total: testCases.length,
        runtimeMs: maxRuntime,
        memoryKb: maxMemory,
        failedAt: i,
        detail: `Execution error on case ${i + 1}: ${(e as Error).message}`,
        testCaseResults: results,
      };
    }

    if (result.compileOutput && result.code !== 0 && i === 0 && !result.stdout) {
      compileError = true;
      results.push({
        testCaseIndex: i,
        status: 'CE',
        verdictBadge: VERDICT_BADGES.CE,
        executionTimeMs: 0,
        inputData: tc.input_data,
        expectedOutput: tc.expected_output,
        actualOutput: result.compileOutput,
        stderr: result.stderr,
      });
      return {
        verdict: 'Compile Error',
        passed: 0,
        total: testCases.length,
        runtimeMs: 0,
        memoryKb: 0,
        failedAt: i,
        detail: result.compileOutput.slice(0, 2000),
        testCaseResults: results,
      };
    }

    maxRuntime = Math.max(maxRuntime, result.runtimeMs);

    if (result.runtimeMs > timeLimitMs) {
      results.push({
        testCaseIndex: i,
        status: 'TLE',
        verdictBadge: VERDICT_BADGES.TLE,
        executionTimeMs: result.runtimeMs,
        inputData: tc.input_data,
        expectedOutput: tc.expected_output,
        actualOutput: result.stdout,
        stderr: result.stderr,
      });
      return {
        verdict: 'Time Limit Exceeded',
        passed: i,
        total: testCases.length,
        runtimeMs: maxRuntime,
        memoryKb: maxMemory,
        failedAt: i,
        detail: `TLE on case ${i + 1} (${result.runtimeMs}ms > ${timeLimitMs}ms)`,
        testCaseResults: results,
      };
    }

    if (result.code !== 0 && result.signal) {
      results.push({
        testCaseIndex: i,
        status: 'CE',
        verdictBadge: VERDICT_BADGES.CE,
        executionTimeMs: result.runtimeMs,
        inputData: tc.input_data,
        expectedOutput: tc.expected_output,
        actualOutput: result.stdout,
        stderr: `signal ${result.signal}`,
      });
      return {
        verdict: 'Runtime Error',
        passed: i,
        total: testCases.length,
        runtimeMs: maxRuntime,
        memoryKb: maxMemory,
        failedAt: i,
        detail: `RE on case ${i + 1}: signal ${result.signal}`,
        testCaseResults: results,
      };
    }

    const got = normalize(result.stdout);
    const want = normalize(tc.expected_output);
    if (got !== want) {
      results.push({
        testCaseIndex: i,
        status: 'WA',
        verdictBadge: VERDICT_BADGES.WA,
        executionTimeMs: result.runtimeMs,
        inputData: tc.input_data,
        expectedOutput: tc.expected_output,
        actualOutput: result.stdout,
        stderr: result.stderr,
      });
      return {
        verdict: 'Wrong Answer',
        passed: i,
        total: testCases.length,
        runtimeMs: maxRuntime,
        memoryKb: maxMemory,
        failedAt: i,
        detail: `WA on case ${i + 1}.\nExpected:\n${want}\nGot:\n${got}`,
        testCaseResults: results,
      };
    }

    results.push({
      testCaseIndex: i,
      status: 'AC',
      verdictBadge: VERDICT_BADGES.AC,
      executionTimeMs: result.runtimeMs,
      inputData: tc.input_data,
      expectedOutput: tc.expected_output,
      actualOutput: result.stdout,
      stderr: result.stderr,
    });
  }

  return {
    verdict: 'Accepted',
    passed: testCases.length,
    total: testCases.length,
    runtimeMs: maxRuntime,
    memoryKb: maxMemory,
    failedAt: -1,
    detail: 'All test cases passed!',
    testCaseResults: results,
  };
}
