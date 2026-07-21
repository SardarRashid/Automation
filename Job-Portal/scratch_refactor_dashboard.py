import os

filepath = 'src/components/ExecutiveDashboard.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

match_score_trend = """
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
"""

if 'const getProgressData' in content:
    content = content.replace('const getProgressData', match_score_trend + '\n  const getProgressData')

chart_jsx = """
          {/* Success Rate / Match Score Trend */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              AI Match Score Trend
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getMatchScoreTrend()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
"""

target = '</div>\n        </div>\n\n        {/* Main Content Area */}'
if target in content:
    content = content.replace(target, chart_jsx + '\n        ' + target)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("ExecutiveDashboard updated with Match Score Trend Chart.")
