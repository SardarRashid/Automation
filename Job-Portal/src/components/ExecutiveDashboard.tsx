import React from 'react';
import { motion } from 'motion/react';
import {
  Briefcase,
  User,
  CheckCircle,
  Clock,
  Sparkles,
  TrendingUp,
  FileText,
  Calendar,
  AlertCircle,
  Activity,
  Award,
  Bookmark,
  Send,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { JobApplication, UserProfile, ContinuousLoopLog } from '../types';

interface ExecutiveDashboardProps {
  applications: JobApplication[];
  profile: UserProfile;
  automationLogs: ContinuousLoopLog[];
}

export default function ExecutiveDashboard({ applications, profile, automationLogs }: ExecutiveDashboardProps) {
  // KPI Calculations
  const totalApplied = applications.filter(a => a.status !== 'tailored' && a.status !== 'rejected').length;
  const activeApps = applications.filter(a => a.status === 'applied' || a.status === 'interviewing').length;
  const interviews = applications.filter(a => a.status === 'interviewing').length;
  const offers = applications.filter(a => a.status === 'offered').length;
  const rejections = applications.filter(a => a.status === 'rejected').length;
  const savedJobs = applications.filter(a => a.status === 'tailored').length;

  // Mocked AI/Progress metrics (until backend integrated deeply)
  const cvScore = 88;
  const atsScore = 92;
  const careerProgress = 65;

  const getStatusChartData = () => {
    return [
      { name: 'Saved', value: savedJobs, color: '#94a3b8' },
      { name: 'Applied', value: applications.filter(a=>a.status==='applied').length, color: '#3b82f6' },
      { name: 'Interview', value: interviews, color: '#a855f7' },
      { name: 'Offered', value: offers, color: '#10b981' },
      { name: 'Rejected', value: rejections, color: '#ef4444' }
    ];
  };

  
  const getMatchScoreTrend = () => {
    const tailored = applications.filter(a => a.matchScore).slice(-7); 
    if (tailored.length === 0) {
      return [
        { name: 'App 1', score: 65 },
        { name: 'App 2', score: 72 },
        { name: 'App 3', score: 78 },
        { name: 'App 4', score: 85 },
        { name: 'App 5', score: 92 },
      ];
    }
    return tailored.map((app, idx) => ({
      name: app.companyName.substring(0, 8) + '...',
      score: app.matchScore
    }));
  };

  const getProgressData = () => {
    // Mock progression data
    return [
      { month: 'Jan', applications: 4, interviews: 0 },
      { month: 'Feb', applications: 12, interviews: 1 },
      { month: 'Mar', applications: 25, interviews: 3 },
      { month: 'Apr', applications: 18, interviews: 5 },
      { month: 'May', applications: 32, interviews: 8 },
    ];
  };

  const recentActivity = automationLogs.slice(0, 4);

  const kpis = [
    { title: "Apps Sent", value: totalApplied, icon: <Send className="w-4 h-4" />, color: "blue" },
    { title: "Active Apps", value: activeApps, icon: <Activity className="w-4 h-4" />, color: "indigo" },
    { title: "Interviews", value: interviews, icon: <Calendar className="w-4 h-4" />, color: "purple" },
    { title: "Offers", value: offers, icon: <Award className="w-4 h-4" />, color: "emerald" },
    { title: "Rejections", value: rejections, icon: <AlertCircle className="w-4 h-4" />, color: "red" },
    { title: "Saved Jobs", value: savedJobs, icon: <Bookmark className="w-4 h-4" />, color: "slate" }
  ];

  return (
    <motion.div
      key="executive-dashboard"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none">
          <div className="w-full h-full border-[30px] border-indigo-500 rounded-full translate-x-12 translate-y-12 animate-pulse" />
        </div>
        
        <div className="max-w-xl space-y-3.5 relative z-10 mb-6 md:mb-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-semibold text-indigo-300 font-mono">
            <Sparkles className="h-3.5 w-3.5" />
            AI Career OS Active
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">Welcome back, {profile.name.split(' ')[0] || 'Professional'}!</h2>
          <p className="text-sm text-indigo-100/80 leading-relaxed font-sans max-w-lg">
            Your career trajectory is looking strong. You have {interviews} upcoming interviews and your resume ATS score is high. Keep pushing forward.
          </p>
        </div>

        <div className="relative z-10 flex gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 shadow-inner">
            <div className="text-3xl font-black text-white">{cvScore}</div>
            <div className="text-[10px] uppercase tracking-wider text-indigo-200 mt-1 font-bold">CV Score</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 shadow-inner">
            <div className="text-3xl font-black text-emerald-400">{atsScore}%</div>
            <div className="text-[10px] uppercase tracking-wider text-indigo-200 mt-1 font-bold">ATS Match</div>
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-24">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{kpi.title}</span>
              <div className={`p-1.5 rounded-lg bg-${kpi.color}-50 dark:bg-${kpi.color}-500/10 text-${kpi.color}-600 dark:text-${kpi.color}-400`}>
                {kpi.icon}
              </div>
            </div>
            <div className={`text-2xl font-extrabold text-${kpi.color}-600 dark:text-${kpi.color}-400`}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* CHARTS & LISTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recruitment Funnel */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wide flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-500"/> Pipeline Funnel</h4>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getStatusChartData()} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={65} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ background: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                  {getStatusChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Career Progress */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wide flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-500"/> Monthly Progress</h4>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getProgressData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }} />
                <Area type="monotone" dataKey="applications" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorApps)" />
                <Line type="monotone" dataKey="interviews" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* AI Suggestions / Tasks */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm">
          <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wide mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500"/> AI Suggestions & Tasks</h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
              <CheckCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">Prepare for Interview</h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Generate AI mock interview questions for your upcoming Logistics Coordinator screening.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
              <FileText className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">Optimize LinkedIn Headline</h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your headline misses key search terms. Consider adding "Supply Chain" to boost visibility.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm">
          <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wide mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-500"/> Recent Activity</h4>
          <div className="space-y-4">
            {recentActivity.length > 0 ? recentActivity.map((log) => (
              <div key={log.id} className="flex gap-3 relative">
                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{log.action}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{log.details}</p>
                  <span className="text-[9px] font-mono text-slate-400 mt-1 block">{log.timestamp}</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-6 text-slate-400 text-sm">No recent activity found.</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
