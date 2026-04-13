/**
 * GlobalStyles.jsx
 * -----------------------------------------------
 * 전역 CSS 애니메이션 및 커스텀 스크롤바 스타일 정의
 */
import React from "react";

const GlobalStyles = () => (
  <style>{`
    /* 커스텀 스크롤바 */
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 99px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }

    /* 글래스모피즘 패널 */
    .glass-panel {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.08);
    }

    /* 부드러운 펄스 애니메이션 */
    .animate-pulse-soft { animation: pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes pulseSoft { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }

    /* 플로팅 애니메이션 */
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
    .animate-float { animation: float 4s ease-in-out infinite; }

    /* 시머 효과 (프로그레스 바) */
    @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

    /* 경고 깜빡임 (빨간색) */
    @keyframes blinkRed {
      0%, 100% { color: #f43f5e; opacity: 1; }
      50% { color: #fb7185; opacity: 0.6; }
    }
    .animate-blink-slow { animation: blinkRed 1.5s ease-in-out infinite; }
  `}</style>
);

export default GlobalStyles;
