import React from 'react';
import { Pencil, Copy } from 'lucide-react';

export const ReportBox = ({ title, content, variant = 'default', children }) => (
  <div
    className={`report-box rounded-xl overflow-hidden flex flex-col h-full border ${
      variant === 'xai' ? 'border-blue-100 shadow-blue-50' : 'border-slate-200'
    }`}
  >
    <div
      className={`px-5 py-2 flex justify-between items-center border-b ${
        variant === 'xai'
          ? 'bg-blue-600 border-blue-500 text-white'
          : 'bg-[#f1f5f9] border-slate-200 text-slate-500'
      }`}
    >
      <span
        className={`px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border ${
          variant === 'xai'
            ? 'bg-blue-700 border-blue-400'
            : 'bg-white border-slate-300 shadow-sm'
        }`}
      >
        {title}
      </span>
      <div className="flex gap-2">
        <button className="hover:text-blue-300 p-1"><Pencil size={14} /></button>
        <button className="hover:text-emerald-300 p-1"><Copy size={14} /></button>
      </div>
    </div>
    <div className="p-5 flex-1 bg-white">
      {children ? children : (
        <div className="text-[12px] font-bold text-slate-700 leading-relaxed whitespace-pre-line custom-scrollbar h-full overflow-auto">
          {content && content.split('\n').filter((l) => l.trim() !== '').map((line, idx) => (
            <div key={idx} className="flex gap-2 mb-1.5">
              <span className="text-blue-300 mt-1">•</span>
              <span>{line}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
