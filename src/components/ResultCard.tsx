import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, ChevronDown, Target, Zap } from 'lucide-react';
import { AnalysisResult, ScoringWeights } from '../types';
import { ScoreChart } from './ScoreChart';
import { PdfViewer } from './PdfViewer';

interface ResultCardProps {
  res: AnalysisResult;
  idx: number;
  weights: ScoringWeights;
  blindMode: boolean;
  searchTerm: string;
  setSearchTerm: (t: string) => void;
  isShareMode: boolean;
  editingScore: any;
  setEditingScore: (v: any) => void;
  handleScoreOverride: (fileName: string, score: number, tags: string[]) => void;
  t: any;
  language: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  res, idx, weights, blindMode, searchTerm, setSearchTerm,
  isShareMode, editingScore, setEditingScore, handleScoreOverride, t, language,
}) => {
  const [expanded, setExpanded] = useState(false);
  const score = res.hr_override_score ?? res.overall_score;

  return (
    <div className={`bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${expanded ? 'ring-4 ring-st-light/10 shadow-3xl' : 'shadow-sm'}`}>
      {/* Header row */}
      <div className="p-6 flex items-center gap-6 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => { setExpanded(!expanded); setSearchTerm(''); }}>
        <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-lg relative overflow-hidden shrink-0 border-2 ${
          score >= 80 ? 'bg-st-success/10 border-st-success text-st-success' : score >= 60 ? 'bg-st-yellow/10 border-st-yellow text-st-yellow' : 'bg-rose-50 border-rose-500 text-rose-500'
        }`}>
          <div className="absolute top-0 right-0 w-8 h-8 bg-current opacity-10 rounded-bl-full" />
          <span className="text-2xl font-black tabular-nums leading-none">{score}</span>
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
            <span className="px-3 py-1 bg-slate-100 rounded-full text-sm font-bold text-slate-500 border border-slate-200">{res.summary.personal_info?.experience_years ?? 'N/A'} {t.years} {t.exp}</span>
            <span className="px-3 py-1 bg-slate-100 rounded-full text-sm font-bold text-slate-500 border border-slate-200 uppercase tracking-widest">{res.summary.personal_info?.education_level || 'N/A'}</span>
            {res.summary.key_skills.slice(0, 3).map((skill, si) => (
              <span key={si} className="text-sm font-bold text-st-light border border-st-light/20 bg-st-light/5 px-2 py-1 rounded-full">{skill}</span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <div className="text-sm font-black text-slate-300 uppercase tracking-widest mb-1">{t.aiRecommendation}</div>
            <div className="text-sm font-bold text-slate-500 truncate max-w-[200px]">{res.overall_recommendation.fit_status.toUpperCase()}</div>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${expanded ? 'bg-st-dark text-white rotate-180' : 'bg-slate-100 text-slate-400'}`}>
            <ChevronDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-100">
            <div className="flex flex-col">
              <div className="w-full flex flex-col bg-white st-scrollbar overflow-y-auto">
                <div className="p-10 space-y-12">
                  {/* Score breakdown */}
                  <section className="animate-in fade-in slide-in-from-left duration-500">
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">{t.scoreBreakdownVis}</h4>
                      <div className="px-3 py-1 bg-st-success/10 text-st-success text-sm font-black rounded-full border border-st-success/20 tracking-widest shadow-sm">{t.highMatch}</div>
                    </div>
                    <ScoreChart weights={weights} detailedScores={res.detailed_scores} t={t} />
                  </section>

                  {/* Highlights & Gaps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-slate-50">
                    <section className="space-y-6">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 inline-block">{t.keyHighlights}</h4>
                      <div className="space-y-4">
                        {res.summary.highlights.map((h, i) => (
                          <div key={i} className="flex gap-4 group cursor-pointer" onClick={() => setSearchTerm(h.split(' ').slice(0, 3).join(' '))}>
                            <div className="w-6 h-6 rounded-lg bg-st-success/10 flex items-center justify-center shrink-0 border border-st-success/20 transition-all group-hover:scale-110"><CheckCircle2 className="w-3.5 h-3.5 text-st-success" /></div>
                            <span className="text-sm text-slate-600 font-bold leading-relaxed group-hover:text-st-light transition-colors">{h}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="space-y-6">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 inline-block">{t.expGaps}</h4>
                      <div className="space-y-4">
                        {res.summary.gaps.map((g, i) => (
                          <div key={i} className="flex gap-4 group cursor-pointer" onClick={() => setSearchTerm(g.split(' ').slice(0, 3).join(' '))}>
                            <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100 transition-all group-hover:scale-110"><XCircle className="w-3.5 h-3.5 text-rose-500" /></div>
                            <span className="text-sm text-slate-500 italic font-bold leading-relaxed group-hover:text-st-light transition-colors">{g}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  {/* AI Recommendation */}
                  <section className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 relative overflow-hidden group hover:border-st-light/30 transition-all">
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-st-light/5 rounded-full blur-3xl" />
                    <div className="flex items-start gap-8 relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-st-dark flex items-center justify-center shrink-0 shadow-2xl group-hover:scale-110 transition-transform"><Zap className="w-8 h-8 text-st-yellow fill-st-yellow" /></div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-black text-st-light uppercase tracking-widest">{t.recommLetter}</h4>
                        <div className="text-lg font-black text-st-dark leading-tight tracking-tight pr-12">{res.overall_recommendation.logic}</div>
                        <div className="flex gap-2 pt-2">
                          <div className="px-4 py-2 bg-white rounded-xl text-sm font-black text-st-dark border border-slate-200 shadow-sm flex items-center gap-2"><Target className="w-4 h-4 text-st-light" />{res.overall_recommendation.fit_status.toUpperCase()}</div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* HR Override */}
                  {!isShareMode && (
                    <section className="pt-8 border-t border-slate-100">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">{t.hrOverride}</h4>
                      <div className="bg-slate-100/50 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 space-y-2">
                          <label className="text-sm font-bold text-slate-500">{t.feedback}</label>
                          <input type="text" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold text-st-dark focus:outline-none focus:ring-2 focus:ring-st-light/20 transition-all"
                            placeholder={t.feedback}
                            value={editingScore?.fileName === res.file_name ? editingScore.tags.join(', ') : (res.hr_feedback_tags?.join(', ') || '')}
                            onChange={(e) => setEditingScore({ fileName: res.file_name, score: editingScore?.fileName === res.file_name ? editingScore.score : score, tags: e.target.value.split(',').map((s: string) => s.trim()) })} />
                        </div>
                        <div className="w-24 space-y-2">
                          <label className="text-sm font-bold text-slate-500">{t.score}</label>
                          <input type="number" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold text-st-dark focus:outline-none focus:ring-2 focus:ring-st-light/20 transition-all"
                            value={editingScore?.fileName === res.file_name ? editingScore.score : score}
                            onChange={(e) => setEditingScore({ fileName: res.file_name, score: parseInt(e.target.value), tags: editingScore?.fileName === res.file_name ? editingScore.tags : (res.hr_feedback_tags || []) })} />
                        </div>
                        {editingScore?.fileName === res.file_name && (
                          <div className="flex gap-2">
                            <button onClick={() => handleScoreOverride(res.file_name, editingScore.score, editingScore.tags)} className="bg-st-dark text-st-yellow p-3 rounded-xl shadow-lg hover:bg-black transition-all active:scale-95"><CheckCircle2 className="w-5 h-5" /></button>
                            <button onClick={() => setEditingScore(null)} className="bg-white text-slate-400 p-3 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all active:scale-95"><XCircle className="w-5 h-5" /></button>
                          </div>
                        )}
                      </div>
                    </section>
                  )}
                </div>
              </div>

              {/* PDF Preview — full-width bottom panel */}
              <div className="border-t border-slate-200 bg-slate-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-xs font-black text-st-dark uppercase tracking-widest bg-st-yellow px-3 py-1 rounded-full">Document Preview</div>
                </div>
                <div className="w-full h-[500px] bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
                  {res.file_data ? (
                    <>
                      <PdfViewer url={res.file_data} searchTerm={searchTerm} blindMode={blindMode} />
                      {blindMode && (
                        <div className="absolute inset-0 bg-st-dark/80 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center z-20">
                          <div className="w-20 h-20 bg-st-yellow rounded-3xl flex items-center justify-center shadow-2xl mb-8 border-4 border-white/20"><Target className="w-8 h-8 text-st-dark" /></div>
                          <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">{t.blindMode} ACTIVE</h3>
                          <p className="text-st-light text-sm font-bold leading-relaxed max-w-xs">{t.blindModeDesc}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300 p-12 text-center">
                      <span className="text-sm font-black uppercase tracking-widest">No preview available</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
