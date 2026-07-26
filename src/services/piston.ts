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

/**
 * Số lượng testcase được gửi song song cùng lúc tới Piston/Wandbox.
 *
 * TRƯỚC ĐÂY: mỗi testcase = 1 vòng lặp `for` + `await` tuần tự → N testcase
 * = N round-trip cộng dồn (đây là nguyên nhân chính gây ra độ trễ lớn khi
 * có nhiều hơn 1 testcase).
 *
 * BÂY GIỜ: các testcase được chia thành từng "lô" (chunk) và gửi đồng thời
 * bằng Promise.allSettled — thời gian chờ của cả lô ~ bằng thời gian của
 * request chậm nhất trong lô, thay vì tổng cộng tất cả.
 *
 * Lưu ý: nếu bạn đang dùng Piston public API (emkc.org) có rate-limit
 * 5 request/giây, hãy để CONCURRENCY <= 4 để không bị 429. Nếu tự host
 * Piston bằng Docker, có thể tăng lên 8-10 tuỳ số CPU core của máy chủ.
 */
const CONCURRENCY = 4;

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
  const maxMemory = 0;

  // Chạy từng lô (chunk) testcase song song, thay vì từng cái một tuần tự.
  for (let start = 0; start < testCases.length; start += CONCURRENCY) {
    const chunk = testCases.slice(start, start + CONCURRENCY);

    // Gửi toàn bộ request trong lô hiện tại CÙNG LÚC (Promise.allSettled
    // để 1 testcase lỗi không làm crash cả lô — ta tự xử lý lỗi bên dưới).
    const settled = await Promise.allSettled(
      chunk.map((tc) => runCode(language, source, tc.input_data)),
    );

    for (let j = 0; j < settled.length; j++) {
      const i = start + j;
      const tc = chunk[j];
      const outcome = settled[j];

      if (outcome.status === 'rejected') {
        const message = (outcome.reason as Error)?.message ?? 'Unknown execution error';
        results.push({
          testCaseIndex: i,
          status: 'CE',
          verdictBadge: VERDICT_BADGES.CE,
          executionTimeMs: maxRuntime,
          inputData: tc.input_data,
          expectedOutput: tc.expected_output,
          actualOutput: '',
          stderr: message,
        });
        return {
          verdict: 'Runtime Error',
          passed: i,
          total: testCases.length,
          runtimeMs: maxRuntime,
          memoryKb: maxMemory,
          failedAt: i,
          detail: `Execution error on case ${i + 1}: ${message}`,
          testCaseResults: results,
        };
      }

      const result = outcome.value;

      // Compile error chỉ có ý nghĩa để kiểm tra ở testcase đầu tiên (i === 0):
      // nếu code không biên dịch được thì mọi testcase khác cũng sẽ lỗi y hệt,
      // nên ta dừng ngay, không lãng phí thêm lần gọi API nào nữa.
      if (result.compileOutput && result.code !== 0 && i === 0 && !result.stdout) {
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
    // Hết lô này mà chưa "return" sớm ở trên -> tức là cả lô đều AC,
    // tiếp tục sang lô testcase kế tiếp.
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
