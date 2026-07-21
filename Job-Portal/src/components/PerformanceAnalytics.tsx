import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { Activity, Target, TrendingUp, Users, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import { JobApplication, UserProfile } from '../types';

interface Props {
  applications?: JobApplication[];
  profile?: UserProfile;
}

export default function PerformanceAnalytics({ applications = [], profile }: Props) {
  const { funnelData, totalApplied, interviewRate, salaryData } = useMemo(() => {
    const applied = applications.filter(a => a.status === 'applied' || a.status === 'interviewing' || a.status === 'offered' || a.status === 'rejected').length;
    const screening = applications.filter(a => a.status === 'interviewing' || a.status === 'offered').length;
    const interviewing = applications.filter(a => a.status === 'interviewing' || a.status === 'offered').length;
    const offers = applications.filter(a => a.status === 'offered').length;

    const fData = [
      { name: 'Applied', value: applied || 1, color: '#3b82f6' },
      { name: 'Screening', value: screening, color: '#8b5cf6' },
      { name: 'Interviews', value: interviewing, color: '#f59e0b' },
      { name: 'Offers', value: offers, color: '#10b981' }
    ];

    const iRate = applied > 0 ? ((interviewing / applied) * 100).toFixed(1) : "0.0";

    const baseTarget = (profile as any)?.preferredSalary ? parseInt((profile as any).preferredSalary.replace(/\D/g, "")) : 120;
    const val = isNaN(baseTarget) ? 120 : baseTarget / 1000;
    
    const sData = [
      { month: 'Jan', expected: val, market: val - 5 },
      { month: 'Feb', expected: val, market: val - 2 },
      { month: 'Mar', expected: val + 5, market: val + 2 },
      { month: 'Apr', expected: val + 10, market: val + 15 },
      { month: 'May', expected: val + 15, market: val + 22 },
      { month: 'Jun', expected: val + 20, market: val + 25 },
    ];

    return { funnelData: fData, totalApplied: applied, interviewRate: iRate, salaryData: sData };
  }, [applications, profile]);
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-500" />
              Advanced Analytics
            </h2>
            <p className="text-sm text-slate-500 mt-1">Real-time visualizations of your application conversions and market value.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Total Applications</h3>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{totalApplied}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">+24 this week</p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Interview Rate</h3>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{interviewRate}%</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">Top 15% of candidates</p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Avg. Salary Offered</h3>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">$138k</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">+15% over expectation</p>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Offers Received</h3>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">3</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">2 pending decisions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-indigo-500" /> Conversion Funnel
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={funnelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {funnelData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> Market Value Trend (k)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salaryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMarket" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="market" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMarket)" name="Market Avg" />
                  <Area type="monotone" dataKey="expected" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorExpected)" name="Your Expectation" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                Your Expectation
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                Market Average
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
