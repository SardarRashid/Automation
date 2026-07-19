import React, { useState, useEffect } from "react";
import { ActivityLog } from "../types";
import { getActivityLogs } from "../services/dbService";
import { ClipboardList, RefreshCw, Clock, Tag, User, Layers, Info } from "lucide-react";

interface ProgressLogFeedProps {
  selectedDate: string;
}

export default function ProgressLogFeed({ selectedDate }: ProgressLogFeedProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const allLogs = await getActivityLogs();
      
      // Filter logs that match selectedDate with timezone alignment (local time)
      const filtered = allLogs.filter(log => {
        if (!log.timestamp) return false;
        try {
          const logDate = new Date(log.timestamp);
          const yyyy = logDate.getFullYear();
          const mm = String(logDate.getMonth() + 1).padStart(2, '0');
          const dd = String(logDate.getDate()).padStart(2, '0');
          const localLogDateStr = `${yyyy}-${mm}-${dd}`;
          return localLogDateStr === selectedDate;
        } catch (e) {
          return false;
        }
      });
      
      setLogs(filtered);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error loading progress logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedDate]);

  return (
    <div id="progress-log-feed-container" className="space-y-4">
      {/* Informational Helpful Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 p-4 rounded-2xl flex items-start gap-3">
        <Info className="w-5.5 h-5.5 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide">
            Real-Time Storekeeper operations audit Feed
          </h4>
          <p className="text-xs text-blue-800 leading-relaxed mt-1">
            This live transaction feed displays all recent system events, bulk additions, and mobile/supervisor physical inventory count logging done "in the meantime". Use this monitor screen to verify storekeeper activities in real-time as they count in cold store rooms.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4.5 h-4.5 text-blue-600" />
            <span className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider">
              OPERATIONAL PROGRESS STREAM ({selectedDate})
            </span>
          </div>

          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="text-[10px] font-mono text-slate-400 font-medium">
                Last updated: {lastRefreshed}
              </span>
            )}
            <button
              onClick={loadLogs}
              disabled={loading}
              className="bg-white border border-slate-200 hover:bg-slate-100/80 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
              Refresh Live Feed
            </button>
          </div>
        </div>

        {/* List Content */}
        {loading && logs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
            RETRIEVING AUDIT LOG STREAM...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-mono max-w-md mx-auto space-y-2">
            <Layers className="w-8 h-8 text-slate-300 mx-auto" />
            <h5 className="font-bold uppercase text-slate-700">No events found for this audit date</h5>
            <p className="text-[11px] leading-relaxed">
              When storekeepers submit physical counts via the Handheld Mobile App or Supervisors update values, their transactions will appear here instantly in the meantime.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              // Action specific badges
              let badgeStyle = "";
              let iconBg = "";
              
              switch (log.action) {
                case "create":
                  badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200/50";
                  iconBg = "bg-emerald-500";
                  break;
                case "update":
                  badgeStyle = "bg-blue-50 text-blue-800 border-blue-200/50";
                  iconBg = "bg-blue-500";
                  break;
                case "delete":
                  badgeStyle = "bg-rose-50 text-rose-800 border-rose-200/50";
                  iconBg = "bg-rose-500";
                  break;
                case "bulk_add":
                  badgeStyle = "bg-purple-50 text-purple-800 border-purple-200/50";
                  iconBg = "bg-purple-500";
                  break;
                case "carry_forward":
                  badgeStyle = "bg-amber-50 text-amber-800 border-amber-200/50";
                  iconBg = "bg-amber-500";
                  break;
                default:
                  badgeStyle = "bg-slate-100 text-slate-800 border-slate-200";
                  iconBg = "bg-slate-400";
              }

              const formattedTime = log.timestamp 
                ? new Date(log.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                : "00:00:00";

              return (
                <div key={log.id} className="p-4 sm:p-5 flex gap-4 hover:bg-slate-50/40 transition-colors items-start">
                  {/* Decorative Timeline Indicator */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${iconBg} ring-4 ring-white shadow-sm mt-1.5`} />
                    <div className="w-0.5 h-12 bg-slate-100 mt-2" />
                  </div>

                  {/* Main Content Info */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-wider border uppercase ${badgeStyle}`}>
                        {log.action}
                      </span>
                      
                      <span className="text-[10px] text-slate-405 font-mono flex items-center gap-1 font-bold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formattedTime}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug break-words">
                      {log.description}
                    </p>

                    {log.details && (
                      <div className="bg-slate-950 text-slate-300 font-mono text-[10.5px] p-2 rounded-lg border border-slate-850 whitespace-pre-wrap">
                        {log.details}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
