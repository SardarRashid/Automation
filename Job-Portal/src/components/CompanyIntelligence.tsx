import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { API } from '../lib/apiClient';
import { UserProfile } from '../types';
import { Building2, Loader2, Sparkles, AlertCircle, Users, BookOpen, ThumbsUp, ThumbsDown, MessageSquare, CheckCircle2 } from 'lucide-react';

interface CompanyIntelligenceProps {
  profile: UserProfile;
}

export default function CompanyIntelligence({ profile }: CompanyIntelligenceProps) {
  const [companyName, setCompanyName] = useState('');
  const [report, setReport] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReport = async () => {
    if (!companyName.trim()) {
      setError('Please enter a company name.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setReport(null);
    
    try {
      const result = await API.getCompanyIntelligence({ companyName: companyName, profile: profile });
      setReport(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate company intelligence report');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-500" />
              AI Company Intelligence
            </h2>
            <p className="text-sm text-slate-500 mt-1">Deep dive into company culture and see tailored Pros/Cons based on your Master Profile.</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Google, Stripe, Local Logistics Co..."
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              onClick={generateReport}
              disabled={isLoading || !companyName.trim()}
              className="px-6 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isLoading ? 'Analyzing...' : 'Generate Report'}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-12 shadow-sm text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200">Gathering Intelligence...</h3>
          <p className="text-sm text-slate-500 mt-2 animate-pulse">Analyzing {companyName} against your Career Preferences and Skills...</p>
        </div>
      )}

      {report && !isLoading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{report.companyName}</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{report.overview}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-indigo-500" /> Culture & Environment
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{report.culture}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-emerald-500" /> Typical Interview Process
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{report.interviewProcess}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-blue-500" /> Recent News
            </h4>
            <ul className="space-y-2">
              {report.recentNews.map((news: string, i: number) => (
                <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>{news}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-6 shadow-sm">
              <h4 className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-4">
                <ThumbsUp className="w-4 h-4" /> Pros (Based on your Profile)
              </h4>
              <ul className="space-y-2">
                {report.pros.map((pro: string, i: number) => (
                  <li key={i} className="text-sm text-emerald-800 dark:text-emerald-200 flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-6 shadow-sm">
              <h4 className="text-xs font-bold uppercase text-rose-700 dark:text-rose-400 flex items-center gap-2 mb-4">
                <ThumbsDown className="w-4 h-4" /> Cons (Based on your Profile)
              </h4>
              <ul className="space-y-2">
                {report.cons.map((con: string, i: number) => (
                  <li key={i} className="text-sm text-rose-800 dark:text-rose-200 flex gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </motion.div>
      )}
    </div>
  );
}
