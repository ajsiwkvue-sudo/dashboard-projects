/**
 * App.jsx
 * -----------------------------------------------
 * CART VITAL - 병원 환자 바이탈 모니터링 대시보드
 *
 * 주요 기능:
 * 1. 대시보드 홈: 전체 환자 현황, 경고 알림, 생체신호별 분포
 * 2. 환자 관리: 전체 환자 목록 및 개별 상세 모니터링
 * 3. 물류 관리: 기기 자산 추적, 배송/회수 관리
 * 4. 설정: 바이탈 경고 임계값 설정
 *
 * 기술 스택: React 18 + Recharts + Tailwind CSS + Lucide Icons
 */
import React, { useState, useEffect } from "react";
import {
  Users, Bell, ChevronRight, LayoutDashboard, Settings,
  Monitor, Truck, X,
} from "lucide-react";

// 스타일 & 유틸리티
import GlobalStyles from "./styles/GlobalStyles";
import { generatePatients, generateNextDataPoint } from "./utils/dataGenerators";

// 페이지 컴포넌트
import DashboardHome from "./components/dashboard/DashboardHome";
import PatientList from "./components/patients/PatientList";
import PatientDetail from "./components/patients/PatientDetail";
import LogisticsManager from "./components/logistics/LogisticsManager";
import VitalSettings from "./components/settings/VitalSettings";

const App = () => {
  // ── 상태 관리 ──
  const [activeTab, setActiveTab] = useState("home");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState(() => generatePatients(20));
  const [isNotiOpen, setIsNotiOpen] = useState(false);

  // ── 실시간 신호 패턴 업데이트 (500ms 간격) ──
  useEffect(() => {
    document.body.className =
      "bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white";

    const interval = setInterval(() => {
      setPatients((current) =>
        current.map((p) => {
          const nextPoint = generateNextDataPoint(p.status);
          return { ...p, signalPattern: [...p.signalPattern.slice(1), nextPoint] };
        })
      );
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // ── 페이지 네비게이션 핸들러 ──
  const handleNavigate = (tab, patient = null) => {
    setActiveTab(tab);
    if (patient) setSelectedPatient(patient);
  };

  // ── 사이드바 네비게이션 아이템 ──
  const NavItem = ({ id, label, icon: Icon, badge }) => (
    <button
      onClick={() => handleNavigate(id)}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
        activeTab === id
          ? "bg-blue-600 text-white shadow-lg font-bold"
          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
      }`}
    >
      <Icon size={20} />
      <span className="flex-1 text-left text-sm">{label}</span>
      {badge && (
        <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );

  const notifications = patients.filter((p) => p.status === "warning").slice(0, 5);

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden">
      <GlobalStyles />

      {/* ══════════════ 사이드바 ══════════════ */}
      <aside className="w-72 bg-[#0b1121] border-r border-slate-800/50 flex flex-col z-20">
        {/* 로고 */}
        <div className="h-20 flex items-center px-6 gap-3 border-b border-slate-800/50">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold shadow-lg">
            C
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">CART VITAL</span>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 p-4 space-y-2">
          <div className="text-xs font-bold text-slate-500 px-4 py-2 uppercase tracking-wider">
            Dashboard
          </div>
          <NavItem id="home" label="대시보드 홈" icon={LayoutDashboard} />

          <div className="mt-6 text-xs font-bold text-slate-500 px-4 py-2 uppercase tracking-wider">
            Management
          </div>
          <NavItem id="patients" label="전체 환자 관리" icon={Users} />
          <NavItem id="logistics" label="물류/재고 통합 관리" icon={Truck} />
          <NavItem id="settings" label="관리항목 조건 설정" icon={Settings} />
        </nav>

        {/* 사용자 정보 */}
        <div className="p-4 m-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
              Dr.
            </div>
            <div>
              <div className="text-sm font-bold text-white">일산병원</div>
              <div className="text-xs text-slate-500">가정의학과</div>
            </div>
          </div>
          <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-400 transition-colors">
            로그아웃
          </button>
        </div>
      </aside>

      {/* ══════════════ 메인 컨텐츠 ══════════════ */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0f172a] relative">
        {/* 헤더 */}
        <header className="h-16 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="hover:text-white cursor-pointer transition-colors">홈</span>
            <ChevronRight size={14} />
            <span className="text-slate-200 font-bold">{activeTab}</span>
          </div>

          <div className="flex items-center gap-6">
            {/* 알림 벨 */}
            <div className="relative">
              <div
                onClick={() => setIsNotiOpen(!isNotiOpen)}
                className="relative cursor-pointer hover:text-white transition-colors text-slate-400"
              >
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] text-white flex items-center justify-center border border-slate-900">
                  {notifications.length}
                </span>
              </div>

              {/* 알림 드롭다운 */}
              {isNotiOpen && (
                <div className="absolute right-0 top-full mt-3 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[200]">
                  <div className="p-3 border-b border-slate-800 text-sm font-bold text-white flex justify-between items-center">
                    <span>최근 알림</span>
                    <span className="text-xs text-rose-400">{notifications.length}건의 경고</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((noti, idx) => (
                        <div
                          key={idx}
                          className="p-3 border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer flex gap-3"
                          onClick={() => { handleNavigate("detail", noti); setIsNotiOpen(false); }}
                        >
                          <div className="mt-1 w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          <div>
                            <div className="text-sm font-bold text-slate-200">{noti.maskedName} ({noti.id})</div>
                            <div className="text-xs text-rose-400 mt-0.5">이상 징후 감지: 확인 필요</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">새로운 알림이 없습니다.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-[1px] bg-slate-800" />

            {/* 시스템 상태 */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <Monitor size={14} className="text-emerald-500" />
              <span className="text-xs font-bold text-emerald-400">System Ready</span>
            </div>
          </div>
        </header>

        {/* 페이지 라우팅 */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          {activeTab === "home" && <DashboardHome onNavigate={handleNavigate} patients={patients} />}
          {activeTab === "patients" && <PatientList onNavigate={handleNavigate} patients={patients} />}
          {activeTab === "detail" && <PatientDetail patient={selectedPatient} onBack={() => handleNavigate("patients")} />}
          {activeTab === "logistics" && <LogisticsManager />}
          {activeTab === "settings" && <VitalSettings />}
        </div>
      </main>
    </div>
  );
};

export default App;
