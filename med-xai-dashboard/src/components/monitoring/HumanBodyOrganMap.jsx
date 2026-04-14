import React from 'react';
import { OrganIcon } from '../shared/OrganIcon.jsx';

const ORGAN_POSITION = {
  뇌: { top: '12%', left: '50%' },
  폐: { top: '30%', left: '32%' },
  심장: { top: '30%', left: '68%' },
  간: { top: '55%', left: '32%' },
  위: { top: '55%', left: '68%' },
  신장: { top: '78%', left: '50%' },
};

const CENTER = { x: 50, y: 45 };

export const HumanBodyOrganMap = ({ organs, selectedOrgan, onSelect }) => (
  <div className="relative w-full h-full min-h-[640px] bg-slate-50/30 rounded-[40px] overflow-hidden border border-slate-100 flex-1">
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      {organs.map((o, i) => {
        const pos = ORGAN_POSITION[o.name];
        if (!pos) return null;
        return (
          <line
            key={i}
            x1={`${CENTER.x}%`}
            y1={`${CENTER.y}%`}
            x2={pos.left}
            y2={pos.top}
            stroke="#e2e8f0"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        );
      })}
    </svg>
    {organs.map((o, i) => {
      const pos = ORGAN_POSITION[o.name];
      if (!pos) return null;
      const isDanger = o.score > 85;
      const isSelected = selectedOrgan?.name === o.name;
      return (
        <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 z-20" style={{ top: pos.top, left: pos.left }}>
          <button
            onClick={() => onSelect(o)}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95
              ${isSelected
                ? 'bg-blue-600 text-white shadow-xl ring-4 ring-blue-100 scale-110'
                : isDanger
                ? 'bg-white border border-rose-200 shadow-md'
                : 'bg-white border border-slate-200 text-slate-500 shadow-md'}`}
          >
            <OrganIcon
              name={o.name}
              size={32}
              className={isSelected ? 'text-white' : isDanger ? 'organ-icon-danger' : 'text-slate-500'}
            />
          </button>
          <div
            className={`mt-3 text-center text-[11px] font-black px-3 py-1 rounded-full shadow-sm transition-all duration-300
              ${isSelected
                ? 'bg-blue-600 text-white'
                : isDanger
                ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-300/50'
                : 'bg-white border border-slate-100 text-slate-700'}`}
          >
            {o.name} {o.score}%
          </div>
        </div>
      );
    })}
  </div>
);
