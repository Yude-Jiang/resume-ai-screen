import React, { useState } from 'react';
import { 
  Upload, 
  BarChart3, 
  LayoutDashboard, 
  Plus, 
  Settings, 
  AlertCircle,
  FileText,
  ChevronDown,
  X,
  Users
} from 'lucide-react';
import { Language } from '../translations';
import { ScoringWeights, Job, WeightItem } from '../types';

interface SidebarProps {
  language: Language;
  setLanguage: (l: Language | ((prev: Language) => Language)) => void;
  activeTab: string;
  setActiveTab: (t: 'dashboard' | 'input' | 'results' | 'talent-library') => void;
  jobs: Job[];
  activeJobId: string | null;
  setActiveJobId: (id: string | null) => void;
  weights: ScoringWeights;
  handleWeightChange: (weights: ScoringWeights) => void;
  createNewJob: (title: string, dept: string) => Promise<void>;
  addWeightItem: () => void;
  removeWeightItem: (id: string) => void;
  isShareMode: boolean;
  t: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  language, setLanguage, activeTab, setActiveTab, jobs, activeJobId, setActiveJobId,
  weights, handleWeightChange, createNewJob, addWeightItem, removeWeightItem, isShareMode, t
}) => {
  const [showJobMenu, setShowJobMenu] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [editingWeightId, setEditingWeightId] = useState<string | null>(null);

  if (isShareMode) return null;

  const updateWeightValue = (id: string, value: number) => {
    const newWeights = weights.map(w => w.id === id ? { ...w, value } : w);
    handleWeightChange(newWeights);
  };

  const updateWeightLabel = (id: string, label: string) => {
    const newWeights = weights.map(w => w.id === id ? { ...w, label } : w);
    handleWeightChange(newWeights);
  };

  const totalWeight = weights.reduce((acc, w) => acc + w.value, 0);

  const weightLabelMap: Record<string, keyof typeof t> = {
    edu: 'education',
    exp: 'experience',
    skill: 'skills',
    lang: 'language',
    cert: 'certs',
  };
  const getWeightLabel = (w: { id: string; label: string }) =>
    t[weightLabelMap[w.id] as keyof typeof t] || w.label;

  return (
    <aside className="w-full md:w-64 bg-st-dark text-white shrink-0 flex flex-col shadow-xl z-10 overflow-hidden relative">
      <div className="p-6 mb-4">
        <div className="flex justify-between items-start">
          <img
            src="/st-logo.svg"
            alt="STMicroelectronics"
            className="h-8"
          />
          <button
            onClick={() => setLanguage(l => l === 'en' ? 'zh' : 'en')}
            className="text-sm font-bold border border-white/20 px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
          >
            {language === 'en' ? '中文' : 'EN'}
          </button>
        </div>
        <div className="text-st-light font-black text-lg mt-3 tracking-tight">{t.aiScreening}</div>
      </div>

      <nav className="px-3 space-y-1 mb-6">
        <button 
          onClick={() => setActiveTab('input')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded transition-all text-base font-bold ${activeTab === 'input' ? 'bg-st-light text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
        >
          <Upload className="w-4 h-4" />
          <span>{t.inputData}</span>
        </button>
        <button 
          onClick={() => setActiveTab('results')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded transition-all text-base font-bold ${activeTab === 'results' ? 'bg-st-light text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{t.screeningResults}</span>
        </button>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded transition-all text-base font-bold ${activeTab === 'dashboard' ? 'bg-st-light text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>{t.dashboard}</span>
        </button>
        <button
          onClick={() => setActiveTab('talent-library')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded transition-all text-base font-bold ${activeTab === 'talent-library' ? 'bg-st-light text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
        >
          <Users className="w-4 h-4" />
          <span>{t.talentLibrary}</span>
        </button>
      </nav>

      <div className="flex-1 px-6 space-y-6 overflow-y-auto st-scrollbar pb-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white/60 text-sm font-bold uppercase tracking-widest">{t.scoringWeights}</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const equal = Math.floor(100 / weights.length);
                  const newWeights = weights.map((w, i) => ({ 
                    ...w, 
                    value: i === weights.length - 1 ? 100 - (equal * (weights.length - 1)) : equal 
                  }));
                  handleWeightChange(newWeights);
                }}
                className="text-sm bg-white/10 hover:bg-white/20 text-white/60 px-2 py-0.5 rounded transition-colors font-bold"
              >
                {t.equalize}
              </button>
              <button 
                onClick={addWeightItem}
                className="text-sm bg-st-light/20 hover:bg-st-light/30 text-st-light px-2 py-0.5 rounded transition-colors font-bold"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {totalWeight !== 100 && (
            <div className="bg-rose-500/20 border border-rose-500/30 p-2 rounded text-sm text-rose-300 font-bold animate-pulse text-center">
              Total: {totalWeight}% (Must be 100%)
            </div>
          )}
          
          <div className="space-y-5">
            {weights.map(w => (
              <div key={w.id} className="group relative">
                <div className="flex justify-between text-sm mb-2 font-bold uppercase tracking-widest text-white/40 group-hover:text-white/70 transition-colors items-center">
                  {editingWeightId === w.id ? (
                    <input 
                      autoFocus
                      type="text"
                      className="bg-white/10 border-none p-0 text-sm text-white focus:ring-0 w-32"
                      value={w.label}
                      onChange={(e) => updateWeightLabel(w.id, e.target.value)}
                      onBlur={() => setEditingWeightId(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingWeightId(null)}
                    />
                  ) : (
                    <span 
                      className="cursor-pointer hover:text-st-light truncate max-w-[140px]"
                      onClick={() => setEditingWeightId(w.id)}
                    >{getWeightLabel(w)}</span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-st-yellow shrink-0">{w.value}%</span>
                    <button 
                      onClick={() => removeWeightItem(w.id)}
                      className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-500 transition-all scale-75"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={w.value} 
                  onChange={(e) => updateWeightValue(w.id, parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-st-yellow hover:bg-white/20 transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-white/5">
          <button 
            onClick={() => setShowJobMenu(!showJobMenu)}
            className="w-full flex items-center justify-between text-white/60 hover:text-white transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-widest">{t.activeJobs}</span>
            </div>
            <ChevronDown className={`w-3 h-3 transition-transform ${showJobMenu ? 'rotate-180' : ''}`} />
          </button>
          
          {showJobMenu && (
            <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-1 max-h-48 overflow-y-auto st-scrollbar pr-1">
                {jobs.map(job => (
                  <button 
                    key={job.id}
                    onClick={() => {
                      setActiveJobId(job.id);
                      setActiveTab('input');
                    }}
                    className={`w-full text-left p-3 rounded-lg text-sm font-bold transition-all border ${activeJobId === job.id ? 'bg-st-light/20 border-st-light text-white shadow-inner' : 'border-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
                  >
                    <div className="truncate">{job.title}</div>
                    <div className="text-sm opacity-40 font-bold">{job.dept}</div>
                  </button>
                ))}
              </div>
              
              <div className="pt-2">
                <input 
                  type="text" 
                  placeholder="Job Title" 
                  value={newJobTitle}
                  onChange={e => setNewJobTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-st-light transition-all mb-2 font-bold"
                />
                <button 
                  onClick={async () => {
                    if (newJobTitle) {
                      await createNewJob(newJobTitle, 'HR Dept');
                      setNewJobTitle('');
                    }
                  }}
                  className="w-full bg-st-yellow text-st-dark py-2.5 rounded-lg text-sm font-black hover:bg-white transition-all shadow-lg active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" />
                  NEW PROJECT
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 bg-st-dark/50 backdrop-blur-xl border-t border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-st-success/20 flex items-center justify-center border border-st-success/30">
            <AlertCircle className="w-4 h-4 text-st-success animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-black text-st-success uppercase tracking-widest">{t.systemStatus}</div>
            <div className="text-sm text-white/40 font-bold leading-none mt-1">{t.active}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
