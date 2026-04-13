/**
 * PatientList.jsx
 * -----------------------------------------------
 * 전체 환자 목록 테이블 뷰
 * - 검색 필터 (이름/ID)
 * - 경고 환자 필터 토글
 * - 실시간 신호 패턴 스파크라인 표시
 * - 행 클릭 시 환자 상세 페이지로 이동
 */
import React, { useState } from "react";
import { Search, AlertCircle } from "lucide-react";
import Sparkline from "../common/Sparkline";

const PatientList = ({ onNavigate, patients }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  const filtered = patients.filter((p) => {
    const matchesSearch = p.name.includes(searchTerm) || p.id.includes(searchTerm);
    const matchesFilter = filterType === "WARNING" ? p.status === "warning" : true;
    return matchesSearch && matchesFilter;
  });

  const toggleFilter = () =>
    setFilterType((prev) => (prev === "WARNING" ? "ALL" : "WARNING"));

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* ── 필터 & 검색 바 ── */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold shadow-lg transition-all ${
              filterType === "ALL"
                ? "bg-blue-600 text-white shadow-blue-900/20"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            전체 ({patients.length})
          </button>
          <button
            onClick={toggleFilter}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 border transition-all ${
              filterType === "WARNING"
                ? "bg-rose-900/40 border-rose-600 text-rose-400 shadow-[0_0_10px_rgba(225,29,72,0.3)]"
                : "bg-rose-900/10 border-rose-900/30 text-rose-500 hover:bg-rose-900/20"
            }`}
          >
            <AlertCircle size={14} /> 경고 ({patients.filter((p) => p.status === "warning").length})
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="환자 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 w-64"
          />
        </div>
      </div>

      {/* ── 테이블 헤더 ── */}
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_1fr_1.5fr] gap-4 px-6 py-3 bg-slate-900/50 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <div>환자 정보</div>
        <div>BP (MMHG)</div>
        <div>PR (BPM)</div>
        <div>SPO2 (%)</div>
        <div>RR (RPM)</div>
        <div>체온 (°C)</div>
        <div>상태</div>
        <div className="text-right">신호 패턴 (REAL-TIME)</div>
      </div>

      {/* ── 환자 행 목록 ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900">
        {filtered.map((patient) => (
          <div
            key={patient.id}
            onClick={() => onNavigate("detail", patient)}
            className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_1fr_1.5fr] gap-4 px-6 py-4 items-center border-b border-slate-800/50 cursor-pointer transition-colors hover:bg-slate-800/80 ${
              patient.status === "warning" ? "bg-rose-950/10" : ""
            }`}
          >
            <div>
              <div className="text-slate-500 text-[10px] font-bold mb-0.5">{patient.ward}</div>
              <div className="text-lg font-bold text-white leading-tight">{patient.maskedName}</div>
              <div className="text-xs text-slate-500 mt-0.5">{patient.dept} | {patient.doctor}</div>
            </div>
            <div className={`text-lg font-bold ${patient.isHighBp ? "text-rose-500 animate-blink-slow" : "text-slate-300"}`}>
              {patient.bpSys} <span className="text-slate-600 text-sm">/ {patient.bpDia}</span>
            </div>
            <div className={`text-lg font-bold ${patient.isTachy ? "text-rose-500 animate-blink-slow" : "text-slate-300"}`}>{patient.pr}</div>
            <div className={`text-lg font-bold ${patient.isLowSpo2 ? "text-rose-500 animate-blink-slow" : "text-slate-300"}`}>{patient.spo2}</div>
            <div className="text-lg font-bold text-slate-300">{patient.rr}</div>
            <div className={`text-lg font-bold ${patient.isFever ? "text-rose-500 animate-blink-slow" : "text-slate-300"}`}>{patient.bodyTemp}</div>
            <div>
              {patient.status === "disconnected" ? (
                <span className="px-3 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold">Disconnected</span>
              ) : patient.status === "warning" ? (
                <span className="px-3 py-1 rounded bg-rose-950/30 border border-rose-900/50 text-rose-400 text-xs font-bold animate-pulse">Check<br />Required</span>
              ) : (
                <span className="px-3 py-1 rounded bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs font-bold">Stable</span>
              )}
            </div>
            <div className="h-10 opacity-70">
              <Sparkline
                data={patient.signalPattern}
                color={patient.status === "warning" ? "#f43f5e" : patient.status === "disconnected" ? "#475569" : "#10b981"}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientList;
