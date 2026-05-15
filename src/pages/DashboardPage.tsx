import React from 'react';
import { FileSearch, Clock, Target, Zap, Eye, Briefcase, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardPageProps {
  stats: any;
  totalSystemStats: any;
  funnelData: any;
  results: any;
  jobs: any[];
  setActiveJobId: (id: string) => void;
  setActiveTab: (tab: 'dashboard' | 'input' | 'results') => void;
  deleteJob: (id: string) => void;
  t: any;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats, totalSystemStats, funnelData, results, jobs, setActiveJobId, setActiveTab, deleteJob, t
}) => {
  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-700 h-full overflow-y-auto st-scrollbar pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-lg font-semibold text-st-dark">{t.dashboard}</h2>
          <p className="text-slate-400 text-xs font-medium mt-1">{t.internalTool}</p>
        </div>
        <div className="px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-st-success animate-pulse" />
          <span className="text-sm font-medium text-slate-500">{t.active}</span>
        </div>
      </div>

      {/* ── Metrics Row (4 cards, full width) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-2">
            <FileSearch className="w-4 h-4 text-st-light" />
            <span className="text-xs font-medium text-slate-400">{t.totalHandled}</span>
          </div>
          <span className="text-2xl font-semibold text-st-dark tabular-nums">{totalSystemStats.results}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-st-light" />
            <span className="text-xs font-medium text-slate-400">{t.hoursSaved}</span>
          </div>
          <span className="text-2xl font-semibold text-st-dark tabular-nums">{(totalSystemStats.results * 0.2).toFixed(1)}h</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-st-light" />
            <span className="text-xs font-medium text-slate-400">{t.avgScore}</span>
          </div>
          <span className="text-2xl font-semibold text-st-dark tabular-nums">
            {results.length > 0 ? (results.reduce((a: any, c: any) => a + (c.hr_override_score ?? c.overall_score), 0) / results.length).toFixed(1) : '0.0'}%
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-st-light" />
            <span className="text-xs font-medium text-slate-400">{t.activeJobsMetric}</span>
          </div>
          <span className="text-2xl font-semibold text-st-dark tabular-nums">{totalSystemStats.jobs}</span>
        </div>
      </div>

      {/* ── Funnel Row (compact) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {funnelData.map((d: any, i: number) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-xs font-medium text-slate-400 truncate">{d.name}</span>
            </div>
            <span className="text-lg font-semibold text-st-dark tabular-nums">{d.value}</span>
          </div>
        ))}
      </div>

      {/* ── Active Positions ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-lg font-semibold text-st-dark flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-st-light" />
            {t.activeJobs}
          </h3>
          <button
            onClick={() => setActiveTab('input')}
            className="px-5 py-2 bg-st-dark text-white rounded-xl text-xs font-medium hover:bg-st-light transition-colors shadow-sm"
          >
            {t.inputData}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <motion.div
              key={job.id}
              whileHover={{ y: -3 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <span className="text-st-light text-xs font-medium">{job.dept}</span>
                    <h4 className="text-base font-semibold text-st-dark leading-tight">{job.title}</h4>
                  </div>
                  <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    job.status === 'running' ? 'bg-st-success/10 text-st-success' :
                    job.status === 'closed' ? 'bg-slate-100 text-slate-400' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {job.status === 'running' ? t.activeStatus : job.status === 'closed' ? t.closedStatus : t.pausedStatus}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-y border-slate-50 py-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-st-dark tabular-nums">{job.stats?.total || 0}</div>
                    <div className="text-xs font-medium text-slate-400">{t.totalHandled.split(' ')[1] || t.units}</div>
                  </div>
                  <div className="text-center border-x border-slate-50">
                    <div className="text-lg font-semibold text-st-dark tabular-nums">{job.stats?.evaluating || 0}</div>
                    <div className="text-xs font-medium text-slate-400">{t.evaluating}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-st-success tabular-nums">{job.stats?.highMatch || 0}</div>
                    <div className="text-xs font-medium text-slate-400">{t.highMatch}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setActiveJobId(job.id); setActiveTab('results'); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-st-dark hover:text-white rounded-xl text-xs font-medium transition-all text-slate-500"
                >
                  <Eye className="w-3.5 h-3.5" />{t.viewDetails}
                </button>
                <button
                  onClick={() => { setActiveJobId(job.id); setActiveTab('input'); }}
                  className="p-2.5 bg-slate-50 hover:bg-st-light hover:text-white rounded-xl text-st-light transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { if (confirm('Delete this job and all its results?')) deleteJob(job.id); }}
                  className="p-2.5 bg-slate-50 hover:bg-rose-100 hover:text-rose-500 rounded-xl text-slate-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
          {jobs.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-300 bg-white rounded-2xl border border-slate-200">
              <Briefcase className="w-12 h-12 mb-4 opacity-20" />
              <span className="text-sm font-medium">{t.waitingInput}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
