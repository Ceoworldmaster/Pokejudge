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
}

interface RunResponse {
  stdout: string;
  stderr: string;
  compileOutput: string;
  runtimeMs: number;
  signal: string | null;
  code: number;
  ok: boolean;
}

const WANDBOX_COMPILERS: Record<string, string> = {
  "c++": "gcc-head",
  python: "cpython-3.10.2",
  java: "openjdk-15.0.2",
  javascript: "nodejs-head",
  go: "go-1.16.2",
};

async function runPiston(req: RunRequest): Promise<RunResponse> {
  const body = {
    language: req.language,
    version: req.version,
    files: [{ name: "main", content: req.source }],
    stdin: req.stdin,
    compile_timeout: 10000,
    run_timeout: 15000,
    compile_memory_limit: -1,
    run_memory_limit: -1,
  };

  const res = await fetch(PISTON_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Piston failed (${res.status}): ${txt}`);
  }

  const data = await res.json();
  const compile = data.compile ?? {};
  const run = data.run ?? {};

  return {
    stdout: run.stdout ?? "",
    stderr: run.stderr ?? "",
    compileOutput: compile.output ?? "",
    runtimeMs: run.time ? Math.round(parseFloat(run.time) * 1000) : 0,
    signal: run.signal ?? null,
    code: run.code ?? 0,
    ok: (run.code === 0 || run.code === null) && !compile.code,
  };
}

async function runWandbox(req: RunRequest): Promise<RunResponse> {
  const compiler = req.wandbox ?? WANDBOX_COMPILERS[req.language];
  if (!compiler) throw new Error(`Wandbox: unsupported language ${req.language}`);

  const body: Record<string, unknown> = {
    code: req.source,
    stdin: req.stdin,
    compiler: compiler,
    runtime: true,
  };

  const res = await fetch(WANDBOX_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Wandbox failed (${res.status}): ${txt}`);
  }

  const data = await res.json();

  const status: string = data.status ?? "0";
  const compileOk = status !== "1" && status !== "2";

  return {
    stdout: data.program_output ?? "",
    stderr: data.program_error ?? "",
    compileOutput: data.compiler_output ?? data.compiler_error ?? "",
    runtimeMs: 0,
    signal: data.signal ? String(data.signal) : null,
    code: compileOk ? 0 : 1,
    ok: compileOk,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { language, version, source, stdin, wandbox } = await req.json() as RunRequest;

    if (!language || !source) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: language, source" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let result: RunResponse;
    let backend = "wandbox";

    try {
      result = await runWandbox({ language, version, source, stdin, wandbox });
    } catch (wandboxErr) {
      console.error("Wandbox failed, trying Piston:", (wandboxErr as Error).message);
      backend = "piston";
      try {
        result = await runPiston({ language, version, source, stdin });
      } catch (pistonErr) {
        throw new Error(
          `Both backends failed. Wandbox: ${(wandboxErr as Error).message}. Piston: ${(pistonErr as Error).message}`,
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
