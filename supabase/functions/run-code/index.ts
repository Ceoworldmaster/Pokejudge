import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PISTON_URL = "https://emkc.org/api/v2/piston/execute";
const WANDBOX_URL = "https://wandbox.org/api/compile.json";

interface RunRequest {
  language: string;
  version: string;
  source: string;
  stdin: string;
  wandbox?: string;
  timeLimitMs?: number;
}

interface RunResponse {
  stdout: string;
  stderr: string;
  compileOutput: string;
  runtimeMs: number;
  signal: string | null;
  code: number;
  ok: boolean;
  timedOut: boolean;
  backend?: string;
}

const WANDBOX_COMPILERS: Record<string, string> = {
  "c++": "gcc-head",
  python: "cpython-3.10.2",
  java: "openjdk-15.0.2",
  javascript: "nodejs-head",
  go: "go-1.16.2",
};

/* Signals that indicate the process was killed for exceeding a time limit */
const TIMEOUT_SIGNALS = new Set(["SIGKILL", "SIGTERM", "SIGXCPU", "SIGALRM", "9", "14", "15", "24"]);

/* Ngân sách thời gian tối đa cho toàn bộ round-trip compile+run tới Piston:
   thời gian giới hạn chạy (limitMs) + khoảng đệm cho việc biên dịch/hàng đợi.
   Việc này thay thế cho "chờ vô thời hạn" trước đây. */
function compileAndRunBudgetMs(limitMs: number): number {
  return limitMs + 8000;
}

/* Đọc API key từ biến môi trường của Supabase Edge Function (Dashboard ->
   Project Settings -> Edge Functions -> Secrets), nếu bạn đã được EngineerMan
   cấp key. Kể từ 15/2/2026, emkc.org/api/v2/piston KHÔNG còn miễn phí cho
   public nữa và yêu cầu token — nếu không có key hợp lệ, mọi request Piston
   nhiều khả năng sẽ bị từ chối/rate-limit và rơi vào nhánh fallback Wandbox
   (vốn có hàng đợi biên dịch công khai, thường chậm hơn nhiều). Đây rất có
   thể là nguyên nhân chính của độ trễ ~4000ms bạn đang gặp. */
const PISTON_API_KEY = Deno.env.get("PISTON_API_KEY");

/* ── Piston (primary) — returns actual CPU time and enforces run_timeout ── */
async function runPiston(req: RunRequest): Promise<RunResponse> {
  const limitMs = req.timeLimitMs ?? 5000;
  /* Piston run_timeout is in seconds. Set it just above the time limit so
     our own time check fires first for borderline cases, while Piston still
     kills truly infinite loops. Cap at 15s (Piston hard limit). */
  const runTimeoutSec = Math.min(Math.ceil(limitMs / 1000) + 1, 15);

  const body = {
    language: req.language,
    version: req.version,
    files: [{ name: "main", content: req.source }],
    stdin: req.stdin,
    compile_timeout: 10000,
    run_timeout: runTimeoutSec,
    compile_memory_limit: -1,
    run_memory_limit: -1,
  };

  /* TRƯỚC ĐÂY: fetch tới Piston không có timeout nào cả — nếu Piston bị
     treo/rate-limit, request có thể "treo" rất lâu trước khi thất bại,
     kéo dài toàn bộ thời gian phản hồi. Giờ ta giới hạn cứng bằng
     AbortController để fail nhanh và chuyển sang Wandbox kịp thời thay vì
     chờ vô thời hạn. */
  const controller = new AbortController();
  const timeoutMs = compileAndRunBudgetMs(limitMs);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const t0 = performance.now();
  let res: Response;
  try {
    res = await fetch(PISTON_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(PISTON_API_KEY ? { Authorization: `Bearer ${PISTON_API_KEY}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") {
      throw new Error(`Piston timed out after ${timeoutMs}ms (no response)`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
  const wallMs = Math.round(performance.now() - t0);

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Piston failed (${res.status}): ${txt}`);
  }

  const data = await res.json();
  const compile = data.compile ?? {};
  const run = data.run ?? {};

  /* Piston returns run.time as a string in seconds (e.g. "0.1234") */
  const runtimeMs = run.time != null ? Math.round(parseFloat(run.time) * 1000) : wallMs;
  const signal: string | null = run.signal ?? null;
  const code: number = run.code ?? 0;

  /* TLE if: killed by a timeout signal, OR measured time exceeds the limit */
  const killed = signal !== null && TIMEOUT_SIGNALS.has(signal);
  const timedOut = killed || runtimeMs > limitMs;

  return {
    stdout: run.stdout ?? "",
    stderr: run.stderr ?? "",
    compileOutput: compile.output ?? "",
    runtimeMs,
    signal,
    code,
    ok: (code === 0 || code === null) && !compile.code && !timedOut,
    timedOut,
  };
}

/* ── Wandbox (fallback) — no runtime field, use wall-clock + abort ── */
async function runWandbox(req: RunRequest): Promise<RunResponse> {
  const compiler = req.wandbox ?? WANDBOX_COMPILERS[req.language];
  if (!compiler) throw new Error(`Wandbox: unsupported language ${req.language}`);

  const limitMs = req.timeLimitMs ?? 5000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), limitMs + 3000);

  const body: Record<string, unknown> = {
    code: req.source,
    stdin: req.stdin,
    compiler,
    runtime: true,
  };

  const t0 = performance.now();
  let res: Response;
  try {
    res = await fetch(WANDBOX_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if ((e as Error).name === "AbortError") {
      return {
        stdout: "", stderr: "", compileOutput: "",
        runtimeMs: limitMs, signal: "SIGKILL", code: 137,
        ok: false, timedOut: true,
      };
    }
    throw e;
  }
  const wallMs = Math.round(performance.now() - t0);
  clearTimeout(timer);

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Wandbox failed (${res.status}): ${txt}`);
  }

  const data = await res.json();
  const status: string = String(data.status ?? "0");
  const compileOk = status !== "1" && status !== "2";
  const signal: string | null = data.signal ? String(data.signal) : null;

  const killed = signal !== null && TIMEOUT_SIGNALS.has(signal);
  const timedOut = killed || wallMs > limitMs;

  return {
    stdout: data.program_output ?? "",
    stderr: data.program_error ?? "",
    compileOutput: data.compiler_output ?? data.compiler_error ?? "",
    runtimeMs: wallMs,
    signal,
    code: compileOk ? 0 : 1,
    ok: compileOk && !timedOut,
    timedOut,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { language, version, source, stdin, wandbox, timeLimitMs } = await req.json() as RunRequest;

    if (!language || !source) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: language, source" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let result: RunResponse;
    let backend = "piston";

    try {
      result = await runPiston({ language, version, source, stdin, timeLimitMs });
    } catch (pistonErr) {
      console.error("Piston failed, trying Wandbox:", (pistonErr as Error).message);
      backend = "wandbox";
      try {
        result = await runWandbox({ language, version, source, stdin, wandbox, timeLimitMs });
      } catch (wandboxErr) {
        throw new Error(
          `Both backends failed. Piston: ${(pistonErr as Error).message}. Wandbox: ${(wandboxErr as Error).message}`,
        );
      }
    }

    return new Response(
      JSON.stringify({ ...result, backend }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
