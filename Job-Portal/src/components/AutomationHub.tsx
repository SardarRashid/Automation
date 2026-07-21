import { API } from '../lib/apiClient';
import { useState, useEffect } from 'react';
import AutoApplyVisualizer from './AutoApplyVisualizer';
import { UserProfile, JobApplication, ContinuousLoopLog } from '../types';
import {

  Sparkles,
  RefreshCw,
  Clock,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  Globe,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Building,
  ArrowUpRight,
  TrendingUp,
  Sliders,
  Copy,
  Plus
} from 'lucide-react';

interface DiscoveredJob {
  id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  category: string;
  relatedCategoryMatched?: string;
  successScore: number;
  authenticityScore: number;
  interviewProbability: number;
  requirements: string[];
  specialFormRequirements?: string;
  status: 'discovered' | 'applied_silently' | 'needs_approval';
}

interface AutomationHubProps {
  profile: UserProfile;
  applications: JobApplication[];
  setApplications: (apps: JobApplication[]) => void;
  logs: ContinuousLoopLog[];
  setLogs: (logs: ContinuousLoopLog[]) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function AutomationHub({
  profile,
  applications,
  setApplications,
  logs,
  setLogs,
  showToast
}: AutomationHubProps) {
  const [isLoopActive, setIsLoopActive] = useState(false);
  const [discoveredJobs, setDiscoveredJobs] = useState<DiscoveredJob[]>([]);
  const [isSimulatingCycle, setIsSimulatingCycle] = useState(false);

  // Initialize discovered jobs (now starts empty)
  useEffect(() => {
    // Left empty. Jobs are populated via simulation cycle.
  }, []);

  const triggerContinuousCycle = async () => {
    setIsSimulatingCycle(true);
    showToast("Launching background Careers Grounding Scan & Analysis...", "info");

    try {
      const data = await API.triggerAutomationCycle({
          profile,
          currentApplicationsCount: applications.length
        });

      
      // Merge backend logs
      const updatedLogs: ContinuousLoopLog[] = [
        {
          id: `log-${Date.now()}-1`,
          timestamp: new Date().toLocaleTimeString(),
          action: 'Global scan launched',
          details: `Filtering preferred countries: [${profile.preferredCountries.join(', ')}]. Excluded: [${profile.excludedCountries.join(', ')}]`,
          status: 'info'
        },
        ...data.logs.map((l: any, index: number) => ({
          id: `log-${Date.now()}-${index + 2}`,
          timestamp: new Date().toLocaleTimeString(),
          action: l.action,
          details: l.details,
          status: l.status
        })),
        ...logs
      ];

      setLogs(updatedLogs);
      setIsLoopActive(true);
      showToast("Real-time careers audit completed!", "success");

      // Update discovered jobs with actual AI output from backend
      if (data.discoveredJobs && data.discoveredJobs.length > 0) {
        setDiscoveredJobs(data.discoveredJobs);
      }
      
      if (data.appliedJobs && data.appliedJobs.length > 0) {
        setApplications([...data.appliedJobs, ...applications]);
        showToast(`Auto-applied silently to ${data.appliedJobs.length} matched roles!`, "success");
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Automation error: ${err.message}`, "error");
    } finally {
      setIsSimulatingCycle(false);
    }
  };

  const handleApplyDiscovered = (job: DiscoveredJob) => {
    // Check mode
    if (profile.mode === 'fully_auto') {
      showToast(`Applying Silently to ${job.title}...`, "success");
    } else {
      showToast(`Preparing tailored CV variants for ${job.company}...`, "info");
    }

    // Add to the job tracker pipeline
    const newApp: JobApplication = {
      id: `app-${job.id}-${Date.now()}`,
      companyName: job.company,
      jobTitle: job.title,
      status: profile.mode === 'fully_auto' ? 'applied' : 'tailored',
      appliedDate: new Date().toISOString().substring(0, 10),
      matchScore: job.successScore,
      notes: `Customized using Multi-CV variant. Specific Rule applied: ${
        job.country === 'Saudi Arabia' ? 'Emphasized Certificates' :
        job.country === 'UAE' ? 'Emphasized Experience Keywords' :
        job.country === 'Qatar' ? 'Emphasized Cover Letter weight' :
        'Emphasized Skills mapping'
      }`,
      logs: [
        { id: '1', date: new Date().toLocaleTimeString(), text: 'Discovered during global search cycle.' },
        { id: '2', date: new Date().toLocaleTimeString(), text: profile.mode === 'fully_auto' ? 'Silent Auto-Applied successfully' : 'Materials tailored and ready' }
      ],
      successScore: job.successScore,
      authenticity: {
        rating: job.authenticityScore > 90 ? 'safe' : 'suspicious',
        reason: 'Scanned official careers site registry check complete.'
      },
      interviewPrediction: {
        chance: job.interviewProbability > 75 ? 'high' : 'medium',
        probability: job.interviewProbability,
        breakdown: 'Solid ATS score alignment with selected Multi-CV variant.'
      },
      skillGaps: {
        missing: job.requirements.slice(1),
        certs: ['Target regional training recommended'],
        keywords: job.requirements,
        suggestions: ['Acknowledge regional SOP standards in screen templates']
      },
      tailoredCvText: `## ArMan - ${job.category} Specialist\n*Targeted for ${job.company}*\n\n### Core Strengths\n- Inventory audits & SOP checklists\n- Space density optimization`,
      coverLetterText: `Dear Hiring Team at ${job.company},\n\nI am thrilled to submit my tailored credentials for the ${job.title} role in ${job.location}...`
    };

    setApplications([newApp, ...applications]);
    
    // Update local status
    setDiscoveredJobs(discoveredJobs.map(dj => dj.id === job.id ? { ...dj, status: profile.mode === 'fully_auto' ? 'applied_silently' : 'needs_approval' } : dj));
  };

  const getCountryRuleBadge = (country: string) => {
    switch (country) {
      case 'Saudi Arabia':
        return <span className="text-[10px] px-2 py-0.5 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 rounded border border-green-200">Rule: Focus Certificates 📜</span>;
      case 'UAE':
        return <span className="text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded border border-blue-200">Rule: Experience Keywords 💼</span>;
      case 'Qatar':
        return <span className="text-[10px] px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded border border-purple-200">Rule: Deep Cover Letter ✍</span>;
      case 'Kuwait':
        return <span className="text-[10px] px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded border border-amber-200">Rule: Emphasis Skills 🛠</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded">Rule: Standard ATS</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT: Discovered Jobs Board in list format */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Discovered Postings Board (Real-Time Analyzed)</h3>
              <p className="text-xs text-slate-400">Grounded role scanning with deep security & success analysis</p>
            </div>

            <div className="flex gap-2">
              <span className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 rounded-lg font-bold border border-indigo-100 dark:border-indigo-900">
                Mode: {profile.mode === 'fully_auto' ? 'FULLY-AUTO ⚡' : profile.mode === 'semi_auto' ? 'SEMI-AUTO 🔍' : 'MANUAL 🛠'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {discoveredJobs.map((job) => (
              <div
                key={job.id}
                className="p-4 border border-slate-150 dark:border-slate-700 rounded-xl bg-slate-50/30 dark:bg-slate-900/10 space-y-3.5 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-extrabold uppercase rounded">
                        {job.category}
                      </span>
                      {job.relatedCategoryMatched && job.relatedCategoryMatched !== job.category && (
                        <span className="text-[9px] px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-bold rounded">
                          {job.relatedCategoryMatched}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                        <Globe className="h-3.5 w-3.5 text-slate-300" />
                        {job.location}, {job.country}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{job.title}</h4>
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Building className="h-3.5 w-3.5" />
                      {job.company}
                    </span>
                  </div>

                  {/* Indicators / Scoring */}
                  <div className="flex items-center gap-3.5 self-start sm:self-center">
                    {/* Success Score */}
                    <div className="text-center">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Success Score</span>
                      <span className={`text-base font-extrabold ${job.successScore > 85 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {job.successScore}%
                      </span>
                    </div>

                    {/* Authenticity Check */}
                    <div className="text-center border-l border-slate-200 dark:border-slate-700 pl-3">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Authenticity</span>
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-1 mt-0.5">
                        {job.authenticityScore > 90 ? (
                          <>
                            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span className="text-emerald-600 dark:text-emerald-400">Verified</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                            <span className="text-rose-500">Audit Check</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Interview prediction */}
                    <div className="text-center border-l border-slate-200 dark:border-slate-700 pl-3">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Interview Likelihood</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mt-1">
                        {job.interviewProbability}% Likelihood
                      </span>
                    </div>
                  </div>
                </div>

                {/* Country Rule Tag */}
                <div className="flex flex-wrap gap-2 items-center">
                  {getCountryRuleBadge(job.country)}
                  {job.specialFormRequirements && (
                    <span className="text-[10px] px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded border border-rose-200 flex items-center gap-1 animate-pulse">
                      <AlertCircle className="h-3 w-3" />
                      Special Form Warning: {job.specialFormRequirements}
                    </span>
                  )}
                </div>

                {/* Requirements list */}
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ATS Scanned Competency Checklist:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {job.requirements.map((req, rIdx) => (
                      <div key={rIdx} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit action */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400">
                    *Automated cover letters are generated dynamically for high success probabilities.
                  </span>

                  {job.status === 'applied_silently' ? (
                    <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-extrabold rounded-lg flex items-center gap-1.5 border border-emerald-200">
                      <CheckCircle2 className="h-4 w-4" />
                      Applied Silently via Loop
                    </span>
                  ) : job.status === 'needs_approval' ? (
                    <span className="px-3.5 py-1.5 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-extrabold rounded-lg border border-amber-200">
                      Tailored Resume Ready!
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApplyDiscovered(job)}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {profile.mode === 'fully_auto' ? 'One-Click Auto-Apply' : 'Tailor & Prepare'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Continuous Loop Logs & Controllers */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl p-5 shadow-lg border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isLoopActive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
              <span className="font-extrabold text-slate-200 text-[11px] uppercase tracking-wider">Continuous Loop Status</span>
            </div>

            <button
              onClick={() => setIsLoopActive(!isLoopActive)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              title={isLoopActive ? "Pause automation loop" : "Resume automation loop"}
            >
              {isLoopActive ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5" />}
            </button>
          </div>

          <div className="space-y-3 font-sans">
            <button
              onClick={triggerContinuousCycle}
              disabled={isSimulatingCycle}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-slate-950 text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all font-sans"
            >
              {isSimulatingCycle ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Running Grounding Scan...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Trigger Manual Scan Cycle
                </>
              )}
            </button>

            <div className="p-3 bg-slate-950 border border-emerald-950 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 font-mono block">Scraped Feedbacks Loops:</span>
              <p className="text-[11px] text-slate-300 leading-normal">
                Loop analyzes GCC country thresholds automatically. High alignment triggers silent auto-apply in fully auto mode.
              </p>
            </div>
          </div>

          {/* Chronological real-time loop updates */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Live Loop Terminal Logs:</span>
            <div className="bg-black/40 p-3 rounded-xl border border-slate-850 h-56 overflow-y-auto space-y-2.5 scrollbar-thin">
              {logs.map((log) => (
                <div key={log.id} className="text-[10px] leading-relaxed">
                  <span className="text-slate-500">[{log.timestamp}]</span>{' '}
                  <span className="text-indigo-400 font-bold">{log.action}:</span>{' '}
                  <span className="text-slate-300">{log.details}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
