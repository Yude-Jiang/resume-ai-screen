import React, { useState } from 'react';
import {
  Upload, BarChart3, LayoutDashboard, Plus, Settings,
  AlertCircle, FileText, ChevronDown, X, Users, Trash2
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
  deleteJob: (id: string) => void;
  addWeightItem: () => void;
  removeWeightItem: (id: string) => void;
  isShareMode: boolean;
  t: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  language, setLanguage, activeTab, setActiveTab, jobs, activeJobId, setActiveJobId,
  weights, handleWeightChange, createNewJob, deleteJob, addWeightItem, removeWeightItem, isShareMode, t
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
    edu: 'education', exp: 'experience', skill: 'skills', lang: 'language', cert: 'certs',
  };
  const getWeightLabel = (w: { id: string; label: string }) =>
    t[weightLabelMap[w.id] as keyof typeof t] || w.label;

  return (
    <aside className="w-full md:w-56 bg-st-dark text-white shrink-0 flex flex-col shadow-xl z-10 h-screen relative">
      {/* Logo + title */}
      <div className="p-4 pb-3">
        <div className="flex justify-between items-start">
          <img src="/st-logo.svg" alt="STMicroelectronics" className="h-7" />
          <button
            onClick={() => setLanguage(l => l === 'en' ? 'zh' : 'en')}
            className="text-xs font-medium border border-white/20 px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
          >{language === 'en' ? '中文' : 'EN'}</button>
        </div>
        <div className="text-st-light font-semibold text-sm mt-2 tracking-tight">{t.aiScreening}</div>
      </div>

      {/* Nav */}
      <nav className="px-2 space-y-0.5 mb-3">
        {([ ['input', Upload], ['results', BarChart3], ['dashboard', LayoutDashboard], ['talent-library', Users] ] as const).map(([tab, Icon]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-medium ${activeTab === tab ? 'bg-st-light text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{t[tab === 'input' ? 'inputData' : tab === 'results' ? 'screeningResults' : tab === 'dashboard' ? 'dashboard' : 'talentLibrary']}</span>
          </button>
        ))}
      </nav>

      {/* Scrollable middle */}
      <div className="flex-1 px-3 space-y-3 overflow-y-auto st-scrollbar pb-3">

        {/* Weights — collapsible */}
        <div>
          <button
            onClick={() => setShowWeights(!showWeights)}
            className="w-full flex items-center justify-between text-white/50 hover:text-white transition-colors group"
          >
            <h3 className="text-[11px] font-semibold tracking-widest uppercase">{t.scoringWeights}</h3>
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-semibold ${totalWeight === 100 ? 'text-st-success' : 'text-rose-400'}`}>{totalWeight}%</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showWeights ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showWeights && (
            <div className="pt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex gap-1">
                <button onClick={() => {
                  const equal = Math.floor(100 / weights.length);
                  const newWeights = weights.map((w, i) => ({ ...w, value: i === weights.length - 1 ? 100 - (equal * (weights.length - 1)) : equal }));
                  handleWeightChange(newWeights);
                }} className="flex-1 text-[11px] bg-white/10 hover:bg-white/20 text-white/50 py-1 rounded transition-colors font-medium">
                  {t.equalize}
                </button>
                <button onClick={addWeightItem} className="text-[11px] bg-st-light/20 hover:bg-st-light/30 text-st-light px-1.5 py-1 rounded transition-colors font-medium">
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {totalWeight !== 100 && (
                <div className="bg-rose-500/20 border border-rose-500/30 p-1.5 rounded text-[11px] text-rose-300 font-medium text-center">{t.mustBe100}</div>
              )}

              <div className="space-y-2.5">
                {weights.map(w => (
                  <div key={w.id} className="group">
                    <div className="flex justify-between items-center mb-1">
                      {editingWeightId === w.id ? (
                        <input autoFocus type="text" className="bg-white/10 border-none p-0 text-xs text-white focus:ring-0 w-24" value={w.label}
                          onChange={(e) => updateWeightLabel(w.id, e.target.value)} onBlur={() => setEditingWeightId(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingWeightId(null)} />
                      ) : (
                        <span className="cursor-pointer hover:text-st-light text-xs font-medium text-white/60 truncate max-w-[100px]"
                          onClick={() => setEditingWeightId(w.id)} title={getWeightLabel(w)}>{getWeightLabel(w)}</span>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-st-yellow text-xs font-semibold tabular-nums">{w.value}%</span>
                        <button onClick={() => removeWeightItem(w.id)}
                          className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-500 transition-all">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <input type="range" min="0" max="100" value={w.value}
                      onChange={(e) => updateWeightValue(w.id, parseInt(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-st-yellow" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Jobs section */}
        <div className="pt-3 border-t border-white/5">
          <button onClick={() => setShowJobMenu(!showJobMenu)}
            className="w-full flex items-center justify-between text-white/50 hover:text-white transition-colors group">
            <div className="flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold tracking-widest uppercase">{t.activeJobs}</span>
            </div>
            <ChevronDown className={`w-3 h-3 transition-transform ${showJobMenu ? 'rotate-180' : ''}`} />
          </button>

          {showJobMenu && (
            <div className="mt-3 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="space-y-1 max-h-36 overflow-y-auto st-scrollbar pr-0.5">
                {jobs.map(job => (
                  <button key={job.id}
                    onClick={() => { setActiveJobId(job.id); setActiveTab('input'); }}
                    className={`w-full text-left p-2 rounded-lg text-xs font-medium transition-all border group ${activeJobId === job.id ? 'bg-st-light/20 border-st-light text-white' : 'border-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="truncate" title={job.title}>{job.title}</div>
                        <div className="text-[10px] opacity-40 font-medium truncate" title={job.dept}>{job.dept}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm('Delete this job and all its results?')) deleteJob(job.id); }}
                        className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 transition-all p-0.5 shrink-0" title="Delete job">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-1.5">
                <input type="text" placeholder={t.jobTitleLabel} value={newJobTitle}
                  onChange={e => setNewJobTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white placeholder:text-white/15 focus:outline-none focus:border-st-light transition-all mb-1.5 font-medium" />
                <button onClick={async () => { if (newJobTitle) { await createNewJob(newJobTitle, t.hrDept); setNewJobTitle(''); } }}
                  className="w-full bg-st-yellow text-st-dark py-2 rounded-lg text-xs font-semibold hover:bg-white transition-all shadow-lg active:scale-95">
                  <Plus className="w-3 h-3 inline mr-1" />{t.jobCreate.toUpperCase()}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System status */}
      <div className="p-3 bg-st-dark/50 backdrop-blur-xl border-t border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-st-success/20 flex items-center justify-center border border-st-success/30">
            <AlertCircle className="w-3.5 h-3.5 text-st-success animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-st-success uppercase tracking-widest">{t.systemStatus}</div>
            <div className="text-[11px] text-white/40 font-medium leading-none mt-0.5">{t.active}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
