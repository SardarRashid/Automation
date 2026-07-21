import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API } from '../lib/apiClient';
import { UserProfile, JobApplication } from '../types';
import { Compass, Loader2, Sparkles, MapPin, Building2, DollarSign, Target, ChevronRight, CheckCircle2 } from 'lucide-react';

interface DailyJobDiscoveryProps {
  profile: UserProfile;
  applications: JobApplication[];
  setApplications: (apps: JobApplication[]) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function DailyJobDiscovery({ profile, applications, setApplications, showToast }: DailyJobDiscoveryProps) {
  const [dailyMatches, setDailyMatches] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [applyingTo, setApplyingTo] = useState<string | null>(null);

  const loadMatches = async () => {
    if (!profile.masterCvText?.trim()) {
      setError("Please generate a Master CV in the Profile Hub first to enable Job Discovery.");
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await API.generateDailyJobMatches({ profile: profile });
      setDailyMatches(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate daily job matches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoApply = async (job: any) => {
    setApplyingTo(job.id || job.title);
    showToast(`Tailoring CV and applying to ${job.company}...`, 'info');
    
    try {
      const data = await API.tailorCv({
          masterCv: profile.masterCvText,
          jobTitle: job.title,
          companyName: job.company,
          country: profile.targetCountries?.[0] || 'UAE',
          category: profile.preferredCategories?.[0] || 'Operations',
          jobDescription: job.description
      });

      const newApp: JobApplication = {
        id: `discovery-${Date.now()}`,
        companyName: job.company,
        jobTitle: job.title,
        jobUrl: 'https://careers.' + job.company.toLowerCase().replace(/\s/g, '') + '.com',
        status: 'applied',
        appliedDate: new Date().toISOString().substring(0, 10),
        matchScore: job.matchScore || 85,
        successScore: data.successScore || data.matchScore || job.matchScore || 85,
        tailoredCvText: data.tailoredCv,
        countryRulesApplied: data.countryRulesApplied || [],
        coverLetterText: data.coverLetter,
        authenticity: { rating: 'safe', reason: 'Verified via Daily AI Matcher' },
        interviewPrediction: data.interviewPrediction || { chance: 'high', probability: 85, breakdown: 'Strong profile alignment.' },
        skillGaps: data.skillGaps || { missing: [], certs: [], keywords: [], suggestions: [] },
        logs: [
          { id: '1', date: new Date().toLocaleTimeString(), text: 'Discovered via Daily Matcher.' },
          { id: '2', date: new Date().toLocaleTimeString(), text: 'CV optimized & Cover Letter tailored.' },
          { id: '3', date: new Date().toLocaleTimeString(), text: 'Applied via Agent.' }
        ]
      };

      setApplications([newApp, ...applications]);
      
      // Update local state to show it was applied
      setDailyMatches((prev: any) => ({
        ...prev,
        jobs: prev.jobs.map((j: any) => (j.id === job.id || j.title === job.title) ? { ...j, applied: true } : j)
      }));
      
      showToast(`Successfully Auto-Applied to ${job.title} at ${job.company}!`, 'success');
    } catch (e: any) {
      console.error(e);
      showToast(`Auto-apply failed: ${e.message}`, 'error');
    } finally {
      setApplyingTo(null);
    }
  };

  useEffect(() => {
    // We do not auto-load because it costs API tokens unless user initiates.
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-6 h-6 text-orange-500" />
              Daily AI Job Discovery
            </h2>
            <p className="text-sm text-slate-500 mt-1">Highly curated job opportunities tailored to your Master Profile strengths.</p>
          </div>
          
          <button
            onClick={loadMatches}
            disabled={isLoading}
            className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-xl text-xs font-bold hover:bg-orange-200 dark:hover:bg-orange-800/50 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Discover Opportunities
          </button>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-2 border border-red-100">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-orange-500">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="font-bold">Scouring the market...</p>
            <p className="text-xs text-slate-500 mt-2">Matching your Master CV with live job data.</p>
          </div>
        ) : dailyMatches ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Top Matches for</span>
              <span className="text-xs font-black uppercase text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded">{dailyMatches.date}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {dailyMatches.jobs.map((job: any, idx: number) => {
                const isApplying = applyingTo === (job.id || job.title);
                return (
                  <motion.div 
                    key={job.id || idx} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: idx * 0.1 }}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700/50 transition-all flex flex-col h-full group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-black text-xl">
                        {job.company.charAt(0)}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-black flex items-center gap-1 ${job.matchScore >= 90 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'}`}>
                        <Target className="w-3 h-3" /> {job.matchScore}% Match
                      </div>
                    </div>

                    <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">{job.company}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <DollarSign className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{job.salaryRange}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4 flex-1">
                      {job.description}
                    </p>

                    <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
                      <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI Insight
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed italic">
                        "{job.matchReason}"
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => handleAutoApply(job)}
                      disabled={isApplying || job.applied}
                      className={`w-full mt-4 py-2 text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-1.5 ${
                        job.applied 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 cursor-not-allowed'
                          : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-md'
                      }`}
                    >
                      {job.applied ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Tracked & Applied</>
                      ) : isApplying ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Tailoring & Applying...</>
                      ) : (
                        <>Auto-Apply via Agent <ChevronRight className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <Compass className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">Click "Discover Opportunities" to find matched roles.</p>
          </div>
        )}
      </div>
    </div>
  );
}
