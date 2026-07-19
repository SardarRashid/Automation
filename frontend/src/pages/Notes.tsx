import { useState, useEffect } from 'react';
import { database, auth } from '../lib/firebase';
import { ref, onValue, set, remove } from 'firebase/database';
import { Plus, Trash2, StickyNote, Edit3, X, Check } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  timestamp: number;
}

const COLORS = [
  'bg-yellow-100 border-yellow-200 text-yellow-900',
  'bg-blue-100 border-blue-200 text-blue-900',
  'bg-emerald-100 border-emerald-200 text-emerald-900',
  'bg-rose-100 border-rose-200 text-rose-900',
  'bg-purple-100 border-purple-200 text-purple-900',
  'bg-slate-100 border-slate-200 text-slate-900'
];

export default function Notes() {
  const [notes, setNotes] = useState<Record<string, Note>>({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Note>>({});
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  const currentUser = auth.currentUser;
  const userKey = currentUser?.email ? currentUser.email.replace(/[.#$\[\]]/g, '_') : 'default_user';

  useEffect(() => {
    const notesRef = ref(database, `notes/${userKey}`);
    const unsubscribe = onValue(notesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setNotes(data);
      else setNotes({});
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userKey]);

  const handleCreateNew = () => {
    const newId = Math.random().toString(36).substring(2, 15);
    setEditForm({
      id: newId,
      title: '',
      content: '',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      timestamp: Date.now()
    });
    setIsEditing(newId);
  };

  const handleEdit = (note: Note) => {
    setEditForm(note);
    setIsEditing(note.id);
  };

  const handleSave = async () => {
    if (!editForm.id || (!editForm.title && !editForm.content)) {
      setIsEditing(null);
      return;
    }
    
    const noteToSave: Note = {
      id: editForm.id,
      title: editForm.title || 'Untitled',
      content: editForm.content || '',
      color: editForm.color || COLORS[0],
      timestamp: editForm.timestamp || Date.now()
    };

    try {
      await set(ref(database, `notes/${userKey}/${noteToSave.id}`), noteToSave);
      setIsEditing(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save note");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await remove(ref(database, `notes/${userKey}/${id}`));
        if (isEditing === id) setIsEditing(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const sortedNotes = Object.values(notes).sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <StickyNote className="w-8 h-8 text-green-700" />
              Important Notes
            </h1>
            <p className="text-slate-500 mt-2 text-lg">Keep track of passwords, guidelines, and important information.</p>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-xl hover:bg-green-800 transition-colors font-bold shadow-sm"
          >
            <Plus className="w-5 h-5" />
            New Note
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700"></div>
          </div>
        ) : sortedNotes.length === 0 && !isEditing ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center text-center">
            <StickyNote className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No notes yet</h3>
            <p className="text-slate-500 mt-2 mb-6">Create your first note to store important information.</p>
            <button
              onClick={handleCreateNew}
              className="bg-green-100 text-green-800 font-bold px-6 py-2 rounded-lg hover:bg-green-200 transition-colors"
            >
              Create Note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
            
            {/* Editor Card */}
            {isEditing && (
              <div className={`rounded-2xl border-2 shadow-lg p-5 flex flex-col ${editForm.color || COLORS[0]} ring-4 ring-green-600/20 z-10`}>
                <div className="flex justify-between items-start mb-3">
                  <input 
                    type="text" 
                    value={editForm.title || ''}
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    placeholder="Note Title"
                    className="w-full bg-transparent border-none text-lg font-bold placeholder-black/30 focus:ring-0 px-0 focus:outline-none"
                    autoFocus
                  />
                  <button onClick={() => setIsEditing(null)} className="text-black/40 hover:text-black transition-colors ml-2">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <textarea
                  value={editForm.content || ''}
                  onChange={e => setEditForm({...editForm, content: e.target.value})}
                  placeholder="Write your note here..."
                  rows={6}
                  className="w-full bg-transparent border-none text-sm placeholder-black/30 focus:ring-0 px-0 resize-none mb-4 focus:outline-none"
                />
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex gap-1.5">
                    {COLORS.map(c => (
                      <button 
                        key={c}
                        onClick={() => setEditForm({...editForm, color: c})}
                        className={`w-5 h-5 rounded-full border border-black/10 transition-transform ${c.split(' ')[0]} ${editForm.color === c ? 'scale-125 ring-2 ring-black/20' : 'hover:scale-110'}`}
                      />
                    ))}
                  </div>
                  <button onClick={handleSave} className="bg-black/10 hover:bg-black/20 text-black px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                </div>
              </div>
            )}

            {/* Existing Notes */}
            {sortedNotes.map(note => {
              if (note.id === isEditing) return null; // Don't show the static version if it's being edited
              
              return (
                <div 
                  key={note.id} 
                  onClick={() => setViewingNote(note)}
                  className={`rounded-2xl border p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow relative group cursor-pointer ${note.color}`}
                >
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(note); }} 
                      className="p-1.5 bg-black/5 hover:bg-black/10 rounded-md text-black/60 hover:text-black transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }} 
                      className="p-1.5 bg-black/5 hover:bg-rose-500/20 rounded-md text-black/60 hover:text-rose-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2 pr-12 line-clamp-1">{note.title}</h3>
                  <p className="text-sm whitespace-pre-wrap break-words opacity-80 line-clamp-4">{note.content}</p>
                  <div className="mt-4 pt-3 border-t border-black/10 text-[10px] font-medium opacity-50 text-right">
                    {new Date(note.timestamp).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
            {/* View Modal */}
            {viewingNote && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewingNote(null)}>
                <div 
                  className={`relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl p-8 ${viewingNote.color}`}
                  onClick={e => e.stopPropagation()}
                >
                  <button 
                    onClick={() => setViewingNote(null)} 
                    className="absolute top-6 right-6 p-2 bg-black/5 hover:bg-black/10 rounded-full text-black/60 hover:text-black transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <h2 className="text-3xl font-black text-black/90 mb-6 pr-12">{viewingNote.title}</h2>
                  <div className="prose prose-sm sm:prose max-w-none">
                    <p className="whitespace-pre-wrap break-words text-black/80 text-lg leading-relaxed">
                      {viewingNote.content}
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-black/10 flex items-center justify-between">
                    <div className="text-sm font-medium opacity-50">
                      Last edited: {new Date(viewingNote.timestamp).toLocaleString()}
                    </div>
                    <button 
                      onClick={() => {
                        handleEdit(viewingNote);
                        setViewingNote(null);
                      }}
                      className="flex items-center gap-2 bg-black/10 hover:bg-black/20 text-black px-4 py-2 rounded-xl font-bold transition-colors"
                    >
                      <Edit3 className="w-4 h-4" /> Edit Note
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
