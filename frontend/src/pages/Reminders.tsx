import React, { useState, useEffect } from 'react';
import { database, auth } from '../lib/firebase';
import { ref, onValue, set, remove } from 'firebase/database';
import { 
  Bell, Trash2, Clock, 
  Sparkles, Search, Paperclip, Check, Edit3, X
} from 'lucide-react';

interface Reminder {
  id: string;
  title: string;
  name: string;
  desc: string;
  date: string;
  time: string;
  group: string;
  priority: string;
  repeat: string;
  attachment_name?: string | null;
  attachment_data?: string | null; // base64
  status: string; // 'pending' | 'done' | 'overdue'
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Record<string, Reminder>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Overdue' | 'Done'>('All');
  const [search, setSearch] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('09:00 AM');
  const [group, setGroup] = useState('General');
  const [priority, setPriority] = useState('Medium');
  const [note, setNote] = useState('');
  const [attachedName, setAttachedName] = useState<string | null>(null);
  const [attachedDataB64, setAttachedDataB64] = useState<string | null>(null);

  // AI assistant input
  const [aiInput, setAiInput] = useState('');
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  // Edit Mode state
  const [editId, setEditId] = useState<string | null>(null);

  const currentUser = auth.currentUser;
  const userKey = currentUser?.email ? currentUser.email.replace(/[.#$\[\]]/g, '_') : 'default_user';

  // Fetch from Firebase
  useEffect(() => {
    const remindersRef = ref(database, `reminders/${userKey}`);
    const unsubscribe = onValue(remindersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Evaluate overdue statuses on load
        const updatedData = { ...data };
        const now = new Date();
        Object.keys(updatedData).forEach(key => {
          const item = updatedData[key];
          if (item.status === 'pending') {
            try {
              // Simple check: format YYYY-MM-DD hh:mm AM/PM
              const dueTimeParsed = parseDueDateTime(item.date, item.time);
              if (dueTimeParsed < now) {
                updatedData[key].status = 'overdue';
                // Sync back to DB
                set(ref(database, `reminders/${userKey}/${key}/status`), 'overdue');
              }
            } catch (e) {}
          }
        });
        setReminders(updatedData);
      } else {
        setReminders({});
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userKey]);

  // Helper to parse "09:00 AM" or "02:30 PM" with "YYYY-MM-DD" into Date object
  const parseDueDateTime = (dateStr: string, timeStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    let [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return new Date(year, month - 1, day, hours, minutes);
  };

  // Attach File helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("File is too large! Max file size is 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(',')[1];
      setAttachedName(file.name);
      setAttachedDataB64(b64);
    };
    reader.readAsDataURL(file);
  };

  // Natural Language AI parser
  const handleAiParse = () => {
    if (!aiInput.trim()) return;

    const text = aiInput.toLowerCase();
    
    // 1. Detect priority
    let parsedPriority = 'Medium';
    if (text.includes('high priority') || text.includes('urgent') || text.includes('asap')) {
      parsedPriority = 'High';
    } else if (text.includes('low priority') || text.includes('not urgent')) {
      parsedPriority = 'Low';
    }

    // 2. Detect Group
    let parsedGroup = 'General';
    if (text.includes('report') || text.includes('sale')) {
      parsedGroup = 'Reports';
    } else if (text.includes('invoice') || text.includes('po')) {
      parsedGroup = 'Invoices';
    } else if (text.includes('driver') || text.includes('van') || text.includes('fuel') || text.includes('trip')) {
      parsedGroup = 'Logistics';
    } else if (text.includes('expense') || text.includes('loan') || text.includes('audit')) {
      parsedGroup = 'Accounting';
    }

    // 3. Detect Time
    let parsedTime = '09:00 AM';
    const timeRegex = /(\d{1,2}):(\d{2})\s*(am|pm)/i;
    const timeMatch = aiInput.match(timeRegex);
    if (timeMatch) {
      parsedTime = `${timeMatch[1]}:${timeMatch[2]} ${timeMatch[3].toUpperCase()}`;
    } else {
      if (text.includes('morning')) parsedTime = '08:00 AM';
      else if (text.includes('afternoon')) parsedTime = '02:00 PM';
      else if (text.includes('evening') || text.includes('night')) parsedTime = '06:00 PM';
    }

    // 4. Detect Date
    let parsedDate = new Date();
    if (text.includes('tomorrow')) {
      parsedDate.setDate(parsedDate.getDate() + 1);
    } else if (text.includes('next week') || text.includes('in a week')) {
      parsedDate.setDate(parsedDate.getDate() + 7);
    } else if (text.includes('in 2 days')) {
      parsedDate.setDate(parsedDate.getDate() + 2);
    } else if (text.includes('in 3 days')) {
      parsedDate.setDate(parsedDate.getDate() + 3);
    } else {
      // Days of the week
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      for (let i = 0; i < 7; i++) {
        if (text.includes(`next ${days[i]}`) || text.includes(`on ${days[i]}`)) {
          const currentDay = parsedDate.getDay();
          const targetDay = i;
          let diff = targetDay - currentDay;
          if (diff <= 0) diff += 7; // force next week
          parsedDate.setDate(parsedDate.getDate() + diff);
          break;
        }
      }
    }

    // 5. Clean Title (remove date/time annotations)
    let parsedTitle = aiInput
      .replace(/by next \w+/i, '')
      .replace(/on \w+/i, '')
      .replace(/at \d+:\d+\s*(am|pm)/i, '')
      .replace(/with \w+\s*priority/i, '')
      .replace(/tomorrow/i, '')
      .replace(/high priority/i, '')
      .replace(/urgent/i, '')
      .replace(/asap/i, '')
      .replace(/in \d+ days/i, '')
      .replace(/morning/i, '')
      .replace(/afternoon/i, '')
      .replace(/evening/i, '')
      .replace(/tasks?/i, '')
      .trim();

    // Capitalize first letter
    parsedTitle = parsedTitle.charAt(0).toUpperCase() + parsedTitle.slice(1);

    if (parsedTitle.length > 50) {
      parsedTitle = parsedTitle.slice(0, 47) + '...';
    }

    setTitle(parsedTitle || 'New AI Task');
    setDueDate(parsedDate.toISOString().split('T')[0]);
    setDueTime(parsedTime);
    setPriority(parsedPriority);
    setGroup(parsedGroup);
    setNote(`Parsed from smart prompt: "${aiInput}"`);
    
    setAiSuccessMessage(`Parsed task details successfully!`);
    setTimeout(() => setAiSuccessMessage(null), 3000);
  };

  const handleAddOrEditReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const id = editId || Math.random().toString(36).substring(2, 15);
    
    // Evaluate if due date is already overdue
    let status = 'pending';
    if (editId && reminders[editId]) {
      status = reminders[editId].status;
    }
    const dueTimeParsed = parseDueDateTime(dueDate, dueTime);
    if (status !== 'done' && dueTimeParsed < new Date()) {
      status = 'overdue';
    }

    const data: Reminder = {
      id,
      title: title.trim(),
      name: assignee.trim() || 'Unassigned',
      desc: note.trim(),
      date: dueDate,
      time: dueTime,
      group: group,
      priority: priority,
      repeat: 'One-time',
      attachment_name: attachedName,
      attachment_data: attachedDataB64,
      status
    };

    try {
      await set(ref(database, `reminders/${userKey}/${id}`), data);
      
      // Reset Form fields
      setTitle('');
      setAssignee('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setDueTime('09:00 AM');
      setGroup('General');
      setPriority('Medium');
      setNote('');
      setAttachedName(null);
      setAttachedDataB64(null);
      setEditId(null);
    } catch (err) {
      alert("Error adding task: " + err);
    }
  };

  const handleToggleDone = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'done' ? 'pending' : 'done';
    try {
      await set(ref(database, `reminders/${userKey}/${id}/status`), nextStatus);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this reminder?")) {
      try {
        await remove(ref(database, `reminders/${userKey}/${id}`));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleEditInit = (item: Reminder) => {
    setEditId(item.id);
    setTitle(item.title);
    setAssignee(item.name);
    setDueDate(item.date);
    setDueTime(item.time);
    setGroup(item.group);
    setPriority(item.priority);
    setNote(item.desc);
    setAttachedName(item.attachment_name || null);
    setAttachedDataB64(item.attachment_data || null);
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setTitle('');
    setAssignee('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setDueTime('09:00 AM');
    setGroup('General');
    setPriority('Medium');
    setNote('');
    setAttachedName(null);
    setAttachedDataB64(null);
  };

  const downloadAttachment = (name: string, b64: string) => {
    const link = document.createElement("a");
    link.href = `data:application/octet-stream;base64,${b64}`;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Computations for Stats
  const list = Object.values(reminders);
  const total = list.length;
  const pending = list.filter(r => r.status === 'pending').length;
  const overdue = list.filter(r => r.status === 'overdue').length;
  const done = list.filter(r => r.status === 'done').length;

  // Filter list based on UI selection and search
  const filteredList = list.filter(item => {
    if (filter === 'Pending' && item.status !== 'pending') return false;
    if (filter === 'Overdue' && item.status !== 'overdue') return false;
    if (filter === 'Done' && item.status !== 'done') return false;
    
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 antialiased">
      {/* Sidebar Controls: Add & AI Assistant */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* AI Task Parser */}
        <div className="bg-slate-900 rounded-2xl shadow-xl p-6 border border-green-600/20 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-700/10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-green-400 animate-pulse" />
            <h3 className="text-lg font-bold">AI Smart Scheduler</h3>
          </div>
          <p className="text-xs text-slate-300 mb-4">
            Type your task naturally and let AI configure it (e.g. <i>"Draft invoice by tomorrow 3:00 PM with High priority"</i>).
          </p>
          <div className="space-y-3">
            <textarea
              rows={2}
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-green-600 focus:border-green-600 text-white placeholder-slate-500 resize-none"
            />
            {aiSuccessMessage && (
              <p className="text-xs text-emerald-400 font-medium">{aiSuccessMessage}</p>
            )}
            <button
              onClick={handleAiParse}
              className="w-full py-2 bg-green-700 hover:bg-green-800 active:scale-[0.98] transition-all rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-green-700/20"
            >
              <Sparkles className="w-4 h-4" /> AI Auto-Fill Form
            </button>
          </div>
        </div>

        {/* Task Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">
              {editId ? 'Edit Reminder' : 'Create Reminder'}
            </h3>
            {editId && (
              <button
                onClick={handleCancelEdit}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
              >
                <X className="w-3.5 h-3.5" /> Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleAddOrEditReminder} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Task Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What is the task?"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Due Time</label>
                <select
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-600"
                >
                  {/* Generate 1-hour interval times for selection */}
                  {Array.from({ length: 24 }).map((_, idx) => {
                    const hour = idx === 0 || idx === 12 ? 12 : idx % 12;
                    const ampm = idx < 12 ? 'AM' : 'PM';
                    const timeString = `${hour < 10 ? '0' : ''}${hour}:00 ${ampm}`;
                    const halfTimeString = `${hour < 10 ? '0' : ''}${hour}:30 ${ampm}`;
                    return (
                      <React.Fragment key={idx}>
                        <option value={timeString}>{timeString}</option>
                        <option value={halfTimeString}>{halfTimeString}</option>
                      </React.Fragment>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Assignee</label>
                <input
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="Employee name"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Group / Category</label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="General">General</option>
                  <option value="Reports">Reports</option>
                  <option value="Invoices">Invoices</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Accounting">Accounting</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Attachment</label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="border border-dashed border-slate-200 rounded-xl py-2 px-3 text-center text-xs text-slate-500 flex items-center justify-center gap-1 hover:bg-slate-50 transition-colors">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[120px]">{attachedName || 'Attach (max 3MB)'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Note Details</label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Additional instructions..."
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors shadow-md"
            >
              {editId ? 'Save Reminder' : 'Add Reminder'}
            </button>
          </form>
        </div>

      </div>

      {/* Main Task List & Stats */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Statistics Dashboard */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-slate-800">{total}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Tasks</span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-amber-500">{pending}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Pending</span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-rose-500">{overdue}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Overdue</span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-emerald-500">{done}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Completed</span>
          </div>
        </div>

        {/* Task List container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Filter Buttons */}
            <div className="flex bg-slate-100 p-1 rounded-lg self-start">
              {(['All', 'Pending', 'Overdue', 'Done'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wider transition-colors ${
                    filter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search reminders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* List display */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
              <p className="text-xs text-slate-400 mt-2 font-medium">Synchronizing tasks...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <Bell className="w-12 h-12 mb-3 text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-semibold">No reminders found</p>
              <p className="text-xs mt-1">Create a new task to get started!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {filteredList.map(item => {
                const isItemDone = item.status === 'done';
                const isOverdue = item.status === 'overdue';
                
                return (
                  <div 
                    key={item.id}
                    className={`flex items-start justify-between p-4 rounded-xl border transition-all ${
                      isItemDone 
                        ? 'bg-slate-50/60 border-slate-200/60 opacity-70' 
                        : isOverdue
                          ? 'bg-rose-50/40 border-rose-100 hover:border-rose-200 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-green-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      
                      {/* Done Toggle Box */}
                      <button 
                        onClick={() => handleToggleDone(item.id, item.status)}
                        className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center mt-1 flex-shrink-0 transition-all ${
                          isItemDone 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : isOverdue
                              ? 'border-rose-300 hover:bg-rose-50'
                              : 'border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {isItemDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Info details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-sm font-bold truncate ${isItemDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {item.title}
                          </h4>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            item.priority === 'High' 
                              ? 'bg-rose-100 text-rose-700' 
                              : item.priority === 'Low'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.priority}
                          </span>
                          <span className="text-[9px] font-bold bg-green-50 text-green-800 px-2 py-0.5 rounded-full">
                            {item.group}
                          </span>
                        </div>

                        {item.desc && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.desc}</p>
                        )}

                        <div className="flex items-center gap-4 text-[10px] text-slate-400 mt-2 flex-wrap font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> 
                            {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {item.time}
                          </span>
                          <span>Assignee: <b className="text-slate-600">{item.name}</b></span>
                          
                          {/* Attachment Link */}
                          {item.attachment_name && item.attachment_data && (
                            <button
                              onClick={() => downloadAttachment(item.attachment_name!, item.attachment_data!)}
                              className="text-green-700 hover:underline flex items-center gap-0.5"
                            >
                              <Paperclip className="w-3 h-3" /> {item.attachment_name}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 ml-4">
                      <button
                        onClick={() => handleEditInit(item)}
                        className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
