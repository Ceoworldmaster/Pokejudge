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

export interface JudgeResult {
  verdict: Verdict;
  passed: number;
  total: number;
  runtimeMs: number;
  memoryKb: number;
  failedAt: number;
  detail: string;
}

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
    };
  }

  let maxRuntime = 0;
  let maxMemory = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    let result: PistonRunResult;
    try {
      result = await runCode(language, source, tc.input_data);
    } catch (e) {
      return {
        verdict: 'Runtime Error',
        passed: i,
        total: testCases.length,
        runtimeMs: maxRuntime,
        memoryKb: maxMemory,
        failedAt: i,
        detail: `Execution error on case ${i + 1}: ${(e as Error).message}`,
      };
    }

    if (result.compileOutput && result.code !== 0 && i === 0 && !result.stdout) {
      return {
        verdict: 'Compile Error',
        passed: 0,
        total: testCases.length,
        runtimeMs: 0,
        memoryKb: 0,
        failedAt: i,
        detail: result.compileOutput.slice(0, 2000),
      };
    }

    maxRuntime = Math.max(maxRuntime, result.runtimeMs);
    if (result.runtimeMs > timeLimitMs) {
      return {
        verdict: 'Time Limit Exceeded',
        passed: i,
        total: testCases.length,
        runtimeMs: maxRuntime,
        memoryKb: maxMemory,
        failedAt: i,
        detail: `TLE on case ${i + 1} (${result.runtimeMs}ms > ${timeLimitMs}ms)`,
      };
    }

    if (result.code !== 0 && result.signal) {
      return {
        verdict: 'Runtime Error',
        passed: i,
        total: testCases.length,
        runtimeMs: maxRuntime,
        memoryKb: maxMemory,
        failedAt: i,
        detail: `RE on case ${i + 1}: signal ${result.signal}`,
      };
    }

    const got = normalize(result.stdout);
    const want = normalize(tc.expected_output);
    if (got !== want) {
      return {
        verdict: 'Wrong Answer',
        passed: i,
        total: testCases.length,
        runtimeMs: maxRuntime,
        memoryKb: maxMemory,
        failedAt: i,
        detail: `WA on case ${i + 1}.\nExpected:\n${want}\nGot:\n${got}`,
      };
    }
  }

  return {
    verdict: 'Accepted',
    passed: testCases.length,
    total: testCases.length,
    runtimeMs: maxRuntime,
    memoryKb: maxMemory,
    failedAt: -1,
    detail: 'All test cases passed!',
  };
}
