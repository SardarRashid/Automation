import React, { useState } from 'react';
import { motion } from 'motion/react';
import { API } from '../lib/apiClient';
import { UserProfile } from '../types';
import { Target, TrendingUp, AlertCircle, Award, BookOpen, Clock, Loader2, RefreshCw } from 'lucide-react';

interface CareerCoachProps {
  profile: UserProfile;
}

interface Roadmap {
  careerRoadmap: string;
  promotionAdvice: string;
  salaryImprovement: string;
  certifications: string[];
  skillGaps: string[];
  industryTrends: string[];
  weeklyGoals: string[];
  monthlyGoals: string[];
}

export default function CareerCoach({ profile }: CareerCoachProps) {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateRoadmap = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await API.generateCareerRoadmap({ profile: profile });
      setRoadmap(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate career roadmap');
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
              <Target className="w-6 h-6 text-indigo-500" />
              AI Career Coach
            </h2>
            <p className="text-sm text-slate-500 mt-1">Get personalized career guidance and skill gap analysis.</p>
          </div>
          <button
            onClick={generateRoadmap}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {roadmap ? 'Regenerate Roadmap' : 'Generate Roadmap'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl mb-6 text-sm flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {!roadmap && !isLoading && !error && (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-slate-900 dark:text-white font-bold">No Active Roadmap</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
              Generate a personalized career progression plan, skill gap analysis, and promotional strategy based on your profile.
            </p>
          </div>
        )}

        {roadmap && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Primary Analysis */}
            <div className="space-y-6 md:col-span-2 lg:col-span-1">
              <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4" /> Career Trajectory
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {roadmap.careerRoadmap}
                </p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4" /> Promotion & Salary Advice
                </h4>
                <div className="space-y-3">
                  <div>
                    <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase">Promotion Strategy</h5>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{roadmap.promotionAdvice}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase mt-3">Salary Improvement</h5>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{roadmap.salaryImprovement}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actionable Lists */}
            <div className="space-y-6 md:col-span-2 lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3 text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-500" /> Skill Gaps
                </h4>
                <ul className="space-y-2">
                  {roadmap.skillGaps.map((gap, i) => (
                    <li key={i} className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2 rounded">{gap}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3 text-sm">
                  <BookOpen className="w-4 h-4 text-blue-500" /> Recommended Certs
                </h4>
                <ul className="space-y-2">
                  {roadmap.certifications.map((cert, i) => (
                    <li key={i} className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2 rounded">{cert}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3 text-sm">
                  <TrendingUp className="w-4 h-4 text-purple-500" /> Industry Trends
                </h4>
                <ul className="space-y-2">
                  {roadmap.industryTrends.map((trend, i) => (
                    <li key={i} className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2 rounded">{trend}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3 text-sm">
                  <Clock className="w-4 h-4 text-rose-500" /> Action Plan
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Weekly Goals</span>
                    <ul className="space-y-1">
                      {roadmap.weeklyGoals.map((g, i) => <li key={i} className="text-[11px] text-slate-600 dark:text-slate-300 flex gap-1"><span className="text-rose-500">•</span> {g}</li>)}
                    </ul>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Monthly Goals</span>
                    <ul className="space-y-1">
                      {roadmap.monthlyGoals.map((g, i) => <li key={i} className="text-[11px] text-slate-600 dark:text-slate-300 flex gap-1"><span className="text-rose-500">•</span> {g}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
