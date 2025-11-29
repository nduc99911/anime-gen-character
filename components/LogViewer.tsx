import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../types';
import { Terminal, X, ChevronDown, ChevronUp, Trash2, Clock, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface LogViewerProps {
  logs: LogEntry[];
  onClear: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ logs, onClear, isOpen, setIsOpen }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Auto scroll to bottom when new logs arrive
  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  const formatTime = (timestamp: number) => {
    // Cast options to any to avoid TypeScript error with fractionalSecondDigits in older lib environments
    return new Date(timestamp).toLocaleTimeString('vi-VN', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      fractionalSecondDigits: 3 
    } as any);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success': return <CheckCircle size={14} className="text-green-400" />;
      case 'error': return <AlertCircle size={14} className="text-red-400" />;
      case 'warning': return <AlertTriangle size={14} className="text-yellow-400" />;
      default: return <Info size={14} className="text-blue-400" />;
    }
  };

  const getLevelClass = (level: string) => {
    switch (level) {
      case 'success': return 'text-green-300 border-l-2 border-green-500 bg-green-900/10';
      case 'error': return 'text-red-300 border-l-2 border-red-500 bg-red-900/10';
      case 'warning': return 'text-yellow-300 border-l-2 border-yellow-500 bg-yellow-900/10';
      default: return 'text-blue-200 border-l-2 border-blue-500 bg-blue-900/10';
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-slate-900 border border-slate-700 text-slate-300 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-slate-800 hover:text-white transition-all hover:shadow-purple-900/20"
      >
        <Terminal size={16} />
        <span className="text-xs font-mono font-bold">Logs ({logs.length})</span>
        {logs.length > 0 && logs[logs.length-1].level === 'error' && (
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 left-0 lg:left-96 h-64 z-50 bg-slate-950 border-t border-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] flex flex-col font-mono text-xs animate-slideUp">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-purple-400" />
          <span className="font-bold text-slate-200">System Logs / Debug Console</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClear} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400" title="Xóa logs">
            <Trash2 size={16} />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="Thu nhỏ">
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Logs Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-[#0d1117]">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 italic">
            <Terminal size={32} className="mb-2 opacity-50" />
            <p>Waiting for system events...</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`p-2 rounded mb-1 ${getLevelClass(log.level)} hover:bg-opacity-20 transition-colors`}>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 opacity-70" title={log.level.toUpperCase()}>{getLevelIcon(log.level)}</span>
                <span className="text-slate-500 shrink-0 font-medium select-none">[{formatTime(log.timestamp)}]</span>
                <div className="flex-1 break-all">
                  <span className="font-medium">{log.message}</span>
                  {log.details && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-slate-500 hover:text-slate-300 text-[10px] select-none">Show Details</summary>
                      <pre className="mt-1 p-2 bg-black/30 rounded overflow-x-auto text-[10px] text-slate-400 whitespace-pre-wrap font-mono border border-slate-800/50">
                        {log.details}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default LogViewer;