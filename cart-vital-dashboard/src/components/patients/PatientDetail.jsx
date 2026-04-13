/**
 * PatientDetail.jsx
 * -----------------------------------------------
 * 개별 환자 상세 모니터링 페이지
 * - 24시간 바이탈 추이 차트 (혈압, 맥박, SpO2, 호흡수, 체온)
 * - 현재 수치 하이라이트 표시
 * - AI 분석 리포트 모달 연동
 */
import React, { useState } from "react";
import {
  ArrowLeft, ChevronRight, Sparkles, Activity, HeartPulse,
  Wind, Stethoscope, Thermometer,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import AIReportModal from "../modals/AIReportModal";

const PatientDetail = ({ patient, onBack }) => {
  const [showAIReport, setShowAIReport] = useState(false);
  if (!patient) return null;

  // 공통 차트 설정
  const commonGrid = <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />;
  const commonXAxis = <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} interval={3} />;
  const commonTooltip = <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff" }} />;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 relative pb-12">
      {showAIReport && <AIReportModal patient={patient} onClose={() => setShowAIReport(false)} />}

      {/* ── 브레드크럼 내비게이션 ── */}
      <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
        <span onClick={onBack} className="hover:text-white cursor-pointer transition-colors">홈</span>
        <ChevronRight size={14} />
        <span onClick={onBack} className="hover:text-white cursor-pointer transition-colors">전체 환자 관리</span>
        <ChevronRight size={14} />
        <span className="font-bold text-blue-400">{patient.id}</span>
      </div>

      {/* ── 환자 정보 헤더 ── */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-700 p-6 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{patient.maskedName}</h1>
              {patient.status === "warning" && (
                <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30">확인 필요</span>
              )}
            </div>
            <div className="text-sm text-slate-500 mt-1 flex items-center gap-3 font-mono">
              <span>기기 정보: F123456-12345</span>
              <span className="w-1 h-1 bg-slate-700 rounded-full" />
              <span>{patient.id}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAIReport(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all shadow-lg shadow-violet-900/30">
            <Sparkles size={16} /> AI 분석 리포트
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/30 cursor-default">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> 실시간 모니터링 중
          </button>
        </div>
      </div>

      {/* ── 바이탈 차트 섹션 ── */}
      <div className="space-y-4">
        {/* 혈압 (BP) */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden flex h-64 shadow-lg">
          <div className="w-[75%] p-6 border-r border-slate-700 relative">
            <div className="flex items-center gap-2 text-rose-500 font-bold mb-4"><Activity size={20} /> 혈압 (BP)</div>
            <div className="absolute top-6 right-6 text-xs text-slate-500">24시간 추이</div>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={patient.history24h}>
                {commonGrid}{commonXAxis}{commonTooltip}
                <Line type="monotone" dataKey="bpSys" stroke="#f43f5e" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="bpDia" stroke="#fb7185" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="w-[25%] flex flex-col items-center justify-center bg-[#172033]">
            <div className="text-xs text-rose-400 font-bold mb-2 uppercase">Current Value</div>
            <div className="text-5xl font-extrabold text-white tracking-tight">{patient.bpSys}<span className="text-3xl text-slate-500">/{patient.bpDia}</span></div>
            <div className="text-slate-500 font-bold mt-2">mmHg</div>
          </div>
        </div>

        {/* 맥박 (PR) */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden flex h-56 shadow-lg">
          <div className="w-[75%] p-6 border-r border-slate-700 relative">
            <div className="flex items-center gap-2 text-emerald-500 font-bold mb-4"><HeartPulse size={20} /> 맥박 (PR)</div>
            <div className="absolute top-6 right-6 text-xs text-slate-500">24시간 추이</div>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={patient.history24h}>
                <defs><linearGradient id="colorPr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                {commonGrid}{commonXAxis}{commonTooltip}
                <Area type="monotone" dataKey="pr" stroke="#10b981" fill="url(#colorPr)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="w-[25%] flex flex-col items-center justify-center bg-[#172033]">
            <div className="text-xs text-emerald-400 font-bold mb-2 uppercase">Current Value</div>
            <div className="text-5xl font-extrabold text-white tracking-tight">{patient.pr}</div>
            <div className="text-slate-500 font-bold mt-1 text-sm">bpm</div>
          </div>
        </div>

        {/* 산소포화도 (SpO2) */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden flex h-48 shadow-lg">
          <div className="w-[75%] p-6 border-r border-slate-700 relative">
            <div className="flex items-center gap-2 text-blue-500 font-bold mb-4"><Wind size={20} /> 산소포화도 (SpO2)</div>
            <div className="absolute top-6 right-6 text-xs text-slate-500">24시간 추이</div>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={patient.history24h}>
                {commonGrid}{commonXAxis}{commonTooltip}
                <YAxis domain={[80, 100]} hide />
                <Line type="monotone" dataKey="spo2" stroke="#3b82f6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="w-[25%] flex flex-col items-center justify-center bg-[#172033]">
            <div className="text-xs text-blue-400 font-bold mb-2 uppercase">Current Value</div>
            <div className="text-5xl font-extrabold text-white tracking-tight">{patient.spo2}%</div>
            <div className="text-slate-500 font-bold mt-1 text-sm">Normal Range</div>
          </div>
        </div>

        {/* 호흡수 + 체온 (2열 그리드) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden flex h-48 shadow-lg">
            <div className="w-[65%] p-5 border-r border-slate-700 relative">
              <div className="flex items-center gap-2 text-amber-500 font-bold mb-2"><Stethoscope size={20} /> 호흡수 (RR)</div>
              <ResponsiveContainer width="100%" height="80%">
                <LineChart data={patient.history24h}>
                  {commonGrid}{commonXAxis}{commonTooltip}
                  <Line type="step" dataKey="rr" stroke="#f59e0b" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="w-[35%] flex flex-col items-center justify-center bg-[#172033]">
              <div className="text-4xl font-extrabold text-white tracking-tight">{patient.rr}</div>
              <div className="text-slate-500 font-bold mt-1 text-xs">rpm</div>
            </div>
          </div>
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden flex h-48 shadow-lg">
            <div className="w-[65%] p-5 border-r border-slate-700 relative">
              <div className="flex items-center gap-2 text-purple-500 font-bold mb-2"><Thermometer size={20} /> 체온 (BT)</div>
              <ResponsiveContainer width="100%" height="80%">
                <LineChart data={patient.history24h}>
                  {commonGrid}{commonXAxis}{commonTooltip}
                  <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} hide />
                  <Line type="monotone" dataKey="bodyTemp" stroke="#a855f7" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="w-[35%] flex flex-col items-center justify-center bg-[#172033]">
              <div className={`text-4xl font-extrabold tracking-tight ${patient.isFever ? "text-rose-500" : "text-white"}`}>{patient.bodyTemp}</div>
              <div className="text-slate-500 font-bold mt-1 text-xs">°C</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
