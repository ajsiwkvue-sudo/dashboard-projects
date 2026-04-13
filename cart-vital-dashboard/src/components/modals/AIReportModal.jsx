/**
 * AIReportModal.jsx
 * -----------------------------------------------
 * AI 환자 분석 리포트 모달
 * - 환자의 바이탈 데이터를 기반으로 한 AI 분석 결과 표시
 * - EMR(전자의무기록) 전송 기능 UI 포함
 */
import React from "react";
import { X, Sparkles, FileText } from "lucide-react";

const AIReportModal = ({ patient, onClose }) => {
  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1e293b] w-full max-w-2xl rounded-xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-[#172033]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="text-blue-400" size={18} /> AI 환자 분석 리포트
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 리포트 본문 */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar text-slate-300 space-y-6 font-mono text-sm leading-relaxed">
          <div>
            <p className="text-slate-500 mb-4">[AI 스마트 분석 리포트]</p>
            <h3 className="text-white font-bold mb-2">1. 환자 정보</h3>
            <ul className="list-none space-y-1 pl-2 border-l-2 border-slate-700">
              <li>- 환자: {patient.name} ({patient.id})</li>
              <li>- 입원/수술일: 2026-01-10 / 2026-01-11</li>
              <li>- 진단명: Acute Appendicitis</li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold mb-2">
              2. 바이탈 분석 ({patient.status === "warning" ? "주의" : "안정"}):
            </h3>
            <ul className="list-none space-y-1 pl-2 border-l-2 border-slate-700">
              <li>- **전반적 상태**: {patient.status === "warning" ? "주의 요망" : "정상"}.</li>
              {patient.isHighBp && (
                <li className="text-rose-400">
                  - 혈압 상승 추세 (Current: {patient.bpSys}/{patient.bpDia})
                </li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold mb-2">
              3. 위험 평가: **{patient.status === "warning" ? "중등도" : "없음"}**
            </h3>
          </div>
        </div>

        {/* 하단 액션 */}
        <div className="p-4 border-t border-slate-700 bg-[#172033] flex justify-end gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-colors">
            <FileText size={14} /> EMR 전송
          </button>
          <button onClick={onClose} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-lg">
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIReportModal;
