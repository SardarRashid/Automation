import { API } from '../lib/apiClient';
import { useState, useRef, ChangeEvent } from 'react';
import { UserProfile, Experience, Education, Certification, Language } from '../types';
import { 
  UploadCloud, Linkedin, Sparkles, RefreshCw, AlertTriangle, 
  CheckCircle, FileText, User, Briefcase, BookOpen, Settings,
  Globe, Github, MapPin, DollarSign, Target, Award,
  Plus, Edit2, Trash2, Save, X
} from 'lucide-react';
import MarkdownViewer from './MarkdownViewer';

interface UserProfileBuilderProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function UserProfileBuilder({ profile, setProfile, showToast }: UserProfileBuilderProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'experience' | 'education' | 'skills' | 'preferences' | 'master_cv'>('personal');
  
  const [isGeneratingAiCv, setIsGeneratingAiCv] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProfile = (updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    // Auto-save happens globally in App.tsx now, but we keep local storage backup just in case
    localStorage.setItem('cv_auto_profile', JSON.stringify(updated));
  };

  const handleArrayUpdate = (field: keyof UserProfile, value: string) => {
    const arr = value.split(',').map(s => s.trim()).filter(Boolean);
    updateProfile({ [field]: arr });
  };


  const handleImportLinkedIn = async () => {
    if (!profile.linkedinUrl) {
      showToast("Please enter a LinkedIn URL first.", "error");
      return;
    }
    setIsUploading(true);
    showToast("Importing LinkedIn profile...", "info");
    try {
      const data = await API.importLinkedIn({ linkedinUrl: profile.linkedinUrl });
      
      const experience = (data.experience || []).map((e: any) => ({ ...e, id: e.id || generateId() }));
      const education = (data.education || []).map((e: any) => ({ ...e, id: e.id || generateId() }));

      const mergedProfile = {
        ...profile,
        ...data,
        experience: experience.length > 0 ? experience : profile.experience,
        education: education.length > 0 ? education : profile.education,
        skills: data.skills && data.skills.length > 0 ? data.skills : profile.skills,
      };

      updateProfile(mergedProfile);
      showToast("LinkedIn profile imported successfully!", "success");
    } catch (err: any) {
      showToast(`Import failed: ${err.message}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateMasterCv = async () => {
    setIsGeneratingAiCv(true);
    showToast("Compiling Master CV with AI...", "info");
    try {
      const data = await API.generateAiCv({
        profile: profile,
        extraPrompts: "Create a highly professional ATS-friendly Master CV encompassing all profile sections."
      });
      updateProfile({ masterCvText: data.masterCvText || data.cvText });
      showToast("Master CV Generated!", "success");
      setActiveTab('master_cv');
    } catch (err: any) {
      showToast(`AI Generation failed: ${err.message}`, "error");
    } finally {
      setIsGeneratingAiCv(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setIsUploading(true);
      showToast("Uploading and parsing CV...", "info");
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const result = reader.result as string;
          const base64Data = result.split(',')[1] || result;
          const data = await API.parseCv({ fileData: base64Data, fileName: file.name, fileType: file.type });
          
          updateProfile({
            name: data.name || profile.name,
            email: data.email || profile.email,
            phone: data.phone || profile.phone,
            location: data.location || profile.location,
            professionalSummary: data.summary || profile.professionalSummary || profile.summary,
            skills: data.skills || profile.skills,
            experience: data.experience || profile.experience,
            education: data.education || profile.education,
            certifications: data.certifications || profile.certifications,
            languages: data.languages || profile.languages
          });
          showToast("CV successfully parsed and profile updated!", "success");
          
          // Generate a Master CV from the newly uploaded data
          showToast("Generating Master CV from parsed data...", "info");
          setIsGeneratingAiCv(true);
          const masterData = await API.generateAiCv({
            profile: { ...profile, ...data },
            extraPrompts: "Create a highly professional ATS-friendly Master CV encompassing all parsed sections."
          });
          updateProfile({ masterCvText: masterData.masterCvText || masterData.cvText });
          showToast("Master CV Generated!", "success");
          setActiveTab('master_cv');
          
        } catch (err: any) {
          showToast(`Failed to parse CV: ${err.message}`, "error");
        } finally {
          setIsUploading(false);
          setIsGeneratingAiCv(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal & Links', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education & Certs', icon: BookOpen },
    { id: 'skills', label: 'Skills & Languages', icon: Award },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'master_cv', label: 'Master CV', icon: FileText }
  ] as const;

  // Components for editable lists
  const ExperienceManager = () => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Experience>>({});
    
    const exps = profile.experience || [];

    const handleSave = () => {
      if (!editForm.title || !editForm.company) {
        showToast("Title and Company are required.", "error");
        return;
      }
      if (editingId === 'new') {
        const newExp: Experience = { ...editForm, id: `exp-${Date.now()}` } as Experience;
        updateProfile({ experience: [newExp, ...exps] });
      } else {
        updateProfile({ experience: exps.map(e => e.id === editingId ? { ...e, ...editForm } as Experience : e) });
      }
      setEditingId(null);
      showToast("Experience saved.", "success");
    };

    return (
      <div className="space-y-4">
        {editingId === null && (
          <button onClick={() => { setEditingId('new'); setEditForm({}); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Experience
          </button>
        )}
        
        {editingId && (
          <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Job Title" value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none" />
              <input type="text" placeholder="Company Name" value={editForm.company || ''} onChange={e => setEditForm({...editForm, company: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none" />
              <input type="text" placeholder="Start Date" value={editForm.startDate || ''} onChange={e => setEditForm({...editForm, startDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none" />
              <input type="text" placeholder="End Date (or Present)" value={editForm.endDate || ''} onChange={e => setEditForm({...editForm, endDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none" />
            </div>
            <textarea placeholder="Description" value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full h-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
              <button onClick={handleSave} className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1"><Save className="h-3.5 w-3.5" /> Save</button>
            </div>
          </div>
        )}

        {exps.map(exp => (
          <div key={exp.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl relative group bg-white dark:bg-slate-900 hover:shadow-sm">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{exp.title}</h4>
            <div className="text-xs text-slate-500 font-medium mb-2">{exp.company} • {exp.startDate} – {exp.endDate}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{exp.description}</p>
            
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingId(exp.id); setEditForm(exp); }} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded hover:text-indigo-600"><Edit2 className="h-3.5 w-3.5" /></button>
              <button onClick={() => updateProfile({ experience: exps.filter(e => e.id !== exp.id) })} className="p-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded hover:bg-rose-100"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const EducationManager = () => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Education>>({});
    const edus = profile.education || [];

    const handleSave = () => {
      if (editingId === 'new') {
        const newEdu: Education = { ...editForm, id: `edu-${Date.now()}` } as Education;
        updateProfile({ education: [newEdu, ...edus] });
      } else {
        updateProfile({ education: edus.map(e => e.id === editingId ? { ...e, ...editForm } as Education : e) });
      }
      setEditingId(null);
      showToast("Education saved.", "success");
    };

    return (
      <div className="space-y-4">
        {editingId === null && (
          <button onClick={() => { setEditingId('new'); setEditForm({}); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Education
          </button>
        )}
        
        {editingId && (
          <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Degree (e.g. B.S. Computer Science)" value={editForm.degree || ''} onChange={e => setEditForm({...editForm, degree: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none" />
              <input type="text" placeholder="Institute" value={editForm.institute || ''} onChange={e => setEditForm({...editForm, institute: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none" />
              <input type="text" placeholder="Country" value={editForm.country || ''} onChange={e => setEditForm({...editForm, country: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none" />
              <input type="text" placeholder="Grade/GPA" value={editForm.grade || ''} onChange={e => setEditForm({...editForm, grade: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none" />
              <input type="text" placeholder="Start Date" value={editForm.startDate || ''} onChange={e => setEditForm({...editForm, startDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none" />
              <input type="text" placeholder="End Date" value={editForm.endDate || ''} onChange={e => setEditForm({...editForm, endDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none" />
            </div>
            <textarea placeholder="Description" value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full h-16 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
              <button onClick={handleSave} className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1"><Save className="h-3.5 w-3.5" /> Save</button>
            </div>
          </div>
        )}

        {edus.map(edu => (
          <div key={edu.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl relative group bg-white dark:bg-slate-900">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{edu.degree}</h4>
            <div className="text-xs text-slate-500 font-medium mb-1">{edu.institute} • {edu.country}</div>
            <div className="text-[10px] text-slate-400 font-medium mb-2">{edu.startDate} – {edu.endDate} • {edu.grade}</div>
            {edu.description && <p className="text-xs text-slate-600 dark:text-slate-400">{edu.description}</p>}
            
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingId(edu.id); setEditForm(edu); }} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded hover:text-indigo-600"><Edit2 className="h-3.5 w-3.5" /></button>
              <button onClick={() => updateProfile({ education: edus.filter(e => e.id !== edu.id) })} className="p-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded hover:bg-rose-100"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const CertificationsManager = () => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Certification>>({});
    const certs = profile.certifications || [];

    const handleSave = () => {
      if (editingId === 'new') {
        const newCert: Certification = { ...editForm, id: `cert-${Date.now()}` } as Certification;
        updateProfile({ certifications: [newCert, ...certs] });
      } else {
        updateProfile({ certifications: certs.map(e => e.id === editingId ? { ...e, ...editForm } as Certification : e) });
      }
      setEditingId(null);
      showToast("Certification saved.", "success");
    };

    return (
      <div className="space-y-4">
        {editingId === null && (
          <button onClick={() => { setEditingId('new'); setEditForm({}); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Certification
          </button>
        )}
        
        {editingId && (
          <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Certificate Name" value={editForm.certificate || ''} onChange={e => setEditForm({...editForm, certificate: e.target.value})} className="col-span-2 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none" />
              <input type="text" placeholder="Organization" value={editForm.organization || ''} onChange={e => setEditForm({...editForm, organization: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none" />
              <input type="text" placeholder="Credential ID" value={editForm.credentialId || ''} onChange={e => setEditForm({...editForm, credentialId: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none" />
              <input type="text" placeholder="Issue Date" value={editForm.issueDate || ''} onChange={e => setEditForm({...editForm, issueDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none" />
              <input type="text" placeholder="Expiry Date" value={editForm.expiryDate || ''} onChange={e => setEditForm({...editForm, expiryDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none" />
              <input type="url" placeholder="Credential URL" value={editForm.credentialUrl || ''} onChange={e => setEditForm({...editForm, credentialUrl: e.target.value})} className="col-span-2 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
              <button onClick={handleSave} className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1"><Save className="h-3.5 w-3.5" /> Save</button>
            </div>
          </div>
        )}

        {certs.map(cert => (
          <div key={cert.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl relative group bg-white dark:bg-slate-900">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{cert.certificate}</h4>
            <div className="text-xs text-slate-500 font-medium mb-1">{cert.organization}</div>
            <div className="text-[10px] text-slate-400 font-medium">Issued: {cert.issueDate} {cert.expiryDate ? `• Expires: ${cert.expiryDate}` : ''}</div>
            
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingId(cert.id); setEditForm(cert); }} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded hover:text-indigo-600"><Edit2 className="h-3.5 w-3.5" /></button>
              <button onClick={() => updateProfile({ certifications: certs.filter(e => e.id !== cert.id) })} className="p-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded hover:bg-rose-100"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const LanguagesManager = () => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Language>>({});
    const langs = profile.languages || [];

    const handleSave = () => {
      if (editingId === 'new') {
        const newLang: Language = { ...editForm, id: `lang-${Date.now()}` } as Language;
        updateProfile({ languages: [newLang, ...langs] });
      } else {
        updateProfile({ languages: langs.map(e => e.id === editingId ? { ...e, ...editForm } as Language : e) });
      }
      setEditingId(null);
      showToast("Language saved.", "success");
    };

    return (
      <div className="space-y-4">
        {editingId === null && (
          <button onClick={() => { setEditingId('new'); setEditForm({ proficiency: 'Fluent' }); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Language
          </button>
        )}
        
        {editingId && (
          <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Language (e.g. English)" value={editForm.language || ''} onChange={e => setEditForm({...editForm, language: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none" />
              <select value={editForm.proficiency || 'Fluent'} onChange={e => setEditForm({...editForm, proficiency: e.target.value as any})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none">
                <option value="Native">Native</option>
                <option value="Fluent">Fluent</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Basic">Basic</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
              <button onClick={handleSave} className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1"><Save className="h-3.5 w-3.5" /> Save</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {langs.map(lang => (
            <div key={lang.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between group bg-white dark:bg-slate-900">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{lang.language}</h4>
                <div className="text-xs text-slate-500">{lang.proficiency}</div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingId(lang.id); setEditForm(lang); }} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded hover:text-indigo-600"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => updateProfile({ languages: langs.filter(e => e.id !== lang.id) })} className="p-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded hover:bg-rose-100"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Wizard Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-500" />
            Master Profile Hub
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            This profile acts as the single source of truth. All automated applications, ATS scans, and cover letters pull directly from here. Data is automatically saved.
          </p>
        </div>
        <div className="flex gap-2">
           <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.txt" />
           <button 
             onClick={() => fileInputRef.current?.click()}
             disabled={isUploading}
             className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition"
           >
             {isUploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
             Upload CV to Auto-Fill
           </button>
           <button 
             onClick={handleGenerateMasterCv}
             disabled={isGeneratingAiCv}
             className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-500/20"
           >
             {isGeneratingAiCv ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
             Generate Master CV
           </button>
        </div>
      </div>

      {/* Full Page Branded Loader Overlay */}
      {(isGeneratingAiCv || isUploading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-8 flex flex-col items-center max-w-sm w-full mx-4 text-center">
            <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">
              ArMan's Job Automation Assistant
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isUploading ? "Uploading and extracting profile data..." : "Compiling highly optimized Master CV..."}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 custom-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === t.id 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        
        {/* PERSONAL */}
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
              <input type="text" value={profile.name || ''} onChange={e => updateProfile({ name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
              <input type="email" value={profile.email || ''} onChange={e => updateProfile({ email: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone</label>
              <input type="text" value={profile.phone || ''} onChange={e => updateProfile({ phone: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nationality (Optional)</label>
              <input type="text" value={profile.nationality || ''} onChange={e => updateProfile({ nationality: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Country</label>
              <input type="text" value={profile.country || ''} onChange={e => updateProfile({ country: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">City</label>
              <input type="text" value={profile.city || ''} onChange={e => updateProfile({ city: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">LinkedIn URL</label>
              <div className="flex gap-2">
                <input type="url" value={profile.linkedinUrl || ''} onChange={e => updateProfile({ linkedinUrl: e.target.value })} className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500" placeholder="https://linkedin.com/in/username" />
                <button onClick={handleImportLinkedIn} disabled={isUploading} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition shadow-lg shadow-blue-500/20 whitespace-nowrap">
                  Import Profile
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">GitHub URL</label>
              <input type="url" value={profile.githubUrl || ''} onChange={e => updateProfile({ githubUrl: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Portfolio URL</label>
              <input type="url" value={profile.portfolioUrl || ''} onChange={e => updateProfile({ portfolioUrl: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Professional Summary</label>
              <textarea value={profile.professionalSummary || profile.summary || ''} onChange={e => updateProfile({ professionalSummary: e.target.value })} className="w-full h-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
        )}

        {/* EXPERIENCE */}
        {activeTab === 'experience' && <ExperienceManager />}

        {/* EDUCATION */}
        {activeTab === 'education' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Education</h3>
              <EducationManager />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Certifications</h3>
              <CertificationsManager />
            </div>
          </div>
        )}

        {/* SKILLS */}
        {activeTab === 'skills' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Professional Skills</h3>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skills (Comma separated)</label>
                <textarea 
                  value={(profile.skills || []).join(', ')} 
                  onChange={e => handleArrayUpdate('skills', e.target.value)} 
                  className="w-full h-32 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500" 
                  placeholder="e.g. React, Node.js, Project Management, Agile"
                />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Languages</h3>
              <LanguagesManager />
            </div>
          </div>
        )}

        {/* PREFERENCES */}
        {activeTab === 'preferences' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Preferred Job Title</label>
              <input type="text" value={profile.preferredJobTitle || ''} onChange={e => updateProfile({ preferredJobTitle: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Preferred Industry</label>
              <input type="text" value={profile.preferredIndustry || ''} onChange={e => updateProfile({ preferredIndustry: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Categories (Comma separated)</label>
              <input type="text" value={(profile.preferredCategories || []).join(', ')} onChange={e => handleArrayUpdate('preferredCategories', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Countries (Comma separated)</label>
              <input type="text" value={(profile.preferredCountries || []).join(', ')} onChange={e => handleArrayUpdate('preferredCountries', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expected Salary</label>
              <input type="text" value={profile.expectedSalary || profile.salaryExpectation || ''} onChange={e => updateProfile({ expectedSalary: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none" placeholder="e.g. $120,000 USD" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Work Setup</label>
              <select value={profile.remoteHybridOnsite || profile.workSetup || 'Any'} onChange={e => updateProfile({ remoteHybridOnsite: e.target.value as any })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none">
                <option value="Any">Any</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>
            </div>
          </div>
        )}

        {/* MASTER CV */}
        {activeTab === 'master_cv' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[500px]">
             <div className="space-y-1 h-full flex flex-col">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Markdown Editor</label>
               <textarea 
                 value={profile.masterCvText || ''} 
                 onChange={e => updateProfile({ masterCvText: e.target.value })} 
                 className="flex-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-mono leading-relaxed focus:outline-none focus:border-indigo-500 resize-none" 
               />
             </div>
             <div className="space-y-1 h-full flex flex-col">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Preview</label>
               <div className="flex-1 w-full bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 overflow-y-auto text-xs leading-relaxed custom-scrollbar">
                 <MarkdownViewer content={profile.masterCvText || 'Generate or paste your CV here.'} />
               </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
