import { useState, useMemo, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocFromServer,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, clientId } from '../lib/firebase';
import { ScoringWeights, AnalysisResult, HardThresholds, Job } from '../types';
import { analyzeResume, analyzeJd, parseJdFile } from '../services/gemini';
import { translations, Language } from '../translations';
import { toast } from 'sonner';

export function useScreening() {
  const [authReady, setAuthReady] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'input' | 'results' | 'talent-library'>('input');
  const [jd, setJd] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [allResults, setAllResults] = useState<AnalysisResult[]>([]);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [blindMode, setBlindMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingScore, setEditingScore] = useState<{ fileName: string, score: number, tags: string[] } | null>(null);
  const [totalSystemStats, setTotalSystemStats] = useState({ jobs: 0, results: 0 });
  const [isShareMode, setIsShareMode] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [jobTitle, setJobTitle] = useState('');

  const [weights, setWeights] = useState<ScoringWeights>([
    { id: 'edu', label: 'Education Match', value: 20 },
    { id: 'exp', label: 'Experience Years', value: 30 },
    { id: 'skill', label: 'Skill Overlap', value: 35 },
    { id: 'lang', label: 'Language Ability', value: 10 },
    { id: 'cert', label: 'Certifications', value: 5 },
  ]);

  const [thresholds, setThresholds] = useState<HardThresholds>({
    minEdu: 'bachelor',
    minExp: 3,
    requiredSkills: [],
  });

  const t = translations[language];

  // Init
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedJobId = urlParams.get('jobId');
    const mode = urlParams.get('mode');

    if (sharedJobId && mode === 'share') {
      setIsShareMode(true);
      setActiveJobId(sharedJobId);
      setActiveTab('results');
    }

    setAuthReady(true);
  }, []);

  // Connection Test
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    if (authReady) testConnection();
  }, [authReady]);

  // Fetch Jobs
  useEffect(() => {
    if (!isShareMode || !authReady) {
      const q = query(collection(db, 'jobs'), where('ownerId', '==', clientId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const jobList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
        setJobs(jobList);
      }, (error) => {
         if (!isShareMode) handleFirestoreError(error, OperationType.LIST, 'jobs');
      });
      return () => unsubscribe();
    }
  }, [isShareMode, authReady]);

  // Fetch Results
  useEffect(() => {
    if (!activeJobId) {
      setResults([]);
      return;
    }
    const constraints = [where('jobId', '==', activeJobId)];
    if (!isShareMode) {
      constraints.push(where('ownerId', '==', clientId));
    }

    const q = query(collection(db, 'analysisResults'), ...constraints);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AnalysisResult));
      docs.sort((a, b) => b.overall_score - a.overall_score);
      setResults(docs);
    }, (error) => {
      if (!isShareMode) handleFirestoreError(error, OperationType.LIST, 'analysisResults');
    });
    return () => unsubscribe();
  }, [activeJobId, isShareMode]);

  // Fetch ALL Results for Dashboard
  useEffect(() => {
    if (isShareMode) return;

    const q = query(collection(db, 'analysisResults'), where('ownerId', '==', clientId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllResults(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AnalysisResult)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'analysisResults_all');
    });
    return () => unsubscribe();
  }, [isShareMode]);

  // System Stats
  useEffect(() => {
    const unsubJobs = onSnapshot(collection(db, 'jobs'), (snap) => {
       setTotalSystemStats(prev => ({ ...prev, jobs: snap.size }));
    });
    const unsubResults = onSnapshot(collection(db, 'analysisResults'), (snap) => {
       setTotalSystemStats(prev => ({ ...prev, results: snap.size }));
    });
    return () => { unsubJobs(); unsubResults(); };
  }, []);

  // Sync JD/Weights/Thresholds when active job changes
  useEffect(() => {
    const activeJob = jobs.find(j => j.id === activeJobId);
    if (activeJob) {
      setJd(activeJob.jd || '');
      if (activeJob.weights && activeJob.weights.length > 0) {
        setWeights(activeJob.weights);
      }
      if (activeJob.thresholds) {
        setThresholds(activeJob.thresholds);
      }
    }
  }, [activeJobId, jobs]);

  // Ensure an active job exists if jobs are available
  useEffect(() => {
    if (jobs.length > 0 && !activeJobId) {
      setActiveJobId(jobs[0].id);
    }
  }, [jobs, activeJobId]);

  // Actions
  const handleWeightChange = async (newWeights: ScoringWeights) => {
    setWeights(newWeights);
    if (activeJobId) {
      try {
        await updateDoc(doc(db, 'jobs', activeJobId), { weights: newWeights, updatedAt: serverTimestamp() });
      } catch (e) { handleFirestoreError(e, OperationType.WRITE, `jobs/${activeJobId}`); }
    }
  };

  const addWeightItem = () => {
    const newWeights = [...weights, { id: `custom_${Date.now()}`, label: 'New Metric', value: 0 }];
    handleWeightChange(newWeights);
  };

  const removeWeightItem = (id: string) => {
    const newWeights = weights.filter(w => w.id !== id);
    handleWeightChange(newWeights);
  };

  const handleScoreOverride = async (fileName: string, score: number, tags: string[]) => {
    const result = results.find(r => r.file_name === fileName);
    if (result && (result as any).id) {
       try {
         await updateDoc(doc(db, 'analysisResults', (result as any).id), {
           hr_override_score: score,
           hr_feedback_tags: tags
         });
       } catch (e) { handleFirestoreError(e, OperationType.WRITE, `analysisResults/${(result as any).id}`); }
    }
    setEditingScore(null);
  };

  const handleAiConfig = async (overrideJd?: string) => {
    const jdToUse = overrideJd || jd;
    if (!jdToUse) return;
    setIsConfiguring(true);
    const promise = analyzeJd(jdToUse);
    toast.promise(promise, {
      loading: language === 'zh' ? '正在分析 JD 并配置权重...' : 'Analyzing JD and configuring weights...',
      success: (config) => {
        if (config.jobTitle) setJobTitle(config.jobTitle);
        setWeights(config.suggestedWeights);
        setThresholds(config.thresholds);
        if (activeJobId) {
          updateDoc(doc(db, 'jobs', activeJobId), {
            jd: jdToUse,
            title: config.jobTitle || jobTitle || undefined,
            weights: config.suggestedWeights,
            thresholds: config.thresholds,
            updatedAt: serverTimestamp()
          }).catch(e => handleFirestoreError(e, OperationType.WRITE, `jobs/${activeJobId}`));
        }
        return language === 'zh' ? '权重和阈值已根据 JD 自动优化！' : 'Weights and thresholds optimized!';
      },
      error: language === 'zh' ? '从 JD 配置失败。' : 'Failed to configure from JD.'
    });

    try {
      await promise;
    } catch (error) {
      console.error("JD Analysis failed:", error);
    } finally {
      setIsConfiguring(false);
    }
  };

  const createNewJob = async (title: string, dept: string) => {
    try {
      const docRef = await addDoc(collection(db, 'jobs'), {
        title,
        dept,
        jd: '',
        weights: [
          { id: 'edu', label: translations[language].education, value: 20 },
          { id: 'exp', label: translations[language].experience, value: 30 },
          { id: 'skill', label: translations[language].skills, value: 35 },
          { id: 'lang', label: translations[language].language, value: 10 },
          { id: 'cert', label: translations[language].certs, value: 5 },
        ],
        thresholds: { minEdu: 'bachelor', minExp: 3, requiredSkills: [] },
        status: 'running',
        updatedAt: serverTimestamp(),
        ownerId: clientId
      });
      setActiveJobId(docRef.id);
      setActiveTab('input');
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'jobs'); }
  };

  const handleJdFileUpload = async (file: File) => {
    setIsConfiguring(true);
    try {
      const text = await parseJdFile(file);
      setJd(text);
      await handleAiConfig(text);
    } catch (e) {
      console.error("JD extraction error:", e);
      toast.error(language === 'zh' ? '提取 JD 失败' : 'Failed to extract JD');
    } finally {
      setIsConfiguring(false);
    }
  };

  const runAnalysis = async () => {
    console.log("runAnalysis triggered", { jd, filesCount: files.length, activeJobId });

    if (files.length === 0) {
      toast.error(language === 'zh' ? '请上传至少一份简历' : 'Please upload at least one resume');
      return;
    }

    let targetJobId = activeJobId;

    if (!targetJobId) {
      if (!jd) {
        toast.error(language === 'zh' ? '请选择一个职位或提供职位描述 (JD)' : 'Please select a job position or provide a Job Description (JD)');
        return;
      }

      try {
        const docRef = await addDoc(collection(db, 'jobs'), {
          title: jobTitle || (language === 'zh' ? '新职位' : 'New Position'),
          dept: language === 'zh' ? '待定' : 'TBD',
          jd: jd,
          weights,
          thresholds,
          status: 'running',
          updatedAt: serverTimestamp(),
          ownerId: clientId
        });
        targetJobId = docRef.id;
        setActiveJobId(targetJobId);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'jobs');
        return;
      }
    } else if (!jd) {
      toast.error(language === 'zh' ? '请提供职位描述 (JD)' : 'Please provide a Job Description (JD)');
      return;
    }

    const CONCURRENCY_LIMIT = 5;
    setIsAnalyzing(true);
    setProgress(0);

    // Duplicate detection: build set of already-screened filenames for this job
    const existingFileNames = new Set(
      results.filter(r => r.jobId === targetJobId).map(r => r.file_name?.toLowerCase())
    );
    const newFiles = files.filter(f => !existingFileNames.has(f.name.toLowerCase()));
    const skippedCount = files.length - newFiles.length;
    if (skippedCount > 0) {
      toast.info(language === 'zh'
        ? `已跳过 ${skippedCount} 份重复简历`
        : `Skipped ${skippedCount} duplicate resume(s)`);
    }
    if (newFiles.length === 0) {
      toast.warning(language === 'zh' ? '所有简历已筛选过' : 'All resumes already screened');
      setIsAnalyzing(false);
      setActiveTab('results');
      return;
    }

    let successCount = 0;
    let failCount = 0;
    let completedCount = 0;

    for (let i = 0; i < newFiles.length; i += CONCURRENCY_LIMIT) {
      const batch = newFiles.slice(i, i + CONCURRENCY_LIMIT);

      const batchResults = await Promise.allSettled(
        batch.map(async (file) => {
          setCurrentFile(file.name);
          const result = await analyzeResume(jd, file, weights, language);
          await addDoc(collection(db, 'analysisResults'), {
            ...result,
            jobId: targetJobId,
            createdAt: serverTimestamp(),
            ownerId: clientId,
          });
          return file.name;
        })
      );

      for (const r of batchResults) {
        if (r.status === 'fulfilled') {
          successCount++;
        } else {
          failCount++;
          const reason = r.reason instanceof Error ? r.reason.message : String(r.reason);
          console.error(`Analysis error:`, r.reason);
          toast.error(`Failed: ${reason}`, { duration: 3000 });
        }
      }

      completedCount += batch.length;
      setProgress((completedCount / newFiles.length) * 100);
    }

    setIsAnalyzing(false);
    setCurrentFile(null);
    if (failCount === 0) {
      toast.success(t.analysisComplete || "Analysis complete!");
    } else {
      toast.warning(`${successCount} success, ${failCount} failed.`);
    }
    setActiveTab('results');
  };

  const stats = useMemo(() => ({
    total: results.length,
    highMatch: results.filter(r => (r.hr_override_score ?? r.overall_score) >= 80).length,
    evaluating: results.filter(r => (r.hr_override_score ?? r.overall_score) >= 60 && (r.hr_override_score ?? r.overall_score) < 80).length,
    notAdvised: results.filter(r => (r.hr_override_score ?? r.overall_score) < 60).length,
    hoursSaved: (results.length * 0.2).toFixed(1),
  }), [results]);

  const funnelData = useMemo(() => [
    { name: t.totalHandled, value: stats.total, color: '#3cb4e6' },
    { name: t.evaluating, value: stats.evaluating + stats.highMatch, color: '#ffd200' },
    { name: t.highMatch, value: stats.highMatch, color: '#10b981' },
    { name: t.notAdvised, value: stats.notAdvised, color: '#f43f5e' },
  ], [stats, t]);

  const jobsWithStats = useMemo(() => {
    return jobs.map(job => {
      const jobResults = allResults.filter(r => r.jobId === job.id);
      return {
        ...job,
        stats: {
          total: jobResults.length,
          highMatch: jobResults.filter(r => (r.hr_override_score ?? r.overall_score) >= 80).length,
          evaluating: jobResults.filter(r => (r.hr_override_score ?? r.overall_score) >= 60 && (r.hr_override_score ?? r.overall_score) < 80).length,
        }
      };
    });
  }, [jobs, allResults]);

  return {
    authReady, jobs, activeJobId, activeTab, jd, files, isAnalyzing, progress, results,
    expandedResult, language, blindMode, searchTerm, editingScore, totalSystemStats, isShareMode,
    weights, thresholds, isConfiguring, jobTitle, t, currentFile, allResults, jobsWithStats,
    setActiveJobId, setActiveTab, setJd, setFiles, setIsAnalyzing,
    setProgress, setResults, setExpandedResult, setLanguage, setBlindMode, setSearchTerm,
    setEditingScore, setWeights, setThresholds, setJobTitle,
    handleWeightChange, handleScoreOverride, handleAiConfig, createNewJob, runAnalysis,
    stats, funnelData, addWeightItem, removeWeightItem, handleJdFileUpload
  };
}
