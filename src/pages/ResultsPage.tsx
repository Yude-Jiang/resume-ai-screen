import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ExternalLink, 
  Loader2, 
  BarChart3, 
  Target,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnalysisResult, Job } from '../types';
import { PdfViewer } from '../components/PdfViewer';
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
  results, expandedResult, setExpandedResult, blindMode, searchTerm, setSearchTerm,
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
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-slate-800">{t.analysisFor.replace('{count}', results.length.toString())}</h3>
              {results.length > 0 && (
                <div className="flex items-center gap-3 ml-8">
                  <select
                    value={scoreFilter}
                    onChange={e => setScoreFilter(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-st-light/20"
                  >
                    <option value="all">{language === 'zh' ? '全部评分' : 'All Scores'}</option>
                    <option value="high">{language === 'zh' ? '优选 (≥80)' : 'High (≥80)'}</option>
                    <option value="medium">{language === 'zh' ? '备选 (60-79)' : 'Medium (60-79)'}</option>
                    <option value="low">{language === 'zh' ? '暂不考虑 (<60)' : 'Low (<60)'}</option>
                  </select>
                  {allFitStatuses.length > 0 && (
                    <select
                      value={fitFilter}
                      onChange={e => setFitFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-st-light/20"
                    >
                      <option value="all">{language === 'zh' ? '全部推荐' : 'All Recommendations'}</option>
                      {allFitStatuses.map(fs => (
                        <option key={fs} value={fs}>{fs}</option>
                      ))}
                    </select>
                  )}
                  {(scoreFilter !== 'all' || fitFilter !== 'all') && (
                    <span className="text-xs font-bold text-st-light">
                      {filteredResults.length}/{results.length} {language === 'zh' ? '人' : 'shown'}
                    </span>
                  )}
                </div>
              )}
              {!isShareMode && activeJobId && (
                <button 
                  onClick={async () => {
                    const job = jobs.find(j => j.id === activeJobId);
                    if (job) {
                      try {
                        await updateDoc(doc(db, 'jobs', activeJobId), { isPublic: !job.isPublic });
                        const url = `${window.location.origin}${window.location.pathname}?jobId=${activeJobId}&mode=share`;
                        if (!job.isPublic) {
                          navigator.clipboard.writeText(url);
                          // We'll need a toast prop too? Or use global toast. I'll use success/info if provided
                        } 
                      } catch (e) { handleFirestoreError(e, OperationType.WRITE, `jobs/${activeJobId}`); }
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-all shadow-sm ${jobs.find(j => j.id === activeJobId)?.isPublic ? 'bg-st-yellow text-st-dark' : 'bg-white text-slate-400 border border-slate-200'}`}
                >
                  <ExternalLink className="w-3 h-3" />
                  {jobs.find(j => j.id === activeJobId)?.isPublic ? 'SHARED' : 'SHARE TO INTERVIEWER'}
                </button>
              )}
            </div>
            {!isShareMode && (
              <button 
                onClick={async () => {
                if (activeJobId && confirm(t.clearAll + "?")) {
                  try {
                    const q = query(collection(db, 'analysisResults'), where('jobId', '==', activeJobId), where('ownerId', '==', clientId));
                    const snap = await getDocs(q);
                    const batch = writeBatch(db);
                    snap.forEach((d: any) => batch.delete(d.ref));
                    await batch.commit();
                  } catch (e) { handleFirestoreError(e, OperationType.DELETE, `analysisResults (batch)`); }
                }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 transition-all border border-rose-100 shadow-sm"
              >
                <XCircle className="w-3 h-3" /> {t.clearAll}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {filteredResults.map((res, idx) => (
              <div 
                key={idx} 
                className={`bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${expandedResult === res.file_name ? 'ring-4 ring-st-light/10 shadow-3xl' : 'shadow-sm'}`}
              >
                <div 
                  className={`p-6 flex items-center gap-6 cursor-pointer hover:bg-slate-50 transition-colors ${expandedResult === res.file_name ? 'bg-white' : ''}`}
                  onClick={() => {
                    setExpandedResult(expandedResult === res.file_name ? null : res.file_name);
                    setSearchTerm('');
                  }}
                >
                  <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-lg relative overflow-hidden shrink-0 border-2 ${
                    (res.hr_override_score ?? res.overall_score) >= 80 ? 'bg-st-success/10 border-st-success text-st-success' : 
                    (res.hr_override_score ?? res.overall_score) >= 60 ? 'bg-st-yellow/10 border-st-yellow text-st-yellow' : 
                    'bg-rose-50 border-rose-500 text-rose-500'
                  }`}>
                    <div className="absolute top-0 right-0 w-8 h-8 bg-current opacity-10 rounded-bl-full" />
                    <span className="text-2xl font-black tabular-nums leading-none">{(res.hr_override_score ?? res.overall_score)}</span>
                    <span className="text-sm font-black mt-1 opacity-60 uppercase tracking-widest">{t.score}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-black text-st-dark truncate">
                        {blindMode ? `${t.candidate} #${idx + 1}` : (res.summary.personal_info?.name || res.file_name.split('.')[0])}
                      </h3>
                      {res.hr_override_score !== undefined && (
                         <div className="px-2 py-1 bg-st-dark text-st-yellow text-sm font-black rounded-full border border-st-yellow/20 flex items-center gap-1 shadow-lg">
                            <Target className="w-3 h-3" /> VERIFIED
                         </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="px-3 py-1 bg-slate-100 rounded-full text-sm font-bold text-slate-500 border border-slate-200">
                        {res.summary.personal_info?.experience_years ?? 'N/A'} {t.years} {t.exp}
                      </div>
                      <div className="px-3 py-1 bg-slate-100 rounded-full text-sm font-bold text-slate-500 border border-slate-200 uppercase tracking-tighter">
                        {res.summary.personal_info?.education_level || 'N/A'}
                      </div>
                      {res.summary.key_skills.slice(0, 3).map((skill, si) => (
                        <span key={si} className="text-sm font-bold text-st-light border border-st-light/20 bg-st-light/5 px-2 py-1 rounded-full">{skill}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <div className="text-sm font-black text-slate-300 uppercase tracking-widest mb-1">{t.aiRecommendation}</div>
                      <div className="text-sm font-bold text-slate-500 truncate max-w-[200px]">
                        {res.overall_recommendation.fit_status.toUpperCase()}
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${expandedResult === res.file_name ? 'bg-st-dark text-white rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                      <ChevronDown className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedResult === res.file_name && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100"
                    >
                      <div className="flex flex-col xl:flex-row h-[800px]">
                        <div className="w-full xl:w-[680px] flex flex-col border-r border-slate-100 bg-white st-scrollbar overflow-y-auto">
                          <div className="p-10 space-y-12">
                            {/* Detailed Scoring */}
                            <section className="animate-in fade-in slide-in-from-left duration-500">
                              <div className="flex items-center justify-between mb-8">
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">{t.scoreBreakdownVis}</h4>
                                <div className="flex gap-2">
                                  <div className="px-3 py-1 bg-st-success/10 text-st-success text-sm font-black rounded-full border border-st-success/20 tracking-tighter shadow-sm animate-pulse">
                                    {t.highMatch}
                                  </div>
                                </div>
                              </div>
                              <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={weights.map((w, i) => {
                                    const idToKey: Record<string, string> = { edu: 'education', exp: 'experience', skill: 'skills', lang: 'language', cert: 'certs' };
                                    const colors = ['#3cb4e6', '#47c8a0', '#f59e0b', '#8b5cf6', '#ef4444'];
                                    return {
                                      name: t[idToKey[w.id] as keyof typeof t] || w.label,
                                      val: res.detailed_scores?.[w.id] || 0,
                                      fill: colors[i % colors.length]
                                    };
                                  })}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                      dataKey="name"
                                      axisLine={false}
                                      tickLine={false}
                                      tick={{ fontSize: 10, fontWeight: '900', fill: '#64748b' }}
                                      dy={10}
                                      interval={0}
                                    />
                                    <YAxis hide domain={[0, 100]} />
                                    <Tooltip
                                      cursor={{ fill: 'rgba(60, 180, 230, 0.05)' }}
                                      content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                          return (
                                            <div className="bg-st-dark text-white px-3 py-2 rounded-xl text-sm font-black shadow-2xl border border-white/10">
                                              {payload[0].value}%
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                    <Bar dataKey="val" radius={[8, 8, 8, 8]} barSize={32}>
                                      {weights.map((_, i) => (
                                        <Cell key={i} fill={['#3cb4e6', '#47c8a0', '#f59e0b', '#8b5cf6', '#ef4444'][i % 5]} />
                                      ))}
                                      <LabelList dataKey="val" position="top" style={{ fontSize: 11, fontWeight: 900, fill: '#475569' }} formatter={(v: number) => v > 0 ? v : ''} />
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </section>

                            {/* Qualitative Analysis */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-slate-50">
                              <section className="space-y-6">
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 inline-block">{t.keyHighlights}</h4>
                                <div className="space-y-4">
                                  {res.summary.highlights.map((h, i) => (
                                    <div 
                                      key={i} 
                                      className="flex gap-4 group cursor-pointer"
                                      onClick={() => setSearchTerm(h.split(' ').slice(0, 3).join(' '))}
                                    >
                                      <div className="w-6 h-6 rounded-lg bg-st-success/10 flex items-center justify-center shrink-0 border border-st-success/20 transition-all group-hover:scale-110">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-st-success" />
                                      </div>
                                      <span className="text-sm text-slate-600 font-bold leading-relaxed group-hover:text-st-light transition-colors">{h}</span>
                                    </div>
                                  ))}
                                </div>
                              </section>
                              <section className="space-y-6">
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 inline-block">{t.expGaps}</h4>
                                <div className="space-y-4">
                                  {res.summary.gaps.map((g, i) => (
                                    <div 
                                      key={i} 
                                      className="flex gap-4 group cursor-pointer"
                                      onClick={() => setSearchTerm(g.split(' ').slice(0, 3).join(' '))}
                                    >
                                      <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100 transition-all group-hover:scale-110">
                                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                      </div>
                                      <span className="text-sm text-slate-500 italic font-bold leading-relaxed group-hover:text-st-light transition-colors">{g}</span>
                                    </div>
                                  ))}
                                </div>
                              </section>
                            </div>

                            {/* AI Recommendation Box */}
                            <section className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 relative overflow-hidden group hover:border-st-light/30 transition-all">
                              <div className="absolute -top-12 -right-12 w-48 h-48 bg-st-light/5 rounded-full blur-3xl" />
                              <div className="flex items-start gap-8 relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-st-dark flex items-center justify-center shrink-0 shadow-2xl group-hover:scale-110 transition-transform">
                                  <Zap className="w-8 h-8 text-st-yellow fill-st-yellow" />
                                </div>
                                <div className="space-y-4">
                                  <h4 className="text-sm font-black text-st-light uppercase tracking-widest">{t.recommLetter}</h4>
                                  <div className="text-lg font-black text-st-dark leading-tight tracking-tight pr-12">
                                     {res.overall_recommendation.logic}
                                  </div>
                                  <div className="flex gap-2 pt-2">
                                    <div className="px-4 py-2 bg-white rounded-xl text-sm font-black text-st-dark border border-slate-200 shadow-sm flex items-center gap-2">
                                      <Target className="w-4 h-4 text-st-light" />
                                      {res.overall_recommendation.fit_status.toUpperCase()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </section>

                            {/* HR Override Panel */}
                            {!isShareMode && (
                            <section className="pt-8 border-t border-slate-100">
                               <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">{t.hrOverride}</h4>
                               <div className="bg-slate-100/50 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-end">
                                  <div className="flex-1 space-y-2">
                                     <label className="text-sm font-bold text-slate-500">{t.feedback}</label>
                                     <input 
                                       type="text"
                                       className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold text-st-dark focus:outline-none focus:ring-2 focus:ring-st-light/20 transition-all"
                                       placeholder={t.feedback}
                                       value={editingScore?.fileName === res.file_name ? editingScore.tags.join(', ') : (res.hr_feedback_tags?.join(', ') || '')}
                                       onChange={(e) => setEditingScore({ 
                                          fileName: res.file_name, 
                                          score: editingScore?.fileName === res.file_name ? editingScore.score : (res.hr_override_score ?? res.overall_score),
                                          tags: e.target.value.split(',').map(s => s.trim()) 
                                       })}
                                     />
                                  </div>
                                  <div className="w-24 space-y-2">
                                     <label className="text-sm font-bold text-slate-500">{t.score}</label>
                                     <input 
                                       type="number"
                                       className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold text-st-dark focus:outline-none focus:ring-2 focus:ring-st-light/20 transition-all"
                                       value={editingScore?.fileName === res.file_name ? editingScore.score : (res.hr_override_score ?? res.overall_score)}
                                       onChange={(e) => setEditingScore({ 
                                          fileName: res.file_name, 
                                          score: parseInt(e.target.value),
                                          tags: editingScore?.fileName === res.file_name ? editingScore.tags : (res.hr_feedback_tags || [])
                                       })}
                                     />
                                  </div>
                                  {editingScore?.fileName === res.file_name && (
                                     <div className="flex gap-2">
                                        <button 
                                          onClick={() => handleScoreOverride(res.file_name, editingScore.score, editingScore.tags)}
                                          className="bg-st-dark text-st-yellow p-3 rounded-xl shadow-lg hover:bg-black transition-all active:scale-95"
                                        >
                                          <CheckCircle2 className="w-5 h-5" />
                                        </button>
                                        <button 
                                          onClick={() => setEditingScore(null)}
                                          className="bg-white text-slate-400 p-3 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
                                        >
                                          <XCircle className="w-5 h-5" />
                                        </button>
                                     </div>
                                  )}
                               </div>
                            </section>
                            )}
                          </div>
                        </div>

                        {/* Resume Visualizer Sidebar */}
                        <div className="flex-1 bg-slate-100 p-10 flex flex-col relative min-h-[500px] xl:min-h-0">
                          <div className="absolute top-0 right-0 p-8 z-10 pointer-events-none">
                             <div className="flex items-center gap-4 animate-in slide-in-from-right duration-1000">
                                <div className="text-right">
                                   <div className="text-xs font-black text-st-dark uppercase tracking-widest bg-st-yellow px-3 py-1 rounded-full shadow-lg border border-white/50">DOCUMENT PREVIEW</div>
                                </div>
                             </div>
                          </div>
                          
                          <div className="w-full h-full bg-white rounded-2xl shadow-3xl overflow-hidden border border-slate-200 relative group">
                            {res.file_data ? (
                              <>
                                <PdfViewer 
                                  url={res.file_data} 
                                  searchTerm={searchTerm} 
                                  blindMode={blindMode} 
                                />
                                {blindMode && (
                                  <div className="absolute inset-0 bg-st-dark/80 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center z-20">
                                    <div className="w-20 h-20 bg-st-yellow rounded-3xl flex items-center justify-center shadow-2xl mb-8 border-4 border-white/20">
                                       <Target className="w-8 h-8 text-st-dark" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">{t.blindMode} ACTIVE</h3>
                                    <p className="text-st-light text-sm font-bold leading-relaxed max-w-xs">{t.blindModeDesc}</p>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300 p-12 text-center">
                                <Loader2 className="w-12 h-12 animate-spin mb-6" />
                                <div className="text-sm font-black uppercase tracking-widest">Generating Digital Version...</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
