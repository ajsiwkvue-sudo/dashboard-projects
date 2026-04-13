import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users, Activity, AlertCircle, Battery, Thermometer, Wifi, Search, Bell, Menu,
  ChevronRight, ArrowLeft, LayoutDashboard, Settings, UserCheck, HeartPulse, Wind,
  Monitor, X, Sparkles, FileText, Loader2, Clock, AlertTriangle, Stethoscope,
  Flame, Save, RotateCcw, Filter, CheckCircle, MapPin, User, Smartphone, Box,
  RefreshCw, Wrench, LogOut, Archive, AlertOctagon, PlayCircle, Truck, Package,
  ArrowRightLeft, ExternalLink, Pencil, Trash2, Plus, ChevronDown, ChevronUp,
  ArrowRight, CheckCircle2, MoreHorizontal, Check, Copy, Link2, Calendar, UserPlus,
  MessageSquare, PlusCircle, QrCode, Globe, CornerDownRight, Download, FileSpreadsheet
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

// ==================================================================================
// 0. GLOBAL STYLES & THEME
// ==================================================================================
const GlobalStyles = () => (
  <style>{`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 99px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
    .glass-panel { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.08); }
    .animate-pulse-soft { animation: pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
    .animate-float { animation: float 4s ease-in-out infinite; }
    @keyframes pulseSoft { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
    @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

    @keyframes blinkRed {
      0%, 100% { color: #f43f5e; opacity: 1; }
      50% { color: #fb7185; opacity: 0.6; }
    }
    .animate-blink-slow { animation: blinkRed 1.5s ease-in-out infinite; }
  `}</style>
);

// ==================================================================================
// 1. DATA GENERATION
// ==================================================================================
const generateAnomalyIntervals = () => {
  const intervals = [];
  if (Math.random() > 0.4) {
    const start1 = Math.floor(Math.random() * 10) + 2;
    intervals.push({ start: start1, end: start1 + 2 });
  }
  return intervals;
};

const generate24HourData = (anomalies, scenario) => {
  return Array.from({ length: 24 }).map((_, i) => {
    const isAbnormal = anomalies.some(interval => i >= interval.start && i < interval.end);
    let bpSys = 110 + Math.random() * 20;
    let bpDia = 70 + Math.random() * 15;
    let pr = 65 + Math.random() * 20;
    let spo2 = 96 + Math.random() * 3;
    let rr = 14 + Math.random() * 4;
    let bodyTemp = 36.5 + Math.random() * 0.5;

    if (isAbnormal) {
        switch(scenario) {
            case 'hypertension': bpSys = 160 + Math.random() * 30; bpDia = 100 + Math.random() * 20; break;
            case 'hypoxia': spo2 = 85 + Math.random() * 7; rr = 24 + Math.random() * 8; pr += 20; break;
            case 'fever': bodyTemp = 38.2 + Math.random() * 1.5; pr += 30; rr += 4; break;
            case 'tachycardia': pr = 120 + Math.random() * 30; break;
            default: bpSys += 20;
        }
    }
    return {
      time: `${String(i).padStart(2, '0')}:00`,
      bpSys, bpDia, pr, spo2, rr,
      bodyTemp: Number(bodyTemp.toFixed(1)),
      isAbnormal
    };
  });
};

const generateNextDataPoint = (status) => {
  let base = status === 'warning' ? 60 : 50;
  let noise = Math.random() * 20 - 10;
  return { value: base + noise };
};

const generatePatients = (count) => {
  const names = ['김철수', '이영희', '박철수', '최지혜', '정우성', '강동원', '한지민', '송혜교', '장동건', '원빈', '유재석', '강호동', '신동엽', '이경규', '김구라', '박명수', '정준하', '노홍철', '하동훈', '길성준'];
  const depts = ['IM', 'GS', 'NR', 'OS', 'FM'];

  return Array.from({ length: count }).map((_, i) => {
    const forceIssue = i < count / 2;
    let scenario = 'normal';

    if (forceIssue) {
        if (i % 5 === 0) scenario = 'hypertension';
        else if (i % 5 === 1) scenario = 'tachycardia';
        else if (i % 5 === 2) scenario = 'hypoxia';
        else if (i % 5 === 3) scenario = 'fever';
        else scenario = 'hypoxia';
    }

    const anomalies = forceIssue ? [{ start: 20, end: 24 }] : [];
    const history = generate24HourData(anomalies, scenario);

    if (scenario === 'hypertension') { history[23].bpSys = 160; history[23].isAbnormal = true; }
    if (scenario === 'tachycardia') { history[23].pr = 120; history[23].isAbnormal = true; }
    if (scenario === 'hypoxia') { history[23].spo2 = 88; history[23].rr = 25; history[23].isAbnormal = true; }
    if (scenario === 'fever') { history[23].bodyTemp = 38.5; history[23].isAbnormal = true; }

    const current = history[23];
    const isDisconnected = i > count - 3;

    const isHighBp = current.bpSys >= 150;
    const isTachy = current.pr >= 110;
    const isLowSpo2 = current.spo2 < 90;
    const isFever = current.bodyTemp >= 37.5;

    const isWarning = isHighBp || isTachy || isLowSpo2 || isFever;

    let status = 'normal';
    let event = 'Stable';
    if (isDisconnected) { status = 'disconnected'; event = 'Disconnected'; }
    else if (isWarning) { status = 'warning'; event = 'Check Required'; }

    return {
      id: `71-${String(i+1).padStart(4, '0')}`,
      name: names[i % names.length],
      maskedName: names[i % names.length][0] + '*' + names[i % names.length][2],
      ward: '71병동',
      dept: depts[i % depts.length],
      doctor: i % 2 === 0 ? '김닥터' : '이교수',
      bpSys: Math.floor(current.bpSys),
      bpDia: Math.floor(current.bpDia),
      pr: Math.floor(current.pr),
      spo2: Math.floor(current.spo2),
      rr: Math.floor(current.rr),
      bodyTemp: current.bodyTemp.toFixed(1),
      status,
      event,
      battery: isDisconnected ? 0 : Math.floor(Math.random() * 60 + 40),
      signalPattern: Array.from({ length: 40 }).map(() => ({ value: 50 + Math.random() * 10 })),
      history24h: history,
      isFever, isHighBp, isLowSpo2, isTachy
    };
  });
};

const generateAssets = (count) => {
    const courierStatuses = ['DISPATCH', 'DELAY', 'RETURN'];
    const hospitalStatuses = ['IN_USE', 'STORAGE', 'CLEANING', 'REPAIR'];
    const pTypes = ['입원', '외래', '지역사회'];
    const names = ['김철수', '이영희', '박민수', '최지혜', '정우성', '강동원', '한지민'];

    return Array.from({ length: count }).map((_, i) => {
        const pType = pTypes[i % pTypes.length];
        const rand = Math.random();
        let status = 'STORAGE';

        if (pType === '입원') {
            if (rand < 0.7) status = 'IN_USE';
            else if (rand < 0.8) status = 'CLEANING';
            else if (rand < 0.9) status = 'STORAGE';
            else status = 'REPAIR';
        } else {
            if (rand < 0.1) status = 'STORAGE';
            else if (rand < 0.2) status = 'DISPATCH';
            else if (rand < 0.25) status = 'DELAY';
            else if (rand < 0.75) status = 'IN_USE';
            else if (rand < 0.85) status = 'RETURN';
            else if (rand < 0.95) status = 'CLEANING';
            else status = 'REPAIR';
        }

        const hasUser = ['IN_USE', 'DISPATCH', 'DELAY', 'RETURN'].includes(status);
        const wearDate = hasUser ? new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] : '-';

        const roomLoc = Math.floor(Math.random() * 4) + 1;
        const roomType = 4;
        const roomNum = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
        const internalLocCode = `${roomLoc}${roomType}${roomNum}`;

        return {
            id: `CR-${String(i + 1).padStart(4, '0')}`,
            status,
            battery: Math.floor(Math.random() * 100),
            lastSync: new Date(Date.now() - Math.floor(Math.random() * 10000000)).toLocaleString(),
            patientName: hasUser ? names[i % names.length] : '-',
            patientType: pType,
            wearDate: wearDate,
            locationLabel: hasUser ? (pType === '입원' ? `71-${internalLocCode}` : `재택-${i%5}`) : (status === 'STORAGE' ? '제1보관소' : 'AS센터')
        };
    });
};

// ==================================================================================
// 2. HELPER COMPONENTS
// ==================================================================================

