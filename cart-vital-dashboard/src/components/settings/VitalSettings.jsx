/**
 * VitalSettings Component
 * Vital sign threshold settings configuration page for CART VITAL dashboard
 * Allows users to configure and manage alert thresholds for blood pressure, heart rate, oxygen saturation, respiration rate, and body temperature
 */

import React, { useState } from 'react';
import {
  Settings,
  RotateCcw,
  Save,
  Activity,
  HeartPulse,
  Wind,
} from 'lucide-react';

const VitalSettings = () => {
  const initialConfig = {
    bp: {
      active: true,
      sysMax: 140,
      sysMin: 90,
      diaMax: 90,
      diaMin: 60,
    },
    pr: {
      active: true,
      max: 100,
      min: 60,
    },
    spo2: {
      active: true,
      min: 90,
    },
    rr: {
      active: true,
      max: 20,
      min: 10,
    },
    bt: {
      active: true,
      max: 37.5,
      min: 35.0,
    },
  };

  const [config, setConfig] = useState(initialConfig);
  const [saveMessage, setSaveMessage] = useState('');

  // Handle toggle for vital sign categories
  const handleToggle = (category) => {
    setConfig((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        active: !prev[category].active,
      },
    }));
  };

  // Handle input value changes
  const handleInputChange = (category, field, value) => {
    setConfig((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: parseFloat(value) || 0,
      },
    }));
  };

  // Reset to initial configuration
  const handleReset = () => {
    setConfig(initialConfig);
    setSaveMessage('');
  };

  // Save configuration
  const handleSave = () => {
    // Here you would typically send config to backend
    console.log('Saving configuration:', config);
    setSaveMessage('설정이 저장되었습니다.');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-[#1e293b] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">생체 신호 설정</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                <RotateCcw className="w-5 h-5" />
                초기화
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
              >
                <Save className="w-5 h-5" />
                설정 저장
              </button>
            </div>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div className="p-4 bg-green-900 border border-green-700 text-green-300 rounded-lg mb-6">
              {saveMessage}
            </div>
          )}

          {/* Info Text */}
          <p className="text-slate-400">
            각 생체 신호의 정상 범위와 경보 임계값을 설정하세요.
          </p>
        </div>

        {/* Settings Cards Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Blood Pressure Card */}
          <div
            className={`bg-slate-800 border border-slate-700 rounded-lg p-6 transition ${
              !config.bp.active ? 'opacity-30 pointer-events-none' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500 bg-opacity-20 rounded-lg">
                  <Activity className="w-5 h-5 text-rose-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">혈압(BP)</h2>
              </div>
              <label className="flex items-center cursor-pointer">
                <div className="relative inline-block w-10 h-6 bg-slate-700 rounded-full">
                  <input
                    type="checkbox"
                    checked={config.bp.active}
                    onChange={() => handleToggle('bp')}
                    className="sr-only"
                  />
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${
                      config.bp.active ? 'translate-x-4' : ''
                    }`}
                  />
                </div>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  수축기 최대(SyS Max)
                </label>
                <input
                  type="number"
                  value={config.bp.sysMax}
                  onChange={(e) =>
                    handleInputChange('bp', 'sysMax', e.target.value)
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  수축기 최소(Sys Min)
                </label>
                <input
                  type="number"
                  value={config.bp.sysMin}
                  onChange={(e) =>
                    handleInputChange('bp', 'sysMin', e.target.value)
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  이완기 최대(Dia Max)
                </label>
                <input
                  type="number"
                  value={config.bp.diaMax}
                  onChange={(e) =>
                    handleInputChange('bp', 'diaMax', e.target.value)
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  이완기 최소(Dia Min)
                </label>
                <input
                  type="number"
                  value={config.bp.diaMin}
                  onChange={(e) =>
                    handleInputChange('bp', 'diaMin', e.target.value)
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Pulse Rate Card */}
          <div
            className={`bg-slate-800 border border-slate-700 rounded-lg p-6 transition ${
              !config.pr.active ? 'opacity-30 pointer-events-none' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 bg-opacity-20 rounded-lg">
                  <HeartPulse className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">맥박(PR)</h2>
              </div>
              <label className="flex items-center cursor-pointer">
                <div className="relative inline-block w-10 h-6 bg-slate-700 rounded-full">
                  <input
                    type="checkbox"
                    checked={config.pr.active}
                    onChange={() => handleToggle('pr')}
                    className="sr-only"
                  />
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${
                      config.pr.active ? 'translate-x-4' : ''
                    }`}
                  />
                </div>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  최대(Max)
                </label>
                <input
                  type="number"
                  value={config.pr.max}
                  onChange={(e) => handleInputChange('pr', 'max', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  최소(Min)
                </label>
                <input
                  type="number"
                  value={config.pr.min}
                  onChange={(e) => handleInputChange('pr', 'min', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Oxygen Saturation Card */}
          <div
            className={`bg-slate-800 border border-slate-700 rounded-lg p-6 transition ${
              !config.spo2.active ? 'opacity-30 pointer-events-none' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg">
                  <Wind className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">산소포화도</h2>
              </div>
              <label className="flex items-center cursor-pointer">
                <div className="relative inline-block w-10 h-6 bg-slate-700 rounded-full">
                  <input
                    type="checkbox"
                    checked={config.spo2.active}
                    onChange={() => handleToggle('spo2')}
                    className="sr-only"
                  />
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${
                      config.spo2.active ? 'translate-x-4' : ''
                    }`}
                  />
                </div>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  최소(Min) %
                </label>
                <input
                  type="number"
                  value={config.spo2.min}
                  onChange={(e) =>
                    handleInputChange('spo2', 'min', e.target.value)
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Respiration Rate Card */}
          <div
            className={`bg-slate-800 border border-slate-700 rounded-lg p-6 transition ${
              !config.rr.active ? 'opacity-30 pointer-events-none' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 bg-opacity-20 rounded-lg">
                  <Wind className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">호흡 속도(RR)</h2>
              </div>
              <label className="flex items-center cursor-pointer">
                <div className="relative inline-block w-10 h-6 bg-slate-700 rounded-full">
                  <input
                    type="checkbox"
                    checked={config.rr.active}
                    onChange={() => handleToggle('rr')}
                    className="sr-only"
                  />
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${
                      config.rr.active ? 'translate-x-4' : ''
                    }`}
                  />
                </div>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  최대(Max)
                </label>
                <input
                  type="number"
                  value={config.rr.max}
                  onChange={(e) => handleInputChange('rr', 'max', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  최소(Min)
                </label>
                <input
                  type="number"
                  value={config.rr.min}
                  onChange={(e) => handleInputChange('rr', 'min', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Body Temperature Card */}
          <div
            className={`bg-slate-800 border border-slate-700 rounded-lg p-6 transition ${
              !config.bt.active ? 'opacity-30 pointer-events-none' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 bg-opacity-20 rounded-lg">
                  <Activity className="w-5 h-5 text-red-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">체온(BT)</h2>
              </div>
              <label className="flex items-center cursor-pointer">
                <div className="relative inline-block w-10 h-6 bg-slate-700 rounded-full">
                  <input
                    type="checkbox"
                    checked={config.bt.active}
                    onChange={() => handleToggle('bt')}
                    className="sr-only"
                  />
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${
                      config.bt.active ? 'translate-x-4' : ''
                    }`}
                  />
                </div>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  최대(Max) °C
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.bt.max}
                  onChange={(e) => handleInputChange('bt', 'max', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  최소(Min) °C
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.bt.min}
                  onChange={(e) => handleInputChange('bt', 'min', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <p className="text-sm text-slate-400">
            설정을 변경한 후 <strong className="text-white">설정 저장</strong> 버튼을 클릭하여 변경사항을 적용하세요. 초기화 버튼을 클릭하면 기본값으로 복원됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VitalSettings;
