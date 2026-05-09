import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  MapPin, 
  Mail, 
  Phone, 
  GraduationCap, 
  Briefcase, 
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Zap,
  Tag,
  MessageSquare,
  TrendingUp,
  Download,
  Settings2,
  Target
} from 'lucide-react';
import { useI18n } from '../components/LanguageContext';
import { AnalysisResult, Job } from '../types';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface CandidateDetailPageProps {
  candidate: AnalysisResult;
  job: Job;
  onBack: () => void;
  onStatusUpdate?: () => void; // Reload data callback
}

const CandidateDetailPage: React.FC<CandidateDetailPageProps> = ({ 
  candidate, 
  job, 
  onBack,
  onStatusUpdate
}) => {
  const { t } = useI18n();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'resume' | 'notes'>('overview');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideScore, setOverrideScore] = useState(candidate.hr_override_score ?? candidate.overall_score);
  const [overrideReason, setOverrideReason] = useState(candidate.hr_feedback_tags?.[0] || '');

  // Derived Values
  const effectiveScore = candidate.hr_override_score ?? candidate.overall_score;
  
  const riskLevel = useMemo(() => {
    if (effectiveScore >= 75) return 'low';
    if (effectiveScore >= 45) return 'medium';
    return 'high';
  }, [effectiveScore]);

  const recommendationLevel = useMemo(() => {
    if (effectiveScore >= 80) return 'high';
    if (effectiveScore >= 60) return 'medium';
    return 'low';
  }, [effectiveScore]);

  const handleUpdateStatus = async () => {
    try {
      await updateDoc(doc(db, 'analysisResults', candidate.id), {
        hr_override_score: overrideScore,
        hr_feedback_tags: [overrideReason],
      });
      toast.success(t('saveChanges'));
      setShowOverrideModal(false);
      onStatusUpdate?.();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="min-h-full bg-slate-50/50 flex flex-col st-scrollbar overflow-y-auto pb-20">
      {/* Top Banner / Hero */}
      <div className="bg-st-dark p-8 lg:p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-st-light/10 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-8 relative z-10">
          <div className="space-y-6">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('cancel')}
            </button>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-st-warning">{job.title}</span>
              <h2 className="text-4xl font-black tracking-tight">{candidate.candidate_name}</h2>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 text-white/50 text-xs font-bold">
                  <Mail className="w-3 h-3" /> {candidate.summary.personal_info.email || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-white/50 text-xs font-bold">
                  <Phone className="w-3 h-3" /> {candidate.summary.personal_info.phone || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-white/50 text-xs font-bold">
                  <GraduationCap className="w-3 h-3" /> {candidate.summary.personal_info.education_level}
                </div>
                <div className="flex items-center gap-2 text-white/50 text-xs font-bold">
                  <Briefcase className="w-3 h-3" /> {candidate.summary.personal_info.experience_years} {t('years')}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8 bg-black/20 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <div className="text-center space-y-1">
              <div className={`text-[10px] font-black uppercase tracking-widest ${
                recommendationLevel === 'high' ? 'text-st-success' : recommendationLevel === 'medium' ? 'text-st-warning' : 'text-st-error'
              }`}>AI {t('score')}</div>
              <div className="text-5xl font-black tabular-nums">{effectiveScore}</div>
            </div>
            <div className="w-[1px] h-12 bg-white/10" />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                <ShieldCheck className="w-3 h-3 text-st-success" />
                Fit Status
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block ${
                recommendationLevel === 'high' ? 'bg-st-success/10 text-st-success border border-st-success/20' : 
                recommendationLevel === 'medium' ? 'bg-st-warning/10 text-st-warning border border-st-warning/20' : 
                'bg-st-error/10 text-st-error border border-st-error/20'
              }`}>
                {candidate.overall_recommendation.fit_status}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Analysis & Insights */}
        <div className="lg:col-span-8 space-y-8">
          {/* Sub-tabs */}
          <div className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-200 w-fit">
            {(['overview', 'resume', 'notes'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeSubTab === tab ? 'bg-st-dark text-white shadow-lg' : 'text-slate-400 hover:text-st-dark'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeSubTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* AI Recommendation Card */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8">
                    <Zap className="w-12 h-12 text-st-warning/10" />
                  </div>
                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-st-dark rounded-xl flex items-center justify-center text-white font-black italic">AI</div>
                      <h3 className="text-2xl font-black text-st-dark tracking-tight">{t('matchReason')}</h3>
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed text-lg italic">
                      "{candidate.overall_recommendation.logic}"
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                       {candidate.summary.key_skills.map((skill, i) => (
                         <span key={i} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200/50">
                           {skill}
                         </span>
                       ))}
                    </div>
                  </div>
                </div>

                {/* Highlights & Gaps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm space-y-6 border-b-4 border-b-st-success">
                    <h4 className="flex items-center gap-3 text-sm font-black text-st-dark uppercase tracking-widest">
                      <TrendingUp className="w-5 h-5 text-st-success" />
                      {t('keyHighlights')}
                    </h4>
                    <ul className="space-y-4">
                      {candidate.summary.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-600 text-sm font-bold leading-snug">
                          <div className="w-1.5 h-1.5 rounded-full bg-st-success mt-1.5 shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm space-y-6 border-b-4 border-b-st-error">
                    <h4 className="flex items-center gap-3 text-sm font-black text-st-dark uppercase tracking-widest">
                      <AlertCircle className="w-5 h-5 text-st-error" />
                      {t('expGaps')}
                    </h4>
                    <ul className="space-y-4">
                      {candidate.summary.gaps.map((g, i) => (
                        <li key={i} className="flex items-start gap-4 text-slate-600 text-sm font-bold leading-snug">
                          <ChevronRight className="w-4 h-4 text-st-error mt-0.5 shrink-0" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSubTab === 'resume' && (
              <motion.div 
                key="resume"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] border border-slate-200 p-8 h-[800px] flex flex-col items-center justify-center gap-4 text-slate-300"
              >
                {candidate.file_data ? (
                  <div className="w-full h-full">
                     {/* Simplified PDF Viewer or Embed */}
                     <embed src={`data:application/pdf;base64,${candidate.file_data}`} className="w-full h-full rounded-2xl" />
                  </div>
                ) : (
                  <>
                    <Briefcase className="w-16 h-16 opacity-20" />
                    <p className="font-black uppercase tracking-widest text-sm">Resume Preview Coming Soon</p>
                    <button className="flex items-center gap-2 px-6 py-3 bg-st-dark text-white rounded-xl text-xs font-black uppercase tracking-widest mt-4">
                       <Download className="w-4 h-4" /> Download Original File
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {activeSubTab === 'notes' && (
              <motion.div 
                key="notes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-[2.5rem] border border-slate-200 p-12 space-y-8"
              >
                 <div className="flex items-center gap-3">
                   <MessageSquare className="w-6 h-6 text-st-light" />
                   <h3 className="text-2xl font-black text-st-dark tracking-tight">Collaboration & Notes</h3>
                 </div>
                 <div className="space-y-4">
                   <textarea 
                     placeholder="Add internal labels, evaluation notes, or interview feedback..."
                     className="w-full h-40 px-8 py-6 bg-slate-50 border-none rounded-[2rem] focus:ring-4 focus:ring-st-light/10 font-bold text-st-dark placeholder:text-slate-300 resize-none"
                   />
                   <div className="flex justify-end pt-4">
                     <button className="px-10 py-4 bg-st-dark text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all">
                       Save Note
                     </button>
                   </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Score Metrics & Controls */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 space-y-8">
            <div className="flex items-center gap-3">
              <Settings2 className="w-6 h-6 text-st-light" />
              <h4 className="text-sm font-black text-st-dark uppercase tracking-widest">{t('scoreBreakdownVis')}</h4>
            </div>

            <div className="space-y-6">
              {Object.entries(candidate.detailed_scores).map(([id, val]) => (
                <div key={id} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">{t(id) || id}</span>
                    <span className="text-st-dark tabular-nums">{val}/100</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        (val as number) >= 80 ? 'bg-st-success' : (val as number) >= 60 ? 'bg-st-warning' : 'bg-st-error'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col gap-3">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                   <Target className="w-3 h-3" /> Risk Assessment
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-st-dark uppercase tracking-widest">Profile Risk</span>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      riskLevel === 'low' ? 'bg-st-success/10 text-st-success' : 
                      riskLevel === 'medium' ? 'bg-st-warning/10 text-st-warning' : 'bg-st-error/10 text-st-error'
                    }`}>
                      {riskLevel} Risk
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setShowOverrideModal(true)}
                className="w-full py-5 bg-st-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-st-dark/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
              >
                <Tag className="w-4 h-4" />
                {t('hrOverride')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Score Override Modal */}
      <AnimatePresence>
        {showOverrideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOverrideModal(false)}
              className="absolute inset-0 bg-st-dark/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[3rem] p-10 lg:p-12 shadow-2xl relative z-10 border border-white/20"
            >
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-st-dark rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-st-dark/20">
                    <Tag className="w-8 h-8 text-st-warning" />
                  </div>
                  <h3 className="text-3xl font-black text-st-dark tracking-tight">{t('hrOverride')}</h3>
                  <p className="text-slate-400 font-medium">{t('feedback')}</p>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-st-light ml-4">
                      <span>Adjust Score</span>
                      <span className="text-st-dark text-xl">{overrideScore}</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" step="1"
                      value={overrideScore}
                      onChange={e => setOverrideScore(parseInt(e.target.value))}
                      className="w-full accent-st-dark"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-st-light ml-4">Reason for Adjustment</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['skillGap', 'expInconsistent', 'tooSenior', 'tooJunior', 'other'].map(tag => (
                        <button
                          key={tag}
                          onClick={() => setOverrideReason(tag)}
                          className={`px-4 py-3 rounded-xl text-xs font-black transition-all ${
                            overrideReason === tag 
                            ? 'bg-st-dark text-white shadow-lg' 
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {t(tag)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 p-2 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <button 
                    onClick={() => setShowOverrideModal(false)}
                    className="flex-1 py-5 bg-white text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    onClick={handleUpdateStatus}
                    className="flex-1 py-5 bg-st-dark text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-st-dark/20 hover:scale-105 transition-all"
                  >
                    {t('saveChanges')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CandidateDetailPage;
