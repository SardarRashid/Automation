import { API } from './lib/apiClient';
import ExecutiveDashboard from './components/ExecutiveDashboard';

import { useState, useEffect, FormEvent } from 'react';
import {
  DollarSign,
  Briefcase,
  User,
  FileText,
  CheckCircle,
  Plus,
  Search,
  Copy,
  Download,
  ArrowRight,
  Sparkles,
  Clock,
  Trash2,
  ExternalLink,
  AlertCircle,
  Check,
  ChevronDown,
  Layers,
  Eye,
  BookOpen,
  Calendar,
  X,
  ArrowUpRight,
  Send,
  Sliders,
  TrendingUp,
  FileSpreadsheet,
  Mail,
  RefreshCw,
  LogOut,
  Building,
  Fingerprint,
  CheckCircle2,
  Globe,
  Award,
  Settings,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Home,
  Zap,
  Folder
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  CartesianGrid
} from 'recharts';

import { UserProfile, JobApplication, ScreeningQuestion, CompanyInfo, EmailResponse, OpenPosition, RejectionLearning, ContinuousLoopLog, PortfolioEntry } from './types';
import { sampleProfile, sampleApplications } from './sampleData';

// Modular Components
import SettingsPanel from './components/SettingsPanel';
import MultiCvManager from './components/MultiCvManager';
import LearningHub from './components/LearningHub';
import AutomationHub from './components/AutomationHub';
import JobTrackerDetails from './components/JobTrackerDetails';
import MarkdownViewer from './components/MarkdownViewer';
import CompanyPortalScanner from './components/CompanyPortalScanner';
import UserProfileBuilder from './components/UserProfileBuilder';

import CareerCoach from './components/CareerCoach';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import CoverLetterGenerator from './components/CoverLetterGenerator';

import InterviewAssistant from './components/InterviewAssistant';
import SalaryPredictor from './components/SalaryPredictor';

import CompanyIntelligence from './components/CompanyIntelligence';
import DailyJobDiscovery from './components/DailyJobDiscovery';
import DocumentCenter from './components/DocumentCenter';

import OutreachGenerator from './components/OutreachGenerator';
import PerformanceAnalytics from './components/PerformanceAnalytics';





// Safe Firebase auth imports

import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database } from './lib/firebase';

// Initialize Firebase

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');

