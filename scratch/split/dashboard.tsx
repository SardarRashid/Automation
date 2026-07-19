{activeSubTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* KPI METRICS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-slate-450 font-bold block text-xs uppercase tracking-wider mb-1">Total Revenue</span>
                  <span className="text-2xl font-bold font-mono text-blue-900">{kpis.revenue.toFixed(2)} SAR</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-700">
                  <TrendingUp className="w-5 h-5 text-[#1E3A8A]" />
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-bold block text-xs uppercase tracking-wider mb-1">Orders Count</span>
                  <span className="text-2xl font-bold font-mono text-slate-800">{kpis.orderCount}</span>
                </div>
                <div className="p-3 bg-green-50 rounded-2xl text-green-700">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-bold block text-xs uppercase tracking-wider mb-1">Retail Stores</span>
                  <span className="text-2xl font-bold font-mono text-slate-800">{kpis.clientCount}</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-bold block text-xs uppercase tracking-wider mb-1">Active Sales Reps</span>
                  <span className="text-2xl font-bold font-mono text-slate-800">{kpis.salesmanCount}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </div>

            {/* VISUAL CHARTS PANELS (RECHARTS) - CONFIGURED WITH ABDULLAH SHARBATLY THEMATIC BRANDING */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Daily Sales Trend Visualizer Section */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs lg:col-span-8 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1 px-2.5 bg-[#1E3A8A] text-white rounded-lg text-xs font-bold uppercase tracking-wider">
                          Official Brand Metric
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-xs text-[#15803D] font-bold">Sharbatly Hub Insights</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-xs mt-1">Daily Revenue & Sales Trend</h3>
                      <p className="text-xs text-slate-400 leading-normal">
                        Earned field bookings mapped across consecutive dispatch calendars in Saudi Riyal (SAR).
                      </p>
                    </div>

                    {/* interactive Toggle Pills */}
                    <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-center border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setChartType('area')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                          chartType === 'area'
                            ? 'bg-white text-[#1E3A8A] shadow-xs'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        📈 Area View
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartType('bar')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                          chartType === 'bar'
                            ? 'bg-white text-[#15803D] shadow-xs'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        📊 Bar View
                      </button>
                    </div>
                  </div>

                  {/* Summary Ribbon Metrics Inside Visual Section */}
                  <div className="grid grid-cols-3 gap-3 bg-gradient-to-r from-blue-50/50 to-emerald-50/50 p-3 rounded-2xl border border-blue-105 mb-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-sm uppercase tracking-wider font-semibold">Peak Day Sales</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {chartsData.dailyTrend.length > 0 
                          ? `${Math.max(...chartsData.dailyTrend.map(d => d.Sales)).toFixed(2)} SAR` 
                          : '0.00 SAR'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-450 block text-sm uppercase tracking-wider font-semibold">Average Booking</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {chartsData.dailyTrend.length > 0 
                          ? `${(chartsData.dailyTrend.reduce((sum, d) => sum + d.Sales, 0) / chartsData.dailyTrend.length).toFixed(2)} SAR`
                          : '0.00 SAR'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-450 block text-sm uppercase tracking-wider font-semibold">Dispatch Trend Line</span>
                      <span className="font-bold text-[#1E3A8A] flex items-center gap-0.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#1E3A8A]" />
                        <span>Active Forecast</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-64 w-full">
                  {chartsData.dailyTrend.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-150 rounded-3xl">
                      No customer invoice stream orders submitted. Complete checkout to test visualization.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'area' ? (
                        <AreaChart data={chartsData.dailyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorSalesSharbatly" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#15803D" stopOpacity={0.01}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            tickLine={false} 
                            tickFormatter={(tick) => {
                              // Elegant day/month format
                              try {
                                const parts = tick.split('-');
                                if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
                              } catch(e) {}
                              return tick;
                            }}
                          />
                          <YAxis 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            tickLine={false} 
                            tickFormatter={(v) => `${v} SAR`}
                          />
                          <Tooltip 
                            formatter={(value: any) => [`${parseFloat(value).toFixed(2)} SAR`, 'Revenue Net']} 
                            contentStyle={{ background: '#1e293b', borderRadius: '16px', border: 'none', color: '#fff', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="Sales" 
                            stroke="#1E3A8A" 
                            strokeWidth={2.5} 
                            fillOpacity={1} 
                            fill="url(#colorSalesSharbatly)" 
                          />
                        </AreaChart>
                      ) : (
                        <BarChart data={chartsData.dailyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            tickLine={false} 
                            tickFormatter={(tick) => {
                              try {
                                const parts = tick.split('-');
                                if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
                              } catch(e) {}
                              return tick;
                            }}
                          />
                          <YAxis 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            tickLine={false} 
                            tickFormatter={(v) => `${v} SAR`}
                          />
                          <Tooltip 
                            formatter={(value: any) => [`${parseFloat(value).toFixed(2)} SAR`, 'Booking Peak']}
                            contentStyle={{ background: '#1e293b', borderRadius: '16px', border: 'none', color: '#fff', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                          />
                          <Bar 
                            dataKey="Sales" 
                            fill="#15803D" 
                            radius={[6, 6, 0, 0]} 
                            maxBarSize={45}
                          />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Category Product Distribution BarChart */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs lg:col-span-4 flex flex-col justify-between">
                <div>
                  <span className="p-1 px-2.5 bg-[#DC2626] text-white rounded-lg text-xs font-bold uppercase tracking-wider inline-block mb-3">
                    Category Mix
                  </span>
                  <h3 className="font-bold text-slate-900 text-xs mb-1">Sales by Catalog</h3>
                  <p className="text-xs text-slate-400 mb-4 leading-normal">Aggregate bookings earned per food product division.</p>
                </div>
                <div className="h-64 w-full">
                  {chartsData.categoryBreakdown.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-150 rounded-3xl">
                      No categorical division data yet
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartsData.categoryBreakdown} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={(v) => `${v} SAR`} />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={8} tickLine={false} width={80} />
                        <Tooltip 
                          formatter={(value: any) => [`${parseFloat(value).toFixed(2)} SAR`, 'Division Sales']}
                          contentStyle={{ background: '#1e293b', borderRadius: '14px', border: 'none', color: '#fff', fontSize: '10px' }} 
                        />
                        <Bar dataKey="Value" fill="#15803D" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* PERFORMANCE LEADERBOARD & RECENT SYSTEM LOGS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Leaderboard panel */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-1">Sales Reps Route Leaderboard</h3>
                <p className="text-xs text-slate-400 mb-4">Revenue bookings & route coverage</p>

                {chartsData.leaderboard.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No sales logs compiled yet.</p>
                ) : (
                  <div className="space-y-3 pt-2">
                    {chartsData.leaderboard.map((rep, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-50">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                          <div>
                            <span className="font-bold text-slate-800 text-xs block">{rep.name}</span>
                            <span className="text-xs text-slate-400 uppercase font-mono">{rep.Orders} orders booked</span>
                          </div>
                        </div>
                        <span className="font-bold text-[#1E3A8A] font-mono text-sm">{rep.Revenue.toFixed(2)} SAR</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sync Audit Logs */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-1">Sheets Sync Pipeline Audit Logs</h3>
                <p className="text-xs text-slate-400 mb-4">Latest synchronization triggers and state logs</p>

                {syncLogs.length === 0 ? (
                  <div className="text-center p-8 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 text-xs">
                    No sync records registered yet in this session.
                  </div>
                ) : (
                  <div className="space-y-2.5 h-60 overflow-y-auto pr-1">
                    {syncLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-slate-50 rounded-xl text-sm font-mono leading-normal shadow-xs border border-slate-100">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span className={log.status === 'SUCCESS' ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                            {log.status}
                          </span>
                        </div>
                        <span className="text-slate-700 block font-sans text-xs">{log.details}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}