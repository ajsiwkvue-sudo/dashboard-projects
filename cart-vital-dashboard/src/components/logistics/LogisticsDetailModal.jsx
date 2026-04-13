/**
 * LogisticsDetailModal Component
 * -----------------------------------------------
 * 기기 상세 정보 및 물류 추적 모달
 * - 입원 환자: 원내 배정 정보, 담당 간호사, 기기 착용/해제/충전 타임라인
 * - 지역사회 환자: 통합 택배 조회 (CJ대한통운 스타일 배송 추적)
 * - 보관 중 기기: 빈 상태 표시
 */

import React, { useState } from 'react';
import {
  Truck,
  X,
  UserCheck,
  Battery,
  RotateCcw,
  Activity,
  Clock,
  CheckCircle,
  Box,
  Loader2,
  Search,
  Globe,
  Package,
  Check,
} from 'lucide-react';
import LinearBattery from '../common/LinearBattery';

const LogisticsDetailModal = ({ asset, onClose }) => {
  const [trackingSearch, setTrackingSearch] = useState('');

  const statusMap = {
    STORAGE: { label: '보관중', color: 'bg-gray-500', textColor: 'text-gray-400' },
    DISPATCH: { label: '발송중', color: 'bg-blue-500', textColor: 'text-blue-400' },
    DELIVERED: { label: '배송완료', color: 'bg-green-500', textColor: 'text-green-400' },
    IN_USE: { label: '사용중', color: 'bg-purple-500', textColor: 'text-purple-400' },
    RETURN: { label: '회수중', color: 'bg-orange-500', textColor: 'text-orange-400' },
    CLEANING_REPAIR: { label: '소독/수리중', color: 'bg-cyan-500', textColor: 'text-cyan-400' },
  };

  // 입원 환자 기기 타임라인 (착용/해제/충전 이력)
  const inpatientTimeline = [
    { event: '착용 시작', date: '2026-01-15 09:30', icon: UserCheck, nurse: '이지혜 책임간호사' },
    { event: '충전 (해제)', date: '2026-01-16 14:20', icon: Battery, nurse: '이지혜 책임간호사' },
    { event: '재착용', date: '2026-01-16 16:45', icon: Activity, nurse: '김수현 간호사' },
    { event: '충전 (해제)', date: '2026-01-17 11:00', icon: Battery, nurse: '이지혜 책임간호사' },
    { event: '재착용', date: '2026-01-17 13:15', icon: Activity, nurse: '김수현 간호사' },
  ];

  // 택배 배송 진행 단계
  const courseSteps = [
    { label: '상품준비', completed: true },
    { label: '집화처리', completed: true },
    { label: '배송중', completed: asset?.status === 'IN_USE' || asset?.status === 'DELIVERED' },
    { label: '배송완료', completed: asset?.status === 'DELIVERED' },
  ];

  // 배송 이력 상세
  const deliveryHistory = [
    { step: '상품준비', time: '2026-01-15 10:00', location: '서울 CART센터', status: '완료' },
    { step: '집화처리', time: '2026-01-15 14:30', location: '서울 강남 집배점', status: '완료' },
    { step: '배송출발', time: '2026-01-16 08:00', location: '경기 성남 허브', status: '완료' },
    { step: '배송중', time: '2026-01-16 11:30', location: '수원 영통 배달점', status: asset?.status === 'DELIVERED' ? '완료' : '진행중' },
    { step: '배송완료', time: asset?.status === 'DELIVERED' ? '2026-01-16 14:20' : '-', location: '-', status: asset?.status === 'DELIVERED' ? '완료' : '대기중' },
  ];

  const isInpatient = asset?.patientType === '입원';
  const isStorage = asset?.status === 'STORAGE';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-700">

        {/* 브라우저 크롬 UI */}
        <div className="bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div className="flex-1 ml-4 bg-slate-700 rounded px-3 py-1 text-xs text-slate-400">
              <Globe className="w-3 h-3 inline mr-2" />
              cart-vital-logistics.hospital.local/{asset?.id}
            </div>
            <X
              onClick={onClose}
              className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer"
            />
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex h-[calc(90vh-50px)]">

          {/* 사이드바: 기기 정보 요약 */}
          <div className="w-64 bg-slate-800 border-r border-slate-700 p-4 space-y-6 overflow-y-auto">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">기기 ID</div>
              <div className="text-sm font-mono text-blue-400">{asset?.id}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">상태</div>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusMap[asset?.status]?.color}`}>
                {statusMap[asset?.status]?.label}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">배터리</div>
              <LinearBattery value={asset?.battery || 0} />
              <div className="text-xs text-slate-400 mt-1">{asset?.battery || 0}%</div>
            </div>

            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">관리 부서</div>
              <div className="text-sm text-slate-300">기기운영팀</div>
            </div>

            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">환자</div>
              <div className="text-sm text-slate-300">{asset?.patientName || '-'}</div>
              <div className="text-xs text-slate-500 mt-1">{asset?.patientType}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">위치</div>
              <div className="text-sm text-slate-300">{asset?.locationLabel || '-'}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">최종 동기화</div>
              <div className="text-xs text-slate-400">{asset?.lastSync}</div>
            </div>
          </div>

          {/* 메인 패널 */}
          <div className="flex-1 overflow-y-auto">
            {isStorage ? (
              // 보관 중 기기: 빈 상태
              <div className="h-full flex flex-col items-center justify-center p-8">
                <Box className="w-16 h-16 text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">발송 전인 기기입니다</h3>
                <p className="text-sm text-slate-500">기기가 보관소에서 배송 대기 중입니다</p>
              </div>
            ) : isInpatient ? (
              // 입원 환자: 원내 배정 정보
              <div className="p-8">
                <h2 className="text-2xl font-bold text-white mb-2">원내 배정 정보</h2>
                <p className="text-slate-400 mb-6">입원 환자 기기 배치 및 착용 이력</p>

                {/* 병동 배정 카드 */}
                <div className="bg-slate-800 rounded-lg p-4 mb-8 border border-slate-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 uppercase mb-1">병동</div>
                      <div className="text-sm font-semibold text-white">71병동</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase mb-1">병실</div>
                      <div className="text-sm font-semibold text-white">{asset?.locationLabel || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase mb-1">착용일</div>
                      <div className="text-sm font-semibold text-white">{asset?.wornDate || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase mb-1">담당 간호사</div>
                      <div className="text-sm font-semibold text-white">이지혜 책임간호사</div>
                    </div>
                  </div>
                </div>

                {/* 기기 착용/해제/충전 타임라인 */}
                <h3 className="text-lg font-semibold text-white mb-4">기기 이력 (착용/해제/충전)</h3>
                <div className="space-y-4">
                  {inpatientTimeline.map((event, idx) => {
                    const IconComponent = event.icon;
                    return (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-blue-400" />
                          </div>
                          {idx < inpatientTimeline.length - 1 && (
                            <div className="w-0.5 h-12 bg-slate-700 my-2"></div>
                          )}
                        </div>
                        <div className="pt-2">
                          <div className="font-semibold text-white">{event.event}</div>
                          <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4" />
                            {event.date}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">담당: {event.nurse}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // 지역사회/외래: 통합 택배 조회 (CJ대한통운 스타일)
              <div className="p-8">
                <h2 className="text-2xl font-bold text-white mb-2">통합 택배 조회</h2>
                <p className="text-slate-400 mb-6">기기 배송 추적 정보</p>

                {/* 운송장 검색 */}
                <div className="bg-slate-800 rounded-lg p-4 mb-8 border border-slate-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={trackingSearch}
                      onChange={(e) => setTrackingSearch(e.target.value)}
                      placeholder="운송장 번호 조회..."
                      className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 text-sm"
                    />
                    <button className="bg-blue-600 hover:bg-blue-700 p-2 rounded transition">
                      <Search className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div className="mt-3 text-xs text-slate-400">
                    운송장 번호: <span className="font-mono text-blue-400">{asset?.id}-{Date.now().toString().slice(-6)}</span>
                  </div>
                </div>

                {/* 배송 진행 단계 */}
                <h3 className="text-lg font-semibold text-white mb-4">배송 진행 현황</h3>
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    {courseSteps.map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition ${
                            step.completed
                              ? 'bg-green-500 border border-green-400'
                              : 'bg-slate-700 border border-slate-600'
                          }`}
                        >
                          {step.completed ? (
                            <Check className="w-5 h-5 text-white" />
                          ) : (
                            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                          )}
                        </div>
                        <div className="text-xs text-center text-slate-400">{step.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 배송 이력 테이블 */}
                <h3 className="text-lg font-semibold text-white mb-4">배송 이력</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left px-4 py-3 text-slate-400 font-semibold">단계</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-semibold">일시</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-semibold">위치</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-semibold">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveryHistory.map((entry, idx) => (
                        <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                          <td className="px-4 py-3 text-slate-300 flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-400" />
                            {entry.step}
                          </td>
                          <td className="px-4 py-3 text-slate-400">{entry.time}</td>
                          <td className="px-4 py-3 text-slate-400">{entry.location}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                entry.status === '완료'
                                  ? 'bg-green-500/20 text-green-400'
                                  : entry.status === '진행중'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-slate-700/50 text-slate-400'
                              }`}
                            >
                              {entry.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsDetailModal;
