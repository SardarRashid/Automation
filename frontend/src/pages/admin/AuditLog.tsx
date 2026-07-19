import { useState, useEffect } from 'react';
import { database } from '../../lib/firebase';
import { ref, onValue, push, set } from 'firebase/database';
import { useToast } from '../../components/ui/ToastNotification';
import { ArrowLeft, Search, Filter, Download, LogIn, LogOut, Key, Shield, FileText, Trash2, Upload, AlertTriangle, Calendar, User } from 'lucide-react';

interface AuditLogEntry {
  id?: string;
  timestamp: number;
  action: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  category: 'login' | 'logout' | 'password' | 'permission' | 'role' | 'delete' | 'export' | 'import' | 'admin' | 'error';
}

interface AuditLogProps {
  onBack: () => void;
}

export default function AuditLog({ onBack }: AuditLogProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const { addToast } = useToast();

  useEffect(() => {
    const logsRef = ref(database, 'audit/logs');
    const unsubscribe = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const logsArray = Object.entries(data).map(([id, entry]: [string, any]) => ({
          id,
          ...entry
        }));
        setLogs(logsArray.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setLogs([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || log.category === filterCategory;
    
    const matchesDate = !filterDate || new Date(log.timestamp).toDateString() === new Date(filterDate).toDateString();
    
    return matchesSearch && matchesCategory && matchesDate;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'login': return <LogIn className="w-4 h-4" />;
      case 'logout': return <LogOut className="w-4 h-4" />;
      case 'password': return <Key className="w-4 h-4" />;
      case 'permission': return <Shield className="w-4 h-4" />;
      case 'role': return <User className="w-4 h-4" />;
      case 'delete': return <Trash2 className="w-4 h-4" />;
      case 'export': return <Download className="w-4 h-4" />;
      case 'import': return <Upload className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'login': return 'bg-emerald-100 text-emerald-700';
      case 'logout': return 'bg-slate-100 text-slate-700';
      case 'password': return 'bg-amber-100 text-amber-700';
      case 'permission': return 'bg-blue-100 text-blue-700';
      case 'role': return 'bg-purple-100 text-purple-700';
      case 'delete': return 'bg-red-100 text-red-700';
      case 'export': return 'bg-cyan-100 text-cyan-700';
      case 'import': return 'bg-indigo-100 text-indigo-700';
      case 'admin': return 'bg-rose-100 text-rose-700';
      case 'error': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Action', 'User', 'Email', 'Category', 'Details', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        formatDate(log.timestamp),
        log.action,
        log.userName || '',
        log.userEmail || '',
        log.category,
        log.details || '',
        log.ipAddress || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Audit log exported successfully.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center space-x-2 text-sm">
            <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Dashboard
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-medium">Audit Log</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
                <p className="text-slate-500">Track all system activities and user actions</p>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
              >
                <option value="all">All Categories</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="password">Password</option>
                <option value="permission">Permission</option>
                <option value="role">Role</option>
                <option value="delete">Delete</option>
                <option value="export">Export</option>
                <option value="import">Import</option>
                <option value="admin">Admin</option>
                <option value="error">Error</option>
              </select>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
              />
            </div>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No audit logs found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getCategoryColor(log.category)}`}>
                          {getCategoryIcon(log.category)}
                          {log.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div>
                          <p className="font-medium">{log.userName || 'Unknown'}</p>
                          <p className="text-xs text-slate-400">{log.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                        {log.details || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {log.ipAddress || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Info */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-600">
              Showing {filteredLogs.length} of {logs.length} entries
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
