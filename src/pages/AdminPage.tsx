import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ELEMENT_LIST, ELEMENTS, DIFFICULTIES, LANGUAGES } from '@/lib/constants';
import type { Problem, Contest, Difficulty, TestCase } from '@/types';
import { Pokeball } from '@/components/Pokeball';
import {
  Shield, Plus, Trash2, Upload, Loader2, FileText, Save, Trophy,
  BookOpen, ListChecks, X, Check, FileArchive, FileCode, Pencil, AlertTriangle,
} from 'lucide-react';
import { parseZip, parseText, type ImportedTestCase } from '@/lib/testImport';

type AdminTab = 'problems' | 'contests';

export function AdminPage() {
  const { profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<AdminTab>('problems');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) { setLoading(false); return; }
    if (profile.role !== 'gym_leader') { setLoading(false); return; }
    (async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from('problems').select('*').order('created_at', { ascending: false }),
        supabase.from('contests').select('*').order('start_time', { ascending: false }),
      ]);
      setProblems((p as Problem[]) ?? []);
      setContests((c as Contest[]) ?? []);
      setLoading(false);
    })();
  }, [profile]);

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-red-500" /></div>;
  }

  if (!profile || profile.role !== 'gym_leader') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <Shield className="h-12 w-12 mx-auto mb-4 text-slate-600" />
        <h1 className="text-2xl font-bold text-white">Gym Leaders Only</h1>
        <p className="text-slate-400 mt-2">You need Gym Leader privileges to access the Admin Panel.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Shield className="h-8 w-8 text-yellow-400" /> Gym Leader Panel
        </h1>
        <p className="text-slate-400 mt-1">Create problems, manage test cases, upload PDFs, and run contests.</p>
      </div>

      <div className="flex gap-1 mb-6 rounded-lg bg-slate-900/60 p-1 w-full sm:w-auto sm:inline-flex">
        {([
          { id: 'problems', label: 'Problem Creator', icon: BookOpen },
          { id: 'contests', label: 'Contest Manager', icon: Trophy },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 sm:flex-none flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id ? 'bg-yellow-500 text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'problems' && (
        <ProblemCreator
          problems={problems}
          onCreated={(p) => setProblems((prev) => [p, ...prev])}
          onUpdated={(p) => setProblems((prev) => prev.map((x) => (x.id === p.id ? p : x)))}
          onDeleted={(id) => setProblems((prev) => prev.filter((x) => x.id !== id))}
          toast={toast}
        />
      )}
      {tab === 'contests' && (
        <ContestManager
          contests={contests}
          problems={problems}
          onCreated={(c) => setContests((prev) => [c, ...prev])}
          toast={toast}
        />
      )}
    </div>
  );
}

