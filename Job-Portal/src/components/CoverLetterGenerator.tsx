import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { API } from '../lib/apiClient';
import { UserProfile } from '../types';
import { FileText, Loader2, Sparkles, AlertCircle, Copy, CheckCircle2 } from 'lucide-react';

interface CoverLetterGeneratorProps {
  profile: UserProfile;
}

export default function CoverLetterGenerator({ profile }: CoverLetterGeneratorProps) {
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState('Professional');
  const [coverLetter, setCoverLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generateCoverLetter = async () => {
    if (!profile.masterCvText?.trim()) {
      setError('Your Master CV is empty. Please complete your profile first in the Profile Hub.');
      return;
    }
    if (!companyName.trim() || !jobDescription.trim()) {
      setError('Please provide both Company Name and Job Description.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setCoverLetter('');
    try {
      const result = await API.generateCoverLetter({ 
        profile: profile, 
        jobDescription: jobDescription, 
        companyName: companyName,
        tone: tone
      });
      setCoverLetter(result.coverLetterText);
    } catch (err: any) {
      setError(err.message || 'Failed to generate cover letter');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tones = ['Professional', 'Executive', 'Creative', 'Short & Direct'];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-500" />
              AI Cover Letter Generator
            </h2>
            <p className="text-sm text-slate-500 mt-1">Generate highly tailored cover letters instantly based on your Master Profile.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp, Google, Logistics Co"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm h-48 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Tone & Style</label>
              <div className="grid grid-cols-2 gap-2">
                {tones.map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition ${
                      tone === t 
                        ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={generateCoverLetter}
              disabled={isLoading || !companyName.trim() || !jobDescription.trim() || !profile.masterCvText?.trim()}
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isLoading ? 'Drafting Cover Letter...' : 'Generate Cover Letter'}
            </button>
            
            {!profile.masterCvText?.trim() && (
              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Warning: No Master CV detected in your profile. Please generate one in the Profile Hub.
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col relative h-full min-h-[400px]">
            {!coverLetter && !isLoading && (
              <div className="m-auto text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Ready to generate.</p>
              </div>
            )}

            {isLoading && (
              <div className="m-auto text-center text-blue-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium animate-pulse">Consulting AI profile metrics...</p>
              </div>
            )}

            {coverLetter && !isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold uppercase text-slate-500">Generated Cover Letter</h4>
                  <button
                    onClick={handleCopy}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors flex items-center gap-1 text-xs font-medium"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                
                <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed overflow-y-auto custom-scrollbar">
                  {coverLetter}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
