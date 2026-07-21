import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { FolderOpen, FileText, Download, Copy, CheckCircle2, FileJson, Briefcase, ChevronRight } from 'lucide-react';

interface DocumentCenterProps {
  profile: UserProfile;
}

export default function DocumentCenter({ profile }: DocumentCenterProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-sky-500" />
              Document Center
            </h2>
            <p className="text-sm text-slate-500 mt-1">Centralized vault for your Master CV and foundational career documents.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Master CV Document */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-xl text-sky-600 dark:text-sky-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Master CV Core</h3>
                  <p className="text-xs text-slate-500">Source of truth for AI Automation</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleCopy(profile.masterCvText, 'cv')}
                  className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Copy to clipboard"
                >
                  {copiedSection === 'cv' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => handleDownload(profile.masterCvText, 'Master_CV.txt')}
                  className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Download .txt"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-600 dark:text-slate-400 overflow-y-auto max-h-64 whitespace-pre-wrap custom-scrollbar">
              {profile.masterCvText || "No Master CV provided yet. Please set it up in the My Profile tab."}
            </div>
          </motion.div>

          {/* Raw JSON Profile Extract */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                  <FileJson className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Profile Data Extract</h3>
                  <p className="text-xs text-slate-500">Structured JSON for ATS imports</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleCopy(JSON.stringify(profile, null, 2), 'json')}
                  className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Copy to clipboard"
                >
                  {copiedSection === 'json' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => handleDownload(JSON.stringify(profile, null, 2), 'Profile_Data.json')}
                  className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Download .json"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-600 dark:text-slate-400 overflow-y-auto max-h-64 whitespace-pre-wrap custom-scrollbar">
              {JSON.stringify({
                name: profile.name,
                preferredCategories: profile.preferredCategories,
                preferredCountries: profile.preferredCountries,
                automationMode: profile.mode,
                skills: profile.skills
              }, null, 2)}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:border-sky-300 dark:hover:border-sky-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-slate-400 group-hover:text-sky-500 transition-colors" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Generated Cover Letters</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:border-sky-300 dark:hover:border-sky-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400 group-hover:text-sky-500 transition-colors" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Multi-CV Variants</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:border-sky-300 dark:hover:border-sky-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-slate-400 group-hover:text-sky-500 transition-colors" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Certificates & Proofs</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