export default function App() {
  // --- CORE STATE ---
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // New Mobile Sheets State
  const [isToolsSheetOpen, setIsToolsSheetOpen] = useState(false);
  const [isAiSheetOpen, setIsAiSheetOpen] = useState(false);
  const [isInsightsSheetOpen, setIsInsightsSheetOpen] = useState(false);
  const [isYouSheetOpen, setIsYouSheetOpen] = useState(false);
  
  const toolsTabs = ['cv_manager', 'document_center', 'scanner'] as const;
  const aiTabs = ['career_coach', 'resume_analyzer', 'cover_letter', 'interview_assistant', 'salary_predictor', 'outreach'] as const;
  const insightsTabs = ['analytics', 'company_intelligence', 'daily_discovery', 'learning'] as const;
  const youTabs = ['profile', 'settings'] as const;
  
  const closeAllSheets = () => {
    setIsToolsSheetOpen(false);
    setIsAiSheetOpen(false);
    setIsInsightsSheetOpen(false);
    setIsYouSheetOpen(false);
  };

  const [profile, setProfile] = useState<UserProfile>(sampleProfile);

  const [applications, setApplications] = useState<JobApplication[]>(sampleApplications);
  const [rejections, setRejections] = useState<RejectionLearning[]>([]);

  const [automationLogs, setAutomationLogs] = useState<ContinuousLoopLog[]>([]);

  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);

  // --- GOOGLE SIGN-IN & GMAIL RESPONSES STATES ---
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [emailResponses, setEmailResponses] = useState<EmailResponse[]>([]);
  const [isScanningEmails, setIsScanningEmails] = useState(false);

  // --- COMPILATION COMPATIBILITY ---
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyUrl, setNewCompanyUrl] = useState('');

  // --- ONE-CLICK AUTO-APPLY CONSOLE OVERLAY STATES ---
  const [isAutoApplying, setIsAutoApplying] = useState(false);
  const [applyStep, setApplyStep] = useState(0);
  const [applyLogs, setApplyLogs] = useState<string[]>([]);
  const [applyPackage, setApplyPackage] = useState<any | null>(null);

  // Search and filter states for Tracker
  const [trackerSearch, setTrackerSearch] = useState('');
  const [trackerFilter, setTrackerFilter] = useState<string>('all');

  // Loader and note edit states
  const [newLogText, setNewLogText] = useState('');
  const [appNotes, setAppNotes] = useState('');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Notification Toast state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  // --- PERSISTENCE ---
  useEffect(() => {
    if (!isDataLoaded || !googleUser) return;
    const userKey = googleUser.email!.toLowerCase().replace(/[.#$\[\]]/g, "_");
    const syncData = setTimeout(() => {
      set(ref(database, `users/${userKey}/jobPortalData`), {
        profile,
        applications,
        rejections,
        automationLogs,
        portfolio,
        companies,
        emailResponses
      });
    }, 1000);
    return () => clearTimeout(syncData);
  }, [profile, applications, rejections, automationLogs, portfolio, companies, emailResponses, isDataLoaded, googleUser]);

  // Background email sync polling
  useEffect(() => {
    if (!googleToken) return;
    
    // Poll every 5 minutes (300,000 ms)
    const intervalId = setInterval(() => {
      handleScanEmailsWithToken(googleToken, true);
    }, 300000);
    
    return () => clearInterval(intervalId);
  }, [googleToken]);

  // Auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setGoogleUser(user);
        const userKey = user.email!.toLowerCase().replace(/[.#$\[\]]/g, "_");
        get(ref(database, `users/${userKey}/jobPortalData`)).then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.profile) setProfile(data.profile);
            if (data.applications) setApplications(data.applications);
            if (data.rejections) setRejections(data.rejections);
            if (data.automationLogs) setAutomationLogs(data.automationLogs);
            if (data.portfolio) setPortfolio(data.portfolio);
            if (data.companies) setCompanies(data.companies);
            if (data.emailResponses) setEmailResponses(data.emailResponses);
          }
          setIsDataLoaded(true);
        }).catch(e => {
          console.error("Failed to load DB data", e);
          setIsDataLoaded(true);
        });
      } else {
        setIsDataLoaded(true);
        setGoogleUser(null);
        setGoogleToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Toast auto-dismiss handled directly in showToast

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- GOOGLE SIGN-IN HANDLERS ---
  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      if (!token) {
        throw new Error("Unable to obtain Google Access Token.");
      }
      setGoogleUser(result.user);
      setGoogleToken(token);
      showToast(`Welcome ${result.user.displayName || "User"}! Google account linked.`, "success");
      
      // Fetch recruiter replies after login
      setTimeout(() => {
        handleScanEmailsWithToken(token);
      }, 500);
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || "Google authentication failed.", "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await signOut(auth);
      setGoogleUser(null);
      setGoogleToken(null);
      setEmailResponses([]);
      showToast("Google account disconnected.", "info");
    } catch (err: any) {
      console.error(err);
      showToast("Failed to sign out.", "error");
    }
  };

  const handleScanEmailsWithToken = async (token: string, silent: boolean = false) => {
    setIsScanningEmails(true);
    if (!silent) showToast("Reading your latest Gmail responses for recruiter rejections...", "info");

    try {
      const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!listRes.ok) {
        throw new Error(`Gmail API error: ${listRes.status}`);
      }

      const listData = await listRes.json();
      const messages = listData.messages || [];

      if (messages.length === 0) {
        setIsScanningEmails(false);
        if (!silent) showToast("No emails found in mailbox.", "info");
        return;
      }

      // Read snippets
      const emailDetailPromises = messages.map(async (msg: any) => {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!detailRes.ok) return null;
        const detail = await detailRes.json();

        const headers = detail.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

        return {
          id: msg.id,
          subject,
          from,
          date,
          snippet: detail.snippet || ''
        };
      });

      const rawEmails = (await Promise.all(emailDetailPromises)).filter(Boolean);

      // Analyze snippets
      const scanRes = await API.scanEmails({
          emails: rawEmails,
          applications: applications
        });

      if (!scanRes.ok) {
        throw new Error("Server analysis failed");
      }

      const analysedEmails: EmailResponse[] = await scanRes.json();
      setEmailResponses(analysedEmails);

      // Convert rejections to feedback loops
      const rejectionEmails = analysedEmails.filter(e => e.sentiment === 'negative');
      if (rejectionEmails.length > 0) {
        const freshLoops: RejectionLearning[] = rejectionEmails.map((e, idx) => ({
          id: `email-rej-${Date.now()}-${idx}`,
          companyName: e.companyName || 'Corporate Recruiter',
          originalFeedback: e.summary || 'Positions closed.',
          gapExtracted: e.actionRequired || 'Regional work permit audit required',
          optimizationAction: 'Appended standard GCC residency & active visa status declaration to CV.',
          date: e.date ? e.date.substring(0, 11) : new Date().toLocaleDateString()
        }));
        setRejections([...freshLoops, ...rejections]);
        showToast(`Harvested ${freshLoops.length} feedback loops from rejected emails!`, "success");
      } else {
        showToast("Inbox checked. No negative or missing certificate flags found.", "success");
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Sync failed: ${err.message}`, "error");
    } finally {
      setIsScanningEmails(false);
    }
  };

  // --- JOB TRACKER EVENT HANDLERS ---
  const handleUpdateStatus = (id: string, newStatus: JobApplication['status']) => {
    const updated = applications.map(app => {
      if (app.id === id) {
        const text = `Updated status manually from "${app.status}" to "${newStatus}".`;
        return {
          ...app,
          status: newStatus,
          logs: [{ id: `log-${Date.now()}`, date: new Date().toLocaleTimeString(), text }, ...app.logs]
        };
      }
      return app;
    });
    setApplications(updated);
    showToast(`Status updated to ${newStatus}!`, "success");
  };

  const handleDeleteApplication = (id: string) => {
    if (window.confirm("Remove this job tracker permanently?")) {
      setApplications(applications.filter(app => app.id !== id));
      setSelectedAppId(null);
      showToast("Application removed.", "info");
    }
  };

  const handleCopyText = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${title} copied to clipboard!`, "success");
  };

  const handleSaveNotes = (id: string, notes: string) => {
    setApplications(applications.map(app => app.id === id ? { ...app, notes } : app));
  };

  const handleAddLog = (id: string) => {
    if (!newLogText.trim()) return;
    const logItem = {
      id: `log-manual-${Date.now()}`,
      date: new Date().toLocaleTimeString(),
      text: newLogText.trim()
    };
    setApplications(applications.map(app => app.id === id ? { ...app, logs: [logItem, ...app.logs] } : app));
    setNewLogText('');
    showToast("Update logged successfully", "success");
  };

  // --- RECHARTS CALCULATIONS ---
  const getStatusChartData = () => {
    const statusCounts = { tailored: 0, applied: 0, interviewing: 0, offered: 0, rejected: 0 };
    applications.forEach(app => {
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }
    });

    return [
      { name: 'Tailored', value: statusCounts.tailored, color: '#f59e0b' },
      { name: 'Applied', value: statusCounts.applied, color: '#3b82f6' },
      { name: 'Interview', value: statusCounts.interviewing, color: '#a855f7' },
      { name: 'Offered', value: statusCounts.offered, color: '#10b981' },
      { name: 'Rejected', value: statusCounts.rejected, color: '#64748b' }
    ];
  };

  // --- SEARCH AND FILTER FILTERING ---
  const filteredApps = applications.filter(app => {
    const matchesSearch = app.companyName.toLowerCase().includes(trackerSearch.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(trackerSearch.toLowerCase());
    const matchesFilter = trackerFilter === 'all' || app.status === trackerFilter;
    return matchesSearch && matchesFilter;
  });

  const activeApp = applications.find(app => app.id === selectedAppId);

  // Stats
  const totalApplied = applications.filter(a => a.status === 'applied' || a.status === 'interviewing').length;
  const interviewingCount = applications.filter(a => a.status === 'interviewing').length;
  const successAvg = Math.round(applications.reduce((acc, a) => acc + (a.successScore || 70), 0) / (applications.length || 1));

  const copyBookmarklet = () => {
    const scriptText = `javascript:(function(){const t=window.getSelection().toString(),j=document.title,u=window.location.href;navigator.clipboard.writeText(JSON.stringify({title:j,url:u,desc:t}));alert('Job specs logged to hyper-agent clipboard!');})();`;
    navigator.clipboard.writeText(scriptText);
    showToast("Bookmarklet script copied! Paste as a browser bookmark url.", "success");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* Toast Alert Queue */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`pointer-events-auto px-4 py-2.5 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 ${
                toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' :
                toast.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900' :
                'bg-blue-50 dark:bg-blue-950/90 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-500" />}
              {toast.type === 'info' && <AlertCircle className="h-4 w-4 text-blue-500" />}
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-950 dark:text-white flex items-center gap-1.5">
              Hyper-Automation Job Agent
              <span className="text-[9px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold rounded">PRO v2.5</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Candidate: {profile.name} • Active Loop Engine</p>
          </div>
        </div>

        {/* Desktop Tab Selector — 5 grouped items instead of 7+settings */}
        <nav className="hidden xl:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'automation'
                ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            Automate
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'tracker'
                ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            Tracker
          </button>
          {/* AI ASSISTANTS */}
          <div className="relative">
            <button
              onClick={() => { const v = !isAiSheetOpen; closeAllSheets(); setIsAiSheetOpen(v); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                aiTabs.includes(activeTab as any)
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              AI Agents <ChevronDown className="h-3 w-3" />
            </button>
            {isAiSheetOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1.5 z-50">
                {[
                  { id: 'career_coach', label: 'Career Coach', icon: Sparkles },
                  { id: 'resume_analyzer', label: 'Resume Analyzer', icon: FileText },
                  { id: 'cover_letter', label: 'Cover Letter Gen', icon: FileText },
                  { id: 'interview_assistant', label: 'Interview Prep', icon: User },
                  { id: 'salary_predictor', label: 'Salary Predictor', icon: DollarSign },
                  { id: 'outreach', label: 'Outreach Gen', icon: Mail },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); closeAllSheets(); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                  >
                    {item.icon && <item.icon className="h-3.5 w-3.5 text-indigo-500" />}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INSIGHTS */}
          <div className="relative">
            <button
              onClick={() => { const v = !isInsightsSheetOpen; closeAllSheets(); setIsInsightsSheetOpen(v); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                insightsTabs.includes(activeTab as any)
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              Insights <ChevronDown className="h-3 w-3" />
            </button>
            {isInsightsSheetOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1.5 z-50">
                {[
                  { id: 'analytics', label: 'Performance', icon: TrendingUp },
                  { id: 'company_intelligence', label: 'Company Intel', icon: Globe },
                  { id: 'daily_discovery', label: 'Daily Discovery', icon: Zap },
                  { id: 'learning', label: 'Learning & Portfolios', icon: BookOpen },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); closeAllSheets(); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                  >
                    {item.icon && <item.icon className="h-3.5 w-3.5 text-indigo-500" />}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TOOLS */}
          <div className="relative">
            <button
              onClick={() => { const v = !isToolsSheetOpen; closeAllSheets(); setIsToolsSheetOpen(v); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                toolsTabs.includes(activeTab as any)
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              Tools <ChevronDown className="h-3 w-3" />
            </button>
            {isToolsSheetOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1.5 z-50">
                {[
                  { id: 'cv_manager', label: 'Multi-CV manager', icon: Layers },
                  { id: 'document_center', label: 'Document Center', icon: Folder },
                  { id: 'scanner', label: 'Company scanner', icon: Building },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); closeAllSheets(); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                  >
                    {item.icon && <item.icon className="h-3.5 w-3.5 text-indigo-500" />}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PROFILE */}
          <div className="relative">
            <button
              onClick={() => { const v = !isYouSheetOpen; closeAllSheets(); setIsYouSheetOpen(v); }}
              className={`p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ${
                youTabs.includes(activeTab as any) ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600' : ''
              }`}
              title="Profile and settings"
            >
              <User className="h-4.5 w-4.5" />
            </button>
            {isYouSheetOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1.5 z-50">
                <button
                  onClick={() => { setActiveTab('profile'); setIsYouSheetOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                >
                  <User className="h-3.5 w-3.5 text-indigo-500" /> My profile
                </button>
                <button
                  onClick={() => { setActiveTab('settings'); setIsYouSheetOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                >
                  <Settings className="h-3.5 w-3.5 text-indigo-500" /> Settings
                </button>
                <div className="h-px bg-slate-200 dark:bg-slate-800 my-1 w-full" />
                <button
                  onClick={() => { handleGoogleSignOut(); setIsYouSheetOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-500" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Main container wrapper */}
      <main className="max-w-7xl w-full mx-auto p-6 flex-1 flex flex-col gap-8">
        


        <AnimatePresence mode="wait">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
              <ExecutiveDashboard 
                applications={applications} 
                profile={profile} 
                automationLogs={automationLogs} 
              />
            )}
  
            
            {activeTab === 'career_coach' && (
              <CareerCoach profile={profile} />
            )}

            {activeTab === 'resume_analyzer' && (
              <ResumeAnalyzer profile={profile} />
            )}

            {activeTab === 'cover_letter' && (
              <CoverLetterGenerator profile={profile} />
            )}

            
            {activeTab === 'interview_assistant' && (
              <InterviewAssistant />
            )}

            {activeTab === 'salary_predictor' && (
              <SalaryPredictor profile={profile} />
            )}

            
            {activeTab === 'company_intelligence' && (
              <CompanyIntelligence profile={profile} />
            )}

            {activeTab === 'daily_discovery' && (
              <DailyJobDiscovery 
                profile={profile} 
                applications={applications}
                setApplications={setApplications}
                showToast={showToast}
              />
            )}

            {activeTab === 'document_center' && (
              <DocumentCenter profile={profile} />
            )}

            
            {activeTab === 'outreach' && (
              <OutreachGenerator profile={profile} />
            )}

            {activeTab === 'analytics' && (
              <PerformanceAnalytics applications={applications} profile={profile} />
            )}

            {/* AI AUTOMATION AGENT HUB */}
          {activeTab === 'automation' && (
            <motion.div
              key="automation"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <AutomationHub
                profile={profile}
                applications={applications}
                setApplications={setApplications}
                logs={automationLogs}
                setLogs={setAutomationLogs}
                showToast={showToast}
              />
            </motion.div>
          )}

          {/* FLOWCV MULTI-CV MANAGER */}
          {activeTab === 'cv_manager' && (
            <motion.div
              key="cv_manager"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <MultiCvManager
                profile={profile}
                setProfile={setProfile}
                showToast={showToast}
              />
            </motion.div>
          )}

          {/* LEARNING & PORTFOLIO HUB */}
          {activeTab === 'learning' && (
            <motion.div
              key="learning"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <LearningHub
                profile={profile}
                rejections={rejections}
                setRejections={setRejections}
                portfolio={portfolio}
                setPortfolio={setPortfolio}
                showToast={showToast}
              />
            </motion.div>
          )}

          {/* APPLICATION TRACKING TAB */}
          {activeTab === 'tracker' && (
            <motion.div
              key="tracker"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left application board index */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="space-y-3.5">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <input
                        type="text"
                        value={trackerSearch}
                        onChange={(e) => setTrackerSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Search trackers..."
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-400 uppercase">Status filter:</span>
                      <select
                        value={trackerFilter}
                        onChange={(e) => setTrackerFilter(e.target.value)}
                        className="bg-transparent border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 outline-none text-slate-600 dark:text-slate-300"
                      >
                        <option value="all">All Portals</option>
                        <option value="tailored">Tailored</option>
                        <option value="applied">Applied</option>
                        <option value="interviewing">Interviewing</option>
                        <option value="offered">Offered</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {filteredApps.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        No trackers match selection. Try setting active loop scan.
                      </div>
                    ) : (
                      filteredApps.map((app) => (
                        <div
                          key={app.id}
                          onClick={() => {
                            setSelectedAppId(app.id);
                            setAppNotes(app.notes || '');
                          }}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedAppId === app.id
                              ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-400 dark:border-indigo-900'
                              : 'bg-slate-50/30 dark:bg-slate-900/10 border-slate-150 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="truncate">
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase block">{app.companyName}</span>
                              <h5 className="font-extrabold text-slate-900 dark:text-white text-xs truncate mt-0.5">{app.jobTitle}</h5>
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              app.status === 'tailored' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30' :
                              app.status === 'applied' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30' :
                              app.status === 'interviewing' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/30' :
                              app.status === 'offered' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30' :
                              'bg-slate-100 text-slate-600 dark:bg-slate-800'
                            }`}>
                              {app.status}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-300" />
                              {app.appliedDate}
                            </span>
                            {app.successScore && (
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{app.successScore}% Success Match</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right detailed tracker metrics */}
                <div className="lg:col-span-8">
                  {activeApp ? (
                    <JobTrackerDetails
                      activeApp={activeApp}
                      handleUpdateStatus={handleUpdateStatus}
                      handleDeleteApplication={handleDeleteApplication}
                      handleCopyText={handleCopyText}
                      appNotes={appNotes}
                      setAppNotes={setAppNotes}
                      handleSaveNotes={handleSaveNotes}
                      newLogText={newLogText}
                      setNewLogText={setNewLogText}
                      handleAddLog={handleAddLog}
                    />
                  ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-16 text-center border border-slate-200/60 dark:border-slate-800/60 flex flex-col items-center justify-center min-h-[500px]">
                      <Briefcase className="h-16 w-16 text-slate-200 dark:text-slate-700 mb-4 animate-pulse" />
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Select an active tracker</h4>
                      <p className="text-xs text-slate-400 max-w-sm mt-1">
                        Select a job application to review customized resume variants, cover letters, and log screening response timelines.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}

          {/* MY PROFILE TAB */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <UserProfileBuilder
                profile={profile}
                setProfile={setProfile}
                showToast={showToast}
              />
            </motion.div>
          )}

          {/* COMPANY PORTALS SCANNER */}
          {activeTab === 'scanner' && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <CompanyPortalScanner
                profile={profile}
                companies={companies}
                setCompanies={setCompanies}
                applications={applications}
                setApplications={setApplications}
                showToast={showToast}
              />
            </motion.div>
          )}

          {/* SETTINGS PANEL TAB */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <SettingsPanel
                profile={profile}
                setProfile={setProfile}
                showToast={showToast}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 dark:border-slate-800/60 py-4 px-6 text-center text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 mt-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>ArMan's Job Automation Assistant</span>
        <div className="flex gap-4">
          <button onClick={() => showToast("Tip: Set fully auto mode on settings to submit matched roles silently!", "info")} className="hover:text-slate-600 dark:hover:text-slate-300 font-medium">Tips & Best Practices</button>
        </div>
      </footer>

      {/* Mobile bottom tab bar — replaces the old 8-item wrapping pill row */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-800/60 flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-semibold ${
            activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Home className="h-5 w-5" />
          Home
        </button>
        <button
          onClick={() => setActiveTab('automation')}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-semibold ${
            activeTab === 'automation' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Zap className="h-5 w-5" />
          Automate
        </button>
        <button
          onClick={() => setActiveTab('tracker')}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-semibold ${
            activeTab === 'tracker' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Briefcase className="h-5 w-5" />
          Tracker
        </button>
        <button
          onClick={() => { setActiveTab('cv_manager'); closeAllSheets(); }}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-semibold ${
            activeTab === 'cv_manager' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Layers className="h-5 w-5" />
          CVs
        </button>
        <button
          onClick={() => setIsToolsSheetOpen(true)}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-semibold ${
            (isToolsSheetOpen || isYouSheetOpen || isAiSheetOpen || isInsightsSheetOpen) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <ChevronDown className="h-5 w-5" />
          Menu
        </button>
      </nav>

      {/* Mobile slide-up sheet: Menu */}
      <AnimatePresence>
        {(isToolsSheetOpen || isYouSheetOpen || isAiSheetOpen || isInsightsSheetOpen) && (
          <>
            <motion.div
              key="menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAllSheets}
              className="xl:hidden fixed inset-0 z-50 bg-slate-950/40"
            />
            <motion.div
              key="menu-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-2xl border-t border-slate-200 dark:border-slate-800 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] max-h-[85vh] overflow-y-auto"
            >
              <div className="w-8 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />
              
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">AI Agents</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { id: 'career_coach', label: 'Career Coach', icon: Sparkles },
                  { id: 'resume_analyzer', label: 'Resume Analyzer', icon: FileText },
                  { id: 'cover_letter', label: 'Cover Letter', icon: FileText },
                  { id: 'interview_assistant', label: 'Interview Prep', icon: User },
                  { id: 'salary_predictor', label: 'Salary Predictor', icon: DollarSign },
                  { id: 'outreach', label: 'Outreach', icon: Mail },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); closeAllSheets(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 text-left"
                  >
                    {item.icon && <item.icon className="h-4 w-4 text-indigo-500" />}
                    {item.label}
                  </button>
                ))}
              </div>

              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Insights</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { id: 'analytics', label: 'Performance', icon: TrendingUp },
                  { id: 'company_intelligence', label: 'Company Intel', icon: Globe },
                  { id: 'daily_discovery', label: 'Discovery', icon: Zap },
                  { id: 'learning', label: 'Learning', icon: BookOpen },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); closeAllSheets(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 text-left"
                  >
                    {item.icon && <item.icon className="h-4 w-4 text-indigo-500" />}
                    {item.label}
                  </button>
                ))}
              </div>

              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tools & Profile</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => { setActiveTab('cv_manager'); closeAllSheets(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 text-left"
                >
                  <Layers className="h-4 w-4 text-indigo-500" /> CV Manager
                </button>
                <button
                  onClick={() => { setActiveTab('document_center'); closeAllSheets(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 text-left"
                >
                  <Folder className="h-4 w-4 text-indigo-500" /> Documents
                </button>
                <button
                  onClick={() => { setActiveTab('scanner'); closeAllSheets(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 text-left"
                >
                  <Building className="h-4 w-4 text-indigo-500" /> Scanner
                </button>
                <button
                  onClick={() => { setActiveTab('profile'); closeAllSheets(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 text-left"
                >
                  <User className="h-4 w-4 text-indigo-500" /> Profile
                </button>
                <button
                  onClick={() => { setActiveTab('settings'); closeAllSheets(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 text-left"
                >
                  <Settings className="h-4 w-4 text-indigo-500" /> Settings
                </button>
                <button
                  onClick={() => { handleGoogleSignOut(); closeAllSheets(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-xs font-semibold text-rose-600 dark:text-rose-400 text-left"
                >
                  <LogOut className="h-4 w-4 text-rose-500" /> Sign Out
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>



    </div>
  );
}
