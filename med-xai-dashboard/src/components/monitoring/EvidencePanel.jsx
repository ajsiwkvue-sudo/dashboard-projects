import React, { useState } from 'react';
import { Eye, ChevronLeft, X, Image as ImageIcon, AlertCircle, Maximize2 } from 'lucide-react';
import { organEvidenceDB } from '../../data/organEvidence.js';

const getStatusColor = (status) => {
  switch (status) {
    case 'critical': return 'bg-rose-500';
    case 'warning': return 'bg-amber-400';
    default: return 'bg-emerald-400';
  }
};

const getTextColor = (status) => {
  switch (status) {
    case 'critical': return 'text-rose-600';
    case 'warning': return 'text-amber-500';
    default: return 'text-slate-800';
  }
};

export const EvidencePanel = ({ selectedOrgan, onReset }) => {
  const [showViewer, setShowViewer] = useState(false);
  const organName = selectedOrgan?.name || '심장';
  const data = organEvidenceDB[organName];
  if (!data) return null;

  return (
    <div className="bg-white border border-slate-200 p-10 rounded-3xl shadow-sm h-full flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-700 relative">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest border-l-4 border-blue-500 pl-4">
            CLINICAL EVIDENCE: <span className="text-blue-600">{data.title}</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 font-bold pl-5">{data.summary}</p>
        </div>
        <div className="flex items-center gap-3">
          {data.imageUrl && (
            <button
              onClick={() => setShowViewer(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black transition-all shadow-md active:scale-95"
            >
              <Eye size={14} /> {data.title} {data.imageType} 확인
            </button>
          )}
          {data.tags.map((tag, i) => (
            <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-500">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        <div className="grid grid-cols-2 gap-4">
          {data.metrics.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm group"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight group-hover:text-blue-500 transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.label}
                </span>
                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(item.status)} shadow-md shrink-0 ml-4`} />
              </div>
              <div className="flex flex-col">
                <span className={`text-2xl font-black leading-tight ${getTextColor(item.status)}`}>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all shadow-xl active:scale-95"
        >
          <ChevronLeft size={16} /> 분석 초기화 및 목록으로
        </button>
      </div>

      {showViewer && (
        <div className="fixed inset-0 z-[100] bg-black animate-in fade-in duration-300 flex flex-col">
          <div className="h-16 bg-slate-900/60 backdrop-blur-lg border-b border-slate-800 px-10 flex items-center justify-between shrink-0 z-10">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-600 rounded-lg text-white">
                <ImageIcon size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-widest leading-none">
                  환자 {data.title} {data.imageType} 영상 정밀 분석
                </h2>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                  XAI Imaging Protocol v4.0.2
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-slate-800 rounded-xl text-blue-400 text-xs font-black border border-slate-700">
                SCAN ID: {organName.toUpperCase()}-IMG-{(Math.random() * 1000).toFixed(0)}
              </div>
              <button
                onClick={() => setShowViewer(false)}
                className="p-3 bg-rose-600/20 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl transition-all shadow-lg active:scale-95"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
            <img
              src={data.imageUrl}
              alt={`${data.title} ${data.imageType}`}
              className="w-full h-full object-contain animate-in zoom-in-95 duration-500 shadow-2xl"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/1920x1080?text=Image+Loading+Error';
              }}
            />
            <div className="absolute bottom-12 left-12 p-8 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-[32px] max-w-lg shadow-2xl z-10">
              <div className="flex items-center gap-3 mb-4 text-blue-400">
                <AlertCircle size={20} />
                <span className="text-xs font-black uppercase tracking-[0.2em]">AI Detection Insights</span>
              </div>
              <p className="text-[12px] text-slate-200 leading-relaxed font-bold">
                해당 {data.imageType} 영상은 사업단의 실시간 판독 지원 시스템을 통해 분석되었습니다. {organName} 부위의 특이 음영 및 구조적 변화가 알고리즘에 의해 감지되었으므로, 임상 소견과 병합하여 판독하십시오.
              </p>
            </div>
          </div>

          <div className="h-14 bg-slate-900/60 backdrop-blur-lg px-10 flex items-center justify-center gap-10 border-t border-slate-800/50 z-10">
            <div className="flex items-center gap-3 text-slate-400 text-[11px] font-black uppercase tracking-widest">
              <Maximize2 size={14} /> Full Screen Maximized View
            </div>
            <div className="w-px h-5 bg-slate-800" />
            <div className="text-slate-400 text-[11px] font-bold">Zoom: Aspect-Fit Fill | High Dynamic Range Active</div>
          </div>
        </div>
      )}
    </div>
  );
};
