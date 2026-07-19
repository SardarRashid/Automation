import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Shield, Activity, User, Monitor, Clock, ArrowRight } from 'lucide-react';
import { auditService } from '../services/audit';
import type { AuditLog } from '../services/audit/types';

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');

  useEffect(() => {
    async function fetchLogs() {
      try {
        const fetchedLogs = await auditService.getRecentLogs(500);
        setLogs(fetchedLogs);
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.newValue && String(log.newValue).toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesModule = moduleFilter === 'All' || log.module === moduleFilter;
      
      return matchesSearch && matchesModule;
    });
  }, [logs, searchTerm, moduleFilter]);

  const uniqueModules = ['All', ...Array.from(new Set(logs.map(l => l.module)))];

  const getModuleColor = (module: string) => {
    switch(module) {
      case 'sales': return 'text-green-600 bg-green-50';
      case 'inventory': return 'text-blue-600 bg-blue-50';
      case 'ledger': return 'text-purple-600 bg-purple-50';
      case 'admin': return 'text-orange-600 bg-orange-50';
      case 'auth': return 'text-slate-600 bg-slate-100';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center text-slate-500">Loading audit logs...</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
      {/* Header & Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-800">System Audit Logs</h2>
          <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full ml-2">
            Recent {logs.length}
          </span>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search user, action, or details..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <select 
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="border border-slate-300 text-sm rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {uniqueModules.map(m => (
              <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-white sticky top-0 shadow-sm z-10 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 border-b">Time</th>
              <th className="px-4 py-3 border-b">User</th>
              <th className="px-4 py-3 border-b">Module</th>
              <th className="px-4 py-3 border-b">Action</th>
              <th className="px-4 py-3 border-b w-1/3">Details</th>
              <th className="px-4 py-3 border-b text-right">Device</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  No logs found matching your filters.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(log.timestamp).toLocaleString(undefined, { 
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-900">{log.userId}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getModuleColor(log.module)}`}>
                      {log.module}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {log.previousValue ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-red-500 line-through text-xs">{String(log.previousValue)}</span>
                        <div className="flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="text-green-600 font-medium">{String(log.newValue)}</span>
                        </div>
                      </div>
                    ) : (
                      <span>{String(log.newValue)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5 text-slate-500">
                      <Monitor className="w-3.5 h-3.5" />
                      <span className="capitalize">{log.device}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
