import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Panel, Group, Separator } from 'react-resizable-panels';
import Editor from '@monaco-editor/react';
import { supabase } from '@/lib/supabase';
import { MOCK_PROBLEMS, MOCK_TEST_CASES } from '@/lib/mockData';
import { LANGUAGES, languageById, ELEMENTS, DIFFICULTIES } from '@/lib/constants';
import type { Problem, TestCase, Submission, Verdict } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ElementBadge, DifficultyBadge } from '@/components/Badges';
import { VerdictBadge } from '@/components/VerdictBadge';
import { Pokeball } from '@/components/Pokeball';
import { PdfViewer } from '@/components/PdfViewer';
import { judgeSubmission, runCode, type JudgeResult } from '@/services/piston';
import {
  Play, Send, Copy, Clock, MemoryStick, FileText, FileCode2,
  History, Lightbulb, ChevronLeft, Loader2, CheckCircle2, Terminal,
} from 'lucide-react';

type Tab = 'statement' | 'submissions' | 'editorial';

export function ProblemWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('statement');
  const [language, setLanguage] = useState(LANGUAGES[0].id);
  const [code, setCode] = useState(LANGUAGES[0].boilerplate);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [console, setConsole] = useState<{
    verdict?: Verdict;
    output?: string;
    runtimeMs?: number;
    memoryKb?: number;
    passed?: number;
    total?: number;
    detail?: string;
  }>({});
  const [consoleOpen, setConsoleOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const problemId = id ?? '';
      // Try DB
      const { data: dbProblem } = await supabase.from('problems').select('*').eq('id', problemId).maybeSingle();
      let p: Problem | null = null;
      if (dbProblem) {
        p = dbProblem as Problem;
      } else {
        p = MOCK_PROBLEMS.find((m) => m.id === problemId) ?? null;
      }
      if (cancelled) return;
      setProblem(p);

      // Test cases
      if (dbProblem) {
        const { data: tc } = await supabase.from('test_cases').select('*').eq('problem_id', problemId);
        if (cancelled) return;
        const dbTc = (tc as TestCase[]) ?? [];
        const mockTc = MOCK_TEST_CASES[problemId] ?? [];
        setTestCases(dbTc.length > 0 ? dbTc : mockTc);
      } else {
        setTestCases(MOCK_TEST_CASES[problemId] ?? []);
      }

      // Submissions
      if (user) {
        const { data: subs } = await supabase
          .from('submissions')
          .select('*')
          .eq('problem_id', problemId)
          .order('created_at', { ascending: false });
        if (cancelled) return;
        setSubmissions((subs as Submission[]) ?? []);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id, user]);

  const onLanguageChange = (langId: string) => {
    setLanguage(langId);
    setCode(languageById(langId).boilerplate);
  };

  const copySample = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('info', 'Sample copied to clipboard.');
  };

  const runSample = async () => {
    if (!problem) return;
    const samples = testCases.filter((t) => t.is_sample);
    if (samples.length === 0) {
      toast('warning', 'No sample test cases available.');
      return;
    }
    setRunning(true);
    setConsoleOpen(true);
    setConsole({ verdict: 'Running' });
    try {
      const lang = languageById(language);
      const tc = samples[0];
      const result = await runCode(lang, code, tc.input_data);
      setConsole({
        verdict: result.code === 0 && normalize(result.stdout) === normalize(tc.expected_output) ? 'Accepted' : (result.code !== 0 ? 'Runtime Error' : 'Wrong Answer'),
        output: result.stdout || result.stderr || result.compileOutput,
        runtimeMs: result.runtimeMs,
        passed: normalize(result.stdout) === normalize(tc.expected_output) ? 1 : 0,
        total: 1,
        detail: result.compileOutput ? result.compileOutput.slice(0, 1500) : result.stderr,
      });
    } catch (e) {
      setConsole({ verdict: 'Runtime Error', detail: (e as Error).message });
    } finally {
      setRunning(false);
    }
  };

  const submit = async () => {
    if (!problem) return;
    if (!user) {
      toast('warning', 'Sign in to submit your solution.');
      navigate('/auth');
      return;
    }
    setSubmitting(true);
    setConsoleOpen(true);
    setConsole({ verdict: 'Running' });
    toast('info', 'Submission sent to Piston! Battle begins...');

    try {
      const lang = languageById(language);
      const result: JudgeResult = await judgeSubmission(lang, code, testCases, problem.time_limit_ms);
      setConsole({
        verdict: result.verdict,
        runtimeMs: result.runtimeMs,
        memoryKb: result.memoryKb,
        passed: result.passed,
        total: result.total,
        detail: result.detail,
      });

      // Save submission
      const { data: saved } = await supabase
        .from('submissions')
        .insert({
          user_id: user.id,
          problem_id: problem.id,
          language: lang.id,
          code,
          verdict: result.verdict,
          runtime_ms: result.runtimeMs,
          memory_kb: result.memoryKb,
          passed_test_cases: result.passed,
          total_test_cases: result.total,
        })
        .select()
        .single();
      if (saved) {
        setSubmissions((s) => [saved as Submission, ...s]);
      }

      if (result.verdict === 'Accepted') {
        toast('success', 'Super Effective! Problem Solved!');
      } else {
        toast('error', `${result.verdict} — ${result.detail?.slice(0, 80) ?? ''}`);
      }
    } catch (e) {
      setConsole({ verdict: 'Runtime Error', detail: (e as Error).message });
      toast('error', (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const samples = testCases.filter((t) => t.is_sample);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <Pokeball size={64} className="mx-auto mb-4 opacity-50" />
        <h1 className="text-2xl font-bold text-white">Problem not found</h1>
        <Link to="/problems" className="btn-ghost mt-4 inline-flex">Back to Pokédex</Link>
      </div>
    );
  }

  const elMeta = ELEMENTS[problem.pokemon_element] ?? ELEMENTS.Normal;
  const diffMeta = DIFFICULTIES[problem.difficulty];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Top bar */}
      <div className="glass-strong border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/problems')} className="text-slate-400 hover:text-white shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-mono text-sm font-bold text-red-400 shrink-0">[{problem.code}]</span>
          <h1 className="text-sm sm:text-base font-bold text-white truncate">{problem.title}</h1>
        </div>
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <ElementBadge element={problem.pokemon_element} />
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Group orientation="horizontal" className="h-full">
          {/* Left pane: statement */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col bg-slate-950/40">
              {/* Metadata banner */}
              <div className={`border-b border-slate-800 px-4 sm:px-6 py-3 ${elMeta.bg}`}>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {problem.time_limit_ms}ms</span>
                  <span className="flex items-center gap-1.5"><MemoryStick className="h-3.5 w-3.5" /> {problem.memory_limit_mb} MB</span>
                  <span className="flex items-center gap-1.5"><Pokeball size={12} /> {elMeta.name} — {elMeta.topic}</span>
                  <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> {diffMeta.label}</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-800 px-2 sm:px-4 gap-1">
                {([
                  { id: 'statement', label: 'Statement', icon: FileText },
                  { id: 'submissions', label: 'Submissions', icon: History },
                  { id: 'editorial', label: 'Editorial', icon: Lightbulb },
                ] as const).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      tab === t.id ? 'border-red-500 text-red-300' : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <t.icon className="h-4 w-4" /> {t.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
                {tab === 'statement' && (
                  <div className="space-y-5">
                    {problem.pdf_url && (
                      <PdfViewer url={problem.pdf_url} />
                    )}

                    {problem.description_markdown && (
                      <MarkdownRenderer content={problem.description_markdown} />
                    )}

                    {!problem.pdf_url && !problem.description_markdown && (
                      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-8 text-center">
                        <FileText className="h-10 w-10 mx-auto text-slate-600 mb-3" />
                        <p className="text-slate-400 font-semibold">No problem statement yet</p>
                        <p className="text-slate-500 text-sm mt-1">The Gym Leader hasn't added a PDF or text description for this problem.</p>
                      </div>
                    )}

                    {samples.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <FileCode2 className="h-5 w-5 text-red-400" /> Sample Cases
                        </h3>
                        {samples.map((s, i) => (
                          <div key={s.id} className="rounded-xl border border-slate-700 bg-slate-900/50 overflow-hidden">
                            <div className="grid sm:grid-cols-2 divide-x divide-slate-700">
                              <div className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold uppercase text-slate-400">Sample Input {i + 1}</span>
                                  <button onClick={() => copySample(s.input_data)} className="text-slate-500 hover:text-red-400">
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <pre className="font-mono text-xs text-emerald-300 bg-slate-950/60 rounded p-2 overflow-x-auto whitespace-pre">{s.input_data}</pre>
                              </div>
                              <div className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold uppercase text-slate-400">Sample Output {i + 1}</span>
                                  <button onClick={() => copySample(s.expected_output)} className="text-slate-500 hover:text-red-400">
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <pre className="font-mono text-xs text-cyan-300 bg-slate-950/60 rounded p-2 overflow-x-auto whitespace-pre">{s.expected_output}</pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'submissions' && (
                  <div className="space-y-2">
                    {!user && <p className="text-slate-500 text-sm">Sign in to view your submission history.</p>}
                    {user && submissions.length === 0 && <p className="text-slate-500 text-sm">No submissions yet. Be the first to battle!</p>}
                    {submissions.map((s) => (
                      <div key={s.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 flex items-center justify-between gap-3">
                        <VerdictBadge verdict={s.verdict} />
                        <span className="text-xs text-slate-400 font-mono">{s.language}</span>
                        <span className="text-xs text-slate-400">{s.passed_test_cases}/{s.total_test_cases}</span>
                        <span className="text-xs text-slate-500">{new Date(s.created_at).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {tab === 'editorial' && (
                  <div className="text-slate-400 text-sm space-y-3">
                    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                      <Lightbulb className="h-5 w-5 text-yellow-400 mb-2" />
                      <p className="font-semibold text-yellow-200">Gym Leader Notes</p>
                      <p className="mt-1">Editorial will appear here once the Gym Leader publishes it. For now, study the sample cases and constraints carefully!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <Separator className="w-1.5 bg-slate-800 hover:bg-red-500/50 transition-colors" />

          {/* Right pane: editor */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col bg-slate-950">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/40">
                <select
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value)}
                  className="input-field w-auto py-1.5 text-sm"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.id} value={l.id}>{l.label}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button onClick={runSample} disabled={running} className="btn-ghost text-sm py-1.5">
                    {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Test Attack
                  </button>
                  <button onClick={submit} disabled={submitting} className="btn-primary text-sm py-1.5">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Submit Attack
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <Editor
                  height="100%"
                  language={languageById(language).monaco}
                  theme="vs-dark"
                  value={code}
                  onChange={(v) => setCode(v ?? '')}
                  options={{
                    fontSize: 14,
                    fontFamily: 'JetBrains Mono, monospace',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    tabSize: 4,
                    automaticLayout: true,
                  }}
                />
              </div>

              {/* Battle console */}
              <div className="border-t border-slate-800 bg-slate-900/60">
                <button
                  onClick={() => setConsoleOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800/40"
                >
                  <span className="flex items-center gap-2"><Terminal className="h-4 w-4 text-red-400" /> Battle Console</span>
                  <span className="text-xs text-slate-500">{consoleOpen ? 'Hide' : 'Show'}</span>
                </button>
                {consoleOpen && (
                  <div className="px-3 pb-3 max-h-48 overflow-y-auto space-y-2 animate-fade-in">
                    {console.verdict && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <VerdictBadge verdict={console.verdict} />
                        {console.runtimeMs !== undefined && (
                          <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" /> {console.runtimeMs}ms</span>
                        )}
                        {console.memoryKb !== undefined && console.memoryKb > 0 && (
                          <span className="text-xs text-slate-400 flex items-center gap-1"><MemoryStick className="h-3 w-3" /> {console.memoryKb}KB</span>
                        )}
                        {console.passed !== undefined && console.total !== undefined && (
                          <span className="text-xs text-slate-400 font-mono">{console.passed}/{console.total} cases</span>
                        )}
                      </div>
                    )}
                    {console.output && (
                      <pre className="font-mono text-xs text-emerald-300 bg-slate-950/80 rounded p-2 overflow-x-auto whitespace-pre-wrap">{console.output}</pre>
                    )}
                    {console.detail && !console.output && (
                      <pre className="font-mono text-xs text-slate-400 bg-slate-950/80 rounded p-2 overflow-x-auto whitespace-pre-wrap">{console.detail}</pre>
                    )}
                    {!console.verdict && !console.output && (
                      <p className="text-xs text-slate-500">Run or submit to see battle results here.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </Group>
      </div>
    </div>
  );
}

function normalize(s: string): string {
  return s.replace(/\r\n/g, '\n').replace(/\s+$/g, '').trim();
}
