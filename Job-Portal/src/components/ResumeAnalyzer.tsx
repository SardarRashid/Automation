import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { API } from '../lib/apiClient';
import { ShieldCheck, AlertCircle, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';

interface ResumeAnalyzerProps {
  profile: UserProfile;
}

export default function ResumeAnalyzer({ profile }: ResumeAnalyzerProps) {
  const [targetJob, setTargetJob] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeResume = async () => {
    if (!profile.masterCvText?.trim()) {
      setError('Your Master CV is empty. Please complete your profile first in the Profile Hub.');
      return;
    }
    if (!targetJob.trim()) {
      setError('Please paste a Target Job Description to analyze against.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      const result = await API.analyzeResume({ cvText: profile.masterCvText, targetJob: targetJob });
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze resume');
    } finally {
      setIsLoading(false);
    }
  };

  const ScoreCircle = ({ score, label }: { score: number, label: string }) => {
    let color = "text-emerald-500";
    if (score < 70) color = "text-rose-500";
    else if (score < 85) color = "text-amber-500";

    return (
      <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
        <div className={`text-3xl font-black ${color}`}>{score}</div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">{label}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              Automated ATS Resume Analyzer
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Your Master CV is automatically loaded from your profile. Paste a job description to instantly check ATS compatibility.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Job Description</label>
              <textarea
                value={targetJob}
                onChange={(e) => setTargetJob(e.target.value)}
                placeholder="Paste the job description here for a tailored ATS match score..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm h-48 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={analyzeResume}
              disabled={isLoading || !targetJob.trim() || !profile.masterCvText?.trim()}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isLoading ? 'Analyzing formatting and ATS readability...' : 'Scan Master CV against Job Description'}
            </button>
            
            {!profile.masterCvText?.trim() && (
              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Warning: No Master CV detected in your profile. Please generate one in the Profile Hub.
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col">
            {!analysis && !isLoading && (
              <div className="m-auto text-center text-slate-400">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Awaiting analysis...</p>
              </div>
            )}

            {isLoading && (
              <div className="m-auto text-center text-emerald-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium animate-pulse">Running ATS simulation algorithms...</p>
              </div>
            )}

            {analysis && !isLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                <div className="grid grid-cols-4 gap-3">
                  <ScoreCircle score={analysis.overallScore} label="Overall" />
                  <ScoreCircle score={analysis.atsScore} label="ATS Match" />
                  <ScoreCircle score={analysis.grammarScore} label="Grammar" />
                  <ScoreCircle score={analysis.readabilityScore} label="Readability" />
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Success Prediction
                  </h4>
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm font-medium border border-emerald-200 dark:border-emerald-800/30">
                    {analysis.successPrediction}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase text-rose-500 mb-2">Missing Keywords</h4>
                    <ul className="space-y-1">
                      {analysis.missingKeywords.map((k: string, i: number) => (
                        <li key={i} className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-1.5 rounded border border-slate-100 dark:border-slate-700">{k}</li>
                      ))}
                      {analysis.missingKeywords.length === 0 && <span className="text-xs text-slate-400">None detected.</span>}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-rose-500 mb-2">Missing Skills</h4>
                    <ul className="space-y-1">
                      {analysis.missingSkills.map((k: string, i: number) => (
                        <li key={i} className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-1.5 rounded border border-slate-100 dark:border-slate-700">{k}</li>
                      ))}
                      {analysis.missingSkills.length === 0 && <span className="text-xs text-slate-400">None detected.</span>}
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-amber-500 mb-2">Suggested Improvements</h4>
                  <ul className="space-y-2">
                    {analysis.suggestedImprovements.map((tip: string, i: number) => (
                      <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
