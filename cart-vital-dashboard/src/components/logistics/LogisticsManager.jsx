/**
 * LogisticsManager Component
 * Main logistics/asset management page for CART VITAL hospital device dashboard
 * Displays device inventory, status tracking, patient assignments, and logistics workflow
 */

import React, { useState } from 'react';
import {
  Box,
  Truck,
  CheckCircle2,
  UserCheck,
  RefreshCw,
  Wrench,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Plus,
  Search,
  RotateCcw,
  Activity,
  UserPlus,
  FileSpreadsheet,
} from 'lucide-react';
import LogisticsDetailModal from './LogisticsDetailModal';
import AssetAssignmentModal from './AssetAssignmentModal';
import LinearBattery from '../common/LinearBattery';
import { generateAssets } from '../../utils/dataGenerators';

const LogisticsManager = () => {
  const [filter, setFilter] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [assets, setAssets] = useState(generateAssets(100));

  const statusSteps = [
    { key: 'STORAGE', label: '보관 중', icon: Box },
    { key: 'DISPATCH', label: '발송 중', icon: Truck },
    { key: 'DELIVERED', label: '배송 완료', icon: CheckCircle2 },
    { key: 'IN_USE', label: '사용 중', icon: UserCheck },
    { key: 'RETURN', label: '회수 중', icon: RefreshCw },
    { key: 'CLEANING_REPAIR', label: '소독/수리 중', icon: Wrench },
  ];

  const statusColors = {
    STORAGE: 'bg-gray-500',
    DISPATCH: 'bg-blue-500',
    DELIVERED: 'bg-blue-600',
    IN_USE: 'bg-green-500',
    RETURN: 'bg-yellow-500',
    CLEANING_REPAIR: 'bg-orange-500',
  };

  const statusLabelMap = {
    STORAGE: '보관 중',
    DISPATCH: '발송 중',
    DELIVERED: '배송 완료',
    IN_USE: '사용 중',
    RETURN: '회수 중',
    CLEANING_REPAIR: '소독/수리 중',
  };

  // Filter assets based on selected filter
  const filteredAssets =
    filter === 'ALL'
      ? assets
      : assets.filter((asset) => asset.status === filter);

  // Pagination
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = filteredAssets.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // Statistics
  const totalAssets = assets.length;
  const activeAssets = assets.filter((a) => a.status === 'IN_USE').length;
  const utilizationRate = Math.round((activeAssets / totalAssets) * 100);

  // Handle status change
  const handleStatusChange = (assetId, newStatus) => {
    setAssets((prevAssets) =>
      prevAssets.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              status: newStatus,
              ...(newStatus === 'STORAGE' && {
                patientName: '-',
                locationLabel: '제1보관소',
                wornDate: '-',
              }),
            }
          : asset
      )
    );
  };

  // Handle asset assignment
  const handleAssign = (assetId, patientInfo) => {
    setAssets((prevAssets) =>
      prevAssets.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              status: 'IN_USE',
              patientName: patientInfo.patientName,
              locationLabel: patientInfo.location,
              wornDate: new Date().toISOString().split('T')[0],
            }
          : asset
      )
    );
    setAssignTarget(null);
  };

  // Calculate days elapsed
  const calculateDaysElapsed = (wornDate) => {
    if (!wornDate) return '-';
    const today = new Date();
    const worn = new Date(wornDate);
    const diff = Math.floor((today - worn) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  };

  // Download CSV
  const handleDownloadCSV = () => {
    const headers = [
      '기기 ID',
      '상태',
      '환자 유형',
      '할당 환자',
      '착용일',
      '경과(일)',
      '배터리',
      '최종 동기화',
    ];
    const rows = filteredAssets.map((asset) => [
      asset.id,
      statusLabelMap[asset.status],
      asset.patientType,
      asset.patientName || '-',
      asset.wornDate || '-',
      calculateDaysElapsed(asset.wornDate),
      `${asset.battery}%`,
      asset.lastSync,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logistics_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Add new device
  const handleAddDevice = () => {
    const newAsset = {
      id: `CR-${String(assets.length + 1).padStart(4, '0')}`,
      status: 'STORAGE',
      patientType: '입원',
      patientName: '-',
      locationLabel: '제1보관소',
      wornDate: '-',
      battery: 100,
      lastSync: new Date().toLocaleString('ko-KR'),
    };
    setAssets([...assets, newAsset]);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">기기 관리</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                <FileSpreadsheet className="w-5 h-5" />
                엑셀 다운로드
              </button>
              <button
                onClick={handleAddDevice}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                신규 기기 등록
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-2">총 기기 수</p>
              <p className="text-3xl font-bold text-white">{totalAssets}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-2">사용 중 / 총</p>
              <p className="text-3xl font-bold text-white">
                {activeAssets} / {totalAssets}
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-2">이용률</p>
              <div className="relative h-8 bg-slate-700 rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 animate-pulse"
                  style={{ width: `${utilizationRate}%` }}
                />
                <p className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                  {utilizationRate}%
                </p>
              </div>
            </div>
          </div>

          {/* Process Flow Steps */}
          <div className="flex gap-2 overflow-x-auto pb-4">
            <button
              onClick={() => {
                setFilter('ALL');
                setCurrentPage(0);
              }}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                filter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              전체
            </button>
            {statusSteps.map((step) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.key}
                  onClick={() => {
                    setFilter(step.key);
                    setCurrentPage(0);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                    filter === step.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                  기기 ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                  상태
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                  환자 유형
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                  할당 환자/위치
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                  착용일
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                  경과(일)
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                  배터리
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                  최종 동기화
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                  관리 액션
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedAssets.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-slate-400">
                    해당하는 기기가 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    onClick={() => setSelectedItem(asset)}
                    className="border-b border-slate-700 hover:bg-slate-700 transition cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm text-white font-medium">
                      {asset.id}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${
                          statusColors[asset.status]
                        }`}
                      >
                        {statusLabelMap[asset.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {asset.patientType}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {asset.patientName && asset.patientName !== '-' ? (
                        <div>
                          <p>{asset.patientName}</p>
                          <p className="text-xs text-slate-400">
                            {asset.locationLabel}
                          </p>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {asset.wornDate || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {calculateDaysElapsed(asset.wornDate)}
                    </td>
                    <td className="px-6 py-4">
                      <LinearBattery value={asset.battery} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {asset.lastSync}
                    </td>
                    <td className="px-6 py-4">
                      {asset.status === 'STORAGE' ? (
                        <button
                          onClick={() => setAssignTarget(asset)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition"
                        >
                          <UserPlus className="w-4 h-4" />
                          할당
                        </button>
                      ) : (
                        <select
                          value={asset.status}
                          onChange={(e) =>
                            handleStatusChange(asset.id, e.target.value)
                          }
                          className="px-3 py-1 bg-slate-700 text-white text-sm rounded border border-slate-600 focus:outline-none"
                        >
                          {statusSteps.map((step) => (
                            <option key={step.key} value={step.key}>
                              {step.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-slate-400 text-sm">
            페이지 {currentPage + 1} / {totalPages} (전체 {filteredAssets.length}개)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded transition"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedItem && (
        <LogisticsDetailModal
          asset={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
      {assignTarget && (
        <AssetAssignmentModal
          asset={assignTarget}
          onAssign={handleAssign}
          onClose={() => setAssignTarget(null)}
        />
      )}
    </div>
  );
};

export default LogisticsManager;