const InputField = React.memo(({ label, value, onChange, placeholder, optional, disabled, type = "text" }) => {
  if (type === "date") {
    return (
      <div>
        <label className="text-xs font-bold text-slate-500 block mb-1.5 flex justify-between">
          {label} {optional && <span className="text-slate-600 font-normal">(선택)</span>}
        </label>
        <div className="relative flex bg-slate-950 border border-slate-700 rounded-lg overflow-hidden group hover:border-blue-500 transition-colors cursor-pointer">
          <div className="flex-1 px-3 py-2 text-sm text-white font-medium flex items-center min-h-[38px]">
            <span className={!value ? "text-slate-500 font-normal" : "text-white"}>
              {value || "날짜 선택"}
            </span>
          </div>
          <input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onClick={(e) => {
              try {
                if (e.target.showPicker) e.target.showPicker();
              } catch (err) {}
            }}
            disabled={disabled}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs font-bold text-slate-500 block mb-1.5 flex justify-between">
        {label} {optional && <span className="text-slate-600 font-normal">(선택)</span>}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
      />
    </div>
  );
});

const Sparkline = ({ data, color, height = 40 }) => (
  <div style={{ height: height, width: '100%' }}>
    <ResponsiveContainer>
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const StatusBadge = ({ status, text }) => {
  const styles = {
    normal: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    warning: "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse",
    disconnected: "bg-slate-700 text-slate-400 border-slate-600",
  };
  return <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${styles[status]}`}>{text}</span>;
};

const LinearBattery = ({ value }) => {
  const v = Math.max(0, Math.min(100, value));
  let color = "bg-emerald-500";
  if(v < 30) color = "bg-rose-500";
  else if(v < 60) color = "bg-amber-500";

  return (
    <div className="flex items-center gap-3 w-full max-w-[140px]">
      <div className={`h-2 flex-1 bg-slate-700 rounded-full overflow-hidden`}>
         <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${v}%` }}></div>
      </div>
      <span className={`text-xs font-bold w-9 text-right ${v < 30 ? 'text-rose-400' : 'text-slate-400'}`}>{v}%</span>
    </div>
  );
};

