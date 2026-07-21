import React, { useState } from 'react';
import { motion } from 'motion/react';
import { API } from '../lib/apiClient';
import { UserProfile } from '../types';
import { DollarSign, Loader2, Sparkles, AlertCircle, MapPin, Briefcase, ChevronRight, Copy, CheckCircle2 } from 'lucide-react';

interface SalaryPredictorProps {
  profile: UserProfile;
}

export default function SalaryPredictor({ profile }: SalaryPredictorProps) {
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('5');
  
  const [prediction, setPrediction] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const predictSalary = async () => {
    if (!jobTitle.trim() || !location.trim()) {
      setError('Job Title and Location are required.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setPrediction(null);
    
    try {
      const result = await API.predictSalary({ jobTitle: jobTitle, location: location, experience: parseInt(experience), profileData: profile });
      setPrediction(result);
    } catch (err: any) {
      setError(err.message || 'Failed to predict salary');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyScript = () => {
    if (prediction) {
      navigator.clipboard.writeText(prediction.negotiationScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-500" />
              AI Salary Predictor & Negotiator
            </h2>
            <p className="text-sm text-slate-500 mt-1">Estimate market rates and generate personalized negotiation scripts based on your profile.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Input Form */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> Target Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Logistics Coordinator"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Location (City / Country)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Dubai, UAE"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                Years of Relevant Experience
              </label>
              <input
                type="number"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                min="0"
                max="50"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={predictSalary}
              disabled={isLoading || !jobTitle.trim() || !location.trim()}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors mt-4"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isLoading ? 'Analyzing Market Data...' : 'Predict Salary Range'}
            </button>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col">
            {!prediction && !isLoading && (
              <div className="m-auto text-center text-slate-400">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50 text-emerald-500" />
                <p className="text-sm">Enter role details to generate market insights.</p>
              </div>
            )}

            {isLoading && (
              <div className="m-auto text-center text-emerald-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium animate-pulse">Cross-referencing profile skills with regional market data...</p>
              </div>
            )}

            {prediction && !isLoading && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                
                {/* Salary Estimate Banner */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white text-center relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 right-0 p-3 opacity-20"><DollarSign className="w-32 h-32" /></div>
                  <h3 className="text-sm uppercase tracking-widest font-bold opacity-80 mb-2">Estimated Market Range</h3>
                  <div className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                    {prediction.estimatedMinimum.toLocaleString()} - {prediction.estimatedMaximum.toLocaleString()} <span className="text-2xl opacity-80">{prediction.currency}</span>
                  </div>
                  <p className="text-xs opacity-80 mt-2">Based on {experience} years experience in {location} + Profile Match</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Market Demand</span>
                    <span className={`text-lg font-bold ${prediction.marketDemand === 'High' ? 'text-emerald-500' : 'text-amber-500'}`}>{prediction.marketDemand}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Confidence Score</span>
                    <span className="text-lg font-bold text-blue-500">{prediction.confidenceScore}%</span>
                  </div>
                </div>

                {/* Driving Factors */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Value Drivers</h4>
                  <ul className="space-y-2">
                    {prediction.factors.map((factor: string, i: number) => (
                      <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Negotiation Script */}
                <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30 p-5 relative">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold uppercase text-indigo-800 dark:text-indigo-400">Recommended Negotiation Script</h4>
                    <button onClick={handleCopyScript} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-800 flex items-center gap-1">
                      {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed italic">
                    "{prediction.negotiationScript}"
                  </p>
                </div>

              </motion.div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
