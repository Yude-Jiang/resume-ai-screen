import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  Tooltip,
} from 'recharts';
import { FileSearch, Clock, Target, Plus, Zap, Eye, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardPageProps {
  stats: any;
  totalSystemStats: any;
  funnelData: any;
  results: any;
  jobs: any[];
  setActiveJobId: (id: string) => void;
  setActiveTab: (tab: 'dashboard' | 'input' | 'results') => void;
  t: any;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats, totalSystemStats, funnelData, results, jobs, setActiveJobId, setActiveTab, t
}) => {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700 h-full overflow-y-auto st-scrollbar pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-st-dark tracking-tight">{t.dashboard}</h2>
          <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-sm">{t.internalTool}</p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-st-success animate-pulse" />
            <span className="text-sm font-black text-slate-500 uppercase tracking-widest">{t.active}</span>
          </div>
        </div>
      </div>

      {/* Active Positions First */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 className="text-2xl font-black text-st-dark tracking-tight flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-st-light" />
            {t.activeJobs}
          </h3>
          <button
             onClick={() => setActiveTab('input')}
             className="px-6 py-2 bg-st-dark text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-st-light transition-colors shadow-lg shadow-st-dark/10"
          >
            {t.inputData}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <motion.div
              key={job.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <span className="text-st-light text-xs font-black uppercase tracking-widest">{job.dept}</span>
                    <h4 className="text-lg font-black text-st-dark leading-tight">{job.title}</h4>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                    job.status === 'running' ? 'bg-st-success/10 text-st-success' :
                    job.status === 'closed' ? 'bg-slate-100 text-slate-400' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {job.status === 'running' ? 'Active' : job.status === 'closed' ? 'Closed' : 'Paused'}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-y border-slate-50 py-6 mb-6">
                   <div className="text-center">
                     <div className="text-xl font-bold text-st-dark tabular-nums">{job.stats?.total || 0}</div>
                     <div className="text-xs font-bold text-slate-400">{t.totalHandled.split(' ')[1] || 'Resumes'}</div>
                   </div>
                   <div className="text-center border-x border-slate-50">
                     <div className="text-xl font-bold text-st-dark tabular-nums">{job.stats?.evaluating || 0}</div>
                     <div className="text-xs font-bold text-slate-400">{t.evaluating}</div>
                   </div>
                   <div className="text-center">
                     <div className="text-xl font-bold text-st-success tabular-nums">{job.stats?.highMatch || 0}</div>
                     <div className="text-xs font-bold text-slate-400">{t.highMatch}</div>
                   </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveJobId(job.id);
                    setActiveTab('results');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-st-dark hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all text-slate-500 whitespace-nowrap"
                >
                  <Eye className="w-4 h-4" />
                  {t.viewDetails}
                </button>
                <button
                  onClick={() => {
                    setActiveJobId(job.id);
                    setActiveTab('input');
                  }}
                  className="p-3 bg-slate-50 hover:bg-st-light hover:text-white rounded-xl text-st-light transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
          {jobs.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-300 bg-white rounded-[2rem] border border-slate-200">
              <Briefcase className="w-12 h-12 mb-4 opacity-20" />
              <span className="text-sm font-black uppercase tracking-widest">{t.waitingInput}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Total Resumes Analysis */}
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] group-hover:opacity-10 transition-all scale-150 rotate-12">
              <FileSearch className="w-64 h-64 text-st-dark" />
            </div>
            <div className="text-sm font-bold text-slate-500 mb-3">{t.totalHandled}</div>
            <div className="flex items-end gap-5">
              <span className="text-2xl font-bold text-st-dark tabular-nums">{totalSystemStats.results}</span>
              <div className="flex items-center gap-1.5 text-st-success text-xs font-bold mb-1 px-2 py-0.5 bg-st-success/10 rounded-full">
                <Plus className="w-3 h-3" /> LIVE
              </div>
            </div>
          </div>

          {/* Productivity / Hours Saved */}
          <div className="bg-st-dark p-10 rounded-[2.5rem] shadow-2xl hover:shadow-st-dark/30 transition-all group relative overflow-hidden">
            <div className="absolute -right-12 -bottom-12 opacity-10 group-hover:opacity-20 transition-all rotate-12">
              <Clock className="w-64 h-64 text-white" />
            </div>
            <div className="text-sm font-bold text-white/50 mb-3">{t.hoursSaved}</div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-st-light tabular-nums">{(totalSystemStats.results * 0.2).toFixed(1)}</span>
              <span className="text-base font-bold text-st-light/40 mb-0.5">h</span>
            </div>
          </div>

          {/* Average Match score */}
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:border-st-light/50 transition-all">
            <div className="text-sm font-bold text-slate-500 mb-3">{t.avgScore}</div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-st-dark tabular-nums">
                {results.length > 0 ? (results.reduce((a: any, c: any) => a + (c.hr_override_score ?? c.overall_score), 0) / results.length).toFixed(1) : '0.0'}
              </span>
              <span className="text-base font-bold text-slate-300 mb-0.5">%</span>
            </div>
          </div>

          {/* System Load Activity */}
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="text-sm font-bold text-slate-500 mb-3">Active Job Pipeline</div>
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { name: 'W1', v: totalSystemStats.jobs * 0.4 }, { name: 'W2', v: totalSystemStats.jobs * 0.6 }, { name: 'W3', v: totalSystemStats.jobs * 0.9 }, { name: 'W4', v: totalSystemStats.jobs }
                ]}>
                  <Area type="monotone" dataKey="v" stroke="#3cb4e6" strokeWidth={4} fillOpacity={0.1} fill="#3cb4e6" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between items-center mt-6">
              <span className="text-2xl font-bold text-st-dark tabular-nums">{totalSystemStats.jobs}</span>
              <span className="text-xs font-bold text-st-light bg-st-light/10 px-2.5 py-1 rounded-full">
                Active jobs
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-st-dark p-10 rounded-[2.5rem] shadow-2xl flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-st-light/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          <div className="text-sm font-bold text-white/40 mb-10 tracking-widest uppercase">{t.funnelTitle}</div>
          
          <div className="flex-1 flex flex-col justify-center gap-6">
            {funnelData.map((d: any, i: number) => (
              <div key={i} className="space-y-3 group">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-white/60 tracking-tight group-hover:text-white transition-colors">{d.name}</span>
                  <span className="text-2xl font-black text-white tabular-nums">{d.value}</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(d.value / Math.max(results.length, 1)) * 100}%` }}
                    className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                    style={{ backgroundColor: d.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-st-light/20 flex items-center justify-center border border-st-light/30 shadow-lg shadow-st-light/10">
              <Zap className="w-6 h-6 text-st-yellow fill-st-yellow" />
            </div>
            <div>
              <div className="text-base font-black text-white tracking-tight">{t.aiStrategy}</div>
              <div className="text-sm font-bold text-st-light tracking-widest uppercase mt-0.5">V4.2 Optimized Engine</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
