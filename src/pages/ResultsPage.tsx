import React, { useState, useMemo } from 'react';
import { XCircle, ExternalLink, BarChart3 } from 'lucide-react';
import { AnalysisResult, Job } from '../types';
import { ResultCard } from '../components/ResultCard';
import { clientId } from '../lib/firebase';

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
  handleFirestoreError?: any;
  db?: any;
  updateDoc?: any;
  doc?: any;
  query?: any;
  collection?: any;
  where?: any;
  getDocs?: any;
  writeBatch?: any;
  OperationType?: any;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  results, blindMode, searchTerm, setSearchTerm,
  editingScore, setEditingScore, handleScoreOverride, activeJobId, jobs, weights, language, isShareMode, t,
  handleFirestoreError, db, updateDoc, doc, query, collection, where, getDocs, writeBatch, OperationType
}) => {
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [fitFilter, setFitFilter] = useState<string>('all');

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
                    <option value="all">{language === 'zh' ? '全部评分' : 'All Scores'}</option>
                    <option value="high">{language === 'zh' ? '优选 (≥80)' : 'High (≥80)'}</option>
                    <option value="medium">{language === 'zh' ? '备选 (60-79)' : 'Medium (60-79)'}</option>
                    <option value="low">{language === 'zh' ? '暂不考虑 (<60)' : 'Low (<60)'}</option>
                  </select>
                  {allFitStatuses.length > 0 && (
                    <select value={fitFilter} onChange={e => setFitFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-st-light/20">
                      <option value="all">{language === 'zh' ? '全部推荐' : 'All Recommendations'}</option>
                      {allFitStatuses.map(fs => <option key={fs} value={fs}>{fs}</option>)}
                    </select>
                  )}
                  {(scoreFilter !== 'all' || fitFilter !== 'all') && (
                    <span className="text-xs font-bold text-st-light">{filteredResults.length}/{results.length} {language === 'zh' ? '人' : 'shown'}</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {!isShareMode && activeJobId && (
                <button onClick={async () => {
                  const job = jobs.find(j => j.id === activeJobId);
                  if (job) {
                    try {
                      await updateDoc(doc(db, 'jobs', activeJobId), { isPublic: !job.isPublic });
                      if (!job.isPublic) {
                        navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?jobId=${activeJobId}&mode=share`);
                      }
                    } catch (e) { handleFirestoreError(e, OperationType.WRITE, `jobs/${activeJobId}`); }
                  }
                }} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-all shadow-sm ${jobs.find(j => j.id === activeJobId)?.isPublic ? 'bg-st-yellow text-st-dark' : 'bg-white text-slate-400 border border-slate-200'}`}>
                  <ExternalLink className="w-3 h-3" />{jobs.find(j => j.id === activeJobId)?.isPublic ? 'SHARED' : 'SHARE TO INTERVIEWER'}
                </button>
              )}
              {!isShareMode && (
                <button onClick={async () => {
                  if (activeJobId && confirm(t.clearAll + "?")) {
                    try {
                      const q = query(collection(db, 'analysisResults'), where('jobId', '==', activeJobId), where('ownerId', '==', clientId));
                      const snap = await getDocs(q);
                      const batch = writeBatch(db);
                      snap.forEach((d: any) => batch.delete(d.ref));
                      await batch.commit();
                    } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'analysisResults (batch)'); }
                  }
                }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 transition-all border border-rose-100 shadow-sm">
                  <XCircle className="w-3 h-3" /> {t.clearAll}
                </button>
              )}
            </div>
          </div>

          {/* Result Cards */}
          <div className="space-y-4">
            {filteredResults.map((res, idx) => (
              <ResultCard
                key={res.file_name || idx}
                res={res} idx={idx} weights={weights}
                blindMode={blindMode} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                isShareMode={isShareMode} editingScore={editingScore} setEditingScore={setEditingScore}
                handleScoreOverride={handleScoreOverride} t={t} language={language}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
