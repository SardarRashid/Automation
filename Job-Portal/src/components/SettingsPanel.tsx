import { useState, FormEvent } from 'react';
import { UserProfile } from '../types';
import { Sliders, Plus, X, ShieldAlert, Sparkles, User, Mail, Phone, Globe, Linkedin, Info } from 'lucide-react';

interface SettingsPanelProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function SettingsPanel({ profile, setProfile, showToast }: SettingsPanelProps) {
  const [newCountry, setNewCountry] = useState('');
  const [newExcluded, setNewExcluded] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const updateProfileField = (key: keyof UserProfile, value: any) => {
    setProfile({
      ...profile,
      [key]: value
    });
  };

  const addPreferredCountry = (e: FormEvent) => {
    e.preventDefault();
    if (!newCountry.trim()) return;
    if (profile.preferredCountries.includes(newCountry.trim())) {
      showToast("Country already added.", "info");
      return;
    }
    const updated = [...profile.preferredCountries, newCountry.trim()];
    updateProfileField('preferredCountries', updated);
    setNewCountry('');
    showToast(`Added ${newCountry.trim()} to preferred countries`, "success");
  };

  const removePreferredCountry = (country: string) => {
    const updated = profile.preferredCountries.filter(c => c !== country);
    updateProfileField('preferredCountries', updated);
    showToast(`Removed ${country}`, "info");
  };

  const addExcludedCountry = (e: FormEvent) => {
    e.preventDefault();
    if (!newExcluded.trim()) return;
    if (profile.excludedCountries.includes(newExcluded.trim())) {
      return;
    }
    const updated = [...profile.excludedCountries, newExcluded.trim()];
    updateProfileField('excludedCountries', updated);
    setNewExcluded('');
    showToast(`Added ${newExcluded.trim()} to excluded countries`, "success");
  };

  const removeExcludedCountry = (country: string) => {
    const updated = profile.excludedCountries.filter(c => c !== country);
    updateProfileField('excludedCountries', updated);
  };

  const addPreferredCategory = (e: FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    if (profile.preferredCategories.includes(newCategory.trim())) {
      return;
    }
    const updated = [...profile.preferredCategories, newCategory.trim()];
    updateProfileField('preferredCategories', updated);
    setNewCategory('');
    showToast(`Added category: ${newCategory.trim()}`, "success");
  };

  const removePreferredCategory = (category: string) => {
    const updated = profile.preferredCategories.filter(c => c !== category);
    updateProfileField('preferredCategories', updated);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* PERSONAL PROFILE DETAILS */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/60">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Personal Information</h3>
            <p className="text-xs text-slate-400">ArMan's basic resume contact information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                value={profile.name}
                onChange={(e) => updateProfileField('name', e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="email"
                value={profile.email}
                onChange={(e) => updateProfileField('email', e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => updateProfileField('phone', e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Portfolio Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="url"
                  value={profile.website}
                  onChange={(e) => updateProfileField('website', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">LinkedIn Profile</label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="url"
                  value={profile.linkedinUrl}
                  onChange={(e) => updateProfileField('linkedinUrl', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1 flex items-start gap-3">
          <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-sans">
            These contact coordinates are automatically mapped into every tailored CV and customized cover letter generated by the active Agent.
          </p>
        </div>
      </div>

      {/* RECRUITMENT AUTOMATION PREFERENCES */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Agent Settings & Rules</h3>
              <p className="text-xs text-slate-400">Configure global matching rules and thresholds</p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* SYSTEM MODE */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Automation Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'fully_auto', title: 'Fully Auto', desc: 'Silent apply, automatic Gmail updates' },
                { id: 'semi_auto', title: 'Semi Auto', desc: 'Scan & optimize, user approves apply' },
                { id: 'manual', title: 'Manual Only', desc: 'Scans postings only, no autoapply' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => updateProfileField('mode', m.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    profile.mode === m.id
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="font-bold text-xs block">{m.title}</span>
                  <span className={`text-[10px] leading-tight block mt-1 ${profile.mode === m.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {m.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ALLOW RELATED CATEGORIES */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="text-amber-500 h-4 w-4" />
                Allow Related Job Categories
              </span>
              <p className="text-[10px] text-slate-400">
                E.g. Storekeeper → matches Assistant, Supervisor, Inventory Controller
              </p>
            </div>
            <button
              onClick={() => updateProfileField('allowRelatedCategories', !profile.allowRelatedCategories)}
              className={`w-11 h-6 rounded-full p-1 transition-all ${
                profile.allowRelatedCategories ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-all transform ${
                  profile.allowRelatedCategories ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PREFERRED COUNTRIES */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Preferred Countries</label>
              <form onSubmit={addPreferredCountry} className="flex gap-2">
                <input
                  type="text"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                  placeholder="e.g. Saudi Arabia"
                />
                <button type="submit" className="px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">
                  <Plus className="h-4 w-4" />
                </button>
              </form>
              <div className="flex flex-wrap gap-1.5">
                {profile.preferredCountries.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900"
                  >
                    {c}
                    <button type="button" onClick={() => removePreferredCountry(c)} className="text-indigo-400 hover:text-indigo-600">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* EXCLUDED COUNTRIES */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Excluded Countries</label>
              <form onSubmit={addExcludedCountry} className="flex gap-2">
                <input
                  type="text"
                  value={newExcluded}
                  onChange={(e) => setNewExcluded(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                  placeholder="e.g. Syria"
                />
                <button type="submit" className="px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">
                  <Plus className="h-4 w-4" />
                </button>
              </form>
              <div className="flex flex-wrap gap-1.5">
                {profile.excludedCountries.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900"
                  >
                    {c}
                    <button type="button" onClick={() => removeExcludedCountry(c)} className="text-rose-400 hover:text-rose-600">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* PREFERRED JOB CATEGORIES */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Preferred Job Categories</label>
            <form onSubmit={addPreferredCategory} className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                placeholder="e.g. Storekeeper, Housekeeping"
              />
              <button type="submit" className="px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">
                <Plus className="h-4 w-4" />
              </button>
            </form>
            <div className="flex flex-wrap gap-1.5">
              {profile.preferredCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800"
                >
                  {cat}
                  <button type="button" onClick={() => removePreferredCategory(cat)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
