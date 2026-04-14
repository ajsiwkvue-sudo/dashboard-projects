import React, { useState } from 'react';
import { Activity, Search } from 'lucide-react';
import { OrganIcon } from '../shared/OrganIcon.jsx';
import { ORGAN_NAMES } from '../../data/patients.js';

const getStatusColorClass = (s) => (s >= 90 ? 'text-rose-500' : s >= 80 ? 'text-amber-500' : 'text-emerald-500');
const getStatusBgClass = (s) => (s >= 90 ? 'bg-rose-500' : s >= 80 ? 'bg-amber-500' : 'bg-emerald-500');

export const PatientMonitoring = ({ patients, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredPatients = patients.filter(
    (p) => p.name.includes(searchTerm) || p.id.includes(searchTerm),
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden text-slate-900 animate-in fade-in duration-500">
      <div className="bg-[#dae8f7] border-b border-[#c5d9ed] px-8 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-blue-900 font-black">
            <Activity size={22} className="animate-pulse-soft" />
            <span className="text-lg tracking-tight uppercase">Med XAI Patient Monitor</span>
          </div>
          <div className="flex items-center bg-white rounded-xl border border-slate-200 px-4 py-1.5 shadow-sm">
            <Search size={14} className="text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="환자 이름 또는 ID 검색"
              className="bg-transparent text-[11px] outline-none text-slate-700 w-48 font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1400px]">
          <thead className="sticky top-0 bg-white text-slate-400 text-[9px] font-black uppercase border-b border-slate-200 z-10">
            <tr>
              <th className="px-8 py-3 w-[150px]">환자이름</th>
              <th className="px-4 py-3 text-center w-[110px]">현재 / 예측</th>
              {ORGAN_NAMES.map((organ) => (
                <th key={organ} className="px-4 py-3 text-center w-[100px]">{organ}</th>
              ))}
              <th className="px-6 py-3 text-center">바이탈 요약</th>
              <th className="px-8 py-3 text-right w-[100px]">체크시간</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPatients.map((p) => (
              <tr
                key={p.id}
                onClick={() => onSelect(p)}
                className="hover:bg-blue-50/20 cursor-pointer transition-colors group"
              >
                <td className="px-8 py-4">
                  <div className="text-[14px] font-black text-slate-900 leading-tight">{p.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.id} | {p.gender[0]}({p.age})</div>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full shadow-sm ${getStatusBgClass(p.score)}`} />
                      <div className={`w-3.5 h-3.5 rounded-full shadow-sm ${getStatusBgClass(p.predictedScore)}`} />
                    </div>
                    <span className={`text-[12px] font-mono font-black ${getStatusColorClass(p.score)}`}>
                      {p.score}% → {p.predictedScore}%
                    </span>
                  </div>
                </td>
                {ORGAN_NAMES.map((organName) => {
                  const organData = p.targetOrgans.find((o) => o.name === organName);
                  const isHigh = organData && organData.score > 85;
                  return (
                    <td key={organName} className="px-4 py-4 text-center align-middle">
                      <div className="flex flex-col items-center">
                        <OrganIcon
                          name={organName}
                          size={30}
                          className={isHigh ? 'text-rose-500 organ-icon-danger' : 'text-slate-400'}
                        />
                        <span className={`text-[12px] font-mono font-black mt-1.5 ${isHigh ? 'text-rose-600' : 'text-slate-600'}`}>
                          {organData ? `${organData.score}%` : '-'}
                        </span>
                      </div>
                    </td>
                  );
                })}
                <td className="px-6 py-4">
                  <div className="grid grid-cols-4 gap-2 w-full h-full">
                    {[
                      { l: 'BP', v: p.vitals.bp },
                      { l: 'PR', v: p.vitals.pr },
                      { l: 'SPO2', v: p.vitals.spo2 + '%' },
                      { l: 'BT', v: p.vitals.bt },
                    ].map((vit, idx) => (
                      <div
                        key={idx}
                        className="bg-white border rounded-xl px-2 py-3 flex flex-col items-center justify-center shadow-sm transition-colors min-h-[54px] border-slate-200"
                      >
                        <span className="text-[10px] font-black uppercase tracking-tighter mb-1 text-slate-400">{vit.l}</span>
                        <span className="text-[13px] font-black leading-none text-slate-800">{vit.v}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-8 py-4 text-right font-mono font-black text-[11px] text-slate-900">{p.checkTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
