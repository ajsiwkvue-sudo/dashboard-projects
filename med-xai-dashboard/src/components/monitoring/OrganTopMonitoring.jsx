import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { OrganIcon } from '../shared/OrganIcon.jsx';
import { organEvidenceDB } from '../../data/organEvidence.js';

export const OrganTopMonitoring = ({ organ }) => {
  if (!organ) return null;
  const evidence = organEvidenceDB[organ.name];
  const isHigh = organ.score > 85;
  const event = evidence?.eventCard;
  if (!event) return null;
  const EventIcon = event.icon;

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      <div className="col-span-7 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm h-full flex flex-col overflow-hidden animate-in slide-in-from-left duration-500">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2 rounded-xl bg-slate-100">
            <OrganIcon name={organ.name} size={20} className="text-slate-600" />
          </div>
          <div>
            <span className="font-black text-slate-800 text-sm block uppercase tracking-tight">{organ.name} TREND</span>
            <span className={`text-[10px] font-bold ${isHigh ? 'text-rose-500' : 'text-blue-500'}`}>Risk Score: {organ.score}%</span>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={organ.trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="value" stroke={isHigh ? '#f43f5e' : '#2563eb'} strokeWidth={3} dot={{ r: 3, fill: '#fff', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-5 bg-white border border-slate-200 p-8 rounded-3xl shadow-sm h-full flex flex-col justify-center animate-in slide-in-from-right duration-500 overflow-hidden">
        <div className="flex items-center gap-2 mb-6 w-full">
          <EventIcon size={18} className={`shrink-0 ${event.color === 'rose' ? 'text-rose-500' : 'text-blue-500'}`} />
          <span className="text-[7.5px] font-black text-slate-800 uppercase tracking-[-0.07em] whitespace-nowrap overflow-hidden text-ellipsis">
            {event.type}
          </span>
        </div>
        <div className="space-y-4">
          <div className="flex">
            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-wider ${event.color === 'rose' ? 'bg-rose-500' : 'bg-emerald-500'}`}>
              {event.status}
            </span>
          </div>
          <div className="flex flex-col">
            <span className={`text-3xl font-black tracking-tight ${event.color === 'rose' ? 'text-rose-600' : 'text-slate-900'}`}>
              {event.mainValue}
            </span>
            <span className="text-[11px] font-bold text-slate-400 mt-2">{event.subValue}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
