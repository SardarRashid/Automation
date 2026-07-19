import os

mst_file = "frontend/src/inventory/components/MobileStockTake.tsx"
with open(mst_file, "r", encoding="utf-8") as f:
    content = f.read()

target = """            ) : records.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs font-mono uppercase tracking-wide">
                No fruit counts saved for this date yet.
              </div>
            ) : ("""

replacement = """            ) : records.length === 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {yesterdayRecords.length > 0 ? (
                  <>
                    <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest px-1 py-1 bg-yellow-500/10 rounded">
                      Previous Available Data (Yesterday)
                    </div>
                    {yesterdayRecords.map((rec, idx) => (
                      <div 
                        key={rec.id || `mob-rec-yest-${idx}`}
                        className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-2 opacity-75 grayscale-[50%]"
                        onClick={() => {
                          setCategoryName(rec.category);
                          setVariety(rec.variety);
                          setSize(rec.size);
                          setStoreNum(rec.location);
                          if (rec.arrivalDate) setArrivalDate(rec.arrivalDate);
                          if (rec.originCountry) setOriginCountry(rec.originCountry);
                          if (rec.grade) setGrade(rec.grade);
                          if (rec.subVariety) setSubVariety(rec.subVariety);
                        }}
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
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-white font-mono">
                            {rec.available} <span className="text-[9px] text-slate-500">Left</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs font-mono uppercase tracking-wide">
                    No fruit counts saved for this date or yesterday yet.
                  </div>
                )}
              </div>
            ) : ("""

content = content.replace(target, replacement)

with open(mst_file, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated MobileStockTake.tsx successfully!")
