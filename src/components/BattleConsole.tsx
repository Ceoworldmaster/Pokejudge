import { useState } from 'react';
import type { Verdict } from '@/types';
import type { TestCaseResult, TestCaseStatus } from '@/services/piston';
import { VerdictBadge } from './VerdictBadge';
import { Pokeball } from './Pokeball';
import {
  Terminal, ChevronDown, ChevronUp, Clock, MemoryStick,
  CheckCircle2, XCircle, AlertTriangle, Zap, Loader2,
  ChevronRight, FileCode2, X,
} from 'lucide-react';

export interface BattleConsoleState {
  verdict?: Verdict;
  output?: string;
  runtimeMs?: number;
  memoryKb?: number;
  passed?: number;
  total?: number;
  detail?: string;
  testCaseResults?: TestCaseResult[];
  mode?: 'run' | 'submit';
}

const STATUS_META: Record<TestCaseStatus, { icon: typeof CheckCircle2; color: string; bg: string; text: string }> = {
  AC:  { icon: CheckCircle2, color: '#34D399', bg: 'bg-emerald-500/15', text: 'text-emerald-300' },
  WA:  { icon: XCircle,      color: '#EF4444', bg: 'bg-red-500/15',     text: 'text-red-300' },
  TLE: { icon: Clock,       color: '#FACC15', bg: 'bg-yellow-500/15',   text: 'text-yellow-300' },
  CE:  { icon: AlertTriangle,color: '#A855F7', bg: 'bg-violet-500/15',  text: 'text-violet-300' },
};

interface Props {
  state: BattleConsoleState;
  open: boolean;
  onToggle: () => void;
  running?: boolean;
  submitting?: boolean;
}

export function BattleConsole({ state, open, onToggle, running, submitting }: Props) {
  const [tab, setTab] = useState<'output' | 'judgment'>('output');
  const [expandedCase, setExpandedCase] = useState<number | null>(null);

  const isActive = running || submitting;
  const hasResults = state.testCaseResults && state.testCaseResults.length > 0;
  const passed = state.passed ?? 0;
  const total = state.total ?? 0;
  const passPct = total > 0 ? (passed / total) * 100 : 0;

  return (
    <div className="border-t border-slate-800 bg-slate-900/80 backdrop-blur">
      {/* Header bar */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800/40 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-red-400" />
          Battle Console
          {isActive && <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />}
          {state.verdict && state.verdict !== 'Running' && state.verdict !== 'Pending' && (
            <VerdictBadge verdict={state.verdict} />
          )}
        </span>
        <span className="text-xs text-slate-500 flex items-center gap-1">
          {open ? 'Hide' : 'Show'}
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </span>
      </button>

      {open && (
        <div className="animate-slide-up">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 px-2 gap-1">
            <button
              onClick={() => setTab('output')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === 'output' ? 'border-red-500 text-red-300' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" /> Test Run Output
            </button>
            <button
              onClick={() => setTab('judgment')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === 'judgment' ? 'border-red-500 text-red-300' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <FileCode2 className="h-3.5 w-3.5" /> Judgment Breakdown
            </button>
          </div>

          <div className="p-4 max-h-[45vh] overflow-y-auto">
            {/* Tab 1: Test Run Output */}
            {tab === 'output' && (
              <div className="space-y-3">
                {isActive && (
                  <div className="flex items-center gap-2 text-cyan-300 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {submitting ? 'Running all test cases...' : 'Running sample...'}
                  </div>
                )}

                {state.output && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400 mb-1.5">stdout</p>
                    <pre className="font-mono text-xs text-emerald-300 bg-slate-950/80 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">{state.output}</pre>
                  </div>
                )}

                {state.detail && !state.output && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400 mb-1.5">Details</p>
                    <pre className="font-mono text-xs text-slate-400 bg-slate-950/80 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">{state.detail}</pre>
                  </div>
                )}

                {!isActive && !state.output && !state.detail && (
                  <p className="text-sm text-slate-500">Run a sample or submit to see output here.</p>
                )}
              </div>
            )}

            {/* Tab 2: Judgment Breakdown */}
            {tab === 'judgment' && (
              <div className="space-y-4">
                {/* Progress bar */}
                {total > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">
                        Passed: <span className="text-emerald-400">{passed}</span> / {total} Test Cases
                      </span>
                      {state.runtimeMs !== undefined && state.runtimeMs > 0 && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {state.runtimeMs}ms
                        </span>
                      )}
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          passPct === 100 ? 'bg-emerald-500' : passPct > 0 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${passPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Overall verdict badge (large) */}
                {state.verdict && state.verdict !== 'Running' && state.verdict !== 'Pending' && (
                  <div className="flex justify-center">
                    <VerdictBadge verdict={state.verdict} size="lg" />
                  </div>
                )}

                {/* Per-testcase grid */}
                {hasResults && (
                  <div className="space-y-2">
                    {state.testCaseResults!.map((tr) => {
                      const sm = STATUS_META[tr.status];
                      const Icon = sm.icon;
                      const isExpanded = expandedCase === tr.testCaseIndex;
                      const isSample = tr.testCaseIndex < 2;
                      return (
                        <div key={tr.testCaseIndex} className="rounded-lg border border-slate-800 bg-slate-950/40 overflow-hidden">
                          <button
                            onClick={() => setExpandedCase(isExpanded ? null : tr.testCaseIndex)}
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-800/40 transition-colors"
                          >
                            <span className="flex items-center gap-2.5">
                              <span className={`flex items-center justify-center h-6 w-6 rounded-full ${sm.bg}`}>
                                <Icon className={`h-3.5 w-3.5 ${sm.text}`} />
                              </span>
                              <span className="text-sm font-mono text-slate-300">
                                Test {tr.testCaseIndex + 1}
                              </span>
                              <span className={`text-xs font-bold ${sm.text}`}>
                                {tr.status} ({tr.verdictBadge})
                              </span>
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-mono">{tr.executionTimeMs}ms</span>
                              {isSample && (
                                <ChevronRight className={`h-4 w-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              )}
                            </span>
                          </button>

                          {/* Expandable diff (sample cases only) */}
                          {isExpanded && isSample && (
                            <div className="border-t border-slate-800 p-3 space-y-2.5 animate-fade-in">
                              <div>
                                <p className="text-xs font-semibold uppercase text-slate-400 mb-1">Input</p>
                                <pre className="font-mono text-xs text-slate-300 bg-slate-950/80 rounded p-2 overflow-x-auto whitespace-pre">{tr.inputData || '(empty)'}</pre>
                              </div>
                              <div className="grid sm:grid-cols-2 gap-2">
                                <div>
                                  <p className="text-xs font-semibold uppercase text-cyan-400 mb-1">Expected</p>
                                  <pre className="font-mono text-xs text-cyan-300 bg-slate-950/80 rounded p-2 overflow-x-auto whitespace-pre">{tr.expectedOutput || '(empty)'}</pre>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase text-red-400 mb-1">Actual</p>
                                  <pre className="font-mono text-xs text-red-300 bg-slate-950/80 rounded p-2 overflow-x-auto whitespace-pre">{tr.actualOutput || '(empty)'}</pre>
                                </div>
                              </div>
                              {tr.stderr && (
                                <div>
                                  <p className="text-xs font-semibold uppercase text-orange-400 mb-1">stderr</p>
                                  <pre className="font-mono text-xs text-orange-300 bg-slate-950/80 rounded p-2 overflow-x-auto whitespace-pre-wrap">{tr.stderr}</pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {!hasResults && !isActive && (
                  <p className="text-sm text-slate-500">Submit your solution to see the full judgment breakdown.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