const LogisticsDetailModal = ({ item, onClose }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [trackingNo, setTrackingNo] = useState(() => {
    const seed = item.id.replace(/[^0-9]/g, '');
    return `1234-5678-${seed.padStart(4, '0')}`;
  });
  const [showResult, setShowResult] = useState(true);

  const statusMap = {
    'STORAGE': '보관 중',
    'DISPATCH': '발송 중',
    'DELAY': '배송 완료',
    'IN_USE': '사용 중',
    'RETURN': '회수 중',
    'CLEANING': '소독 중',
    'REPAIR': '수리 중'
  };

  const getTrackingData = () => {
    const idNum = parseInt(item.id.replace(/[^0-9]/g, ''), 10) || 0;
    const hubs = ['서울 허브', '경기 허브', '옥천 HUB', '대전 HUB', '곤지암 HUB'];
    const terminals = ['강남 중앙', '성동 서부', '일산 동부', '부산 해운대'];
    const courierNames = ['김기사', '이기사', '박기사', '최배송'];

    const myHub = hubs[idNum % hubs.length];
    const myTerminal = terminals[(idNum + 2) % terminals.length];
    const myCourier = courierNames[(idNum + 1) % courierNames.length];

    const baseDate = "2026.01.14";
    const prevDate = "2026.01.13";
    const morningTime = `${String(8 + (idNum % 4)).padStart(2, '0')}:${String(10 + (idNum % 45)).padStart(2, '0')}`;
    const afternoonTime = `${String(14 + (idNum % 3)).padStart(2, '0')}:${String(5 + (idNum % 50)).padStart(2, '0')}`;
    const nightTime = `${String(19 + (idNum % 4)).padStart(2, '0')}:${String(20 + (idNum % 35)).padStart(2, '0')}`;

    let result = { step: 4, statusLabel: '배송 완료', history: [] };

    if (item.status === 'DISPATCH') {
      result.step = 3;
      result.statusLabel = '배송 중';
      result.history = [
        { time: `${baseDate} ${morningTime}`, step: '간선 하차', desc: `${myTerminal} 터미널 도착 및 분류 중` },
        { time: `${prevDate} ${nightTime}`, step: '간선 상차', desc: `${myHub} 터미널 출고 완료` },
        { time: `${prevDate} ${nightTime.replace('2', '1')}`, step: '집화 처리', desc: `사업소 접수 및 물류센터 입고` }
      ];
    } else if (item.status === 'DELAY') {
      result.step = 4;
      result.statusLabel = '배송 완료';
      result.history = [
        { time: `${baseDate} ${afternoonTime}`, step: '배송 완료', desc: `자택 수령 완료 (수령인: 본인 / 배송기사: ${myCourier})` },
        { time: `${baseDate} ${morningTime}`, step: '배송 출발', desc: `${myTerminal} 지점에서 배송 출발하였습니다.` },
        { time: `${prevDate} ${nightTime}`, step: '간선 상차', desc: `${myHub} 터미널 통과` },
        { time: `${prevDate} ${nightTime.replace('2', '1')}`, step: '집화 처리', desc: `송도 비대면 연구 센터 집화` }
      ];
    } else if (item.status === 'RETURN') {
      result.step = 2;
      result.statusLabel = '회수 중';
      result.history = [
        { time: `${baseDate} ${afternoonTime}`, step: '집화 완료', desc: `환자 자택 방문 및 기기 회수 완료 (기사: ${myCourier})` },
        { time: `${baseDate} ${morningTime}`, step: '회수 접수', desc: `병원 요청에 의한 반납 프로세스 개시` }
      ];
    } else {
      result.step = 4;
      result.statusLabel = '배송 완료';
      result.history = [
        { time: `${baseDate} ${afternoonTime}`, step: '배송 완료', desc: `자택 수령 완료 (수령인: 본인 / 배송기사: ${myCourier})` },
        { time: `${baseDate} ${morningTime}`, step: '배송 출발', desc: `${myTerminal} 지점에서 배송 출발하였습니다.` },
        { time: `${prevDate} ${nightTime}`, step: '간선 하차', desc: `${myTerminal} 터미널 도착` },
        { time: `${prevDate} ${nightTime.replace('2', '1')}`, step: '집화 처리', desc: `집화 처리 완료 (${myHub})` }
      ];
    }
    return result;
  };

  const trackingData = getTrackingData();

  if (!item) return null;
  const isStorage = item.status === 'STORAGE';
  const isInpatient = item.patientType === '입원';

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setShowResult(true);
    }, 800);
  };

  const journeyData = [
    { time: `${item.wearDate} 09:12`, type: '착용', icon: UserCheck, color: 'text-emerald-500', desc: '환자 본인 확인 후 기기 착용 완료' },
    { time: `${item.wearDate} 11:30`, type: '충전', icon: Battery, color: 'text-amber-500', desc: '배터리 20% 이하 감지로 인한 충전 시작' },
    { time: `${item.wearDate} 12:45`, type: '해제', icon: RotateCcw, color: 'text-slate-400', desc: '검사 또는 세면을 위한 일시 해제' },
    { time: `${item.wearDate} 13:10`, type: '착용', icon: UserCheck, color: 'text-emerald-500', desc: '기기 재착용 및 동기화 확인' },
    { time: `${item.lastSync.split(' ')[0]} ${item.lastSync.split(' ')[1]}`, type: '현재', icon: Activity, color: 'text-blue-500', desc: '실시간 데이터 정상 수집 중' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-950">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Truck className="text-blue-500"/> {isInpatient ? '원내 기기 관리' : '실시간 배송 추적 및 기기 관리'}
              </h2>
              <div className="mt-2 flex items-center gap-3 text-sm text-slate-400">
                 <span className="font-mono text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{item.id}</span>
                 {!isStorage && item.patientName && item.patientName !== '-' && <><span>|</span><span>{item.patientName} ({item.patientType})</span></>}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
        </div>

        <div className="p-0 flex-1 overflow-hidden flex">
           <div className="w-1/4 bg-slate-800/30 border-r border-slate-800 p-6 space-y-6">
             <div>
               <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">현재 상태</label>
               <div className={`mt-1 text-lg font-bold text-emerald-400`}>
                 {statusMap[item.status] || item.status}
               </div>
             </div>
             <div>
               <label className="text-xs font-bold text-slate-500 uppercase">배터리 잔량</label>
               <div className="mt-2"><LinearBattery value={item.battery} /></div>
             </div>
             <div>
               <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">관리 부서</label>
               <div className="mt-1 text-sm text-white font-bold">{isInpatient ? '원내 물류팀' : 'CJ대한통운 (외부)'}</div>
             </div>
             <div className="pt-6 border-t border-slate-800">
               <p className="text-[10px] text-slate-500 leading-relaxed italic">
                 {isInpatient
                   ? "※ 입원 환자는 원내 병동 관리 지침에 따라 기기가 직접 전달됩니다."
                   : `※ 외부 API 연동을 통해 ${item.patientName || '환자'}님의 실제 배송 상태를 실시간으로 미러링하고 있습니다.`
                 }
               </p>
             </div>
           </div>

           <div className="w-3/4 flex flex-col bg-[#f8f9fa]">
             <div className="bg-[#dee2e6] px-4 py-2 flex items-center gap-2 border-b border-slate-300">
               <div className="flex gap-1.5 mr-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
               </div>
               <div className="flex-1 bg-white rounded-md border border-slate-300 px-3 py-1 flex items-center gap-2 text-[11px] text-slate-500">
                  <Globe size={12}/> {isInpatient ? 'https://internal.hospital.logistics/assets' : `https://smart-logistics.cloud/tracking/${trackingNo}`}
               </div>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
               {!isStorage ? (
                 <div className="max-w-2xl mx-auto space-y-6">
                   {isInpatient ? (
                     <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-4">
                       {showTimeline ? (
                          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-6 border-b pb-4">
                               <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Clock size={20} className="text-blue-500"/> 환자 기기 여정 타임라인</h3>
                               <button onClick={() => setShowTimeline(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">이전으로</button>
                            </div>
                            <div className="relative space-y-8 pl-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                               {journeyData.map((event, idx) => (
                                  <div key={idx} className="relative">
                                     <div className={`absolute -left-8 w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center z-10 ${event.color.replace('text', 'border')}`}>
                                        <event.icon size={14} className={event.color}/>
                                     </div>
                                     <div>
                                        <div className="flex items-center gap-2">
                                           <span className="text-xs font-mono text-slate-400">{event.time}</span>
                                           <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${event.color.replace('text', 'bg')}/10 ${event.color}`}>{event.type}</span>
                                        </div>
                                        <p className="mt-1 text-sm text-slate-600 font-medium">{event.desc}</p>
                                     </div>
                                  </div>
                               ))}
                            </div>
                          </div>
                       ) : (
                         <>
                           <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center text-white"><UserCheck size={24}/></div>
                                <div>
                                  <h3 className="text-lg font-bold text-slate-800">원내 배정 정보</h3>
                                  <p className="text-xs text-slate-500">병원 내부 자산 관리 시스템 연동</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-y-4">
                                <div><p className="text-[10px] text-slate-400 font-bold uppercase">병동 위치</p><p className="text-sm font-bold text-slate-800">{item.locationLabel}</p></div>
                                <div><p className="text-[10px] text-slate-400 font-bold uppercase">사용자</p><p className="text-sm font-bold text-slate-800">{item.patientName} 님</p></div>
                                <div><p className="text-[10px] text-slate-400 font-bold uppercase">전달 담당자</p><p className="text-sm font-bold text-slate-800">이지혜 책임간호사</p></div>
                                <div><p className="text-[10px] text-slate-400 font-bold uppercase">전달 일시</p><p className="text-sm font-bold text-slate-800">{item.wearDate}</p></div>
                              </div>
                           </div>
                           <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><CheckCircle size={20}/></div>
                                <span className="text-sm font-bold text-slate-700">현재 정상 작동 및 데이터 수집 중</span>
                              </div>
                              <button onClick={() => setShowTimeline(true)} className="text-xs font-bold text-blue-600 hover:underline">상세보기</button>
                           </div>
                         </>
                       )}
                     </div>
                   ) : (
                     <>
                       <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                         <div className="flex items-center gap-3 mb-4">
                           <div className="w-10 h-10 bg-emerald-500 rounded-md flex items-center justify-center text-white font-black text-xl">N</div>
                           <span className="text-lg font-bold text-slate-800 tracking-tight">통합 택배 조회</span>
                         </div>
                         <div className="flex gap-2">
                           <select className="bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500">
                             <option>CJ대한통운</option>
                             <option>한진택배</option>
                           </select>
                           <div className="flex-1 relative">
                             <input
                               type="text"
                               className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 font-mono"
                               value={trackingNo}
                               onChange={(e) => setTrackingNo(e.target.value)}
                               placeholder="운송장 번호"
                             />
                           </div>
                           <button
                             onClick={handleSearch}
                             className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded text-sm font-bold transition-colors flex items-center gap-2"
                           >
                             {isSearching ? <Loader2 size={14} className="animate-spin"/> : <Search size={14}/>} 다시조회
                           </button>
                         </div>
                       </div>

                       {showResult && !isSearching && (
                         <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-4">
                           <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                             <div className="flex justify-between items-start mb-6">
                               <div>
                                 <div className="text-xs text-slate-500 mb-1">운송장 번호</div>
                                 <div className="text-xl font-bold text-slate-900 font-mono tracking-tight">{trackingNo}</div>
                               </div>
                               <div className="text-right">
                                 <div className={`text-[11px] font-bold px-2 py-0.5 rounded border text-emerald-600 bg-emerald-50 border-emerald-100`}>
                                   {trackingData.statusLabel}
                                 </div>
                                 <div className="text-[10px] text-slate-400 mt-1">최근 업데이트: {trackingData.history[0].time}</div>
                               </div>
                             </div>

                             <div className="flex items-center justify-between px-2">
                               {[
                                 { icon: Box, label: '상품준비', step: 1 },
                                 { icon: Package, label: '집화처리', step: 2 },
                                 { icon: Truck, label: '배송중', step: 3 },
                                 { icon: Check, label: '배송완료', step: 4 }
                               ].map((s, idx) => (
                                 <React.Fragment key={idx}>
                                   <div className="flex flex-col items-center gap-2">
                                     <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                       trackingData.step >= s.step ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'
                                     }`}>
                                       <s.icon size={18}/>
                                     </div>
                                     <span className={`text-[11px] font-bold ${
                                       trackingData.step === s.step ? 'text-emerald-600' : 'text-slate-500'
                                     }`}>{s.label}</span>
                                   </div>
                                   {idx < 3 && (
                                     <div className={`flex-1 h-0.5 mx-1 transition-colors ${
                                       trackingData.step > s.step ? 'bg-emerald-500' : 'bg-slate-100'
                                     }`}></div>
                                   )}
                                 </React.Fragment>
                               ))}
                             </div>
                           </div>

                           <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                             <table className="w-full text-xs text-left">
                               <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                                 <tr>
                                   <th className="px-4 py-3 w-32">날짜/시간</th>
                                   <th className="px-4 py-3 w-24">배송단계</th>
                                   <th className="px-4 py-3">처리현황</th>
                                 </tr>
                               </thead>
                               <tbody className="text-slate-600 divide-y divide-slate-100">
                                 {trackingData.history.map((row, idx) => (
                                   <tr key={idx} className={idx === 0 ? "bg-emerald-50/30" : ""}>
                                     <td className="px-4 py-3 font-mono">{row.time}</td>
                                     <td className={`px-4 py-3 font-bold ${idx === 0 ? 'text-emerald-600' : ''}`}>{row.step}</td>
                                     <td className="px-4 py-3">{row.desc}</td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                         </div>
                       )}
                     </>
                   )}
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                    <Box size={64} className="opacity-10" />
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-600">발송 전인 기기입니다.</p>
                      <p className="text-xs mt-1 opacity-60">사업단 기기 할당 후 물류 데이터가<br/>자동으로 생성됩니다.</p>
                    </div>
                 </div>
               )}
             </div>
           </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-2">
           <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 text-sm font-bold hover:bg-slate-800 transition-colors">닫기</button>
        </div>
      </div>
    </div>
  );
};

const AssetAssignmentModal = ({ asset, onClose, onAssign }) => {
  const [locationType, setLocationType] = useState(null);
  const [communityScenario, setCommunityScenario] = useState(null);
  const [isInfected, setIsInfected] = useState(false);
  const [deliveryRequired, setDeliveryRequired] = useState(false);

  const [form, setForm] = useState({
    patientName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    ward: '',
    room: '',
    admissionDate: '',
    surgeryDate: '',
    contact: '',
    address: ''
  });

  useEffect(() => {
    if (locationType === 'HOSPITAL') {
      setDeliveryRequired(false);
      setCommunityScenario(null);
    } else if (locationType === 'COMMUNITY') {
      if (communityScenario === 'HOME') {
        setDeliveryRequired(true);
      } else if (communityScenario === 'OUTPATIENT') {
        setDeliveryRequired(false);
      }
    }
  }, [locationType, communityScenario]);

  const handleSubmit = () => {
    if (!locationType) return alert("환자 관리 위치를 선택해주세요.");
    if (!form.patientName) return alert("환자 이름을 입력해주세요.");

    let pType = "";
    if (locationType === 'HOSPITAL') pType = "입원";
    else if (communityScenario === 'OUTPATIENT') pType = "외래";
    else if (communityScenario === 'HOME') pType = "지역사회";

    let locationLabel = "";
    if (locationType === 'HOSPITAL') locationLabel = `${form.ward || '미지정'} ${form.room || ''}`;
    else if (communityScenario === 'HOME') locationLabel = `재택 (${form.address.substring(0,5)}..)`;
    else locationLabel = '외래';

    onAssign(asset.id, form.patientName, locationLabel, pType, form.startDate);
    onClose();
  };

  const ToggleBtn = ({ active, label, onClick, icon: Icon }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all border-2 ${active ? 'bg-blue-600/20 text-blue-400 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-slate-900/50 text-slate-500 border-slate-700 hover:bg-slate-800 hover:text-slate-300'}`}
    >
      {Icon && <Icon size={24} className="mb-2" />}
      <span className="font-bold text-sm">{label}</span>
    </button>
  );

  const Switch = ({ checked, onChange, label }) => (
     <div className="flex items-center justify-between bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-800">
       <span className="text-sm font-bold text-slate-300">{label}</span>
       <div onClick={() => onChange(!checked)} className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-700'}`}>
         <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
       </div>
     </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-[#1e293b] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#172033]">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><UserPlus size={18} className="text-blue-500"/> 기기 할당 (신규 환자 등록)</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          <div>
            <label className="text-sm font-bold text-white block mb-3">1. 환자 관리 위치 선택</label>
            <div className="grid grid-cols-2 gap-4">
               <ToggleBtn active={locationType === 'HOSPITAL'} label="원내 (병동/병실)" onClick={() => setLocationType('HOSPITAL')} />
               <ToggleBtn active={locationType === 'COMMUNITY'} label="지역사회 (외래/재택)" onClick={() => setLocationType('COMMUNITY')} />
            </div>
          </div>
          {locationType === 'COMMUNITY' && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-bold text-white block mb-3">1-1. 관리 시나리오 선택</label>
              <div className="flex gap-3 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                 <button type="button" onClick={() => setCommunityScenario('OUTPATIENT')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${communityScenario === 'OUTPATIENT' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>외래 환자</button>
                 <button type="button" onClick={() => setCommunityScenario('HOME')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${communityScenario === 'HOME' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>재택 환자</button>
              </div>
            </div>
          )}
          {(locationType === 'HOSPITAL' || (locationType === 'COMMUNITY' && communityScenario)) && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="h-px w-full bg-slate-800"></div>
              <div>
                <h4 className="text-sm font-bold text-blue-400 mb-4">공통 환자 정보</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">할당 대상 기기 ID</label>
                    <div className="text-slate-400 font-mono bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 text-sm">{asset.id}</div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">환자 유형</label>
                    <div className="text-slate-400 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 text-sm font-bold">
                      {locationType === 'HOSPITAL' ? '원내' : locationType === 'COMMUNITY' ? '지역사회' : '선택 대기중'}
                    </div>
                  </div>

                  <InputField
                    label="환자 이름"
                    value={form.patientName}
                    onChange={(val) => setForm(prev => ({ ...prev, patientName: val }))}
                    placeholder="예: 홍길동"
                  />
                  <div className="flex items-end pb-1"><Switch checked={isInfected} onChange={setIsInfected} label="감염성 질환 여부" /></div>

                  <InputField
                    label="시작일"
                    type="date"
                    value={form.startDate}
                    onChange={(val) => setForm(prev => ({ ...prev, startDate: val }))}
                  />

                  <InputField
                    label="종료 예정일"
                    type="date"
                    value={form.endDate}
                    onChange={(val) => setForm(prev => ({ ...prev, endDate: val }))}
                    optional
                  />
                </div>
              </div>

              <div className={`${locationType === 'HOSPITAL' ? 'block' : 'hidden'} space-y-6`}>
                <h4 className="text-sm font-bold text-emerald-400 mb-4">원내 상세 정보</h4>
                <div className="grid grid-cols-2 gap-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800">
                   <InputField
                    label="병동"
                    value={form.ward}
                    onChange={(val) => setForm(prev => ({ ...prev, ward: val }))}
                    placeholder="예: 71병동"
                   />
                   <InputField
                    label="병실"
                    value={form.room}
                    onChange={(val) => setForm(prev => ({ ...prev, room: val }))}
                    placeholder="예: 101호"
                   />
                   <InputField
                    label="입원일"
                    type="date"
                    value={form.admissionDate}
                    onChange={(val) => setForm(prev => ({ ...prev, admissionDate: val }))}
                   />
                   <InputField
                    label="수술일"
                    type="date"
                    value={form.surgeryDate}
                    onChange={(val) => setForm(prev => ({ ...prev, surgeryDate: val }))}
                    optional
                   />
                </div>
              </div>

              {communityScenario === 'OUTPATIENT' && (
                <div>
                  <h4 className="text-sm font-bold text-amber-400 mb-4">외래 상세 정보</h4>
                  <div className="grid grid-cols-2 gap-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800">
                     <div className="col-span-2"><InputField label="연락처" value={form.contact} onChange={(val) => setForm(prev => ({ ...prev, contact: val }))} placeholder="010-0000-0000" /></div>
                     <div className="col-span-2"><InputField label="주소" value={form.address} onChange={(val) => setForm(prev => ({ ...prev, address: val }))} placeholder="주소 입력" optional /></div>
                  </div>
                </div>
              )}

              {communityScenario === 'HOME' && (
                <div>
                  <h4 className="text-sm font-bold text-purple-400 mb-4">재택 상세 정보</h4>
                  <div className="grid grid-cols-2 gap-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800">
                     <InputField label="연락처 (필수)" value={form.contact} onChange={(val) => setForm(prev => ({ ...prev, contact: val }))} placeholder="010-0000-0000" />
                     <div className="flex items-end pb-1"><Switch checked={deliveryRequired} onChange={setDeliveryRequired} label="배송 필요 여부" /></div>
                     <div className="col-span-2"><InputField label="자택 주소 (필수)" value={form.address} onChange={(val) => setForm(prev => ({ ...prev, address: val }))} placeholder="도로명 주소 등 상세 입력" /></div>
                     <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">기기 회수 방식</label>
                        <select
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none"
                        >
                           <option value="COURIER">택배 회수</option>
                           <option value="VISIT">방문 수거</option>
                           <option value="HOSPITAL">병원 직접 반납</option>
                        </select>
                     </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-800 bg-[#172033] flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-slate-400 font-bold hover:text-white hover:bg-slate-800 transition-colors text-sm">취소</button>
          <button
            onClick={handleSubmit}
            disabled={!locationType || (locationType === 'COMMUNITY' && !communityScenario)}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors text-sm shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            할당 완료
          </button>
        </div>
      </div>
    </div>
  );
};

const AIReportModal = ({ patient, onClose }) => {
  if (!patient) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1e293b] w-full max-w-2xl rounded-xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-[#172033]">
           <h2 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles className="text-blue-400" size={18} /> AI 환자 분석 리포트</h2>
           <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>
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
             <h3 className="text-white font-bold mb-2">2. 바이탈 분석 ({patient.status === 'warning' ? '주의' : '안정'}):</h3>
             <ul className="list-none space-y-1 pl-2 border-l-2 border-slate-700">
                <li>- **전반적 상태**: {patient.status === 'warning' ? '주의 요망' : '정상'}.</li>
                {patient.isHighBp && <li className="text-rose-400">- 혈압 상승 추세 (Current: {patient.bpSys}/{patient.bpDia})</li>}
             </ul>
           </div>
           <div><h3 className="text-white font-bold mb-2">3. 위험 평가: **{patient.status === 'warning' ? '중등도' : '없음'}**</h3></div>
        </div>
        <div className="p-4 border-t border-slate-700 bg-[#172033] flex justify-end gap-3">
           <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-colors"><FileText size={14}/> EMR 전송</button>
           <button onClick={onClose} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-lg">확인</button>
        </div>
      </div>
    </div>
  );
};

const DashboardHome = ({ onNavigate, patients }) => {
  const [hoveredSection, setHoveredSection] = useState(null);

  const stats = useMemo(() => ({
    total: patients.length,
    disconnected: patients.filter(p => p.status === 'disconnected'),
    checkRequired: patients.filter(p => p.status === 'warning'),
    fever: patients.filter(p => p.isFever),
    highBp: patients.filter(p => p.isHighBp),
    highPr: patients.filter(p => p.isTachy),
    lowSpo2: patients.filter(p => p.isLowSpo2),
    rrIssue: patients.filter(p => p.rr > 20 || p.rr < 10),
    btIssue: patients.filter(p => p.isFever)
  }), [patients]);

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
                   {title.includes('혈압') ? `${p.bpSys}/${p.bpDia}` :
                    title.includes('맥박') ? `${p.pr}` :
                    title.includes('산소') ? `${p.spo2}%` :
                    title.includes('체온') ? `${p.bodyTemp}°C` :
                    title.includes('호흡') ? `${p.rr} rpm` :
                    title.includes('연결') ? 'Loss' : 'Check'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1e293b] border-r border-b border-slate-600 rotate-45"></div>
    </div>
  );

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
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
               </span>
               <span className="text-sm text-slate-300 font-bold">실시간 모니터링 정상 가동</span>
             </div>
           </div>
        </div>
        <div className="col-span-7 flex flex-col gap-3">
           <div
             className="flex-1 bg-[#172033] rounded-xl border border-slate-800 p-5 flex items-center justify-between hover:border-slate-600 transition-all cursor-pointer relative group"
             onMouseEnter={() => setHoveredSection('disconnected')}
             onMouseLeave={() => setHoveredSection(null)}
             style={{ zIndex: hoveredSection === 'disconnected' ? 50 : 1 }}
           >
             {hoveredSection === 'disconnected' && <HoverPopup title="연결 끊김" list={stats.disconnected} colorClass="text-slate-400" />}
             <div className="flex items-center gap-5">
                 <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors"><Wifi size={24} /></div>
                 <div>
                    <div className="text-amber-500 font-bold text-base mb-1">연결 끊김 ({stats.disconnected.length}명)</div>
                    <div className="text-xs text-slate-500 font-medium">{stats.disconnected.length > 0 ? '신호 미수신 상태' : '모든 기기 정상 연결 중'}</div>
                 </div>
             </div>
             <ChevronRight className="text-slate-700 group-hover:text-white" size={20} />
           </div>
           <div
             className="flex-1 bg-[#172033] rounded-xl border border-rose-900/30 p-5 flex items-center justify-between hover:bg-rose-950/20 hover:border-rose-700/50 transition-all cursor-pointer relative group"
             onMouseEnter={() => setHoveredSection('warning')}
             onMouseLeave={() => setHoveredSection(null)}
             onClick={() => onNavigate('patients', null, 'warning')}
             style={{ zIndex: hoveredSection === 'warning' ? 50 : 1 }}
           >
             {hoveredSection === 'warning' && <HoverPopup title="확인 필요" list={stats.checkRequired} colorClass="text-rose-400" />}
             <div className="flex items-center gap-5">
                 <div className="w-12 h-12 rounded-xl bg-rose-900/20 flex items-center justify-center text-rose-500 animate-pulse-soft"><AlertCircle size={24} /></div>
                 <div>
                    <div className="text-rose-400 font-bold text-base mb-1">연결 확인 필요 <span className="text-white ml-1 text-lg">{stats.checkRequired.length}</span> 명</div>
                    <div className="text-xs text-rose-500/70 font-medium">생체신호 이상 감지</div>
                 </div>
             </div>
             <ChevronRight className="text-slate-700 group-hover:text-rose-400" size={20} />
           </div>
           <div
             className="flex-1 bg-[#172033] rounded-xl border border-slate-800 p-5 flex items-center justify-between hover:border-slate-600 transition-all cursor-pointer relative group"
             onMouseEnter={() => setHoveredSection('fever')}
             onMouseLeave={() => setHoveredSection(null)}
             style={{ zIndex: hoveredSection === 'fever' ? 50 : 1 }}
           >
             {hoveredSection === 'fever' && <HoverPopup title="발열 환자" list={stats.fever} colorClass="text-amber-400" />}
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
      <div className="flex-1 bg-[#111827] rounded-2xl border border-slate-800 p-6 flex flex-col">
         <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2"><Activity className="text-blue-500" size={20} /> 생체신호별 경고(Warning) 분포</h3>
         <div className="flex-1 grid grid-cols-5 gap-4">
           <div className="bg-[#1f2937] rounded-xl border border-slate-700/50 p-4 relative hover:bg-[#2d3748] transition-colors cursor-pointer h-full" onMouseEnter={() => setHoveredSection('bp')} onMouseLeave={() => setHoveredSection(null)} style={{ zIndex: hoveredSection === 'bp' ? 50 : 1 }}>
              {hoveredSection === 'bp' && <HoverPopup title="혈압 (BP)" list={stats.highBp} colorClass="text-rose-500" />}
              <MiniGauge count={stats.highBp.length} total={stats.total} color="#f43f5e" label="혈압 (BP)" subLabel="고혈압 주의" />
           </div>
           <div className="bg-[#1f2937] rounded-xl border border-slate-700/50 p-4 relative hover:bg-[#2d3748] transition-colors cursor-pointer h-full" onMouseEnter={() => setHoveredSection('pr')} onMouseLeave={() => setHoveredSection(null)} style={{ zIndex: hoveredSection === 'pr' ? 50 : 1 }}>
              {hoveredSection === 'pr' && <HoverPopup title="맥박 (PR)" list={stats.highPr} colorClass="text-emerald-500" />}
              <MiniGauge count={stats.highPr.length} total={stats.total} color="#10b981" label="맥박 (PR)" subLabel="빈맥 주의" />
           </div>
           <div className="bg-[#1f2937] rounded-xl border border-slate-700/50 p-4 relative hover:bg-[#2d3748] transition-colors cursor-pointer h-full" onMouseEnter={() => setHoveredSection('spo2')} onMouseLeave={() => setHoveredSection(null)} style={{ zIndex: hoveredSection === 'spo2' ? 50 : 1 }}>
              {hoveredSection === 'spo2' && <HoverPopup title="산소포화도" list={stats.lowSpo2} colorClass="text-blue-500" />}
              <MiniGauge count={stats.lowSpo2.length} total={stats.total} color="#3b82f6" label="산소포화도" subLabel="저산소증" />
           </div>
           <div className="bg-[#1f2937] rounded-xl border border-slate-700/50 p-4 relative hover:bg-[#2d3748] transition-colors cursor-pointer h-full" onMouseEnter={() => setHoveredSection('rr')} onMouseLeave={() => setHoveredSection(null)} style={{ zIndex: hoveredSection === 'rr' ? 50 : 1 }}>
              {hoveredSection === 'rr' && <HoverPopup title="호흡수 (RR)" list={stats.rrIssue} colorClass="text-amber-500" />}
              <MiniGauge count={stats.rrIssue.length} total={stats.total} color="#f59e0b" label="호흡수 (RR)" subLabel="과호흡/저호흡" />
           </div>
           <div className="bg-[#1f2937] rounded-xl border border-slate-700/50 p-4 relative hover:bg-[#2d3748] transition-colors cursor-pointer h-full" onMouseEnter={() => setHoveredSection('bt')} onMouseLeave={() => setHoveredSection(null)} style={{ zIndex: hoveredSection === 'bt' ? 50 : 1 }}>
              {hoveredSection === 'bt' && <HoverPopup title="체온 (BT)" list={stats.btIssue} colorClass="text-purple-500" />}
              <MiniGauge count={stats.btIssue.length} total={stats.total} color="#a855f7" label="체온 (BT)" subLabel="고열 주의" />
           </div>
         </div>
      </div>
    </div>
  );
};

const PatientList = ({ onNavigate, patients }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState('ALL');

  const filtered = patients.filter(p => {
    const matchesSearch = p.name.includes(searchTerm) || p.id.includes(searchTerm);
    const matchesFilter = filterType === 'WARNING' ? p.status === 'warning' : true;
    return matchesSearch && matchesFilter;
  });

  const toggleFilter = () => setFilterType(prev => prev === 'WARNING' ? 'ALL' : 'WARNING');

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-4">
             <button onClick={() => setFilterType('ALL')} className={`px-4 py-1.5 rounded-lg text-sm font-bold shadow-lg transition-all ${filterType === 'ALL' ? 'bg-blue-600 text-white shadow-blue-900/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>전체 ({patients.length})</button>
             <button onClick={toggleFilter} className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 border transition-all ${filterType === 'WARNING' ? 'bg-rose-900/40 border-rose-600 text-rose-400 shadow-[0_0_10px_rgba(225,29,72,0.3)]' : 'bg-rose-900/10 border-rose-900/30 text-rose-500 hover:bg-rose-900/20'}`}><AlertCircle size={14} /> 경고 ({patients.filter(p => p.status === 'warning').length})</button>
          </div>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
             <input type="text" placeholder="환자 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 w-64" />
          </div>
      </div>
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_1fr_1.5fr] gap-4 px-6 py-3 bg-slate-900/50 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div>환자 정보</div><div>BP (MMHG)</div><div>PR (BPM)</div><div>SPO2 (%)</div><div>RR (RPM)</div><div>체온 (°C)</div><div>상태</div><div className="text-right">신호 패턴 (REAL-TIME)</div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900">
          {filtered.map((patient) => (
            <div key={patient.id} onClick={() => onNavigate('detail', patient)} className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_1fr_1.5fr] gap-4 px-6 py-4 items-center border-b border-slate-800/50 cursor-pointer transition-colors hover:bg-slate-800/80 ${patient.status === 'warning' ? 'bg-rose-950/10' : ''}`}>
                  <div><div className="text-slate-500 text-[10px] font-bold mb-0.5">{patient.ward}</div><div className="text-lg font-bold text-white leading-tight">{patient.maskedName}</div><div className="text-xs text-slate-500 mt-0.5">{patient.dept} | {patient.doctor}</div></div>
                  <div className={`text-lg font-bold ${patient.isHighBp ? 'text-rose-500 animate-blink-slow' : 'text-slate-300'}`}>{patient.bpSys} <span className="text-slate-600 text-sm">/ {patient.bpDia}</span></div>
                  <div className={`text-lg font-bold ${patient.isTachy ? 'text-rose-500 animate-blink-slow' : 'text-slate-300'}`}>{patient.pr}</div>
                  <div className={`text-lg font-bold ${patient.isLowSpo2 ? 'text-rose-500 animate-blink-slow' : 'text-slate-300'}`}>{patient.spo2}</div>
                  <div className="text-lg font-bold text-slate-300">{patient.rr}</div>
                  <div className={`text-lg font-bold ${patient.isFever ? 'text-rose-500 animate-blink-slow' : 'text-slate-300'}`}>{patient.bodyTemp}</div>
                  <div>
                    {patient.status === 'disconnected' ? (<span className="px-3 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold">Disconnected</span>) : patient.status === 'warning' ? (<span className="px-3 py-1 rounded bg-rose-950/30 border border-rose-900/50 text-rose-400 text-xs font-bold animate-pulse">Check<br/>Required</span>) : (<span className="px-3 py-1 rounded bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs font-bold">Stable</span>)}
                  </div>
                  <div className="h-10 opacity-70"><Sparkline data={patient.signalPattern} color={patient.status === 'warning' ? '#f43f5e' : patient.status === 'disconnected' ? '#475569' : '#10b981'} /></div>
            </div>
          ))}
      </div>
    </div>
  );
};

const PatientDetail = ({ patient, onBack }) => {
   const [showAIReport, setShowAIReport] = useState(false);
   if (!patient) return null;

   const commonGrid = <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />;
   const commonXAxis = <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} interval={3} />;
   const commonTooltip = <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff'}} />;

   return (
     <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 relative pb-12">
       {showAIReport && <AIReportModal patient={patient} onClose={() => setShowAIReport(false)} />}
       <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
          <span onClick={onBack} className="hover:text-white cursor-pointer transition-colors">홈</span><ChevronRight size={14} />
          <span onClick={onBack} className="hover:text-white cursor-pointer transition-colors">전체 환자 관리</span><ChevronRight size={14} />
          <span className="font-bold text-blue-400">{patient.id}</span>
       </div>
       <div className="bg-[#1e293b] rounded-2xl border border-slate-700 p-6 flex justify-between items-center shadow-2xl">
          <div className="flex items-center gap-6">
             <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><ArrowLeft size={24} /></button>
             <div>
                <div className="flex items-center gap-3">
                   <h1 className="text-3xl font-bold text-white">{patient.maskedName}</h1>
                   {patient.status === 'warning' && <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30">확인 필요</span>}
                </div>
                <div className="text-sm text-slate-500 mt-1 flex items-center gap-3 font-mono"><span>기기 정보: F123456-12345</span><span className="w-1 h-1 bg-slate-700 rounded-full"></span><span>{patient.id}</span></div>
             </div>
          </div>
          <div className="flex gap-3">
             <button onClick={() => setShowAIReport(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all shadow-lg shadow-violet-900/30"><Sparkles size={16} /> AI 분석 리포트</button>
             <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/30 cursor-default"><div className="w-2 h-2 bg-white rounded-full animate-pulse"></div> 실시간 모니터링 중</button>
          </div>
       </div>
       <div className="space-y-4">
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden flex h-64 shadow-lg">
             <div className="w-[75%] p-6 border-r border-slate-700 relative">
                <div className="flex items-center gap-2 text-rose-500 font-bold mb-4"><Activity size={20} /> 혈압 (BP)</div>
                <div className="absolute top-6 right-6 text-xs text-slate-500">24시간 추이</div>
                <ResponsiveContainer width="100%" height="85%">
                   <LineChart data={patient.history24h}>
                      {commonGrid} {commonXAxis} {commonTooltip}
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
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden flex h-56 shadow-lg">
             <div className="w-[75%] p-6 border-r border-slate-700 relative">
                <div className="flex items-center gap-2 text-emerald-500 font-bold mb-4"><HeartPulse size={20} /> 맥박 (PR)</div>
                <div className="absolute top-6 right-6 text-xs text-slate-500">24시간 추이</div>
                <ResponsiveContainer width="100%" height="85%">
                   <AreaChart data={patient.history24h}>
                      <defs><linearGradient id="colorPr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                      {commonGrid} {commonXAxis} {commonTooltip}
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
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden flex h-48 shadow-lg">
             <div className="w-[75%] p-6 border-r border-slate-700 relative">
                <div className="flex items-center gap-2 text-blue-500 font-bold mb-4"><Wind size={20} /> 산소포화도 (SpO2)</div>
                <div className="absolute top-6 right-6 text-xs text-slate-500">24시간 추이</div>
                <ResponsiveContainer width="100%" height="85%">
                   <LineChart data={patient.history24h}>
                      {commonGrid} {commonXAxis} {commonTooltip}
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
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden flex h-48 shadow-lg">
                <div className="w-[65%] p-5 border-r border-slate-700 relative">
                   <div className="flex items-center gap-2 text-amber-500 font-bold mb-2"><Stethoscope size={20} /> 호흡수 (RR)</div>
                   <ResponsiveContainer width="100%" height="80%">
                      <LineChart data={patient.history24h}>
                         {commonGrid} {commonXAxis} {commonTooltip}
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
                         {commonGrid} {commonXAxis} {commonTooltip}
                         <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} hide />
                         <Line type="monotone" dataKey="bodyTemp" stroke="#a855f7" strokeWidth={3} dot={false} />
                      </LineChart>
                   </ResponsiveContainer>
                </div>
                <div className="w-[35%] flex flex-col items-center justify-center bg-[#172033]">
                   <div className={`text-4xl font-extrabold tracking-tight ${patient.isFever ? 'text-rose-500' : 'text-white'}`}>{patient.bodyTemp}</div>
                   <div className="text-slate-500 font-bold mt-1 text-xs">°C</div>
                </div>
             </div>
          </div>
       </div>
     </div>
   );
};

const LogisticsManager = () => {
  const [filter, setFilter] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [assets, setAssets] = useState(() => generateAssets(100));

  const handleStatusChange = (id, newStatus) => {
    setAssets(prev => prev.map(item => {
      if (item.id === id) {
        if (newStatus === 'STORAGE') {
          return {
            ...item,
            status: newStatus,
            patientName: '-',
            patientType: '-',
            wearDate: '-',
            locationLabel: '제1보관소'
          };
        }
        return { ...item, status: newStatus };
      }
      return item;
    }));
  };

  const handleAssign = (id, patientName, location, patientType, wearDate) => {
    setAssets(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'IN_USE', patientName, locationLabel: location, patientType, wearDate } : item
    ));
  };

  const handleCreateNew = () => {
    const newId = `CR-${String(assets.length + 1).padStart(4, '0')}`;
    setAssets(prev => [{
      id: newId, status: 'STORAGE', battery: 100, lastSync: '방금 전', patientName: '-', patientType: '-', wearDate: '-', locationLabel: '제1보관소'
    }, ...prev]);
  };

  const downloadAssetList = () => {
    const headers = ["기기 ID", "현재 상태", "환자 유형", "환자명", "위치/주소", "착용 시작일", "배터리 잔량"];
    const csvRows = assets.map(a => [
      a.id,
      a.status,
      a.patientType,
      a.patientName,
      a.locationLabel,
      a.wearDate,
      `${a.battery}%`
    ].join(","));

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CART_VITAL_Asset_List_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = useMemo(() => ({
      total: assets.length,
      storage: assets.filter(a => a.status === 'STORAGE').length,
      dispatch: assets.filter(a => a.status === 'DISPATCH').length,
      delay: assets.filter(a => a.status === 'DELAY').length,
      inUse: assets.filter(a => a.status === 'IN_USE').length,
      return: assets.filter(a => a.status === 'RETURN').length,
      cleaningRepair: assets.filter(a => ['CLEANING', 'REPAIR'].includes(a.status)).length,
  }), [assets]);

  const utilRate = Math.round((stats.inUse / stats.total) * 100);

  const filteredAssets = useMemo(() => {
    let result = assets;
    if (filter !== 'ALL') {
       if (filter === 'CLEANING_REPAIR') {
          result = assets.filter(a => ['CLEANING', 'REPAIR'].includes(a.status));
       } else {
          result = assets.filter(a => a.status === filter);
       }
    }
    return result;
  }, [assets, filter]);

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const currentItems = filteredAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleFilterClick = (targetFilter) => {
    setFilter(filter === targetFilter ? 'ALL' : targetFilter);
    setCurrentPage(1);
  };

  const getElapsedDays = (dateStr) => {
    if (!dateStr || dateStr === '-') return '-';
    const start = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    const diffTime = today - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays < 0 ? 0 : diffDays}일`;
  };

  const STATUS_OPTIONS = [
    { value: 'STORAGE', label: '보관 중' },
    { value: 'DISPATCH', label: '발송 중' },
    { value: 'DELAY', label: '배송 완료' },
    { value: 'IN_USE', label: '사용 중' },
    { value: 'RETURN', label: '회수 중' },
    { value: 'CLEANING', label: '소독 중' },
    { value: 'REPAIR', label: '수리 중' },
  ];

  const getStatusBadge = (status) => {
      switch(status) {
         case 'IN_USE': return <span className="px-2 py-1 rounded bg-[#0f3d3e] border border-[#165a5c] text-[#34d399] text-[11px] font-bold">사용 중</span>;
         case 'CLEANING': return <span className="px-2 py-1 rounded bg-[#3f2e14] border border-[#6b4e23] text-[#fbbf24] text-[11px] font-bold">소독 중</span>;
         case 'REPAIR': return <span className="px-2 py-1 rounded bg-[#3f1623] border border-[#751d33] text-[#fb7185] text-[11px] font-bold">수리 중</span>;
         case 'STORAGE': return <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[11px] font-bold">보관 중</span>;
         case 'DISPATCH': return <span className="px-2 py-1 rounded bg-[#172554] border border-[#1e3a8a] text-[#60a5fa] text-[11px] font-bold">발송 중</span>;
         case 'DELAY': return <span className="px-2 py-1 rounded bg-emerald-900/30 border border-emerald-700/50 text-emerald-400 text-[11px] font-bold">배송 완료</span>;
         case 'RETURN': return <span className="px-2 py-1 rounded bg-slate-700 border border-slate-600 text-slate-300 text-[11px] font-bold">회수 중</span>;
         default: return null;
      }
  };

  const ProcessStep = ({ label, count, icon: Icon, targetFilter, isLast }) => {
    const isActive = filter === targetFilter;
    return (
      <div className="flex items-center flex-1 min-w-0">
        <button
          onClick={() => handleFilterClick(targetFilter)}
          className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl border transition-all relative group
            ${isActive
              ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.25)]'
              : 'bg-[#1e293b] border-slate-700 hover:bg-slate-800 hover:border-slate-600'
            }`}
        >
           <div className={`mb-1.5 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
             <Icon size={20} strokeWidth={1.5} />
           </div>
           <span className={`text-xs font-bold ${isActive ? 'text-blue-300' : 'text-slate-400'}`}>{label}</span>
           <span className={`mt-0.5 text-xl font-extrabold ${isActive ? 'text-white' : 'text-slate-200'}`}>{count}</span>
           {isActive && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>}
        </button>
        {!isLast && <div className="mx-2 text-slate-600"><ChevronRight size={18} /></div>}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {selectedItem && <LogisticsDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
      {assignTarget && <AssetAssignmentModal asset={assignTarget} onClose={() => setAssignTarget(null)} onAssign={handleAssign} />}

      <div className="flex justify-between items-end pt-1 pb-2">
         <div className="flex items-end gap-3 bg-[#1e293b] px-6 py-4 rounded-xl border border-slate-700/50 shadow-lg">
            <div>
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Assets</div>
               <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white leading-none">{stats.total}</span>
                  <span className="text-sm font-bold text-slate-500">기기</span>
               </div>
            </div>
            <div className="h-10 w-[1px] bg-slate-700 mx-2"></div>
            <div>
               <div className="text-xs font-bold text-slate-400 mb-1">가동 현황</div>
               <div className="text-base font-bold text-white flex items-center gap-1">
                  <span className="text-emerald-400">{stats.inUse}</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-400">{stats.total}</span>
                  <span className="text-[10px] text-slate-500 ml-1">(Active)</span>
               </div>
            </div>
         </div>

         <div className="flex flex-col items-end gap-2 w-1/3 min-w-[300px] mb-2">
            <div className="flex gap-2">
              <button
                onClick={downloadAssetList}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-bold border border-slate-700 transition-colors"
              >
                <FileSpreadsheet size={16}/> 엑셀 다운로드
              </button>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition-colors"
              >
                <Plus size={16}/> 신규 기기 등록
              </button>
            </div>
            <div className="w-full">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-bold px-1">
                   <span className="flex items-center gap-2"><Activity size={14} className="text-blue-500"/> 전체 가동률</span>
                   <span className="text-white text-lg">{utilRate}%</span>
                </div>
                <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative shadow-inner">
                   <div className="absolute inset-0 bg-[#0f172a]/50"></div>
                   <div
                      className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 rounded-full relative z-10 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,211,238,0.3)] overflow-hidden"
                      style={{ width: `${utilRate}%` }}
                   >
                       <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                   </div>
                </div>
            </div>
         </div>
      </div>

      <div className="flex w-full overflow-x-auto py-1">
         <ProcessStep label="보관 중" count={stats.storage} icon={Box} targetFilter="STORAGE" />
         <ProcessStep label="발송 중" count={stats.dispatch} icon={Truck} targetFilter="DISPATCH" />
         <ProcessStep label="배송 완료" count={stats.delay} icon={Check} targetFilter="DELAY" />
         <ProcessStep label="사용 중" count={stats.inUse} icon={UserCheck} targetFilter="IN_USE" />
         <ProcessStep label="회수 중" count={stats.return} icon={RefreshCw} targetFilter="RETURN" />
         <ProcessStep label="소독/수리 중" count={stats.cleaningRepair} icon={Wrench} targetFilter="CLEANING_REPAIR" isLast={true} />
      </div>

      <div className="flex-1 bg-[#1e293b] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden min-h-0">
         <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-800/30">
            <div className="flex items-center gap-3">
               <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Box size={16} className="text-slate-400"/> 기기 자산 목록
               </h2>
               <span className="bg-blue-600/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[11px] font-bold uppercase">
                  {filter === 'ALL' ? 'ALL STATUS' : filter}
               </span>
            </div>
            <div className="flex items-center gap-3">
               {filter !== 'ALL' && (
                 <button onClick={() => { setFilter('ALL'); setCurrentPage(1); }} className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors">
                   <RotateCcw size={12} /> 필터 초기화
                 </button>
               )}
               <div className="relative w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14}/>
                  <input type="text" placeholder="기기 ID 검색..." className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:border-blue-500 outline-none"/>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-[1fr_0.8fr_0.8fr_1.2fr_0.8fr_0.6fr_0.8fr_1.2fr_1.1fr] px-6 py-3 bg-slate-900/50 border-b border-slate-700 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <div>기기 ID</div><div>상태</div><div>환자 유형</div><div>할당 환자 / 위치</div><div>착용일</div><div>경과</div><div>배터리</div><div>최종 동기화</div><div className="text-right">관리 액션</div>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#1e293b]">
            {currentItems.map(item => (
               <div key={item.id} onClick={() => setSelectedItem(item)} className="grid grid-cols-[1fr_0.8fr_0.8fr_1.2fr_0.8fr_0.6fr_0.8fr_1.2fr_1.1fr] px-6 py-4 border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors group items-center">
                  <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{item.id}</div>
                  <div>{getStatusBadge(item.status)}</div>
                  <div className="text-xs font-bold text-slate-400">{item.patientType || '-'}</div>
                  <div className="text-sm">
                    {item.patientName && item.patientName !== '-' ? (
                        <div>
                            <span className="text-white font-bold">{item.patientName}</span>
                            <span className="text-slate-500 text-xs ml-1">({item.locationLabel.split(' ')[0]})</span>
                        </div>
                    ) : (
                        <span className="text-slate-500 text-xs">{item.locationLabel}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono tracking-tighter">{item.wearDate || '-'}</div>
                  <div className="text-xs font-bold text-blue-400">{getElapsedDays(item.wearDate)}</div>
                  <div><LinearBattery value={item.battery} /></div>
                  <div className="text-[11px] text-slate-500 font-mono tracking-tight">{item.lastSync}</div>
                  <div className="text-right" onClick={(e) => e.stopPropagation()}>
                    {item.status === 'STORAGE' ? (
                       <button onClick={() => setAssignTarget(item)} className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold py-1.5 rounded border border-blue-500/30 flex items-center justify-center gap-1"><UserPlus size={12}/> 할당</button>
                    ) : (
                       <div className="relative inline-block w-full">
                         <select value={item.status} onChange={(e) => handleStatusChange(item.id, e.target.value)} className="w-full appearance-none bg-slate-800 border border-slate-600 hover:border-blue-500 text-xs text-white font-bold py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                           {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>)}
                         </select>
                         <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                       </div>
                    )}
                  </div>
               </div>
            ))}
         </div>
         <div className="p-3 border-t border-slate-700 bg-slate-900/30 flex justify-center">
             <div className="flex gap-1">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="w-8 h-8 rounded border border-slate-700 text-slate-500 hover:bg-slate-800 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><ArrowLeft size={14}/></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map((page) => (
                  <button key={page} onClick={() => handlePageChange(page)} className={`w-8 h-8 rounded font-bold flex items-center justify-center transition-all ${currentPage === page ? 'bg-blue-600 text-white shadow-lg border border-blue-500' : 'border border-slate-700 text-slate-400 hover:bg-slate-800'}`}>{page}</button>
                ))}
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="w-8 h-8 rounded border border-slate-700 text-slate-500 hover:bg-slate-800 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><ArrowRight size={14}/></button>
             </div>
         </div>
      </div>
    </div>
  );
};

