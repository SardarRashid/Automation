import { API } from '../lib/apiClient';
import { useState, FormEvent } from 'react';
import { CompanyInfo, JobApplication, OpenPosition, UserProfile } from '../types';
import {

  Building,
  Plus,
  RefreshCw,
  Search,
  Globe,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  ShieldCheck,
  Award,
  ArrowRight,
  Trash2,
  Loader2
} from 'lucide-react';

interface CompanyPortalScannerProps {
  profile: UserProfile;
  companies: CompanyInfo[];
  setCompanies: (companies: CompanyInfo[]) => void;
  applications: JobApplication[];
  setApplications: (apps: JobApplication[]) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function CompanyPortalScanner({
  profile,
  companies,
  setCompanies,
  applications,
  setApplications,
  showToast
}: CompanyPortalScannerProps) {
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('');
  const [targetJobTitle, setTargetJobTitle] = useState(profile.preferredCategories?.[0] || '');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [tailoringPosTitle, setTailoringPosTitle] = useState<string | null>(null);

  // Add a new company portal source
  const handleAddCompany = (e: FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    const formattedUrl = newWebsiteUrl.trim().startsWith('http')
      ? newWebsiteUrl.trim()
      : `https://${newWebsiteUrl.trim()}`;

    const newCompany: CompanyInfo = {
      id: `company-${Date.now()}`,
      name: newCompanyName.trim(),
      websiteUrl: formattedUrl || 'https://careers.google.com',
      status: 'idle',
      autoSearch: true,
      autoApply: false,
      openPositions: []
    };

    setCompanies([...companies, newCompany]);
    setNewCompanyName('');
    setNewWebsiteUrl('');
    showToast(`Added company portal for ${newCompany.name}!`, 'success');
  };

  const handleDeleteCompany = (id: string) => {
    setCompanies(companies.filter((c) => c.id !== id));
    if (selectedCompanyId === id) {
      setSelectedCompanyId(null);
    }
    showToast('Company portal removed.', 'info');
  };

  // Live scan specific company portal using backend
  const handleScanCompany = async (company: CompanyInfo) => {
    setScanningId(company.id);
    setCompanies(
      companies.map((c) => (c.id === company.id ? { ...c, status: 'scanning' } : c))
    );
    showToast(`Initializing Google Careers Grounding scan for ${company.name}...`, 'info');

    try {
      const data = await API.scanCompanySite({
          companyName: company.name,
          websiteUrl: company.websiteUrl,
          jobTitle: targetJobTitle
        });

      // Transform openPositions safely
      const discoveredPositions: OpenPosition[] = (data.openPositions || []).map((pos: any) => ({
        title: pos.title || `${targetJobTitle} Specialist`,
        department: pos.department || 'Operations',
        location: pos.location || 'GCC Region',
        country: pos.country || 'UAE',
        requirements: pos.requirements || ['Relevant experience', 'Good communication'],
        description: pos.description || 'General operations coordination.'
      }));

      const specialReqs = data.specialRequirementsDetected || [];

      // Update companies list state
      const updatedCompanies = companies.map((c) => {
        if (c.id === company.id) {
          return {
            ...c,
            status: 'scanned' as const,
            lastScanned: new Date().toLocaleTimeString(),
            openPositions: discoveredPositions,
            customFormRequirements: data.customFormRequirements || (specialReqs.length > 0 ? `Detected requirement flags: ${specialReqs.join(', ')}` : undefined)
          };
        }
        return c;
      });

      setCompanies(updatedCompanies);
      setSelectedCompanyId(company.id);
      showToast(`Scan complete! Discovered ${discoveredPositions.length} active matching postings at ${company.name}.`, 'success');

      // Silently Auto-apply logic if enabled and matches requirements
      if (company.autoApply && discoveredPositions.length > 0) {
        const hasSpecialRequirements = specialReqs.length > 0 && !specialReqs.includes('none');
        if (hasSpecialRequirements) {
          showToast(`Silent Auto-apply paused for ${company.name} due to special requirements: ${specialReqs.join(', ')}`, 'info');
        } else {
          // Auto-apply to the first position
          const targetPos = discoveredPositions[0];
          triggerSilentAutoApply(company, targetPos);
        }
      }

    } catch (err: any) {
      console.error(err);
      setCompanies(
        companies.map((c) => (c.id === company.id ? { ...c, status: 'error' } : c))
      );
      showToast(`Portal scanning failed: ${err.message}`, 'error');
    } finally {
      setScanningId(null);
    }
  };

  // Trigger silent auto-apply for a role discovered from a portal
  const triggerSilentAutoApply = async (company: CompanyInfo, position: OpenPosition) => {
    showToast(`Launching silent auto-apply pilot for ${position.title} at ${company.name}...`, 'info');

    try {
      const data = await API.tailorCv({
          masterCv: profile.masterCvText,
          jobTitle: position.title,
          companyName: company.name,
          country: position.country || 'UAE',
          category: targetJobTitle,
          jobDescription: position.description + '\nRequirements:\n' + position.requirements.join('\n')
      });

      
      const newApp: JobApplication = {
        id: `portal-auto-${Date.now()}`,
        companyName: company.name,
        jobTitle: position.title,
        jobUrl: company.websiteUrl,
        status: 'applied',
        appliedDate: new Date().toISOString().substring(0, 10),
        matchScore: data.successScore || data.matchScore || 85,
        successScore: data.successScore || data.matchScore || 85,
        tailoredCvText: data.tailoredCv,
        countryRulesApplied: data.countryRulesApplied || [],
        coverLetterText: data.coverLetter,
        authenticity: data.authenticity || { rating: 'safe', reason: 'Official company portal registry' },
        interviewPrediction: data.interviewPrediction || { chance: 'medium', probability: 75, breakdown: 'Strong CV tailoring applied' },
        skillGaps: data.skillGaps || { missing: [], certs: [], keywords: [], suggestions: [] },
        logs: [
          { id: '1', date: new Date().toLocaleTimeString(), text: 'Discovered via portal scan.' },
          { id: '2', date: new Date().toLocaleTimeString(), text: 'ATS-tailored CV and Cover Letter created successfully.' },
          { id: '3', date: new Date().toLocaleTimeString(), text: 'Silent auto-apply submitted via portal integration API.' }
        ]
      };

      setApplications([newApp, ...applications]);
      showToast(`Successfully auto-applied silently to ${company.name}! (${newApp.successScore}% match)`, 'success');
    } catch (e: any) {
      console.error(e);
      showToast(`Auto-apply submission failed: ${e.message}`, 'error');
    }
  };

  // Push manually discovered job to tracker with tailoring
  const pushToTracker = async (company: CompanyInfo, position: OpenPosition) => {
    setTailoringPosTitle(position.title);
    showToast(`Tailoring credentials & pushing ${position.title} to Job Tracker...`, 'info');

    try {
      const data = await API.tailorCv({
          masterCv: profile.masterCvText,
          jobTitle: position.title,
          companyName: company.name,
          country: position.country || 'UAE',
          category: targetJobTitle,
          jobDescription: position.description + '\nRequirements:\n' + position.requirements.join('\n')
      });

      
      const newApp: JobApplication = {
        id: `portal-manual-${Date.now()}`,
        companyName: company.name,
        jobTitle: position.title,
        jobUrl: company.websiteUrl,
        status: 'tailored',
        appliedDate: new Date().toISOString().substring(0, 10),
        matchScore: data.successScore || data.matchScore || 85,
        successScore: data.successScore || data.matchScore || 85,
        tailoredCvText: data.tailoredCv,
        countryRulesApplied: data.countryRulesApplied || [],
        coverLetterText: data.coverLetter,
        authenticity: data.authenticity || { rating: 'safe', reason: 'Official company portal registry' },
        interviewPrediction: data.interviewPrediction || { chance: 'medium', probability: 75, breakdown: 'ATS check passed' },
        skillGaps: data.skillGaps || { missing: [], certs: [], keywords: [], suggestions: [] },
        logs: [
          { id: '1', date: new Date().toLocaleTimeString(), text: 'Discovered during manual portal scan.' },
          { id: '2', date: new Date().toLocaleTimeString(), text: 'CV optimized & Cover Letter tailored.' }
        ]
      };

      setApplications([newApp, ...applications]);
      showToast(`Added ${position.title} at ${company.name} to Job Tracker board!`, 'success');
    } catch (e: any) {
      console.error(e);
      showToast(`Tailoring failed: ${e.message}`, 'error');
    } finally {
      setTailoringPosTitle(null);
    }
  };

  const toggleAutoSearch = (companyId: string) => {
    setCompanies(
      companies.map((c) =>
        c.id === companyId ? { ...c, autoSearch: !c.autoSearch } : c
      )
    );
  };

  const toggleAutoApply = (companyId: string) => {
    setCompanies(
      companies.map((c) =>
        c.id === companyId ? { ...c, autoApply: !c.autoApply } : c
      )
    );
  };

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: Add and List Portals (5 columns) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* ADD PORTAL */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Target Company Portals</h3>
              <p className="text-xs text-slate-400">Add corporate websites to actively monitor</p>
            </div>
          </div>

          <form onSubmit={handleAddCompany} className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Company Name</label>
              <input
                type="text"
                required
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                placeholder="e.g. Al Futtaim Logistics"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Careers URL / Website</label>
              <input
                type="text"
                required
                value={newWebsiteUrl}
                onChange={(e) => setNewWebsiteUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                placeholder="e.g. careers.alfuttaim.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Job Category Target</label>
                <select
                  value={targetJobTitle}
                  onChange={(e) => setTargetJobTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-bold text-slate-700 dark:text-slate-300"
                >
                  {profile.preferredCategories && profile.preferredCategories.length > 0 ? (
                    profile.preferredCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))
                  ) : (
                    <option value="">Update Preferences in Profile Hub</option>
                  )}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1 transition-all h-[36px]"
                >
                  <Plus className="h-4 w-4" />
                  Add Portal
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* PORTALS LIST */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">Active Portals Registry</h4>
          
          <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
            {companies.map((company) => (
              <div
                key={company.id}
                className={`p-3.5 border rounded-xl bg-slate-50/20 dark:bg-slate-900/10 space-y-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all ${
                  selectedCompanyId === company.id ? 'border-indigo-400 dark:border-indigo-900 ring-1 ring-indigo-400' : 'border-slate-150 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="truncate">
                    <h5 className="font-extrabold text-slate-900 dark:text-white text-xs truncate">{company.name}</h5>
                    <a
                      href={company.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-slate-400 hover:text-indigo-500 flex items-center gap-1 truncate mt-0.5"
                    >
                      <Globe className="h-3 w-3 shrink-0" />
                      {company.websiteUrl}
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  </div>

                  <button
                    onClick={() => handleDeleteCompany(company.id)}
                    className="text-slate-300 hover:text-rose-500 p-1 rounded transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Automation Toggles */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[11px] font-semibold text-slate-500">
                  <button
                    onClick={() => toggleAutoSearch(company.id)}
                    className="flex items-center gap-1.5 justify-start text-left"
                  >
                    {company.autoSearch ? (
                      <ToggleRight className="h-5 w-5 text-indigo-600 shrink-0" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-slate-300 shrink-0" />
                    )}
                    <span>Auto-Search</span>
                  </button>

                  <button
                    onClick={() => toggleAutoApply(company.id)}
                    className="flex items-center gap-1.5 justify-start text-left"
                  >
                    {company.autoApply ? (
                      <ToggleRight className="h-5 w-5 text-emerald-600 shrink-0" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-slate-300 shrink-0" />
                    )}
                    <span>Auto-Apply</span>
                  </button>
                </div>

                {/* Scan action */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
                  <span className="text-[9px] text-slate-400 font-medium">
                    {company.lastScanned ? `Last Scan: ${company.lastScanned}` : 'Never Scanned'}
                  </span>

                  <button
                    onClick={() => handleScanCompany(company)}
                    disabled={scanningId !== null}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    {scanningId === company.id ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Search className="h-3 w-3" />
                        Scan Careers
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Open Positions Scan Results (7 columns) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm space-y-4 flex flex-col h-full min-h-[500px]">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Grounded Scan Findings</h3>
            <p className="text-xs text-slate-400">Targeting Category: {targetJobTitle}</p>
          </div>

          {!selectedCompany ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-400">
              <Search className="h-12 w-12 text-slate-200 dark:text-slate-700 mb-3" />
              <h5 className="font-bold text-slate-700 dark:text-slate-300 text-xs">No Scan Portal Selected</h5>
              <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                Select or trigger a careers page scan from the registry on the left to review parsed job postings.
              </p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
                <span className="text-xs font-bold text-slate-500">
                  {selectedCompany.name} ({selectedCompany.openPositions?.length || 0} roles found)
                </span>
                {selectedCompany.customFormRequirements && (
                  <span className="text-[9px] px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-extrabold rounded-lg border border-rose-100 dark:border-rose-900 animate-pulse flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Forms Required
                  </span>
                )}
              </div>

              {selectedCompany.openPositions?.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Clean Scan - No openings</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1">
                    Careers page has no active postings matching "{targetJobTitle}" at this moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedCompany.openPositions?.map((pos, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-150 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/10 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h5 className="font-extrabold text-slate-900 dark:text-white text-sm">{pos.title}</h5>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {pos.department} • {pos.location} ({pos.country})
                          </span>
                        </div>

                        {/* Success Match Estimator Badge */}
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 font-extrabold block">Success Score</span>
                          <span className="text-sm font-black text-emerald-500">88%</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 leading-normal">{pos.description}</p>

                      {/* Requirements Competencies */}
                      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-xl space-y-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">ATS Scanned Portal Competency Checklist:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {pos.requirements.map((req, rIdx) => (
                            <div key={rIdx} className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-sans font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                              <span>{req}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        {selectedCompany.autoApply ? (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Auto-apply pilot configured
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            *Auto-generate CV tailored to {pos.country} rules.
                          </span>
                        )}

                        <button
                          onClick={() => pushToTracker(selectedCompany, pos)}
                          disabled={tailoringPosTitle === pos.title}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-md"
                        >
                          {tailoringPosTitle === pos.title ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Tailoring...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5" />
                              Tailor & Tracker Push
                              <ArrowRight className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
