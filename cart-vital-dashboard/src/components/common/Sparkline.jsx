/**
 * Sparkline.jsx
 * -----------------------------------------------
 * 소형 라인 차트 컴포넌트
 * - 환자 목록 테이블에서 실시간 신호 패턴 미니 차트로 사용
 */
import React from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const Sparkline = ({ data, color, height = 40 }) => (
  <div style={{ height, width: "100%" }}>
    <ResponsiveContainer>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default Sparkline;
