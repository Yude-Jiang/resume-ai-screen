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
  const [showWeights, setShowWeights] = useState(true);
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
            className="text-sm font-medium border border-white/20 px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
          >
            {language === 'en' ? '中文' : 'EN'}
          </button>
        </div>
        <div className="text-st-light font-semibold text-lg mt-3 tracking-tight">{t.aiScreening}</div>
      </div>

      <nav className="px-3 space-y-1 mb-6">
        <button 
          onClick={() => setActiveTab('input')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded transition-all text-sm font-medium ${activeTab === 'input' ? 'bg-st-light text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
        >
          <Upload className="w-4 h-4" />
          <span>{t.inputData}</span>
        </button>
        <button 
          onClick={() => setActiveTab('results')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded transition-all text-sm font-medium ${activeTab === 'results' ? 'bg-st-light text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{t.screeningResults}</span>
        </button>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded transition-all text-sm font-medium ${activeTab === 'dashboard' ? 'bg-st-light text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>{t.dashboard}</span>
        </button>
        <button
          onClick={() => setActiveTab('talent-library')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded transition-all text-sm font-medium ${activeTab === 'talent-library' ? 'bg-st-light text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
        >
          <Users className="w-4 h-4" />
          <span>{t.talentLibrary}</span>
        </button>
      </nav>

      <div className="flex-1 px-6 space-y-6 overflow-y-auto st-scrollbar pb-6">
        {/* Weights — collapsible */}
        <div className="space-y-1">
          <button
            onClick={() => setShowWeights(!showWeights)}
            className="w-full flex items-center justify-between text-white/60 hover:text-white transition-colors group"
          >
            <h3 className="text-sm font-medium tracking-wide">{t.scoringWeights}</h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${totalWeight === 100 ? 'text-st-success' : 'text-rose-400'}`}>{totalWeight}%</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showWeights ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showWeights && (
            <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    const equal = Math.floor(100 / weights.length);
                    const newWeights = weights.map((w, i) => ({
                      ...w,
                      value: i === weights.length - 1 ? 100 - (equal * (weights.length - 1)) : equal
                    }));
                    handleWeightChange(newWeights);
                  }}
                  className="flex-1 text-xs bg-white/10 hover:bg-white/20 text-white/60 py-1 rounded transition-colors font-medium"
                >
                  {t.equalize}
                </button>
                <button
                  onClick={addWeightItem}
                  className="text-xs bg-st-light/20 hover:bg-st-light/30 text-st-light px-2 py-1 rounded transition-colors font-medium"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {totalWeight !== 100 && (
                <div className="bg-rose-500/20 border border-rose-500/30 p-2 rounded text-xs text-rose-300 font-medium text-center">
                  {t.mustBe100}
                </div>
              )}

              <div className="space-y-4">
                {weights.map(w => (
                  <div key={w.id} className="group">
                    <div className="flex justify-between items-center mb-1.5">
                      {editingWeightId === w.id ? (
                        <input
                          autoFocus type="text"
                          className="bg-white/10 border-none p-0 text-sm text-white focus:ring-0 w-28"
                          value={w.label}
                          onChange={(e) => updateWeightLabel(w.id, e.target.value)}
                          onBlur={() => setEditingWeightId(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingWeightId(null)}
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-st-light text-sm font-medium text-white/70 truncate max-w-[120px]"
                          onClick={() => setEditingWeightId(w.id)}
                        >{getWeightLabel(w)}</span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className="text-st-yellow text-sm font-semibold tabular-nums">{w.value}%</span>
                        <button
                          onClick={() => removeWeightItem(w.id)}
                          className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-500 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="range" min="0" max="100"
                      value={w.value}
                      onChange={(e) => updateWeightValue(w.id, parseInt(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-st-yellow"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-white/5">
          <button 
            onClick={() => setShowJobMenu(!showJobMenu)}
            className="w-full flex items-center justify-between text-white/60 hover:text-white transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium uppercase tracking-widest">{t.activeJobs}</span>
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
                    className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-all border ${activeJobId === job.id ? 'bg-st-light/20 border-st-light text-white shadow-inner' : 'border-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
                  >
                    <div className="truncate">{job.title}</div>
                    <div className="text-sm opacity-40 font-medium">{job.dept}</div>
                  </button>
                ))}
              </div>
              
              <div className="pt-2">
                <input 
                  type="text" 
                  placeholder={t.jobTitleLabel}
                  value={newJobTitle}
                  onChange={e => setNewJobTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-st-light transition-all mb-2 font-medium"
                />
                <button 
                  onClick={async () => {
                    if (newJobTitle) {
                      await createNewJob(newJobTitle, t.hrDept);
                      setNewJobTitle('');
                    }
                  }}
                  className="w-full bg-st-yellow text-st-dark py-2.5 rounded-lg text-sm font-semibold hover:bg-white transition-all shadow-lg active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" />
                  {t.jobCreate.toUpperCase()}
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
            <div className="text-sm font-semibold text-st-success uppercase tracking-widest">{t.systemStatus}</div>
            <div className="text-sm text-white/40 font-medium leading-none mt-1">{t.active}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
