import React, { useState, useMemo, useEffect, useRef } from 'react';
import { XCircle, BarChart3, GitCompare, X, Loader2 } from 'lucide-react';
import { AnalysisResult, Job } from '../types';
import { ResultCard } from '../components/ResultCard';
import { ScoreChart } from '../components/ScoreChart';
import { compareCandidates } from '../services/gemini';
import { api } from '../lib/firebase';

interface ResultsPageProps {
  results: AnalysisResult[];
  expandedResult: string | null;
  setExpandedResult: (id: string | null) => void;
  blindMode: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  editingScore: any;
  setEditingScore: (val: any) => void;
  handleScoreOverride: (fileName: string, score: number, tags: string[]) => void;
  activeJobId: string | null;
  jobs: Job[];
  weights: any[];
  language: string;
  isShareMode: boolean;
  t: any;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  results, blindMode, searchTerm, setSearchTerm,
  editingScore, setEditingScore, handleScoreOverride, activeJobId, jobs, weights, language, isShareMode, t,
}) => {
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [fitFilter, setFitFilter] = useState<string>('all');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCompare, setSelectedCompare] = useState<Set<string>>(new Set());
  const [compareAnalysis, setCompareAnalysis] = useState<string | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Fetch AI comparison when 2-3 candidates selected (debounced via ref to avoid poll re-triggers)
  const activeJob = useMemo(() => jobs.find(j => j.id === activeJobId), [jobs, activeJobId]);
  const lastCompareKey = useRef<string>('');
  useEffect(() => {
    const key = [...selectedCompare].sort().join('|') + '|' + (activeJob?.jd?.slice(0, 200) || '');
    if (!key || key === lastCompareKey.current) return;
    lastCompareKey.current = key;

    if (selectedCompare.size < 2 || !activeJob?.jd) {
      setCompareAnalysis(null);
      return;
    }
    const selectedResults = results.filter(r => selectedCompare.has(r.file_name));
    if (selectedResults.length < 2) return;

    setCompareLoading(true);
    compareCandidates(
      activeJob.jd,
      selectedResults.map(r => ({
        name: r.candidate_name || r.file_name,
        scores: r.detailed_scores,
        highlights: r.summary.highlights.slice(0, 3),
        gaps: r.summary.gaps.slice(0, 3),
      })),
      language as 'en' | 'zh'
    ).then(setCompareAnalysis).catch(() => setCompareAnalysis(null)).finally(() => setCompareLoading(false));
  }, [selectedCompare, activeJob, language]);

  const allFitStatuses = useMemo(() => {
    const set = new Set<string>();
    results.forEach(r => { if (r.overall_recommendation?.fit_status) set.add(r.overall_recommendation.fit_status); });
    return Array.from(set);
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const score = r.hr_override_score ?? r.overall_score;
      if (scoreFilter === 'high' && score < 80) return false;
      if (scoreFilter === 'medium' && (score < 60 || score >= 80)) return false;
      if (scoreFilter === 'low' && score >= 60) return false;
      if (fitFilter !== 'all' && r.overall_recommendation?.fit_status !== fitFilter) return false;
      return true;
    });
  }, [results, scoreFilter, fitFilter]);

  return (
    <div className="flex-1 overflow-y-auto p-8 st-scrollbar h-full bg-slate-50/30">
      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-6 animate-in fade-in duration-700">
          <div className="w-24 h-24 rounded-[2.5rem] bg-slate-100 flex items-center justify-center border-4 border-white shadow-xl">
            <BarChart3 className="w-10 h-10" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">{t.waitingInput}</h3>
            <p className="text-sm font-bold mt-2 uppercase tracking-widest">{t.uploadPrompt}</p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-12 pb-24">
          {/* Header + Filters */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-slate-800">{t.analysisFor.replace('{count}', results.length.toString())}</h3>
              {results.length > 0 && (
                <div className="flex items-center gap-3 ml-8">
                  <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value as any)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-st-light/20">
                    <option value="all">{t.allScores}</option>
                    <option value="high">{t.highScore}</option>
                    <option value="medium">{t.mediumScore}</option>
                    <option value="low">{t.lowScore}</option>
                  </select>
                  {allFitStatuses.length > 0 && (
                    <select value={fitFilter} onChange={e => setFitFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-st-light/20">
                      <option value="all">{t.allRecommendations}</option>
                      {allFitStatuses.map(fs => <option key={fs} value={fs}>{fs}</option>)}
                    </select>
                  )}
                  {(scoreFilter !== 'all' || fitFilter !== 'all') && (
                    <span className="text-xs font-bold text-st-light">{filteredResults.length}/{results.length} {t.shown}</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!isShareMode && (
                <button onClick={async () => {
                  if (activeJobId && confirm(t.clearAll + "?")) {
                    try { await api.deleteResultsByJob(activeJobId); } catch (e) { /* ignore */ }
                  }
                }} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-500 bg-rose-50 hover:bg-rose-100 transition-all border border-rose-100">
                  <XCircle className="w-3 h-3" /> {t.clearAll}
                </button>
              )}
              {!isShareMode && (
                <button
                  onClick={() => { setCompareMode(!compareMode); setSelectedCompare(new Set()); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${compareMode ? 'bg-st-dark text-st-yellow shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}
                >
                  <GitCompare className="w-3.5 h-3.5" /> {t.compare}
                </button>
              )}
            </div>
          </div>

          {/* Comparison Radar */}
          {compareMode && selectedCompare.size >= 2 && (
            <div className="bg-white rounded-2xl border border-st-light/20 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-st-dark">
                  {t.comparing}: {selectedCompare.size} {t.candidate || 'candidates'}
                </h4>
                <button onClick={() => setSelectedCompare(new Set())} className="text-xs font-medium text-slate-400 hover:text-rose-500 flex items-center gap-1">
                  <X className="w-3 h-3" /> {t.clearCompare}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ScoreChart
                  weights={weights}
                  detailedScores={results.find(r => selectedCompare.has(r.file_name))?.detailed_scores || {}}
                  t={t}
                  compareScores={
                    Array.from(selectedCompare)
                      .slice(1)
                      .map(fn => {
                        const r = results.find(r2 => r2.file_name === fn);
                        return { name: r?.candidate_name || fn, scores: r?.detailed_scores || {} };
                      })
                  }
                />
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <h4 className="text-xs font-medium text-st-light tracking-wide mb-3">
                    {language === 'zh' ? 'AI 对比分析' : 'AI Comparison'}
                  </h4>
                  {compareLoading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {language === 'zh' ? '生成中...' : 'Analyzing...'}
                    </div>
                  ) : compareAnalysis ? (
                    <div className="text-xs text-st-dark leading-relaxed space-y-2 max-h-[320px] overflow-y-auto st-scrollbar">
                      {compareAnalysis.split('\n').filter(Boolean).map((line, i) => {
                        // Section headers: 【...】 or [...]
                        const isHeader = /^[【\[]/.test(line.trim());
                        // Bullet or numbered
                        const isBullet = /^[•\-—\d]+[\.\)]/.test(line.trim()) || line.trim().startsWith('•');
                        return (
                          <div key={i} className={`${isHeader ? 'text-[11px] font-semibold text-st-dark mt-2 first:mt-0' : isBullet ? 'pl-3 text-[11px] text-slate-600' : 'text-[11px] text-slate-600'}`}>
                            {line}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">{language === 'zh' ? '选择候选人后自动生成' : 'Select candidates to generate'}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Result Cards */}
          <div className="space-y-4">
            {filteredResults.map((res, idx) => (
              <ResultCard
                key={res.file_name || idx}
                res={res} idx={idx} weights={weights}
                blindMode={blindMode} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                isShareMode={isShareMode} editingScore={editingScore} setEditingScore={setEditingScore}
                handleScoreOverride={handleScoreOverride} t={t} language={language}
                compareMode={compareMode}
                isCompared={selectedCompare.has(res.file_name)}
                onToggleCompare={() => {
                  setSelectedCompare(prev => {
                    const next = new Set(prev);
                    if (next.has(res.file_name)) { next.delete(res.file_name); }
                    else if (next.size < 3) { next.add(res.file_name); }
                    return next;
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