const VitalSettings = () => {
  const [config, setConfig] = useState({
    bp: { active: true, sysMax: 140, sysMin: 90, diaMax: 90, diaMin: 60 },
    pr: { active: true, max: 100, min: 60 },
    spo2: { active: true, min: 90 },
    rr: { active: true, max: 20, min: 10 },
    bt: { active: true, max: 37.5, min: 35.0 }
  });
  const handleToggle = (key) => setConfig(prev => ({ ...prev, [key]: { ...prev[key], active: !prev[key].active } }));
  const ToggleSwitch = ({ active, onClick }) => (
    <div onClick={onClick} className={`w-12 h-6 flex items-center bg-slate-700 rounded-full p-1 cursor-pointer transition-colors ${active ? 'bg-blue-600' : 'bg-slate-700'}`}>
      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${active ? 'translate-x-6' : 'translate-x-0'}`}></div>
    </div>
  );
  const InputRow = ({ label, value, unit }) => (
    <div className="flex justify-between items-center py-2">
      <span className="text-slate-400 text-sm font-bold">{label}</span>
      <div className="flex items-center gap-2">
        <input type="number" defaultValue={value} className="w-20 bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-right text-white font-bold text-sm focus:border-blue-500 outline-none transition-colors" />
        <span className="text-slate-500 text-xs w-8 text-left">{unit}</span>
      </div>
    </div>
  );
  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center pt-2">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Settings className="text-white" size={24} /> 관리항목 조건 설정</h2>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 font-bold text-sm"><RotateCcw size={16}/> 초기화</button>
             <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg font-bold text-sm"><Save size={16}/> 설정 저장</button>
          </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
          <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6 shadow-xl relative overflow-hidden">
             <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4"><div className="flex items-center gap-2 text-rose-500 font-bold text-lg"><Activity size={20}/> 혈압 (BP)</div><ToggleSwitch active={config.bp.active} onClick={() => handleToggle('bp')} /></div>
             <div className={`space-y-2 ${!config.bp.active ? 'opacity-30 pointer-events-none' : ''}`}>
                <InputRow label="수축기 상한" value={config.bp.sysMax} unit="mmHg" /><InputRow label="수축기 하한" value={config.bp.sysMin} unit="mmHg" /><InputRow label="이완기 상한" value={config.bp.diaMax} unit="mmHg" /><InputRow label="이완기 하한" value={config.bp.diaMin} unit="mmHg" />
             </div>
          </div>
          <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6 shadow-xl relative overflow-hidden">
             <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4"><div className="flex items-center gap-2 text-emerald-500 font-bold text-lg"><HeartPulse size={20}/> 맥박 (PR)</div><ToggleSwitch active={config.pr.active} onClick={() => handleToggle('pr')} /></div>
             <div className={`space-y-2 ${!config.pr.active ? 'opacity-30 pointer-events-none' : ''}`}>
                <InputRow label="맥박 상한" value={config.pr.max} unit="bpm" /><InputRow label="맥박 하한" value={config.pr.min} unit="bpm" />
             </div>
          </div>
          <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6 shadow-xl relative overflow-hidden">
             <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4"><div className="flex items-center gap-2 text-blue-500 font-bold text-lg"><Wind size={20}/> 산소포화도</div><ToggleSwitch active={config.spo2.active} onClick={() => handleToggle('spo2')} /></div>
             <div className={`space-y-2 ${!config.spo2.active ? 'opacity-30 pointer-events-none' : ''}`}><InputRow label="산소포화도 하한" value={config.spo2.min} unit="%" /></div>
          </div>
      </div>
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState(() => generatePatients(20));
  const [isNotiOpen, setIsNotiOpen] = useState(false);

  useEffect(() => {
    document.body.className = "bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white";
    const interval = setInterval(() => {
      setPatients((current) => current.map((p) => {
          const nextPoint = generateNextDataPoint(p.status);
          return { ...p, signalPattern: [...p.signalPattern.slice(1), nextPoint] };
        })
      );
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (tab, patient = null) => {
    setActiveTab(tab);
    if (patient) setSelectedPatient(patient);
  };

  const NavItem = ({ id, label, icon: Icon, badge }) => (
    <button onClick={() => handleNavigate(id)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === id ? 'bg-blue-600 text-white shadow-lg font-bold' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}>
      <Icon size={20} /><span className="flex-1 text-left text-sm">{label}</span>
      {badge && <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>}
    </button>
  );

  const notifications = patients.filter(p => p.status === 'warning').slice(0, 5);

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden">
      <GlobalStyles />
      <aside className="w-72 bg-[#0b1121] border-r border-slate-800/50 flex flex-col z-20">
        <div className="h-20 flex items-center px-6 gap-3 border-b border-slate-800/50"><div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold shadow-lg">C</div><span className="text-xl font-extrabold text-white tracking-tight">CART VITAL</span></div>
        <nav className="flex-1 p-4 space-y-2">
            <div className="text-xs font-bold text-slate-500 px-4 py-2 uppercase tracking-wider">Dashboard</div>
            <NavItem id="home" label="대시보드 홈" icon={LayoutDashboard} />
            <div className="mt-6 text-xs font-bold text-slate-500 px-4 py-2 uppercase tracking-wider">Management</div>
            <NavItem id="patients" label="전체 환자 관리" icon={Users} />
            <NavItem id="logistics" label="물류/재고 통합 관리" icon={Truck} />
            <NavItem id="settings" label="관리항목 조건 설정" icon={Settings} />
        </nav>
        <div className="p-4 m-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">Dr.</div><div><div className="text-sm font-bold text-white">일산병원</div><div className="text-xs text-slate-500">가정의학과</div></div></div>
            <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-400 transition-colors">로그아웃</button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 bg-[#0f172a] relative">
        <header className="h-16 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between px-8 z-10">
           <div className="flex items-center gap-2 text-sm text-slate-500"><span className="hover:text-white cursor-pointer transition-colors">홈</span><ChevronRight size={14} /><span className="text-slate-200 font-bold">{activeTab}</span></div>
           <div className="flex items-center gap-6">
              <div className="relative">
                 <div onClick={() => setIsNotiOpen(!isNotiOpen)} className="relative cursor-pointer hover:text-white transition-colors text-slate-400"><Bell size={20} /><span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] text-white flex items-center justify-center border border-slate-900">{notifications.length}</span></div>
                 {isNotiOpen && (
                    <div className="absolute right-0 top-full mt-3 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[200]">
                        <div className="p-3 border-b border-slate-800 text-sm font-bold text-white flex justify-between items-center"><span>최근 알림</span><span className="text-xs text-rose-400">{notifications.length}건의 경고</span></div>
                        <div className="max-h-64 overflow-y-auto">
                           {notifications.length > 0 ? notifications.map((noti, idx) => (
                               <div key={idx} className="p-3 border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer flex gap-3" onClick={() => { handleNavigate('detail', noti); setIsNotiOpen(false); }}>
                                   <div className="mt-1 w-2 h-2 rounded-full bg-rose-500 shrink-0"></div>
                                   <div><div className="text-sm font-bold text-slate-200">{noti.maskedName} ({noti.id})</div><div className="text-xs text-rose-400 mt-0.5">이상 징후 감지: 확인 필요</div></div>
                               </div>
                           )) : <div className="p-4 text-center text-xs text-slate-500">새로운 알림이 없습니다.</div>}
                        </div>
                    </div>
                 )}
              </div>
              <div className="h-6 w-[1px] bg-slate-800"></div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10"><Monitor size={14} className="text-emerald-500" /><span className="text-xs font-bold text-emerald-400">System Ready</span></div>
           </div>
        </header>
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
           {activeTab === 'home' && <DashboardHome onNavigate={handleNavigate} patients={patients} />}
           {activeTab === 'patients' && <PatientList onNavigate={handleNavigate} patients={patients} />}
           {activeTab === 'detail' && <PatientDetail patient={selectedPatient} onBack={() => handleNavigate('patients')} />}
           {activeTab === 'logistics' && <LogisticsManager />}
           {activeTab === 'settings' && <VitalSettings />}
        </div>
      </main>
    </div>
  );
};

export default App;
