import os

mst_file = "frontend/src/inventory/components/MobileStockTake.tsx"
with open(mst_file, "r", encoding="utf-8") as f:
    content = f.read()

target_ui = """
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs">Loading recorded counts...</div>
          ) : records.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs font-mono uppercase tracking-wide">
              No fruit counts saved for this date yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {records.map((rec, idx) => (
"""

replacement_ui = """
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs">Loading recorded counts...</div>
          ) : (
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {records.length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-xs font-mono uppercase tracking-wide border border-dashed border-slate-800 rounded-xl">
                  No fruit counts saved for this date yet.
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Today's Progress</h3>
                  {records.map((rec, idx) => (
                    <div 
                      key={rec.id || `mob-rec-${idx}`}
                      className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{rec.category} • {rec.variety}</span>
                          <span className="bg-slate-800 text-[9px] text-slate-300 px-1 rounded font-mono">
                            #{rec.size}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Store: {rec.location} • Arr: {rec.arrivalDate}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="text-right">
                          <div className="text-emerald-400 font-mono font-black text-sm">{rec.available} <span className="text-[8px] uppercase">Box</span></div>
                          <div className="text-[9px] text-slate-500">Physical Count</div>
                        </div>
                        
                        <button
                          onClick={() => {
                            if (rec.id) handleDeleteRecord(rec.id, `${rec.category} ${rec.variety}`);
                          }}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PENDING ITEMS FROM YESTERDAY */}
              {yesterdayRecords.filter(yRec => !records.some(r => 
                r.category.toLowerCase() === yRec.category.toLowerCase() && 
                r.variety.toLowerCase() === yRec.variety.toLowerCase() && 
                r.size === yRec.size && 
                r.location === yRec.location &&
                (r.originCountry || "") === (yRec.originCountry || "")
              )).length > 0 && (
                <div className="space-y-2 pb-4">
                  <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest px-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Uncounted from Yesterday
                  </h3>
                  {yesterdayRecords.filter(yRec => !records.some(r => 
                    r.category.toLowerCase() === yRec.category.toLowerCase() && 
                    r.variety.toLowerCase() === yRec.variety.toLowerCase() && 
                    r.size === yRec.size && 
                    r.location === yRec.location &&
                    (r.originCountry || "") === (yRec.originCountry || "")
                  )).map((yRec, idx) => (
                    <button 
                      key={`pend-${idx}`}
                      onClick={() => {
                        setCategoryName(yRec.category);
                        setVariety(yRec.variety);
                        setSize(yRec.size || "");
                        setStoreNum(yRec.location);
                        if (yRec.originCountry) setOriginCountry(yRec.originCountry);
                        if (yRec.grade) setGrade(yRec.grade);
                        if (yRec.subVariety) setSubVariety(yRec.subVariety);
                        setArrivalDate(yRec.arrivalDate || "");
                      }}
                      className="w-full text-left bg-slate-900 border border-slate-800 border-dashed hover:border-amber-500/50 p-2.5 rounded-xl flex items-center justify-between gap-2 group transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{yRec.category} • {yRec.variety}</span>
                          <span className="bg-slate-800 text-[9px] text-slate-400 px-1 rounded font-mono">
                            #{yRec.size}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Store: {yRec.location}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-slate-400 font-mono font-black text-sm">{yRec.available} <span className="text-[8px] uppercase">Box</span></div>
                        <div className="text-[9px] text-slate-500">Yesterday's Stock</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
"""

target_end = """                      <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <div className="text-emerald-400 font-mono font-black text-sm">{rec.available} <span className="text-[8px] uppercase">Box</span></div>
                        <div className="text-[9px] text-slate-500">Physical Count</div>
                      </div>
                      
                      <button
                        onClick={() => {
                          if (rec.id) handleDeleteRecord(rec.id, `${rec.category} ${rec.variety}`);
                        }}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>"""

if target_ui in content:
    # We replace from target_ui to target_end
    # First let's find the exact block to replace
    start_index = content.find(target_ui)
    end_index = content.find(target_end, start_index) + len(target_end)
    
    if start_index != -1 and end_index != -1 and end_index > start_index:
        content = content[:start_index] + replacement_ui + "\n          </div>\n        </header>" + content[end_index:]
        with open(mst_file, "w", encoding="utf-8") as f:
            f.write(content)
        print("MobileStockTake updated with Pending Uncounted items feature.")
    else:
        print("Could not find end block")
else:
    print("Could not find target ui")

