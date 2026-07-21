import React, { useState } from 'react';
import { motion } from 'motion/react';
import { API } from '../lib/apiClient';
import { UserProfile } from '../types';
import { Send, Loader2, Sparkles, Mail, Linkedin, Copy, CheckCircle2, Building2, User } from 'lucide-react';

interface OutreachGeneratorProps {
  profile: UserProfile;
}

export default function OutreachGenerator({ profile }: OutreachGeneratorProps) {
  const [company, setCompany] = useState('');
  const [targetPerson, setTargetPerson] = useState('');
  const [role, setRole] = useState('');
  const [outreachType, setOutreachType] = useState<'email' | 'linkedin'>('email');
  
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generateOutreach = async () => {
    if (!company.trim()) {
      setError('Please enter a target company.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setResult(null);
    setCopied(false);
    
    try {
      if (outreachType === 'email') {
        const res = await API.generateOutreachEmail({ company: company, hiringManager: targetPerson || 'Hiring Manager', profile: profile });
        setResult(res);
      } else {
        const res = await API.generateLinkedInNote({ company: company, targetRole: role || 'Recruiter', profile: profile });
        setResult(res);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate outreach message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-6 h-6 text-fuchsia-500" />
              AI Networking & Outreach
            </h2>
            <p className="text-sm text-slate-500 mt-1">Generate highly personalized cold emails and LinkedIn connection requests.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div className="flex gap-4 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit">
              <button
                onClick={() => setOutreachType('email')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${
                  outreachType === 'email' 
                    ? 'bg-white dark:bg-slate-700 text-fuchsia-600 dark:text-fuchsia-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Mail className="w-4 h-4" /> Cold Email
              </button>
              <button
                onClick={() => setOutreachType('linkedin')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${
                  outreachType === 'linkedin' 
                    ? 'bg-white dark:bg-slate-700 text-[#0a66c2] dark:text-blue-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Linkedin className="w-4 h-4" /> LinkedIn Note
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Target Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. OpenAI, Stripe, Google"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none"
                />
              </div>

              {outreachType === 'email' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> Hiring Manager Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetPerson}
                    onChange={(e) => setTargetPerson(e.target.value)}
                    placeholder="e.g. Sarah Connor or 'Hiring Manager'"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> Target Role / Recruiter Title
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Senior Technical Recruiter"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#0a66c2] outline-none"
                  />
                </div>
              )}

              <button
                onClick={generateOutreach}
                disabled={isLoading || !company.trim()}
                className={`w-full py-3 text-white rounded-xl text-sm font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-2 transition-colors ${
                  outreachType === 'email' ? 'bg-fuchsia-600 hover:bg-fuchsia-500' : 'bg-[#0a66c2] hover:bg-blue-600'
                }`}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isLoading ? 'Drafting Message...' : `Generate ${outreachType === 'email' ? 'Email' : 'LinkedIn Note'}`}
              </button>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-100">
                  {error}
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative flex flex-col min-h-[300px]">
            {!result && !isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                {outreachType === 'email' ? <Mail className="w-12 h-12 mb-3 opacity-20" /> : <Linkedin className="w-12 h-12 mb-3 opacity-20" />}
                <p className="text-sm">Generated message will appear here</p>
              </div>
            ) : isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-fuchsia-500">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="font-bold text-sm">Consulting Career Strategist...</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">
                    {outreachType === 'email' ? 'Email Draft' : 'Connection Note'}
                  </h3>
                  <button 
                    onClick={() => handleCopy(outreachType === 'email' ? `${result.subject}\n\n${result.body}` : result.note)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                
                {outreachType === 'email' ? (
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                      <span className="text-slate-400 mr-2">Subject:</span> {result.subject}
                    </div>
                    <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {result.body}
                    </div>
                    <div className="bg-fuchsia-50 dark:bg-fuchsia-900/10 border border-fuchsia-100 dark:border-fuchsia-900/30 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-400 uppercase mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Strategy Tip
                      </p>
                      <p className="text-xs text-fuchsia-800 dark:text-fuchsia-200">{result.strategyTip}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed relative">
                      {result.note}
                      <div className="absolute bottom-3 right-3 text-[10px] font-bold text-slate-400">
                        {result.characterCount}/300
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
