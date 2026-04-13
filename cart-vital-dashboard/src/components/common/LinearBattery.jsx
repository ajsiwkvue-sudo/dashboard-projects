/**
 * LinearBattery.jsx
 * -----------------------------------------------
 * 배터리 잔량 시각화 컴포넌트
 * - 30% 미만: 빨강, 60% 미만: 주황, 이상: 초록
 * - 프로그레스 바 + 퍼센트 텍스트
 */
import React from "react";

const LinearBattery = ({ value }) => {
  const v = Math.max(0, Math.min(100, value));
  let color = "bg-emerald-500";
  if (v < 30) color = "bg-rose-500";
  else if (v < 60) color = "bg-amber-500";

  return (
    <div className="flex items-center gap-3 w-full max-w-[140px]">
      <div className="h-2 flex-1 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${v}%` }}
        />
      </div>
      <span className={`text-xs font-bold w-9 text-right ${v < 30 ? "text-rose-400" : "text-slate-400"}`}>
        {v}%
      </span>
    </div>
  );
};

export default LinearBattery;
