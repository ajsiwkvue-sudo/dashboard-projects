/**
 * StatusBadge.jsx
 * -----------------------------------------------
 * 환자 상태 배지 컴포넌트
 * - normal: 초록 (정상)
 * - warning: 빨강 + 펄스 애니메이션 (경고)
 * - disconnected: 회색 (연결 끊김)
 */
import React from "react";

const StatusBadge = ({ status, text }) => {
  const styles = {
    normal: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    warning: "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse",
    disconnected: "bg-slate-700 text-slate-400 border-slate-600",
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${styles[status]}`}>
      {text}
    </span>
  );
};

export default StatusBadge;
