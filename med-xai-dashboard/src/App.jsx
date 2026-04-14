import React, { useState } from 'react';
import { Activity, LayoutDashboard, User } from 'lucide-react';
import { DeviceDashboard } from './components/dashboard/DeviceDashboard.jsx';
import { PatientMonitoring } from './components/patient/PatientMonitoring.jsx';
import { PatientDetail } from './components/patient/PatientDetail.jsx';
import { generateXaiPatientsData } from './data/patients.js';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patients] = useState(() => generateXaiPatientsData(15));
  const [selectedPatient, setSelectedPatient] = useState(null);

  return (
    <div className="flex h-screen w-full bg-[#0b1121] text-slate-200 overflow-hidden font-sans antialiased">
      <aside className="w-72 bg-[#0b1121] flex flex-col z-20 shadow-2xl shrink-0 border-r border-slate-800/50">
        <div className="h-24 flex items-center px-10 gap-4 border-b border-slate-800/30">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center font-black text-xl shadow-2xl text-white">
            M
          </div>
          <div>
            <span className="text-2xl font-black tracking-tighter text-white block leading-none">Med XAI</span>
            <span className="text-[10px] text-blue-500 font-black uppercase tracking-[0.3em] mt-1 block">Protocols 4.0</span>
          </div>
        </div>
        <nav className="flex-1 p-6 space-y-2 mt-4">
          <button
            onClick={() => { setActiveTab('dashboard'); setSelectedPatient(null); }}
            className={`w-full flex items-center gap-5 px-7 py-5 rounded-2xl transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-xl'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            <LayoutDashboard size={22} />
            <span className="text-sm font-black uppercase tracking-widest">대시보드</span>
          </button>
          <button
            onClick={() => { setActiveTab('monitor'); setSelectedPatient(null); }}
            className={`w-full flex items-center gap-5 px-7 py-5 rounded-2xl transition-all ${
              activeTab === 'monitor' || activeTab === 'detail'
                ? 'bg-blue-600 text-white shadow-xl'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            <Activity size={22} />
            <span className="text-sm font-black uppercase tracking-widest">환자모니터링</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#0b1121] overflow-hidden">
        <header className="h-20 border-b border-slate-800/50 bg-[#0b1121]/80 backdrop-blur-xl flex items-center justify-between px-12 z-20 shrink-0">
          <div />
          <div className="flex items-center gap-8">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-slate-400 font-black">오성진 교수</div>
              <div className="text-[9px] text-blue-500 font-bold">심장내과</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <User size={20} />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          {activeTab === 'dashboard' ? (
            <DeviceDashboard />
          ) : activeTab === 'monitor' ? (
            <PatientMonitoring
              patients={patients}
              onSelect={(p) => { setSelectedPatient(p); setActiveTab('detail'); }}
            />
          ) : activeTab === 'detail' ? (
            <div className="max-w-7xl mx-auto h-full">
              <PatientDetail patient={selectedPatient} onBack={() => setActiveTab('monitor')} />
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default App;
