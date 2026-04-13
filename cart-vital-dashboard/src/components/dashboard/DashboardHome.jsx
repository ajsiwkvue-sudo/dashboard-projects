/**
 * DashboardHome.jsx
 * -----------------------------------------------
 * 메인 대시보드 홈 화면
 * - 전체 환자 수, 연결 끊김, 경고 환자 요약
 * - 생체신호별 경고 분포 (미니 게이지 차트)
 * - 호버 시 환자 상세 목록 팝업
 */
import React, { useState, useMemo } from "react";
import {
  Users, Activity, AlertCircle, Thermometer, Wifi, ChevronRight,
} from "lucide-react";

const DashboardHome = ({ onNavigate, patients }) => {
  const [hoveredSection, setHoveredSection] = useState(null);

  const stats = useMemo(() => ({
    total: patients.length,
    disconnected: patients.filter((p) => p.status === "disconnected"),
    checkRequired: patients.filter((p) => p.status === "warning"),
    fever: patients.filter((p) => p.isFever),
    highBp: patients.filter((p) => p.isHighBp),
    highPr: patients.filter((p) => p.isTachy),
    lowSpo2: patients.filter((p) => p.isLowSpo2),
    rrIssue: patients.filter((p) => p.rr > 20 || p.rr < 10),
    btIssue: patients.filter((p) => p.isFever),
  }), [patients]);

  // ── 호버 팝업: 해당 카테고리 환자 목록 표시 ──
  const HoverPopup = ({ title, list, colorClass = "text-white" }) => (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-[100] w-64 bg-[#1e293b] border border-slate-600 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-700 backdrop-blur-sm flex justify-between items-center">
        <span className={`font-bold text-sm ${colorClass}`}>{title}</span>
        <span className="text-xs text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">{list.length}명</span>
      </div>
      <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
        {list.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-500">해당 환자가 없습니다.</div>
        ) : (
          list.map((p) => (
            <div key={p.id} className="flex justify-between items-center p-2.5 hover:bg-white/5 rounded-lg cursor-pointer border-b border-slate-800/50 last:border-0 transition-colors group">
              <div>
                <div className="text-sm font-bold text-slate-200 group-hover:text-white">{p.maskedName}</div>
                <div className="text-[10px] text-slate-500">{p.ward} | {p.id}</div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold ${colorClass}`}>
                  {title.includes("혈압") ? `${p.bpSys}/${p.bpDia}` :
                   title.includes("맥박") ? `${p.pr}` :
                   title.includes("산소") ? `${p.spo2}%` :
                   title.includes("체온") ? `${p.bodyTemp}°C` :
                   title.includes("호흡") ? `${p.rr} rpm` :
                   title.includes("연결") ? "Loss" : "Check"}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1e293b] border-r border-b border-slate-600 rotate-45" />
    </div>
  );

  // ── 미니 게이지 차트: SVG 원형 프로그레스 ──
  const MiniGauge = ({ count, total, color, label, subLabel }) => {
    const pct = (count / total) * 100;
    const r = 32;
    const c = 2 * Math.PI * r;
    const dash = (pct / 100) * c;

    return (
      <div className="relative flex flex-col items-center justify-center h-full">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="transform -rotate-90 w-full h-full">
            <circle cx="48" cy="48" r={r} stroke="#334155" strokeWidth="8" fill="transparent" opacity="0.2" />
            <circle cx="48" cy="48" r={r} stroke={color} strokeWidth="8" fill="transparent"
              strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
              className="transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute text-center flex flex-col items-center">
            <div className="text-2xl font-black text-white leading-none">{count}</div>
            <div className="text-[10px] text-slate-500 font-bold mt-0.5">/ {total}</div>
          </div>
        </div>
        <div className="mt-3 text-center">
          <div className="text-sm font-bold text-slate-200 mb-1">{label}</div>
          <span className="text-[10px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/50">
            {subLabel}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-5">
      {/* ── 상단: 전체 환자 수 + 경고 카드 ── */}
      <div className="grid grid-cols-12 gap-5 h-[320px]">
        <div className="col-span-5 bg-[#172033] rounded-2xl p-8 border border-slate-800 relative flex flex-col justify-center shadow-lg group">
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <Users className="absolute -right-6 -top-6 text-slate-800/50 w-48 h-48 group-hover:text-blue-900/20 transition-colors duration-500" />
          </div>
          <div className="relative z-10">
            <div className="text-xs font-extrabold text-slate-500 tracking-widest uppercase mb-4">Total Patients</div>
            <div className="flex items-baseline gap-1">
              <span className="text-8xl font-black text-white tracking-tighter">{stats.total}</span>
              <span className="text-2xl font-bold text-slate-600">명</span>
            </div>
            <div className="mt-8 flex items-center gap-3 bg-slate-800/50 w-fit px-4 py-2 rounded-full border border-slate-700/50">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="text-sm text-slate-300 font-bold">실시간 모니터링 정상 가동</span>
            </div>
          </div>
        </div>

        <div className="col-span-7 flex flex-col gap-3">
          {/* 연결 끊김 */}
          <div className="flex-1 bg-[#172033] rounded-xl border border-slate-800 p-5 flex items-center justify-between hover:border-slate-600 transition-all cursor-pointer relative group"
            onMouseEnter={() => setHoveredSection("disconnected")}
            onMouseLeave={() => setHoveredSection(null)}
            style={{ zIndex: hoveredSection === "disconnected" ? 50 : 1 }}>
            {hoveredSection === "disconnected" && <HoverPopup title="연결 끊김" list={stats.disconnected} colorClass="text-slate-400" />}
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors"><Wifi size={24} /></div>
              <div>
                <div className="text-amber-500 font-bold text-base mb-1">연결 끊김 ({stats.disconnected.length}명)</div>
                <div className="text-xs text-slate-500 font-medium">{stats.disconnected.length > 0 ? "신호 미수신 상태" : "모든 기기 정상 연결 중"}</div>
              </div>
            </div>
            <ChevronRight className="text-slate-700 group-hover:text-white" size={20} />
          </div>

          {/* 확인 필요 */}
          <div className="flex-1 bg-[#172033] rounded-xl border border-rose-900/30 p-5 flex items-center justify-between hover:bg-rose-950/20 hover:border-rose-700/50 transition-all cursor-pointer relative group"
            onMouseEnter={() => setHoveredSection("warning")}
            onMouseLeave={() => setHoveredSection(null)}
            onClick={() => onNavigate("patients", null, "warning")}
            style={{ zIndex: hoveredSection === "warning" ? 50 : 1 }}>
            {hoveredSection === "warning" && <HoverPopup title="확인 필요" list={stats.checkRequired} colorClass="text-rose-400" />}
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-rose-900/20 flex items-center justify-center text-rose-500 animate-pulse-soft"><AlertCircle size={24} /></div>
              <div>
                <div className="text-rose-400 font-bold text-base mb-1">연결 확인 필요 <span className="text-white ml-1 text-lg">{stats.checkRequired.length}</span> 명</div>
                <div className="text-xs text-rose-500/70 font-medium">생체신호 이상 감지</div>
              </div>
            </div>
            <ChevronRight className="text-slate-700 group-hover:text-rose-400" size={20} />
          </div>

          {/* 발열 환자 */}
          <div className="flex-1 bg-[#172033] rounded-xl border border-slate-800 p-5 flex items-center justify-between hover:border-slate-600 transition-all cursor-pointer relative group"
            onMouseEnter={() => setHoveredSection("fever")}
            onMouseLeave={() => setHoveredSection(null)}
            style={{ zIndex: hoveredSection === "fever" ? 50 : 1 }}>
            {hoveredSection === "fever" && <HoverPopup title="발열 환자" list={stats.fever} colorClass="text-amber-400" />}
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-amber-400 transition-colors"><Thermometer size={24} /></div>
              <div>
                <div className="text-slate-200 font-bold text-base mb-1">발열 환자 (37.5°C↑)</div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-white leading-none">{stats.fever.length}</span>
                  <span className="text-xs text-slate-500 font-medium mb-0.5">명 모니터링 중</span>
                </div>
              </div>
            </div>
            <ChevronRight className="text-slate-700 group-hover:text-white" size={20} />
          </div>
        </div>
      </div>

      {/* ── 하단: 생체신호별 경고 분포 게이지 ── */}
      <div className="flex-1 bg-[#111827] rounded-2xl border border-slate-800 p-6 flex flex-col">
        <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
          <Activity className="text-blue-500" size={20} /> 생체신호별 경고(Warning) 분포
        </h3>
        <div className="flex-1 grid grid-cols-5 gap-4">
          {[
            { key: "bp", list: stats.highBp, color: "#f43f5e", label: "혈압 (BP)", subLabel: "고혈압 주의", title: "혈압 (BP)", colorClass: "text-rose-500" },
            { key: "pr", list: stats.highPr, color: "#10b981", label: "맥박 (PR)", subLabel: "빈맥 주의", title: "맥박 (PR)", colorClass: "text-emerald-500" },
            { key: "spo2", list: stats.lowSpo2, color: "#3b82f6", label: "산소포화도", subLabel: "저산소증", title: "산소포화도", colorClass: "text-blue-500" },
            { key: "rr", list: stats.rrIssue, color: "#f59e0b", label: "호흡수 (RR)", subLabel: "과호흡/저호흡", title: "호흡수 (RR)", colorClass: "text-amber-500" },
            { key: "bt", list: stats.btIssue, color: "#a855f7", label: "체온 (BT)", subLabel: "고열 주의", title: "체온 (BT)", colorClass: "text-purple-500" },
          ].map(({ key, list, color, label, subLabel, title, colorClass }) => (
            <div key={key}
              className="bg-[#1f2937] rounded-xl border border-slate-700/50 p-4 relative hover:bg-[#2d3748] transition-colors cursor-pointer h-full"
              onMouseEnter={() => setHoveredSection(key)}
              onMouseLeave={() => setHoveredSection(null)}
              style={{ zIndex: hoveredSection === key ? 50 : 1 }}>
              {hoveredSection === key && <HoverPopup title={title} list={list} colorClass={colorClass} />}
              <MiniGauge count={list.length} total={stats.total} color={color} label={label} subLabel={subLabel} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
