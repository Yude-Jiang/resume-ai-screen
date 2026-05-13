import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Download, 
  LayoutGrid, 
  List, 
  ChevronRight, 
  Calendar,
  GraduationCap,
  Briefcase,
  Star
} from 'lucide-react';
import { useI18n } from '../components/LanguageContext';
import { AnalysisResult } from '../types';

function formatRelativeTime(date: Date | any): string {
  if (!date || typeof date === 'string') return date || 'Recently';
  const d = date instanceof Date ? date : date.toDate?.() || new Date(date);
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

interface TalentLibraryPageProps {
  results: AnalysisResult[];
  onSelect: (result: AnalysisResult) => void;
}

const TalentLibraryPage: React.FC<TalentLibraryPageProps> = ({ 
  results, 
  onSelect 
}) => {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'high' | 'pending' | 'rejected'>('all');

  // Filter & Search Logic
  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchSearch = r.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.summary.key_skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const effectiveScore = r.hr_override_score ?? r.overall_score;
      let matchStatus = true;
      if (statusFilter === 'high') matchStatus = effectiveScore >= 80;
      else if (statusFilter === 'pending') matchStatus = effectiveScore >= 60 && effectiveScore < 80;
      else if (statusFilter === 'rejected') matchStatus = effectiveScore < 60;

      return matchSearch && matchStatus;
    });
  }, [results, searchTerm, statusFilter]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700 st-scrollbar overflow-y-auto h-full pb-32">
      {/* Header & Stats Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-st-dark">Talent Pool</h2>
          <p className="text-slate-400 text-xs font-medium">Managing {results.length} processed candidates across all positions</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-st-dark text-white shadow-lg' : 'text-slate-400 hover:text-st-dark'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-st-dark text-white shadow-lg' : 'text-slate-400 hover:text-st-dark'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <button className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-xs font-medium text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Search & Global Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-st-light transition-colors" />
          <input 
            type="text" 
            placeholder="Search by name, skills, or experience..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[1.5rem] focus:ring-4 focus:ring-st-light/10 font-bold text-st-dark placeholder:text-slate-300 shadow-sm transition-all"
          />
        </div>
        <div className="md:col-span-4 flex gap-2 bg-white p-2 rounded-[1.5rem] border border-slate-200 shadow-sm">
          {(['all', 'high', 'pending', 'rejected'] as const).map(f => (
            <button
               key={f}
               onClick={() => setStatusFilter(f)}
               className={`flex-1 py-3 rounded-xl text-xs font-medium transition-all ${
                 statusFilter === f ? 'bg-st-dark text-white shadow-lg' : 'text-slate-400 hover:text-st-dark hover:bg-slate-50'
               }`}
            >
              {f === 'all' ? 'All' : f === 'high' ? 'Strong' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid View */}
      <AnimatePresence mode="popLayout">
        {viewMode === 'grid' ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
          >
            {filteredResults.map((result) => {
              const score = result.hr_override_score ?? result.overall_score;
              return (
                <motion.div 
                  key={result.id}
                  layout
                  whileHover={{ y: -8 }}
                  onClick={() => onSelect(result)}
                  className="group bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-2xl transition-all cursor-pointer flex flex-col justify-between h-[420px]"
                >
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-st-dark font-medium text-2xl group-hover:bg-st-dark group-hover:text-white transition-all shadow-inner">
                        {result.candidate_name.charAt(0)}
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-semibold tabular-nums transition-colors ${
                          score >= 80 ? 'text-st-success' : score >= 60 ? 'text-st-warning' : 'text-st-error'
                        }`}>
                          {score}
                        </div>
                        <div className="text-xs font-medium text-slate-300">{t('score')}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <h4 className="text-base font-semibold text-st-dark leading-tight group-hover:text-st-light transition-colors">{result.candidate_name}</h4>
                       <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                         <Briefcase className="w-3.5 h-3.5 shrink-0" />
                         <span className="truncate">{result.summary.personal_info.experience_years} {t('years')} · {result.summary.personal_info.education_level}</span>
                       </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {result.summary.key_skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-3 py-1.5 bg-slate-50 text-xs font-medium text-slate-400 rounded-lg group-hover:bg-st-light/10 group-hover:text-st-light transition-all">
                          {skill}
                        </span>
                      ))}
                      {result.summary.key_skills.length > 3 && (
                        <span className="px-3 py-1.5 bg-slate-50 text-xs font-medium text-slate-300 rounded-lg">
                          +{result.summary.key_skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                       <Calendar className="w-3.5 h-3.5" />
                       {result.createdAt ? formatRelativeTime(result.createdAt.toDate?.() || result.createdAt) : 'Recently'}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-st-dark group-hover:text-white transition-all shadow-inner">
                       <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm"
          >
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-8 py-5 text-xs font-medium text-slate-400">Candidate Info</th>
                  <th className="px-8 py-5 text-xs font-medium text-slate-400">Education & Exp</th>
                  <th className="px-8 py-5 text-xs font-medium text-slate-400">Key Skills</th>
                  <th className="px-8 py-5 text-xs font-medium text-slate-400">AI Score</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.map((result) => {
                  const score = result.hr_override_score ?? result.overall_score;
                  return (
                    <tr 
                      key={result.id} 
                      onClick={() => onSelect(result)}
                      className="group hover:bg-slate-50/50 cursor-pointer transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-st-dark font-medium group-hover:bg-st-dark group-hover:text-white transition-colors">
                             {result.candidate_name.charAt(0)}
                           </div>
                           <div className="font-semibold text-st-dark">{result.candidate_name}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <GraduationCap className="w-3.5 h-3.5 text-st-light" />
                            {result.summary.personal_info.education_level}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                            <Briefcase className="w-3.5 h-3.5 text-st-light" />
                            {result.summary.personal_info.experience_years} {t('years')} exp
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex flex-wrap gap-1">
                            {result.summary.key_skills.slice(0, 2).map((s, i) => (
                              <span key={i} className="px-2 py-1 bg-slate-100 text-xs font-medium uppercase text-slate-400 rounded-lg">
                                {s}
                              </span>
                            ))}
                         </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <div className={`px-4 py-1.5 rounded-full text-xs font-medium tabular-nums shadow-sm ${
                             score >= 80 ? 'bg-st-success text-white' : score >= 60 ? 'bg-st-warning text-st-dark' : 'bg-st-error text-white'
                           }`}>
                             {score}
                           </div>
                           {score >= 90 && <Star className="w-4 h-4 text-st-warning fill-st-warning animate-pulse" />}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-st-dark transition-colors inline-block" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {filteredResults.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300 space-y-4">
          <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center shadow-inner">
             <Search className="w-10 h-10 opacity-20" />
          </div>
          <p className="font-medium text-xs">No candidates found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default TalentLibraryPage;
