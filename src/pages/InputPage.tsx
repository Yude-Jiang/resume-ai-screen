import React, { useRef } from 'react';
import {
  FileText,
  Settings,
  AlertCircle,
  UploadCloud,
  Loader2,
  ChevronRight,
  CheckCircle2,
  Zap,
  Target,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Job, ScoringWeights, HardThresholds, EduLevel } from '../types';

interface InputPageProps {
  jd: string;
  setJd: (val: string) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  isAnalyzing: boolean;
  progress: number;
  currentFile: string | null;
  runAnalysis: () => Promise<void>;
  isConfiguring: boolean;
  handleAiConfig: () => Promise<void>;
  handleJdFileUpload: (file: File) => Promise<void>;
  weights: ScoringWeights;
  thresholds: HardThresholds;
  setThresholds: (t: HardThresholds) => void;
  activeJobId: string | null;
  jobs: Job[];
  jobTitle: string;
  setJobTitle: (val: string) => void;
  t: any;
}

export const InputPage: React.FC<InputPageProps> = ({
  jd, setJd, files, setFiles, isAnalyzing, progress, currentFile, runAnalysis,
  isConfiguring, handleAiConfig, handleJdFileUpload, weights, thresholds, setThresholds,
  activeJobId, jobs, jobTitle, setJobTitle, t
}) => {
  const activeJob = jobs.find(j => j.id === activeJobId);
  const jdFileInputRef = useRef<HTMLInputElement>(null);

  const onJdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleJdFileUpload(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50 relative">
      {/* Configuration Panel */}
      <div className="w-full md:w-1/2 border-r border-slate-200 overflow-y-auto bg-white/50 backdrop-blur-xl p-10 space-y-12 st-scrollbar">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-400 tracking-wide">{t.jobDescription}</h3>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={jdFileInputRef}
                onChange={onJdFileChange}
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
              />
              <div className="w-2 h-2 rounded-full bg-st-light animate-pulse ml-2" />
              <span className="text-sm font-medium text-st-dark tracking-widest">AI READY</span>
            </div>
          </div>
          <div className="relative group">
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder={t.jdPlaceholder}
              className="w-full h-80 p-6 bg-white border-2 border-slate-100 rounded-[2rem] text-base focus:outline-none focus:border-st-light/50 transition-all shadow-sm hover:shadow-md st-scrollbar font-medium text-slate-600 resize-none leading-relaxed"
            />
            {/* Empty-state guide illustration */}
            {!jd.trim() && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 opacity-60">
                  <FileText className="w-8 h-8 text-slate-300" />
                </div>
                <div className="text-sm font-medium text-slate-300 text-center max-w-xs">
                  <span className="text-st-light font-semibold">Paste</span> a Job Description here, or click{' '}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-st-light/10 rounded-lg text-st-light text-xs font-semibold">
                    <Settings className="w-3 h-3" /> Upload JD
                  </span>{' '}
                  below
                </div>
              </div>
            )}
            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-10 group-hover:opacity-100 transition-opacity">
               <FileText className="w-6 h-6 text-st-dark/20" />
            </div>

            <button
              onClick={() => {
                if (!jd.trim()) {
                  jdFileInputRef.current?.click();
                } else {
                  handleAiConfig();
                }
              }}
              disabled={isConfiguring}
              className={`absolute bottom-6 right-6 flex items-center gap-3 px-6 py-4 rounded-2xl text-base font-medium tracking-widest shadow-xl transition-all active:scale-95 ${jd.trim() ? 'bg-st-dark text-st-yellow hover:bg-black' : 'bg-st-light text-white hover:bg-st-dark'}`}
            >
              {isConfiguring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
              {jd.trim() ? t.aiConfig.toUpperCase() : (t.uploadJd || 'UPLOAD JD').toUpperCase()}
            </button>
          </div>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">{t.jdHelpText || "AI will analyze JD to suggest weights and items."}</p>
        </div>

        <div className="space-y-8 pt-8 border-t border-slate-100">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-st-dark flex items-center justify-center">
                 <Target className="w-5 h-5 text-st-yellow fill-st-yellow" />
              </div>
              <h3 className="text-base font-semibold text-st-dark">{t.hardThresholds}</h3>
           </div>

           <div className="space-y-3">
              <label className="text-sm font-medium text-slate-400">Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium text-st-dark focus:outline-none focus:ring-2 focus:ring-st-light/20 transition-all"
              />
           </div>

           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                 <label className="text-sm font-medium text-slate-400">{t.minEdu}</label>
                 <select 
                    value={thresholds.minEdu}
                    onChange={(e) => setThresholds({ ...thresholds, minEdu: e.target.value as EduLevel })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium text-st-dark focus:outline-none focus:ring-2 focus:ring-st-light/20 transition-all appearance-none cursor-pointer"
                 >
                    <option value="associate">{t.associate}</option>
                    <option value="bachelor">{t.bachelor}</option>
                    <option value="master">{t.master}</option>
                    <option value="doctor">{t.doctor}</option>
                 </select>
              </div>
              <div className="space-y-3">
                 <label className="text-sm font-medium text-slate-400">{t.minExp}</label>
                 <div className="relative">
                    <input 
                       type="number" 
                       value={thresholds.minExp}
                       onChange={(e) => setThresholds({ ...thresholds, minExp: parseInt(e.target.value) || 0 })}
                       className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium text-st-dark focus:outline-none focus:ring-2 focus:ring-st-light/20 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">{t.years}</span>
                 </div>
              </div>
           </div>

           <div className="space-y-3">
              <label className="text-xs font-medium text-slate-400 flex justify-between">
                 {t.techStack}
                 <span className="text-st-light">{thresholds.requiredSkills.length} {t.customThresholds.split(' ')[1]}</span>
              </label>
              <div className="flex flex-wrap gap-2 min-h-[50px] p-4 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200">
                 {thresholds.requiredSkills.length === 0 ? (
                    <span className="text-xs text-slate-400 font-medium m-auto">{t.noThresholdAdded}</span>
                 ) : (
                    thresholds.requiredSkills.map((skill, idx) => (
                       <span key={idx} className="bg-white px-3 py-1.5 rounded-lg text-xs font-medium text-st-dark shadow-sm border border-slate-200 flex items-center gap-2 group animate-in zoom-in">
                          {skill}
                          <button 
                             onClick={() => setThresholds({ ...thresholds, requiredSkills: thresholds.requiredSkills.filter((_, i) => i !== idx) })}
                             className="text-slate-300 hover:text-rose-500 transition-colors"
                          >
                             <CheckCircle2 className="w-3 h-3" />
                          </button>
                       </span>
                    ))
                 )}
              </div>
              <div className="flex gap-2">
                 <input 
                    type="text" 
                    placeholder={t.addThreshold}
                    onKeyDown={(e) => {
                       if (e.key === 'Enter' && e.currentTarget.value) {
                          setThresholds({ ...thresholds, requiredSkills: [...thresholds.requiredSkills, e.currentTarget.value] });
                          e.currentTarget.value = '';
                       }
                    }}
                    className="flex-1 bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium text-st-dark focus:outline-none focus:ring-2 focus:ring-st-light/20 transition-all shadow-inner"
                 />
              </div>
           </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="w-full md:w-1/2 p-10 pb-14 bg-slate-50/50 flex flex-col h-full st-scrollbar relative">
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center"
            >
              <div className="w-24 h-24 bg-st-dark rounded-[2rem] flex items-center justify-center shadow-2xl mb-8 animate-pulse">
                <Loader2 className="w-12 h-12 text-st-yellow animate-spin" />
              </div>
              <h3 className="text-base font-semibold text-st-dark mb-2">
                {t.analyzingCandidates || 'Analyzing Candidates...'}
              </h3>
              <div className="text-base font-medium text-slate-400 mb-8 max-w-sm">
                Processing: <span className="text-st-light">{currentFile || '...'}</span>
              </div>
              
              <div className="w-full max-w-md space-y-3">
                <div className="flex justify-between text-sm font-medium tracking-widest text-slate-400 uppercase">
                  <span>{t.progress || 'Progress'}</span>
                  <span>{Math.floor(progress)}%</span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner p-0.5">
                  <motion.div 
                    className="h-full bg-st-light rounded-full shadow-[0_0_15px_rgba(60,180,230,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-sm italic text-slate-400 font-medium">
                  {t.analysisNote || 'Large files may take up to 20 seconds. Please do not close this window.'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-10 flex items-center justify-between">
           <div>
              <h2 className="text-lg font-semibold text-st-dark">{t.resumeUpload}</h2>
              <p className="text-slate-400 font-medium mt-1 text-sm">Batch parsing up to 50 files</p>
           </div>
           {files.length > 0 && (
              <button 
                onClick={() => setFiles([])}
                className="text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors bg-rose-50 px-4 py-2 rounded-full shadow-sm"
              >
                 CLEAR {files.length} FILES
              </button>
           )}
        </div>

        <div className="flex-1 flex flex-col gap-8 min-h-0">
          <label className="group relative flex-1 flex flex-col items-center justify-center border-[3px] border-dashed border-slate-200 hover:border-st-light/50 bg-white hover:bg-st-light/[0.02] rounded-[3rem] p-12 transition-all cursor-pointer shadow-sm hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98]">
            <input 
              type="file" 
              multiple 
              onChange={e => {
                const newFiles = Array.from(e.target.files || []);
                setFiles([...files, ...newFiles]);
              }}
              className="hidden" 
            />
            <div className="w-24 h-24 bg-st-dark rounded-[2rem] flex items-center justify-center shadow-2xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative">
               <UploadCloud className="w-10 h-10 text-st-yellow animate-bounce" />
               <div className="absolute -top-2 -right-2 w-8 h-8 bg-st-light rounded-xl flex items-center justify-center border-4 border-white shadow-lg animate-in zoom-in">
                  <Plus className="w-4 h-4 text-white font-medium" />
               </div>
            </div>
            <div className="text-base font-medium text-st-dark mb-3 text-center">{t.clickToUpload}</div>
            <div className="text-sm font-medium text-slate-400 text-center px-8 border-t border-slate-100 pt-4 mt-2">
               {t.supportedFormats}
            </div>
          </label>

          <AnimatePresence>
            {files.length > 0 && (
               <motion.div 
                 initial={{ opacity: 0, y: 40 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 40 }}
                 className="space-y-6"
               >
                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-48 overflow-y-auto pr-4 st-scrollbar">
                   {files.map((f, i) => (
                     <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 group hover:border-st-light/30 transition-all">
                       <div className="w-10 h-10 rounded-xl bg-st-dark/5 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-st-dark/30" />
                       </div>
                       <div className="min-w-0">
                         <div className="text-sm font-medium text-st-dark truncate">{f.name}</div>
                         <div className="text-xs text-slate-400 font-medium">PDF DOCUMENT</div>
                       </div>
                     </div>
                   ))}
                 </div>

                 <button 
                   onClick={runAnalysis}
                   className="w-full bg-st-dark text-st-yellow py-5 rounded-[2rem] font-semibold text-lg tracking-tight hover:bg-black transition-all shadow-[0_20px_50px_rgba(26,44,79,0.2)] active:scale-[0.98] flex items-center justify-center gap-3 group disabled:opacity-50"
                   disabled={isAnalyzing}
                 >
                   {isAnalyzing ? (
                     <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-4">
                           <Loader2 className="w-8 h-8 animate-spin" />
                           <span>ANALYZING {Math.floor(progress)}%</span>
                        </div>
                        <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-st-yellow transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                     </div>
                   ) : (
                     <>
                        <span>{t.startAnalysis.toUpperCase()}</span>
                        <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                     </>
                   )}
                 </button>
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
