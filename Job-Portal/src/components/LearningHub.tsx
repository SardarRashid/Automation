import React, { useState } from 'react';
import { motion } from 'motion/react';
import { API } from '../lib/apiClient';
import { UserProfile, RejectionLearning, PortfolioEntry } from '../types';
import { Sparkles, Award, FileText, CheckCircle2, RefreshCw, AlertTriangle, Trash2, Check, Copy, BookOpen, Loader2, Map } from 'lucide-react';

interface LearningHubProps {
  profile: UserProfile;
  rejections: RejectionLearning[];
  setRejections: (rejections: RejectionLearning[]) => void;
  portfolio: PortfolioEntry[];
  setPortfolio: (portfolio: PortfolioEntry[]) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function LearningHub({
  profile,
  rejections,
  setRejections,
  portfolio,
  setPortfolio,
  showToast
}: LearningHubProps) {
  const [selectedCategory, setSelectedCategory] = useState('Storekeeper');
  const [isGeneratingPortfolio, setIsGeneratingPortfolio] = useState(false);
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);
  const [learningPath, setLearningPath] = useState<any>(null);

  const handleGeneratePortfolio = async () => {
    setIsGeneratingPortfolio(true);
    showToast(`Generating operational project portfolio for ${selectedCategory}...`, "info");

    try {
      const promptContext = `Generate a list of 2 custom professional operational projects for ${selectedCategory}. Return JSON strictly: {"portfolio": [{"title": "...", "description": "...", "metrics": "...", "technologies": "..."}]}`;
      const data = await API.generateCvVariant({ profileData: profile, variantName: promptContext, targetRole: selectedCategory });
      
      let newProjects: PortfolioEntry[] = [];
      if (data.portfolio && Array.isArray(data.portfolio)) {
        newProjects = data.portfolio.map((p: any, i: number) => ({
          id: `p-${Date.now()}-${i}`,
          title: p.title || 'Operational Project',
          category: selectedCategory,
          description: p.description || '',
          metrics: p.metrics || '',
          technologies: p.technologies || ''
        }));
      } else {
        // Fallback dummy data if AI doesn't return exact struct
        newProjects = [
          {
            id: `p-${Date.now()}-1`,
            title: `${selectedCategory} Process Optimization`,
            category: selectedCategory,
            description: 'Implemented an optimized workflow reducing turnaround time.',
            metrics: 'Saved 15 hours weekly.',
            technologies: 'Standard Operating Procedures'
          }
        ];
      }
      
      setPortfolio([...newProjects, ...portfolio]);
      showToast("Portfolio projects generated successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to generate portfolio", "error");
    } finally {
      setIsGeneratingPortfolio(false);
    }
  };

  const handleGenerateLearningPath = async () => {
    setIsGeneratingPath(true);
    showToast(`Generating personalized learning path for ${selectedCategory}...`, "info");

    try {
      const data = await API.generateLearningPath({ targetRole: selectedCategory, currentProfile: profile });
      setLearningPath(data);
      showToast("Learning path generated!", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to generate learning path", "error");
    } finally {
      setIsGeneratingPath(false);
    }
  };

  const removePortfolio = (id: string) => {
    setPortfolio(portfolio.filter(p => p.id !== id));
  };

  const removeRejection = (id: string) => {
    setRejections(rejections.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-500" />
            AI Learning & Portfolio Hub
          </h2>
          <p className="text-sm text-slate-500 mt-1">Convert rejected applications into actionable learning paths and generate impressive portfolio projects.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="Storekeeper">Storekeeper</option>
            <option value="Housekeeping">Housekeeping</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Logistics Coordinator">Logistics Coordinator</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEARNING PATH SECTION */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Map className="w-5 h-5 text-emerald-500" /> Custom Learning Path
            </h3>
            <button 
              onClick={handleGenerateLearningPath}
              disabled={isGeneratingPath}
              className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              {isGeneratingPath ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {learningPath ? 'Regenerate Path' : 'Generate Path'}
            </button>
          </div>

          {!learningPath && !isGeneratingPath && (
            <div className="m-auto text-center py-8">
              <Map className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Generate a step-by-step AI learning schedule to master {selectedCategory}.</p>
            </div>
          )}

          {isGeneratingPath && (
            <div className="m-auto text-center py-8 text-emerald-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium animate-pulse">Designing personalized curriculum...</p>
            </div>
          )}

          {learningPath && !isGeneratingPath && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                <h4 className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400 mb-2">Critical Missing Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {learningPath.criticalMissingSkills?.map((skill: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-white dark:bg-slate-950 text-[10px] font-bold text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-800">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
                {learningPath.learningModules?.map((mod: any, i: number) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 font-bold text-xs">
                      W{mod.week}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{mod.focusArea}</h4>
                      <p className="text-xs text-slate-500 mt-1">{mod.recommendedResource}</p>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-2 block">{mod.estimatedHours} hrs estimated</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* PORTFOLIO SECTION */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Portfolio Projects
            </h3>
            <button 
              onClick={handleGeneratePortfolio}
              disabled={isGeneratingPortfolio}
              className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              {isGeneratingPortfolio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Generate Projects
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {portfolio.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No portfolio projects generated yet.
              </div>
            ) : (
              portfolio.map((p) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 group relative">
                  <button 
                    onClick={() => removePortfolio(p.id)}
                    className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="inline-block px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-bold rounded uppercase tracking-wider mb-2">
                    {p.category}
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight pr-8">{p.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{p.description}</p>
                  
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 w-16 shrink-0">METRICS</span>
                      <span className="text-[10px] text-slate-700 dark:text-slate-300">{p.metrics}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 w-16 shrink-0">TECH</span>
                      <span className="text-[10px] text-slate-700 dark:text-slate-300">{p.technologies}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* REJECTION FEEDBACK LOOP */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-rose-500" /> Rejection Feedback Loops
            </h3>
            <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg">
              {rejections.length} Tracked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rejections.length === 0 ? (
              <div className="col-span-full text-center py-8 text-slate-500 text-sm">
                No rejection feedback currently logged. Agent will auto-populate this from parsed emails.
              </div>
            ) : (
              rejections.map((rej) => (
                <div key={rej.id} className="p-4 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-900/10 relative group">
                  <button 
                    onClick={() => removeRejection(rej.id)}
                    className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[9px] font-mono text-slate-400 block mb-1">{rej.date}</span>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{rej.companyName}</h4>
                  
                  <div className="mt-3 space-y-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">Gap Extracted</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{rej.gapExtracted}</p>
                    </div>
                    <div className="pt-2 border-t border-rose-100 dark:border-rose-900/30">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">AI Optimization Applied</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium flex gap-1.5 items-start mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                        {rej.optimizationAction}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
