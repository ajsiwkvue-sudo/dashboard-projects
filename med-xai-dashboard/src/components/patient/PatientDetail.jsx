import React, { useState } from 'react';
import { Activity, ArrowLeft, GitCommit, TrendingUp, TrendingDown } from 'lucide-react';
import { HumanBodyOrganMap } from '../monitoring/HumanBodyOrganMap.jsx';
import { OrganTopMonitoring } from '../monitoring/OrganTopMonitoring.jsx';
import { EvidencePanel } from '../monitoring/EvidencePanel.jsx';
import { ReportBox } from '../shared/ReportBox.jsx';

const TABS = ['환자 상태', '정밀진단 분석 (AI)', '상태요약보고 (SBAR)', '상태기록 (SOAP)'];

export const PatientDetail = ({ patient, onBack }) => {
  const [activeTab, setActiveTab] = useState('환자 상태');
  const [selectedOrganForTrend, setSelectedOrganForTrend] = useState(null);

  if (!patient) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 relative text-slate-900 h-full">
      <div className="bg-[#dae8f7] py-3 px-10 rounded-2xl border border-[#c5d9ed] flex justify-center shadow-sm">
        <h1 className="text-blue-900 font-black text-sm uppercase tracking-[0.4em]">정밀 진단 분석 보고</h1>
      </div>

      <div className="bg-slate-100/50 p-6 rounded-[32px] border border-slate-200 grid grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-[10px] text-slate-400 font-black uppercase mb-1">환자정보</div>
          <div className="text-lg font-black text-slate-800">{patient.name}</div>
          <div className="text-[11px] text-slate-500 font-bold">ID: {patient.id}, {patient.gender} {patient.age}세</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-[10px] text-slate-400 font-black uppercase mb-1">진단 정보</div>
          <div className="text-[12px] font-bold text-slate-700 leading-tight">{patient.diagnosis}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-[10px] text-slate-400 font-black uppercase mb-1">최근 체크 시간</div>
          <div className="text-[12px] font-bold text-slate-700 leading-tight">{patient.checkTime}</div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-8 py-3 text-xs font-black uppercase border-x border-t rounded-t-2xl -mb-[1px] transition-all ${
              activeTab === t
                ? 'bg-slate-700 text-white border-slate-700 shadow-lg scale-[1.02]'
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === '환자 상태' && (
        <div className="grid grid-cols-12 gap-8 items-stretch h-[720px]">
          <div className="col-span-4 h-full">
            <div className="bg-white border rounded-[40px] p-8 shadow-2xl h-full flex flex-col">
              <HumanBodyOrganMap
                organs={patient.targetOrgans}
                selectedOrgan={selectedOrganForTrend}
                onSelect={(o) => setSelectedOrganForTrend(o)}
              />
            </div>
          </div>
          <div className="col-span-8 flex flex-col gap-6 h-full transition-all duration-500">
            {selectedOrganForTrend ? (
              <>
                <div className="h-[240px] shrink-0">
                  <OrganTopMonitoring organ={selectedOrganForTrend} />
                </div>
                <div className="flex-1 min-h-0">
                  <EvidencePanel
                    selectedOrgan={selectedOrganForTrend}
                    onReset={() => setSelectedOrganForTrend(null)}
                  />
                </div>
              </>
            ) : (
              <div className="h-full bg-slate-50/50 border border-slate-200 border-dashed rounded-[40px] flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 animate-bounce">
                  <Activity size={32} className="text-slate-300" />
                </div>
                <div className="text-center">
                  <p className="font-black uppercase tracking-widest text-sm mb-1">Waiting for selection</p>
                  <p className="text-[11px] font-bold">인체 맵에서 분석을 진행할 장기를 클릭해 주세요.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === '정밀진단 분석 (AI)' && (
        <div className="grid grid-cols-2 gap-8 items-stretch h-[680px] animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-6 h-full">
            <div className="h-[200px] shrink-0">
              <ReportBox title="주요 위험 인자" variant="xai">
                <div className="grid grid-cols-3 gap-3 h-full items-center">
                  {patient.xai.riskFactors.map((rf, idx) => (
                    <div
                      key={idx}
                      className="bg-white border-2 border-slate-50 p-3 rounded-2xl flex flex-col items-center justify-center shadow-sm hover:border-blue-100 transition-colors h-[120px]"
                    >
                      <span className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-tight">{rf.name}</span>
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-black ${rf.type === 'up' ? 'text-rose-500' : 'text-blue-500'}`}>{rf.value}</span>
                        {rf.type === 'up'
                          ? <TrendingUp size={14} className="text-rose-500" />
                          : <TrendingDown size={14} className="text-blue-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </ReportBox>
            </div>
            <div className="flex-1 min-h-0">
              <ReportBox title="판별근거 (현재)" content={patient.xai.basisCurrent} variant="xai" />
            </div>
          </div>
          <div className="flex flex-col gap-6 h-full">
            <div className="h-[200px] shrink-0">
              <ReportBox title="AI 판독 결과 요약" variant="xai">
                <div className="h-full flex flex-col justify-center items-center text-center px-4 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white mb-3 shadow-lg">
                    <GitCommit size={20} />
                  </div>
                  <p className="text-[11px] font-black text-slate-800 leading-relaxed italic line-clamp-3">{patient.xai.summary}</p>
                </div>
              </ReportBox>
            </div>
            <div className="flex-1 min-h-0">
              <ReportBox title="판별근거 (예측)" content={patient.xai.basisPrediction} variant="xai" />
            </div>
          </div>
        </div>
      )}

      {activeTab === '상태요약보고 (SBAR)' && (
        <div className="grid grid-cols-2 gap-8 items-stretch h-[680px] animate-in slide-in-from-bottom-4 duration-500">
          <ReportBox title="Situation" content={patient.sbar.situation} />
          <ReportBox title="Background" content={patient.sbar.background} />
          <ReportBox title="Assessment" content={patient.sbar.assessment} />
          <ReportBox title="Recommend" content={patient.sbar.recommend} />
        </div>
      )}

      {activeTab === '상태기록 (SOAP)' && (
        <div className="grid grid-cols-2 gap-8 items-stretch h-[680px] animate-in slide-in-from-bottom-4 duration-500">
          <ReportBox title="Subjective" content={patient.soap.subjective} />
          <ReportBox title="Objective" content={patient.soap.objective} />
          <ReportBox title="Assessment" content={patient.soap.assessment} />
          <ReportBox title="Plan" content={patient.soap.plan} />
        </div>
      )}

      <div className="py-10 flex justify-center border-t border-slate-200">
        <button
          onClick={onBack}
          className="px-20 py-5 bg-slate-900 text-white text-xs font-black rounded-2xl uppercase hover:bg-slate-800 transition-all shadow-2xl flex items-center gap-6 group tracking-[0.2em]"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-2 transition-transform" /> 목록으로
        </button>
      </div>
    </div>
  );
};
