import { API } from '../lib/apiClient';
import { useState } from 'react';
import { JobApplication, PortfolioEntry } from '../types';
import {
  Sparkles,
  FileText,
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Award,
  CheckCircle2,
  Copy,
  Trash2,
  Calendar,
  ExternalLink,
  Send,
  RefreshCw
} from 'lucide-react';
import MarkdownViewer from './MarkdownViewer';


interface JobTrackerDetailsProps {
  activeApp: JobApplication;
  handleUpdateStatus: (id: string, status: JobApplication['status']) => void;
  handleDeleteApplication: (id: string) => void;
  handleCopyText: (text: string, title: string) => void;
  appNotes: string;
  setAppNotes: (val: string) => void;
  handleSaveNotes: (id: string, notes: string) => void;
  newLogText: string;
  setNewLogText: (val: string) => void;
  handleAddLog: (id: string) => void;
}

export default function JobTrackerDetails({
  activeApp,
  handleUpdateStatus,
  handleDeleteApplication,
  handleCopyText,
  appNotes,
  setAppNotes,
  handleSaveNotes,
  newLogText,
  setNewLogText,
  handleAddLog
}: JobTrackerDetailsProps) {
  const [completedSkills, setCompletedSkills] = useState<string[]>([]);

  // Safe reply state variables
  const [hrMessageInput, setHrMessageInput] = useState('');
  const [draftedReply, setDraftedReply] = useState('');
  const [safetyAudits, setSafetyAudits] = useState<string[]>([]);
  const [safetyScore, setSafetyScore] = useState<number>(100);
  const [isDrafting, setIsDrafting] = useState(false);

  const handleDraftSafeReply = async () => {
    if (!hrMessageInput.trim()) return;
    setIsDrafting(true);
    try {
      const data = await API.draftHrReply({
          hrMessage: hrMessageInput,
          jobTitle: activeApp.jobTitle,
          companyName: activeApp.companyName,
          candidateName: "ArMan"
        });

            setDraftedReply(data.draftedReply || '');
      setSafetyAudits(data.safetyAudits || []);
      setSafetyScore(data.safetyScore || 100);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDrafting(false);
    }
  };

  const toggleSkillCompleted = (skill: string) => {
    if (completedSkills.includes(skill)) {
      setCompletedSkills(completedSkills.filter(s => s !== skill));
    } else {
      setCompletedSkills([...completedSkills, skill]);
    }
  };

  const getInterviewPredictionBadge = (prediction?: string) => {
    switch (prediction) {
      case 'high_likelihood':
        return <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-full font-bold border border-emerald-200">High Likelihood 🚀</span>;
      case 'medium_likelihood':
        return <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 rounded-full font-bold border border-amber-200 font-sans">Medium Likelihood 📈</span>;
      case 'action_required':
        return <span className="text-xs px-2.5 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-full font-bold border border-rose-200 animate-pulse">Action Required ⚠</span>;
      default:
        return <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">Uncertain 🔍</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
      
      {/* Detailed Header */}
      <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{activeApp.companyName}</span>
            {activeApp.jobUrl && (
              <a href={activeApp.jobUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">{activeApp.jobTitle}</h3>
        </div>

        <div className="flex items-center gap-3.5">
          {/* Status changer dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-semibold">Status:</span>
            <select
              value={activeApp.status}
              onChange={(e) => handleUpdateStatus(activeApp.id, e.target.value as JobApplication['status'])}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="tailored">Tailored</option>
              <option value="applied">Applied</option>
              <option value="interviewing">Interviewing</option>
              <option value="offered">Offered</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Delete Application */}
          <button
            onClick={() => handleDeleteApplication(activeApp.id)}
            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
            title="Remove Application"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Main Detail Content Grid */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-y-auto max-h-[600px]">
        
        {/* Left column: Materials, answers, scoring, portfolio */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* ADVANCED AI ANALYTICS HEADER WIDGET */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-700 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* SUCCESS SCORE */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Success Score</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-extrabold ${activeApp.successScore && activeApp.successScore > 85 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {activeApp.successScore || 75}%
                </span>
                <span className="text-[9px] text-slate-400 font-medium">ATS Score</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1">
                <div
                  className={`h-1 rounded-full ${activeApp.successScore && activeApp.successScore > 85 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${activeApp.successScore || 75}%` }}
                />
              </div>
            </div>

            {/* AUTHENTICITY AUDIT */}
            <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 sm:pl-4">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Authenticity Check</span>
              <div className="flex items-center gap-1.5 mt-1">
                {activeApp.authenticity?.rating === 'safe' ? (
                  <>
                    <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Verified Posting</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Neutral Audit</span>
                  </>
                )}
              </div>
              <span className="text-[9px] text-slate-400 block font-medium">Anti-spam scam security guard</span>
            </div>

            {/* INTERVIEW LIKELIHOOD */}
            <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 sm:pl-4">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Interview Prediction</span>
              <div className="mt-1">
                {getInterviewPredictionBadge(activeApp.interviewPrediction?.chance)}
              </div>
              <span className="text-[9px] text-slate-400 block font-medium">Predictive pipeline analytics</span>
            </div>
          </div>

          {/* TAILORED PORTFOLIO TRANSLATIONS */}
          {activeApp.portfolioEntries && activeApp.portfolioEntries.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-700 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-indigo-500" />
                Appended Portfolio Case Studies
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeApp.portfolioEntries.map((p) => (
                  <div key={p.id} className="p-3 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/50 rounded-xl space-y-1.5">
                    <h5 className="font-bold text-slate-900 dark:text-white text-xs">{p.title}</h5>
                    <p className="text-[10px] text-slate-500 leading-normal">{p.description}</p>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded border border-indigo-100/30 text-[10px] font-bold text-emerald-600">
                      Metrics: {p.metrics}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CV & Cover letter tabs */}
          {activeApp.tailoredCvText ? (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-700">Tailored Resume & Assets</h4>
              
              <div className="flex gap-2.5">
                <button
                  onClick={() => handleCopyText(activeApp.tailoredCvText || "", "Custom Resume")}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Custom CV
                </button>
                {activeApp.coverLetterText && (
                  <button
                    onClick={() => handleCopyText(activeApp.coverLetterText || "", "Custom Cover Letter")}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Cover Letter
                  </button>
                )}
              </div>

              {activeApp.countryRulesApplied && activeApp.countryRulesApplied.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {activeApp.countryRulesApplied.map((rule, idx) => (
                    <span key={idx} className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-[10px] font-bold rounded flex items-center gap-1 border border-amber-200 dark:border-amber-800/50">
                      <Sparkles className="h-3 w-3" />
                      {rule} Applied
                    </span>
                  ))}
                </div>
              )}

              <div className="p-4 border border-slate-150 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/45 max-h-64 overflow-y-auto shadow-inner">
                <MarkdownViewer content={activeApp.tailoredCvText} />
              </div>
            </div>
          ) : (
            <div className="p-5 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 text-xs">
              No tailored resume created for this role yet. Customizations can be added via the scan or auto-apply.
            </div>
          )}

          {/* AI HR AUTO-REPLY & SAFETY CHAT SANDBOX */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              AI Safe HR Auto-Reply Sandbox
            </h4>
            <p className="text-[11px] text-slate-400">
              Received an email or chat from a recruiter? Paste it below to draft an ATS-compliant, strategically safe response (avoiding premature salary talk, keeping terms guarded).
            </p>

            <div className="space-y-3">
              <textarea
                value={hrMessageInput}
                onChange={(e) => setHrMessageInput(e.target.value)}
                className="w-full h-20 p-3 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/40 dark:bg-slate-900/30 text-xs outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed text-slate-700 dark:text-slate-200"
                placeholder="e.g. 'Can you jump on a call and let us know your salary expectations and previous salary history?'"
              />

              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  🛡 Guardrails: No premature salary disclosure • Professional GCC tone
                </span>
                <button
                  onClick={handleDraftSafeReply}
                  disabled={isDrafting || !hrMessageInput.trim()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-md disabled:opacity-55 animate-pulse"
                >
                  {isDrafting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Drafting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Draft Safe Reply
                    </>
                  )}
                </button>
              </div>

              {draftedReply && (
                <div className="p-4 bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/60 rounded-xl space-y-3.5 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4 text-emerald-500 animate-bounce" />
                      Safe Proposed Response (Score: {safetyScore}%)
                    </span>
                    <button
                      onClick={() => handleCopyText(draftedReply, "Safe HR Response")}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 text-[11px] font-bold"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy Draft
                    </button>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-xs leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-line font-medium">
                    {draftedReply}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Safety Checks Enforced:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {safetyAudits.map((audit, idx) => (
                        <div key={idx} className="text-[10px] text-slate-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>{audit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Logs, Gaps checklists, notes */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* INTEGRATED SKILL GAPS CHECKLIST */}
          {activeApp.skillGaps?.missing && activeApp.skillGaps.missing.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-700">Competency Gap Audit Checklist</h4>
              <p className="text-[10px] text-slate-400">Mark off gaps as you acquire/verify certification or experiences:</p>
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-150 dark:border-slate-700">
                {activeApp.skillGaps.missing.map((gap, index) => {
                  const isDone = completedSkills.includes(gap);
                  return (
                    <button
                      key={index}
                      onClick={() => toggleSkillCompleted(gap)}
                      className="w-full text-left flex items-start gap-2 text-[11px] py-1 text-slate-600 dark:text-slate-300 font-medium"
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => {}} // toggled on button click
                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 shrink-0"
                      />
                      <span className={isDone ? 'line-through text-slate-400' : ''}>{gap}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes Textarea */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-700">Internal Application Notes</h4>
            <textarea
              value={appNotes !== '' ? appNotes : activeApp.notes || ''}
              onChange={(e) => {
                setAppNotes(e.target.value);
                handleSaveNotes(activeApp.id, e.target.value);
              }}
              className="w-full h-24 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed text-slate-700 dark:text-slate-200"
              placeholder="Add follow-up notes, referral name, portal password references..."
            />
          </div>

          {/* Logs / Updates list */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-700">Progress Updates & History</h4>
            
            {/* Write new manual update log */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newLogText}
                onChange={(e) => setNewLogText(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
                placeholder="Log updates (e.g. Recieved assessment invitation)..."
              />
              <button
                onClick={() => handleAddLog(activeApp.id)}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
                title="Add log entry"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            {/* Chronological list of updates logs */}
            <div className="bg-slate-50 dark:bg-slate-900/35 border border-slate-200/50 dark:border-slate-700/60 p-4 rounded-xl max-h-48 overflow-y-auto space-y-3.5">
              {activeApp.logs.map(log => (
                <div key={log.id} className="text-xs flex gap-2.5 items-start">
                  <div className="p-1 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                    <Clock className="h-3 w-3" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 block font-mono font-semibold">{log.date}</span>
                    <p className="text-slate-600 dark:text-slate-300 leading-normal">{log.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
