import React from 'react';
import { Zap } from 'lucide-react';
import { Language } from '../translations';

interface HeaderProps {
  isShareMode: boolean;
  activeTab: string;
  setActiveTab: (t: 'dashboard' | 'input' | 'results') => void;
  language: Language;
  blindMode: boolean;
  setBlindMode: (b: boolean) => void;
  activeJobId: string | null;
  jobs: any[];
  t: any;
}

export const Header: React.FC<HeaderProps> = ({
  isShareMode, activeTab, setActiveTab, language, blindMode, setBlindMode,
  activeJobId, jobs, t
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shrink-0 z-20">
      {!isShareMode ? (
        <div className="flex gap-8 h-full">
          <button 
            onClick={() => setActiveTab('input')}
            className={`text-base font-bold h-full border-b-2 px-2 transition-all ${activeTab === 'input' ? 'border-st-dark text-st-dark' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            {t.inputData}
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            className={`text-base font-bold h-full border-b-2 px-2 transition-all ${activeTab === 'results' ? 'border-st-dark text-st-dark' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            {t.screeningResults}
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`text-base font-bold h-full border-b-2 px-2 transition-all ${activeTab === 'dashboard' ? 'border-st-dark text-st-dark' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            {t.dashboard}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-st-dark rounded-xl flex items-center justify-center">
             <Zap className="w-6 h-6 text-st-yellow fill-st-yellow" />
          </div>
          <div>
            <h1 className="text-base font-bold text-st-dark">AI Resume Screening | Interviewer View</h1>
            <p className="text-sm font-bold text-slate-400 truncate max-w-[200px]">Active Job: {jobs.length > 0 ? (jobs.find(j => j.id === activeJobId)?.title || 'Loading...') : 'Results Sharing'}</p>
          </div>
        </div>
      )}
      
      <div className="ml-auto flex items-center gap-4">
         <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{t.blindMode}</span>
            <button
              onClick={() => setBlindMode(!blindMode)}
              className={`w-8 h-4 rounded-full transition-all relative ${blindMode ? 'bg-st-light' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${blindMode ? 'left-4.5' : 'left-0.5'}`} />
            </button>
         </div>
      </div>
    </header>
  );
};
