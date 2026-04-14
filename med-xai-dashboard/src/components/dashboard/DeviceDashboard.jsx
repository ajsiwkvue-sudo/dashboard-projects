import React, { useState, useMemo } from 'react';
import {
  Activity, ChevronRight, Plus, Monitor, TrendingUp,
  Repeat, Timer, Package, UserCheck, RotateCcw, BatteryCharging, Wrench,
} from 'lucide-react';
import { devices, VENDORS } from '../../data/devices.js';

export const DeviceDashboard = () => {
  const [hoveredStatusIdx, setHoveredStatusIdx] = useState(null);
  const totalCount = devices.length;

  const statusStats = useMemo(() => ({
    total: totalCount,
    storing: devices.filter((d) => d.status === '보관').length,
    using: devices.filter((d) => d.status === '사용').length,
    collecting: devices.filter((d) => d.status === '회수').length,
    charging: devices.filter((d) => d.status === '충전').length,
    repairing: devices.filter((d) => d.status === '수리').length,
  }), [totalCount]);

  const utilizationRate = Math.round((statusStats.using / totalCount) * 100);

  const vendorStats = useMemo(
    () => VENDORS.map((v, idx) => {
      const items = devices.filter((d) => d.vendor === v);
      return {
        name: v,
        total: items.length,
        using: items.filter((i) => i.status === '사용').length,
        storing: items.filter((i) => i.status === '보관').length,
        charging: items.filter((i) => i.status === '충전').length,
        repairing: items.filter((i) => i.status === '수리').length,
        turnover: [3.2, 2.8, 1.9, 4.1][idx],
        avgTime: [16.5, 12.2, 18.7, 14.5][idx],
      };
    }),
    [],
  );

  const statusCategories = [
    { label: '보관', value: statusStats.storing, icon: Package },
    { label: '사용', value: statusStats.using, icon: UserCheck },
    { label: '회수', value: statusStats.collecting, icon: RotateCcw },
    { label: '충전', value: statusStats.charging, icon: BatteryCharging },
    { label: '수리', value: statusStats.repairing, icon: Wrench },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-2xl overflow-hidden relative">
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><span>홈</span></div>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-500 font-black">System Ready</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 mb-12 relative z-10">
          <div className="col-span-3 bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 flex flex-col justify-center">
            <div className="text-xs text-slate-500 font-black uppercase mb-3 tracking-widest">Total Assets</div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-white">{totalCount}</span>
              <span className="text-lg text-slate-400">기기</span>
              <div className="ml-8 border-l border-slate-700 pl-6">
                <div className="text-xs text-slate-500 font-bold mb-1">가동 현황</div>
                <div className="text-lg font-black text-emerald-400">
                  {statusStats.using} <span className="text-slate-600">/ {totalCount}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-6 flex flex-col justify-center px-10">
            <div className="flex justify-between items-end mb-3">
              <div className="flex items-center gap-3 text-slate-300 font-black">
                <Activity size={20} className="text-blue-500" />
                <span className="text-sm">전체 가동률</span>
              </div>
              <span className="text-3xl font-black text-white">{utilizationRate}%</span>
            </div>
            <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] border border-slate-800 relative">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 rounded-full utilization-bar-glow relative overflow-hidden bar-fill-animation"
                style={{ '--target-width': `${utilizationRate}%` }}
              />
            </div>
          </div>
          <div className="col-span-3 flex items-center justify-end">
            <button className="bg-blue-600 hover:bg-blue-500 text-white font-black text-sm px-8 py-4 rounded-xl shadow-xl flex items-center gap-3 transition-all">
              <Plus size={18} /> 신규 기기 등록
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-6 relative z-10">
          {statusCategories.map((step, idx) => {
            const isHovered = hoveredStatusIdx === idx;
            const itemsInStatus = devices.filter((d) => d.status === step.label);
            const StepIcon = step.icon;
            return (
              <div key={idx} className="flex items-center gap-3 relative">
                <div
                  className={`relative flex-1 p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all cursor-help z-20 ${
                    isHovered
                      ? 'bg-blue-600/20 border-blue-500/60 shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-[1.02]'
                      : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50'
                  }`}
                  onMouseEnter={() => setHoveredStatusIdx(idx)}
                  onMouseLeave={() => setHoveredStatusIdx(null)}
                >
                  <StepIcon size={36} className={isHovered ? 'text-blue-400 animate-pulse' : 'text-slate-500'} />
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-slate-400 font-bold mb-1">{step.label}</span>
                    <span className={`text-2xl font-black ${isHovered ? 'text-white' : 'text-slate-300'}`}>{step.value}</span>
                  </div>
                </div>

                {isHovered && itemsInStatus.length > 0 && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex justify-between items-center text-[10px] text-blue-400 font-black uppercase mb-3 border-b border-slate-700 pb-2 tracking-widest">
                      <span>장비(제조사)</span>
                      <span>환자명</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {itemsInStatus.map((d, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-blue-900/20 transition-colors text-[11px]"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span className="font-bold text-slate-200">{d.vendor}</span>
                          </div>
                          <span className="text-slate-400 font-bold">{d.patient}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {idx < 4 && <ChevronRight size={18} className="text-slate-700 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 bg-[#0f172a] border border-slate-800 rounded-2xl p-10 shadow-xl">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black text-white flex items-center gap-4">
              <Monitor size={24} className="text-blue-500" /> 제조사별 장비 모니터링 현황
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {vendorStats.map((v, i) => (
              <div
                key={i}
                className="p-8 border border-slate-800 rounded-2xl bg-slate-800/20 hover:bg-slate-800/40 border-l-4 border-l-blue-600 transition-all"
              >
                <div className="text-sm text-blue-400 font-black mb-4 border-b border-blue-500/10 pb-2 inline-block tracking-widest uppercase">
                  {v.name}
                </div>
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-7xl font-black text-white">{v.total}</span>
                  <span className="text-sm text-slate-500 uppercase font-bold tracking-widest">Units</span>
                </div>
                <div className="grid grid-cols-4 gap-4 font-bold">
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px] mb-2 uppercase">사용</span>
                    <span className="text-blue-400 text-3xl font-black">{v.using}</span>
                  </div>
                  <div className="flex flex-col"><span className="text-slate-300 text-3xl font-black">{v.storing}</span></div>
                  <div className="flex flex-col"><span className="text-emerald-500 text-3xl font-black">{v.charging}</span></div>
                  <div className="flex flex-col"><span className="text-amber-500 text-3xl font-black">{v.repairing}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-4 bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-3 text-slate-300 font-black mb-8 border-b border-slate-800 pb-4">
            <TrendingUp size={22} className="text-blue-500" />
            <h2 className="text-lg uppercase">제조사별 운영 효율 KPI</h2>
          </div>
          <div className="space-y-4">
            {vendorStats.map((v, i) => (
              <div
                key={i}
                className="bg-slate-800/20 border border-slate-800 rounded-xl p-5 hover:bg-slate-800/40 transition-all group"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black text-blue-400 tracking-widest uppercase">{v.name}</span>
                  <div className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-bold">In Operation</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Repeat size={12} />
                      <span className="text-[10px] font-bold uppercase">장비 회전율</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white">{v.turnover}</span>
                      <span className="text-[10px] text-slate-600 font-bold">회</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Timer size={12} />
                      <span className="text-[10px] font-bold uppercase">평균 사용시간</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white">{v.avgTime}</span>
                      <span className="text-[10px] text-slate-600 font-bold">h/d</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