// ---------- Problem Creator ----------
function ProblemCreator({
  problems, onCreated, onUpdated, onDeleted, toast,
}: {
  problems: Problem[];
  onCreated: (p: Problem) => void;
  onUpdated: (p: Problem) => void;
  onDeleted: (id: string) => void;
  toast: (t: 'success' | 'error' | 'info' | 'warning', m: string) => void;
}) {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [element, setElement] = useState(ELEMENT_LIST[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [timeLimit, setTimeLimit] = useState(1000);
  const [memoryLimit, setMemoryLimit] = useState(256);
  const [markdown, setMarkdown] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLink, setPdfLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testCases, setTestCases] = useState<{ input: string; output: string; isSample: boolean }[]>([
    { input: '', output: '', isSample: true },
  ]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [importing, setImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Problem | null>(null);

  const importZipFile = async (file: File) => {
    setImporting(true);
    try {
      const parsed = await parseZip(file);
      if (parsed.length === 0) {
        toast('error', 'No test case pairs found in ZIP. Expected test1.in / test1.out style files.');
        return;
      }
      const firstAsSample = parsed.map((tc, i) => ({ ...tc, isSample: i === 0 }));
      setTestCases(firstAsSample);
      toast('success', `Imported ${parsed.length} test cases from ZIP.`);
    } catch (e) {
      toast('error', `ZIP import failed: ${(e as Error).message}`);
    } finally {
      setImporting(false);
    }
  };

  const importTextFile = async (file: File) => {
    setImporting(true);
    try {
      const content = await file.text();
      const parsed = parseText(content);
      if (parsed.length === 0) {
        toast('error', 'No test cases found. Use format: ### Test 1, Input: ..., Output: ...');
        return;
      }
      setTestCases(parsed);
      toast('success', `Imported ${parsed.length} test cases from text file.`);
    } catch (e) {
      toast('error', `Text import failed: ${(e as Error).message}`);
    } finally {
      setImporting(false);
    }
  };

  const importFromFile = (file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith('.zip')) {
      importZipFile(file);
    } else if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.doc')) {
      importTextFile(file);
    } else {
      toast('warning', 'Unsupported file type. Use .zip, .txt, .md, or .doc');
    }
  };

  const uploadPdf = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'pdf';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('problem-pdfs').upload(path, file, { contentType: 'application/pdf' });
      if (error) throw error;
      const { data: pub } = supabase.storage.from('problem-pdfs').getPublicUrl(path);
      setPdfUrl(pub.publicUrl);
      setPdfFile(null);
      toast('success', 'PDF uploaded successfully.');
    } catch (e) {
      toast('error', `Upload failed: ${(e as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const onPdfSelect = (file: File | null) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast('warning', 'Please select a PDF file.');
      return;
    }
    setPdfFile(file);
    uploadPdf(file);
  };

  const resetForm = () => {
    setEditingId(null);
    setCode(''); setTitle(''); setMarkdown(''); setPdfUrl(null); setPdfFile(null); setPdfLink('');
    setElement(ELEMENT_LIST[0]); setDifficulty('easy'); setTimeLimit(1000); setMemoryLimit(256);
    setTestCases([{ input: '', output: '', isSample: true }]);
  };

  const loadForEdit = async (p: Problem) => {
    setEditingId(p.id);
    setCode(p.code); setTitle(p.title); setElement(p.pokemon_element); setDifficulty(p.difficulty);
    setTimeLimit(p.time_limit_ms); setMemoryLimit(p.memory_limit_mb);
    setMarkdown(p.description_markdown ?? ''); setPdfUrl(p.pdf_url); setPdfLink(''); setPdfFile(null);
    const { data } = await supabase.from('test_cases').select('*').eq('problem_id', p.id).order('is_sample', { ascending: false });
    const tcs = (data as TestCase[]) ?? [];
    setTestCases(tcs.length > 0 ? tcs.map((t) => ({ input: t.input_data, output: t.expected_output, isSample: t.is_sample })) : [{ input: '', output: '', isSample: true }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProblem = async (p: Problem) => {
    setDeletingId(p.id);
    try {
      const { error: tcErr } = await supabase.from('test_cases').delete().eq('problem_id', p.id);
      if (tcErr) throw tcErr;
      const { error: cpErr } = await supabase.from('contest_problems').delete().eq('problem_id', p.id);
      if (cpErr) throw cpErr;
      const { error } = await supabase.from('problems').delete().eq('id', p.id);
      if (error) throw error;
      if (p.pdf_url) {
        const path = p.pdf_url.split('/problem-pdfs/')[1];
        if (path) await supabase.storage.from('problem-pdfs').remove([path]);
      }
      onDeleted(p.id);
      if (editingId === p.id) resetForm();
      toast('success', `Problem ${p.code} deleted.`);
    } catch (e) {
      toast('error', `Delete failed: ${(e as Error).message}`);
    } finally {
      setDeletingId(null);
      setDeleteConfirm(null);
    }
  };

  const save = async () => {
    if (!code.trim() || !title.trim()) {
      toast('warning', 'Problem code and title are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        title: title.trim(),
        pokemon_element: element,
        difficulty,
        description_markdown: markdown || null,
        pdf_url: pdfUrl,
        time_limit_ms: timeLimit,
        memory_limit_mb: memoryLimit,
      };

      let savedProblem: Problem;

      if (editingId) {
        const { data, error } = await supabase.from('problems').update(payload).eq('id', editingId).select().single();
        if (error) throw error;
        savedProblem = data as Problem;
        await supabase.from('test_cases').delete().eq('problem_id', editingId);
      } else {
        const { data, error } = await supabase.from('problems').insert(payload).select().single();
        if (error) throw error;
        savedProblem = data as Problem;
      }

      const tcRows = testCases
        .filter((t) => t.input.trim() || t.output.trim())
        .map((t) => ({
          problem_id: savedProblem.id,
          input_data: t.input,
          expected_output: t.output,
          is_sample: t.isSample,
        }));
      if (tcRows.length > 0) {
        const { error: tcErr } = await supabase.from('test_cases').insert(tcRows);
        if (tcErr) throw tcErr;
      }

      if (editingId) {
        onUpdated(savedProblem);
        toast('success', `Problem ${savedProblem.code} updated!`);
      } else {
        onCreated(savedProblem);
        toast('success', `Problem ${savedProblem.code} created!`);
      }
      resetForm();
    } catch (e) {
      toast('error', `Save failed: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === 'application/pdf') onPdfSelect(f);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Form */}
      <div className="lg:col-span-2 space-y-4">
        <div className="glass rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><BookOpen className="h-5 w-5 text-red-400" /> Problem Details</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Code (Mã bài)</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="PIKA01" className="input-field font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Pikachu Lightning Charge" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Element</label>
              <select value={element} onChange={(e) => setElement(e.target.value)} className="input-field">
                {ELEMENT_LIST.map((el) => (
                  <option key={el} value={el}>{el} — {ELEMENTS[el].topic}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="input-field">
                {Object.values(DIFFICULTIES).map((d) => (
                  <option key={d.name} value={d.name}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Time Limit (ms)</label>
              <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Memory Limit (MB)</label>
              <input type="number" value={memoryLimit} onChange={(e) => setMemoryLimit(Number(e.target.value))} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Description (Markdown + LaTeX)</label>
            <textarea value={markdown} onChange={(e) => setMarkdown(e.target.value)} rows={8} placeholder="# Problem title&#10;Describe the problem... Use $...$ for inline math, $$...$$ for display math." className="input-field font-mono text-sm" />
          </div>
        </div>

        {/* PDF uploader */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3"><FileText className="h-5 w-5 text-cyan-400" /> PDF Problem Statement</h2>
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className="rounded-xl border-2 border-dashed border-slate-700 p-6 text-center hover:border-red-500/50 transition-colors"
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-red-400" />
                <span className="text-sm">Uploading PDF...</span>
              </div>
            ) : pdfUrl ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-300 flex items-center gap-2"><Check className="h-4 w-4" /> PDF saved</span>
                <button onClick={() => { setPdfUrl(null); setPdfFile(null); }} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto text-slate-500 mb-2" />
                <p className="text-sm text-slate-400">Drag & drop a PDF here, or</p>
                <label className="btn-ghost mt-2 text-sm cursor-pointer inline-flex">
                  <input type="file" accept="application/pdf" className="hidden" onChange={(e) => onPdfSelect(e.target.files?.[0] ?? null)} />
                  Choose File
                </label>
                <p className="text-[11px] text-slate-500 mt-2">File uploads automatically when selected</p>
              </>
            )}
          </div>
          <div className="mt-3">
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Or paste a PDF link</label>
            <div className="flex gap-2">
              <input
                value={pdfLink}
                onChange={(e) => setPdfLink(e.target.value)}
                placeholder="https://example.com/problem.pdf"
                className="input-field flex-1"
              />
              <button
                onClick={() => { if (pdfLink.trim()) { setPdfUrl(pdfLink.trim()); toast('info', 'PDF link attached.'); } }}
                className="btn-ghost text-sm whitespace-nowrap"
              >
                Use Link
              </button>
            </div>
          </div>
        </div>

        {/* Test cases */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3"><ListChecks className="h-5 w-5 text-emerald-400" /> Test Cases</h2>

          {/* Bulk import */}
          <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3 mb-4">
            <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <FileArchive className="h-3.5 w-3.5 text-cyan-400" /> Bulk Import Test Cases
            </p>
            <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
              ZIP with <code className="text-cyan-300">test1.in</code> / <code className="text-cyan-300">test1.out</code> pairs, or text file with <code className="text-cyan-300">### Test 1 / Input: / Output:</code> blocks.
            </p>
            <div className="flex flex-wrap gap-2">
              <label className="btn-ghost text-xs py-1.5 cursor-pointer inline-flex items-center gap-1.5">
                {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileArchive className="h-3.5 w-3.5" />}
                Import ZIP
                <input type="file" accept=".zip" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importFromFile(f); e.target.value = ''; }} />
              </label>
              <label className="btn-ghost text-xs py-1.5 cursor-pointer inline-flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5" />
                Import TXT / DOC
                <input type="file" accept=".txt,.md,.doc" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importFromFile(f); e.target.value = ''; }} />
              </label>
              {testCases.length > 0 && (
                <button onClick={() => setTestCases([{ input: '', output: '', isSample: true }])} className="btn-ghost text-xs py-1.5 text-red-400">
                  <Trash2 className="h-3.5 w-3.5" /> Clear All
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {testCases.map((tc, i) => (
              <div key={i} className="rounded-lg border border-slate-700 p-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={tc.isSample}
                      onChange={(e) => setTestCases((prev) => prev.map((p, idx) => idx === i ? { ...p, isSample: e.target.checked } : p))}
                      className="accent-red-500"
                    />
                    Sample case
                  </label>
                  {testCases.length > 1 && (
                    <button onClick={() => setTestCases((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  <textarea value={tc.input} onChange={(e) => setTestCases((prev) => prev.map((p, idx) => idx === i ? { ...p, input: e.target.value } : p))} rows={3} placeholder="Input data" className="input-field font-mono text-xs" />
                  <textarea value={tc.output} onChange={(e) => setTestCases((prev) => prev.map((p, idx) => idx === i ? { ...p, output: e.target.value } : p))} rows={3} placeholder="Expected output" className="input-field font-mono text-xs" />
                </div>
              </div>
            ))}
            <button onClick={() => setTestCases((prev) => [...prev, { input: '', output: '', isSample: false }])} className="btn-ghost text-sm w-full">
              <Plus className="h-4 w-4" /> Add Test Case
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={save} disabled={saving} className="btn-primary flex-1 text-base py-3">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} {editingId ? 'Update Problem' : 'Create Problem'}
          </button>
          {editingId && (
            <button onClick={resetForm} className="btn-ghost text-base py-3 px-4">
              <X className="h-5 w-5" /> Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Existing problems list */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white">Problems ({problems.length})</h2>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {problems.map((p) => (
            <div
              key={p.id}
              className={`glass rounded-lg p-3 transition-all ${editingId === p.id ? 'ring-2 ring-red-500' : ''}`}
            >
              <button
                onClick={() => setSelectedProblem(p)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-red-400">{p.code}</span>
                  <span className="text-xs text-slate-500 capitalize">{p.difficulty}</span>
                </div>
                <p className="text-sm font-semibold text-white mt-1 truncate">{p.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{p.pokemon_element} {p.pdf_url && <span className="text-emerald-400">· PDF</span>}</p>
              </button>
              <div className="flex gap-2 mt-2 pt-2 border-t border-slate-700/50">
                <button onClick={() => loadForEdit(p)} className="flex-1 text-xs py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center gap-1 transition-colors">
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button onClick={() => setDeleteConfirm(p)} disabled={deletingId === p.id} className="flex-1 text-xs py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center gap-1 transition-colors">
                  {deletingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Delete
                </button>
              </div>
            </div>
          ))}
          {problems.length === 0 && <p className="text-slate-500 text-sm text-center py-8">No problems created yet.</p>}
        </div>
      </div>

      {selectedProblem && (
        <ProblemDetailModal problem={selectedProblem} onClose={() => setSelectedProblem(null)} toast={toast} />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="glass-strong rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-full bg-red-500/20 p-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Problem?</h3>
            </div>
            <p className="text-sm text-slate-400 mb-1">This will permanently delete:</p>
            <p className="text-sm font-semibold text-white mb-1"><span className="font-mono text-red-400">{deleteConfirm.code}</span> — {deleteConfirm.title}</p>
            <p className="text-xs text-slate-500 mb-5">All test cases and contest associations will be removed. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={() => deleteProblem(deleteConfirm)} disabled={!!deletingId} className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                {deletingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProblemDetailModal({ problem, onClose, toast }: { problem: Problem; onClose: () => void; toast: (t: 'success' | 'error', m: string) => void }) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTc, setNewTc] = useState({ input: '', output: '', isSample: false });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('test_cases').select('*').eq('problem_id', problem.id).order('is_sample', { ascending: false });
      setTestCases((data as TestCase[]) ?? []);
      setLoading(false);
    })();
  }, [problem.id]);

  const addTc = async () => {
    const { data, error } = await supabase.from('test_cases').insert({
      problem_id: problem.id,
      input_data: newTc.input,
      expected_output: newTc.output,
      is_sample: newTc.isSample,
    }).select().single();
    if (error) { toast('error', error.message); return; }
    setTestCases((prev) => [data as TestCase, ...prev]);
    setNewTc({ input: '', output: '', isSample: false });
    toast('success', 'Test case added.');
  };

  const deleteTc = async (id: string) => {
    const { error } = await supabase.from('test_cases').delete().eq('id', id);
    if (error) { toast('error', error.message); return; }
    setTestCases((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass-strong rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <div>
            <span className="font-mono text-xs text-red-400">{problem.code}</span>
            <h3 className="text-lg font-bold text-white">{problem.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? <Loader2 className="h-6 w-6 animate-spin text-red-500" /> : (
            <>
              {testCases.map((tc, i) => (
                <div key={tc.id} className="rounded-lg border border-slate-700 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300">Case {i + 1} {tc.is_sample && <span className="text-emerald-400">(sample)</span>}</span>
                    <button onClick={() => deleteTc(tc.id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <pre className="font-mono text-xs text-emerald-300 bg-slate-950/60 rounded p-2 overflow-x-auto whitespace-pre">{tc.input_data}</pre>
                    <pre className="font-mono text-xs text-cyan-300 bg-slate-950/60 rounded p-2 overflow-x-auto whitespace-pre">{tc.expected_output}</pre>
                  </div>
                </div>
              ))}
              <div className="rounded-lg border border-slate-700 p-3">
                <p className="text-xs font-semibold text-slate-300 mb-2">Add test case</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  <textarea value={newTc.input} onChange={(e) => setNewTc((p) => ({ ...p, input: e.target.value }))} rows={3} placeholder="Input" className="input-field font-mono text-xs" />
                  <textarea value={newTc.output} onChange={(e) => setNewTc((p) => ({ ...p, output: e.target.value }))} rows={3} placeholder="Expected output" className="input-field font-mono text-xs" />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input type="checkbox" checked={newTc.isSample} onChange={(e) => setNewTc((p) => ({ ...p, isSample: e.target.checked }))} className="accent-red-500" />
                    Sample
                  </label>
                  <button onClick={addTc} className="btn-primary text-xs py-1 px-3"><Plus className="h-3 w-3" /> Add</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Contest Manager ----------
function ContestManager({
  contests, problems, onCreated, toast,
}: {
  contests: Contest[];
  problems: Problem[];
  onCreated: (c: Contest) => void;
  toast: (t: 'success' | 'error' | 'info' | 'warning', m: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleProblem = (id: string) => {
    setSelectedProblems((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const save = async () => {
    if (!title.trim() || !startTime || !endTime) {
      toast('warning', 'Title, start time, and end time are required.');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('contests')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      const newContest = data as Contest;

      if (selectedProblems.length > 0) {
        const rows = selectedProblems.map((pid, i) => ({
          contest_id: newContest.id,
          problem_id: pid,
          order_index: i,
        }));
        const { error: cpErr } = await supabase.from('contest_problems').insert(rows);
        if (cpErr) throw cpErr;
      }

      onCreated(newContest);
      toast('success', `Contest "${newContest.title}" created!`);
      setTitle(''); setDescription(''); setStartTime(''); setEndTime(''); setSelectedProblems([]);
    } catch (e) {
      toast('error', `Save failed: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div className="glass rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-400" /> New Contest</h2>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Indigo League Showdown" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-field" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Start Time</label>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">End Time</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Assign Problems</label>
            <div className="max-h-60 overflow-y-auto space-y-1.5 rounded-lg border border-slate-700 p-2">
              {problems.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Create problems first.</p>}
              {problems.map((p) => (
                <label key={p.id} className="flex items-center gap-2 p-2 rounded hover:bg-slate-800/40 cursor-pointer">
                  <input type="checkbox" checked={selectedProblems.includes(p.id)} onChange={() => toggleProblem(p.id)} className="accent-red-500" />
                  <span className="font-mono text-xs text-red-400">{p.code}</span>
                  <span className="text-sm text-slate-200">{p.title}</span>
                  <span className="ml-auto text-xs text-slate-500">{p.pokemon_element}</span>
                </label>
              ))}
            </div>
          </div>
          <button onClick={save} disabled={saving} className="btn-primary w-full">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Create Contest
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-white mb-3">Contests ({contests.length})</h2>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {contests.map((c) => (
            <div key={c.id} className="glass rounded-lg p-3">
              <p className="font-semibold text-white text-sm">{c.title}</p>
              <p className="text-xs text-slate-500 mt-1">{new Date(c.start_time).toLocaleString()} → {new Date(c.end_time).toLocaleString()}</p>
            </div>
          ))}
          {contests.length === 0 && <p className="text-slate-500 text-sm text-center py-8">No contests yet.</p>}
        </div>
      </div>
    </div>
  );
}
