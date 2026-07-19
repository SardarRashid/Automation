import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, Printer, Copy, FileText, ChevronUp, ChevronDown, CheckSquare, Square } from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (val: any, row: T) => React.ReactNode;
  sortable?: boolean;
  total?: boolean; // if true, sums this column in the footer
}

interface SpreadsheetGridProps<T> {
  title: string;
  data: T[];
  columns: ColumnDef<T>[];
  onRowDoubleClick?: (row: T) => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  onPrint?: () => void;
  searchable?: boolean;
  searchKeys?: string[]; // keys to search on
  rowKey?: (row: T) => string;
  customToolbar?: React.ReactNode;
}

export function SpreadsheetGrid<T>({ 
  title, data, columns, onRowDoubleClick, onExportExcel, onExportPDF, onPrint, 
  searchable = true, searchKeys = [], rowKey, customToolbar 
}: SpreadsheetGridProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectedRows.size > 0) {
          handleCopySelected();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedRows, data]);

  const handleCopySelected = () => {
    const selectedData = filteredAndSortedData.filter(row => selectedRows.has(rowKey(row)));
    if (selectedData.length === 0) return;

    const headers = columns.map(c => c.header).join('\t');
    const rows = selectedData.map(row => 
      columns.map(c => {
        const val = (row as any)[c.key];
        return val != null ? String(val).replace(/\t/g, ' ') : '';
      }).join('\t')
    ).join('\n');

    const textToCopy = `${headers}\n${rows}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedKey('rows');
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const handleCopyCell = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    if (searchable && searchTerm && searchKeys.length > 0) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item => 
        searchKeys.some(key => {
          const val = (item as any)[key];
          return val != null && String(val).toLowerCase().includes(lowerSearch);
        })
      );
    }

    if (sortConfig) {
      result.sort((a: any, b: any) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig, searchKeys, searchable]);

  const toggleRowSelect = (id: string) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRows(newSet);
  };

  const toggleAllSelect = () => {
    if (selectedRows.size === filteredAndSortedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredAndSortedData.map(r => rowKey(r))));
    }
  };

  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    columns.filter(c => c.total).forEach(c => t[c.key] = 0);
    filteredAndSortedData.forEach(row => {
      columns.filter(c => c.total).forEach(c => {
        const val = Number((row as any)[c.key]) || 0;
        t[c.key] += val;
      });
    });
    return t;
  }, [filteredAndSortedData, columns]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden font-sans">
      <div className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-slate-800 text-lg whitespace-nowrap">{title}</h2>
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search spreadsheet..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
              />
            </div>
          )}
          {customToolbar}
        </div>

        <div className="flex items-center gap-2">
          {selectedRows.size > 0 && (
            <button 
              onClick={handleCopySelected}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-sm font-medium transition-colors"
            >
              <Copy className="w-4 h-4" /> 
              {copiedKey === 'rows' ? 'Copied!' : `Copy (${selectedRows.size})`}
            </button>
          )}
          
          <div className="h-6 w-px bg-slate-300 mx-1"></div>

          {onPrint && (
            <button onClick={onPrint} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>
          )}
          {onExportExcel && (
            <button onClick={onExportExcel} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-sm font-medium transition-colors">
              <FileText className="w-4 h-4" /> Excel
            </button>
          )}
          {onExportPDF && (
            <button onClick={onExportPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-sm font-medium transition-colors">
              <Download className="w-4 h-4" /> PDF
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50/30 relative" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <table ref={tableRef} className="w-full text-sm text-left border-collapse min-w-max">
          <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 z-10 shadow-sm border-b border-slate-300">
            <tr>
              <th className="px-3 py-2 border-r border-slate-200 w-10 text-center bg-slate-100">
                <button onClick={toggleAllSelect} className="text-slate-400 hover:text-blue-600">
                  {selectedRows.size === filteredAndSortedData.length && filteredAndSortedData.length > 0 ? (
                    <CheckSquare className="w-4 h-4 mx-auto" />
                  ) : (
                    <Square className="w-4 h-4 mx-auto" />
                  )}
                </button>
              </th>
              <th className="px-2 py-2 border-r border-slate-200 w-12 text-center text-xs text-slate-400 bg-slate-100">#</th>
              {columns.map(col => (
                <th 
                  key={col.key}
                  style={{ width: col.width }}
                  className={`px-3 py-2 border-r border-slate-200 select-none bg-slate-100 ${col.sortable !== false ? 'cursor-pointer hover:bg-slate-200' : ''}`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                    {col.header}
                    {sortConfig?.key === col.key && (
                      sortConfig?.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-200">
            {filteredAndSortedData.map((row, idx) => {
              const rId = typeof rowKey === "function" ? rowKey(row) : ((row as any).id || (row as any).key || String(idx));
              const isSelected = selectedRows.has(rId);
              return (
                <tr 
                  key={rId} 
                  className={`group transition-colors ${isSelected ? 'bg-blue-50/60' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100 cursor-default`}
                  onDoubleClick={() => onRowDoubleClick && onRowDoubleClick(row)}
                >
                  <td className="px-3 py-1.5 border-r border-slate-200 text-center" onClick={(e) => { e.stopPropagation(); toggleRowSelect(rId); }}>
                    <button className={`${isSelected ? 'text-blue-600' : 'text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                      {isSelected ? <CheckSquare className="w-4 h-4 mx-auto" /> : <Square className="w-4 h-4 mx-auto" />}
                    </button>
                  </td>
                  <td className="px-2 py-1.5 border-r border-slate-200 text-center text-xs font-mono text-slate-400 select-none">
                    {idx + 1}
                  </td>
                  {columns.map(col => {
                    const rawVal = (row as any)[col.key];
                    const content = col.render ? col.render(rawVal, row) : rawVal;
                    const cId = `${rId}-${col.key}`;
                    return (
                      <td 
                        key={col.key} 
                        className={`px-3 py-1.5 border-r border-slate-200 whitespace-pre-wrap ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          handleCopyCell(String(rawVal), cId);
                        }}
                        title={copiedKey === cId ? 'Copied!' : 'Right-click to copy'}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            
            {filteredAndSortedData.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-12 text-center text-slate-500">
                  No records found in the spreadsheet.
                </td>
              </tr>
            )}
          </tbody>

          {columns.some(c => c.total) && filteredAndSortedData.length > 0 && (
            <tfoot className="bg-slate-100 font-bold text-slate-800 sticky bottom-0 z-10 border-t-2 border-slate-300">
              <tr>
                <td colSpan={2} className="px-3 py-2 border-r border-slate-200 text-right bg-slate-100">
                  TOTALS:
                </td>
                {columns.map(col => (
                  <td 
                    key={col.key}
                    className={`px-3 py-2 border-r border-slate-200 font-mono bg-slate-100 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                  >
                    {col.total && totals[col.key] != null ? totals[col.key].toFixed(2) : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
