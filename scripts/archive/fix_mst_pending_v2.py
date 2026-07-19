import os

mst_file = "frontend/src/inventory/components/MobileStockTake.tsx"
with open(mst_file, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Let's find line 1125 to 1167 and replace it
# 1125: {loading ? (
# 1167: </div>

# The easiest way is to rewrite using replace by looking for the unique string.
content = "".join(lines)

target_ui = """{loading ? (
<div className="py-8 text-center text-slate-500 text-xs">Loading recorded counts...</div>
) : records.length === 0 ? (
<div className="py-8 text-center text-slate-500 text-xs font-mono uppercase tracking-wide">
No fruit counts saved for this date yet.
</div>
) : (
<div className="space-y-2 max-h-56 overflow-y-auto">
{records.map((rec, idx) => (
<div
key={rec.id || `mob-rec-${idx}`}
className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl flex items-center justify-between gap-2"
>
<div>
<div className="flex items-center gap-2">
<span className="text-xs font-bold text-white">{rec.category}  {rec.variety}</span>
<span className="bg-slate-800 text-[9px] text-slate-300 px-1 rounded font-mono">
#{rec.size}
</span>
</div>
<div className="text-[10px] text-slate-500 font-mono mt-0.5">
Store: {rec.location}  Arr: {rec.arrivalDate}
</div>
</div>

<div className="flex items-center gap-2.5 shrink-0">
<div className="text-right">
<div className="text-emerald-400 font-mono font-black text-sm">{rec.available} <span className="text-[8px] uppercase">Box</span></div>
<div className="text-[9px] text-slate-500">Physical Count</div>
</div>
<button
onClick={() => rec.id && handleDeleteRecord(rec.id, rec.variety)}
type="button"
className="p-1.5 bg-red-950/20 text-red-400 hover:bg-red-950/60 rounded-lg transition-colors border border-red-950/30"
>
<Trash2 className="w-3.5 h-3.5" />
</button>
</div>
</div>
))}
</div>
)}"""

# It's better to just splice the lines
start_line = -1
end_line = -1
for i, line in enumerate(lines):
    if "{loading ? (" in line and "Loading recorded counts..." in lines[i+1]:
        start_line = i
    if "</div>" in line and start_line != -1 and i > start_line + 40 and "</div>" in lines[i-1] and ")}</div>" in "".join(lines[i-10:i]).replace(" ", "").replace("\\n", ""):
        # Check carefully, line 1166 is `)}`, 1167 is `</div>`
        if lines[i-1].strip() == ")}":
            end_line = i
            break

if start_line != -1 and end_line != -1:
    new_ui = """
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
                onClick={() => rec.id && handleDeleteRecord(rec.id, rec.variety)}
                type="button"
                className="p-1.5 bg-red-950/20 text-red-400 hover:bg-red-950/60 rounded-lg transition-colors border border-red-950/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
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
        <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest px-1 flex items-center gap-1 mt-4 border-t border-slate-800 pt-3">
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
              document.getElementById("mobile-mode-container")?.scrollTo({ top: 0, behavior: "smooth" });
            }}
            type="button"
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
    lines[start_line:end_line] = [new_ui + "\n"]
    with open(mst_file, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print("MobileStockTake updated with Pending Uncounted items feature.")
else:
    print(f"Could not find exact bounds. Start: {start_line}, End: {end_line}")

