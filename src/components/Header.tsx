import React from 'react';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { Language } from '../translations';

interface HeaderProps {
  isShareMode: boolean;
  activeTab: string;
  setActiveTab: (t: 'dashboard' | 'input' | 'results' | 'talent-library') => void;
  language: Language;
  setLanguage: (l: Language | ((prev: Language) => Language)) => void;
  blindMode: boolean;
  setBlindMode: (b: boolean) => void;
  activeJobId: string | null;
  jobs: any[];
  t: any;
}

function pageTitle(activeTab: string, t: any): string {
  const map: Record<string, string> = {
    input: t.inputData,
    results: t.screeningResults,
    dashboard: t.dashboard,
    'talent-library': t.talentLibrary,
  };
  return map[activeTab] || activeTab;
}

export const Header: React.FC<HeaderProps> = ({
  isShareMode, activeTab, setActiveTab, language, setLanguage, blindMode, setBlindMode,
  activeJobId, jobs, t
}) => {
  const activeJob = jobs.find((j: any) => j.id === activeJobId);

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 shrink-0 z-20">
      {/* Left: breadcrumb */}
      {isShareMode ? (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-st-dark rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-st-yellow fill-st-yellow" />
          </div>
          <span className="text-sm font-medium text-slate-400">{t.sharedResults}</span>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-st-dark">
            {pageTitle(activeTab, t)}
          </span>
          {activeJob && (
            <>
              <span className="text-slate-300 text-sm">/</span>
              <span className="text-sm font-normal text-slate-500 truncate max-w-[240px]">{activeJob.title}</span>
            </>
          )}
        </div>
      )}

      {/* Right: actions */}
      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={() => setLanguage(l => l === 'en' ? 'zh' : 'en')}
          className="text-xs font-medium border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
        >
          {language === 'en' ? '中文' : 'EN'}
        </button>
        {!isShareMode && (
          <button
            onClick={() => setBlindMode(!blindMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              blindMode
                ? 'bg-st-dark text-white'
                : 'bg-slate-100 text-slate-400 hover:text-slate-600'
            }`}
          >
            {blindMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {t.blindMode}
          </button>
        )}
      </div>
    </header>
  );
};
