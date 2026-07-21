import { API } from '../lib/apiClient';
import { useState } from 'react';
import { UserProfile, ResumeVariant } from '../types';
import { Sparkles, FileText, Save, RefreshCw, Copy, Plus, Trash2 } from 'lucide-react';
import MarkdownViewer from './MarkdownViewer';

interface MultiCvManagerProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function MultiCvManager({ profile, setProfile, showToast }: MultiCvManagerProps) {
  const variants = profile.resumeVariants || [];
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(variants.length > 0 ? variants[0].id : null);
  
  const selectedVariant = variants.find(v => v.id === selectedVariantId);
  const [editorText, setEditorText] = useState<string>(selectedVariant?.content || '');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRawEditor, setShowRawEditor] = useState(false);

  // New Variant Form State
  const [showNewForm, setShowNewForm] = useState(variants.length === 0);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newIndustry, setNewIndustry] = useState('');

  const handleSelectVariant = (id: string) => {
    setSelectedVariantId(id);
    const variant = variants.find(v => v.id === id);
    setEditorText(variant?.content || '');
    setShowNewForm(false);
  };

  const handleCreateNew = () => {
    if (!newName || !newRole) {
      showToast("Name and Target Role are required", "error");
      return;
    }
    const newVariant: ResumeVariant = {
      id: Date.now().toString(),
      name: newName,
      targetRole: newRole,
      targetIndustry: newIndustry,
      targetCountry: '',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedVariants = [...variants, newVariant];
    setProfile({ ...profile, resumeVariants: updatedVariants });
    setSelectedVariantId(newVariant.id);
    setEditorText('');
    setShowNewForm(false);
    setNewName(''); setNewRole(''); setNewIndustry('');
  };

  const handleDelete = (id: string) => {
    const updatedVariants = variants.filter(v => v.id !== id);
    setProfile({ ...profile, resumeVariants: updatedVariants });
    if (selectedVariantId === id) {
      setSelectedVariantId(updatedVariants.length > 0 ? updatedVariants[0].id : null);
      if (updatedVariants.length > 0) {
        setEditorText(updatedVariants[0].content);
      } else {
        setShowNewForm(true);
      }
    }
  };

  const handleSaveVariant = () => {
    if (!selectedVariantId) return;
    const updatedVariants = variants.map(v => 
      v.id === selectedVariantId ? { ...v, content: editorText, updatedAt: new Date().toISOString() } : v
    );
    setProfile({ ...profile, resumeVariants: updatedVariants });
    showToast(`Saved CV variant!`, "success");
  };

  const handleAiGenerateVariant = async () => {
    if (!profile.masterCvText?.trim()) {
      showToast("Please write or generate your Master CV in the Profile Hub first.", "error");
      return;
    }
    if (!selectedVariant) return;

    setIsGenerating(true);
    showToast(`AI generating custom CV variant for ${selectedVariant.targetRole}...`, "info");

    try {
      const data = await API.generateCvVariant({
          masterCv: profile.masterCvText,
          category: selectedVariant.targetRole, // Passing Target Role as Category
          name: profile.name
        });
      setEditorText(data.cvText);
      
      const updatedVariants = variants.map(v => 
        v.id === selectedVariant.id ? { ...v, content: data.cvText, updatedAt: new Date().toISOString() } : v
      );
      
      setProfile({ ...profile, resumeVariants: updatedVariants });
      showToast(`Successfully engineered CV for ${selectedVariant.targetRole}!`, "success");
    } catch (err: any) {
      showToast(`Generation failed: ${err.message}`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCv = () => {
    navigator.clipboard.writeText(editorText);
    showToast(`Copied CV to clipboard!`, "success");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Selector */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">Targeted CV Variants</h4>
            <button 
              onClick={() => setShowNewForm(true)}
              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Create unlimited tailored versions of your Master CV targeting specific roles or industries.
          </p>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
            {variants.map((variant) => (
              <div key={variant.id} className="relative group">
                <button
                  type="button"
                  onClick={() => handleSelectVariant(variant.id)}
                  className={`w-full text-left p-3 rounded-xl border flex flex-col gap-1 transition-all pr-10 ${
                    selectedVariantId === variant.id && !showNewForm
                      ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
                      : 'bg-transparent border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{variant.name}</span>
                  <span className="text-[10px] text-slate-500 font-medium">Role: {variant.targetRole}</span>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(variant.id); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            {variants.length === 0 && !showNewForm && (
              <div className="text-center p-4 text-xs text-slate-400 border border-dashed rounded-xl">
                No variants found. Create one.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor & Creation Area */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-6 shadow-sm">
        
        {showNewForm ? (
          <div className="space-y-4 max-w-md mx-auto py-8">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Create New CV Variant</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Variant Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Google SWE Role" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Target Role</label>
                <input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="e.g. Senior Software Engineer" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Target Industry (Optional)</label>
                <input value={newIndustry} onChange={e => setNewIndustry(e.target.value)} placeholder="e.g. Big Tech" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="pt-4 flex gap-2">
                <button onClick={handleCreateNew} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-sm">Create Variant</button>
                {variants.length > 0 && <button onClick={() => setShowNewForm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm">Cancel</button>}
              </div>
            </div>
          </div>
        ) : selectedVariant ? (
          <div className="space-y-4 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {selectedVariant.name}
                </h3>
                <p className="text-xs text-slate-500">Optimizing for: <span className="font-bold text-indigo-500">{selectedVariant.targetRole}</span></p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleAiGenerateVariant}
                  disabled={isGenerating}
                  className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  {isGenerating ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Auto-Tailor
                </button>
                <button
                  onClick={() => setShowRawEditor(!showRawEditor)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg"
                >
                  {showRawEditor ? "View Formatted" : "Edit Markdown"}
                </button>
                <button
                  onClick={handleCopyCv}
                  disabled={!editorText}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
                <button
                  onClick={handleSaveVariant}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <Save className="h-3 w-3" /> Save
                </button>
              </div>
            </div>

            {isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-3 min-h-[400px]">
                <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                <span className="text-sm text-slate-500 font-medium animate-pulse">AI is rewriting your Master CV for {selectedVariant.targetRole}...</span>
              </div>
            ) : !editorText ? (
              <div className="flex-1 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-50 dark:bg-slate-900/40 min-h-[400px]">
                <FileText className="h-10 w-10 text-slate-300" />
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">CV Variant Empty</p>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Click 'Auto-Tailor' to have the AI write this variant based on your Master CV.
                  </p>
                </div>
              </div>
            ) : showRawEditor ? (
              <textarea
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                className="w-full flex-1 min-h-[500px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed resize-none"
              />
            ) : (
              <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/20 shadow-inner flex-1 min-h-[500px] overflow-y-auto custom-scrollbar">
                <MarkdownViewer content={editorText} />
              </div>
            )}
          </div>
        ) : null}
      </div>

    </div>
  );
}
