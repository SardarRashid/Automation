import React from 'react';
import { motion } from 'motion/react';
import { Database, Search, Cpu, Send, CheckCircle2, RefreshCw } from 'lucide-react';

interface AutoApplyVisualizerProps {
  isActive: boolean;
}

export default function AutoApplyVisualizer({ isActive }: AutoApplyVisualizerProps) {
  return (
    <div className="bg-slate-900 rounded-2xl p-6 overflow-hidden relative shadow-inner border border-slate-800">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Node 1: Profile Matrix */}
        <div className="flex flex-col items-center gap-2">
          <motion.div 
            animate={{ 
              boxShadow: isActive ? ['0px 0px 0px rgba(99,102,241,0)', '0px 0px 20px rgba(99,102,241,0.5)', '0px 0px 0px rgba(99,102,241,0)'] : 'none'
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400"
          >
            <Database className="w-8 h-8" />
          </motion.div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profile Matrix</span>
        </div>

        {/* Connection 1 */}
        <div className="flex-1 h-0.5 bg-slate-800 relative hidden md:block">
          {isActive && (
            <motion.div 
              initial={{ left: '0%' }}
              animate={{ left: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"
            />
          )}
        </div>

        {/* Node 2: AI Web Scanner */}
        <div className="flex flex-col items-center gap-2">
          <motion.div 
            animate={{ 
              rotate: isActive ? 360 : 0,
              boxShadow: isActive ? ['0px 0px 0px rgba(236,72,153,0)', '0px 0px 20px rgba(236,72,153,0.5)', '0px 0px 0px rgba(236,72,153,0)'] : 'none'
            }}
            transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, boxShadow: { duration: 2, repeat: Infinity, delay: 0.5 } }}
            className="w-16 h-16 rounded-2xl bg-pink-500/20 border border-pink-500/50 flex items-center justify-center text-pink-400"
          >
            <Search className="w-8 h-8" />
          </motion.div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Web Scanner</span>
        </div>

        {/* Connection 2 */}
        <div className="flex-1 h-0.5 bg-slate-800 relative hidden md:block">
          {isActive && (
            <motion.div 
              initial={{ left: '0%' }}
              animate={{ left: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5, ease: 'linear' }}
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-pink-500 rounded-full shadow-[0_0_10px_#ec4899]"
            />
          )}
        </div>

        {/* Node 3: LLM Evaluation */}
        <div className="flex flex-col items-center gap-2">
          <motion.div 
            animate={{ 
              scale: isActive ? [1, 1.1, 1] : 1,
              boxShadow: isActive ? ['0px 0px 0px rgba(16,185,129,0)', '0px 0px 20px rgba(16,185,129,0.5)', '0px 0px 0px rgba(16,185,129,0)'] : 'none'
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400"
          >
            <Cpu className="w-8 h-8" />
          </motion.div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">LLM Eval</span>
        </div>

        {/* Connection 3 */}
        <div className="flex-1 h-0.5 bg-slate-800 relative hidden md:block">
          {isActive && (
            <motion.div 
              initial={{ left: '0%' }}
              animate={{ left: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 1, ease: 'linear' }}
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"
            />
          )}
        </div>

        {/* Node 4: Auto-Submission */}
        <div className="flex flex-col items-center gap-2">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-500 ${isActive ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 border' : 'bg-slate-800 text-slate-600'}`}>
            {isActive ? (
              <motion.div
                animate={{ y: [-2, 2, -2] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Send className="w-8 h-8" />
              </motion.div>
            ) : (
              <CheckCircle2 className="w-8 h-8" />
            )}
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submission</span>
        </div>

      </div>

      {/* Status Overlay */}
      <div className="mt-8 flex items-center justify-center gap-2 text-sm font-bold">
        {isActive ? (
          <>
            <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
            <span className="text-sky-400">Agent Active: Scanning ATS Portals & Executing Matches</span>
          </>
        ) : (
          <span className="text-slate-500">Agent Idle: Waiting for trigger</span>
        )}
      </div>
    </div>
  );
}
