import React from 'react';
import { Toaster } from 'sonner';
import { api, handleFirestoreError, OperationType } from './lib/firebase';

// Sub-components & Pages
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { InputPage } from './pages/InputPage';
import { ResultsPage } from './pages/ResultsPage';
import TalentLibraryPage from './pages/TalentLibraryPage';

// Hooks
import { useScreening } from './hooks/useScreening';
import AiChatWidget from './components/AiChatWidget';
import { LanguageProvider } from './components/LanguageContext';

// Error Boundary: functional fallback wrapper
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-st-dark flex items-center justify-center p-8">
      <div className="max-w-lg bg-red-50 border border-red-200 rounded-2xl p-8 text-left">
        <h2 className="text-red-600 font-black text-lg mb-2">App Crashed</h2>
        <pre className="text-red-800 text-sm whitespace-pre-wrap break-all font-mono bg-red-100 p-4 rounded-xl max-h-80 overflow-auto">
          {error.message}
          {'\n\n'}
          {error.stack}
        </pre>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-3 bg-st-yellow text-st-dark font-bold rounded-xl hover:bg-yellow-400 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

// Use React.Component with any to bypass TS strictness
class ErrorBoundary extends (React.Component as any) {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if ((this.state as any).hasError) {
      return <ErrorFallback error={(this.state as any).error} />;
    }
    return (this.props as any).children;
  }
}

export default function App() {
  const {
    authReady, jobs, activeJobId, activeTab, jd, files, isAnalyzing, progress, results,
    expandedResult, language, blindMode, searchTerm, editingScore, totalSystemStats, isShareMode,
    weights, thresholds, isConfiguring, jobTitle, t, stats, funnelData, currentFile, allResults, jobsWithStats,
    setLanguage, setActiveTab, setJd, setFiles, setExpandedResult, setBlindMode, setSearchTerm,
    setEditingScore, setWeights, setThresholds, setJobTitle, setActiveJobId,
    handleWeightChange, handleScoreOverride, handleAiConfig, createNewJob, runAnalysis,
    addWeightItem, removeWeightItem, handleJdFileUpload
  } = useScreening();

  if (!authReady) {
    return (
      <div className="min-h-screen bg-st-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-st-yellow border-t-transparent rounded-full animate-spin" />
          <div className="text-st-yellow font-black tracking-widest text-sm uppercase animate-pulse">Initializing AI Resume Screening...</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <LanguageProvider lang={language}>
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden font-sans">
        <Toaster position="top-right" richColors />
        
        <Sidebar 
          language={language}
          setLanguage={setLanguage}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          jobs={jobs}
          activeJobId={activeJobId}
          setActiveJobId={setActiveJobId}
          weights={weights}
          handleWeightChange={handleWeightChange}
          createNewJob={createNewJob}
          addWeightItem={addWeightItem}
          removeWeightItem={removeWeightItem}
          isShareMode={isShareMode}
          t={t}
        />

        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <Header
            isShareMode={isShareMode}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            language={language}
            blindMode={blindMode}
            setBlindMode={setBlindMode}
            activeJobId={activeJobId}
            jobs={jobs}
            t={t}
          />

          {activeTab === 'dashboard' && (
            <DashboardPage 
              stats={stats}
              totalSystemStats={totalSystemStats}
              funnelData={funnelData}
              results={allResults}
              jobs={jobsWithStats}
              setActiveJobId={setActiveJobId}
              setActiveTab={setActiveTab}
              t={t}
            />
          )}

          {activeTab === 'input' && (
            <InputPage 
              jd={jd}
              setJd={setJd}
              files={files}
              setFiles={setFiles}
              isAnalyzing={isAnalyzing}
              progress={progress}
              currentFile={currentFile}
              runAnalysis={runAnalysis}
              isConfiguring={isConfiguring}
              handleAiConfig={handleAiConfig}
              handleJdFileUpload={handleJdFileUpload}
              weights={weights}
              thresholds={thresholds}
              setThresholds={setThresholds}
              activeJobId={activeJobId}
              jobs={jobs}
              jobTitle={jobTitle}
              setJobTitle={setJobTitle}
              t={t}
            />
          )}

          {activeTab === 'results' && (
            <ResultsPage 
              results={results}
              expandedResult={expandedResult}
              setExpandedResult={setExpandedResult}
              blindMode={blindMode}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              editingScore={editingScore}
              setEditingScore={setEditingScore}
              handleScoreOverride={handleScoreOverride}
              activeJobId={activeJobId}
              jobs={jobs}
              weights={weights}
              language={language}
              isShareMode={isShareMode}
              t={t}
            />
          )}

          {activeTab === 'talent-library' && (
            <TalentLibraryPage
              results={allResults}
              onSelect={(result) => {
                setExpandedResult(result.file_name);
                setActiveTab('results');
              }}
            />
          )}

        </main>
        
        <AiChatWidget
          activeJobId={activeJobId}
          activeResult={expandedResult ? results.find(r => r.file_name === expandedResult) ?? null : null}
          activeJobJd={jd}
          language={language}
        />

        <div className="fixed bottom-0 left-0 right-0 z-50 bg-st-dark/90 backdrop-blur-md border-t border-white/5 px-6 py-2 flex items-center justify-center">
          <span className="text-[11px] font-medium text-white/40">
            {new Date().toISOString().split('T')[0]} | {language === 'zh' ? 'ST 内部使用' : 'ST Internal Use'} | {language === 'zh' ? '创建人' : 'Created by'}: Yude.jiang@st.com &nbsp;ST
          </span>
        </div>
      </div>
    </LanguageProvider>
    </ErrorBoundary>
  );
}
