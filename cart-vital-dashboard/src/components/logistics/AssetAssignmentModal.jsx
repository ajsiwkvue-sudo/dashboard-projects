/**
 * AssetAssignmentModal Component
 *
 * A two-step modal for assigning hospital devices to patients.
 * Step 1: Select location type (Hospital vs Community)
 * Step 2: Fill patient information form with location-specific fields
 *
 * Features:
 * - Hospital assignments: ward, room, admission date, surgery date
 * - Community outpatient (외래): contact, address
 * - Community home (재택): contact, delivery toggle, address, return method
 * - Common fields: device ID, patient type, name, infection toggle, date range
 *
 * @component
 */

import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import InputField from '../common/InputField';

const AssetAssignmentModal = ({ asset, onClose, onAssign }) => {
  const [step, setStep] = useState(1);
  const [locationType, setLocationType] = useState(null);
  const [communityType, setCommunityType] = useState(null);
  const [formData, setFormData] = useState({
    patientName: '',
    infection: false,
    startDate: '',
    endDate: '',
    // Hospital fields
    ward: '',
    room: '',
    admissionDate: '',
    surgeryDate: '',
    // Community fields
    contact: '',
    address: '',
    delivery: false,
    returnMethod: 'courier',
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleAssign = () => {
    const patientType =
      locationType === 'hospital'
        ? 'INPATIENT'
        : communityType === 'outpatient'
        ? 'OUTPATIENT'
        : 'HOME';

    onAssign(asset?.id, {
      patientName: formData.patientName,
      location: locationType === 'hospital' ? `71-${formData.room}` : formData.address,
      patientType,
      startDate: formData.startDate,
      endDate: formData.endDate,
    });
  };

  const isFormValid =
    formData.patientName &&
    formData.startDate &&
    formData.endDate &&
    (locationType === 'hospital'
      ? formData.ward && formData.room
      : formData.contact && formData.address);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-lg shadow-2xl max-w-lg w-full border border-slate-700">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-800 border-b border-slate-700 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Device Assignment</h2>
          </div>
          <X
            onClick={onClose}
            className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer transition"
          />
        </div>

        {/* Content */}
        <div className="p-8">

          {step === 1 ? (
            // Step 1: Location Type Selection
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Step 1: Select Location Type</h3>
                <p className="text-sm text-slate-400">Choose where the device will be assigned</p>
              </div>

              {/* Location Type Options */}
              <div className="space-y-3">
                {/* Hospital Option */}
                <button
                  onClick={() => {
                    setLocationType('hospital');
                    setCommunityType(null);
                  }}
                  className={`w-full p-4 rounded-lg border-2 transition text-left ${
                    locationType === 'hospital'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="font-semibold text-white">Hospital (입원)</div>
                  <div className="text-sm text-slate-400 mt-1">
                    Device assigned to hospital ward/room
                  </div>
                </button>

                {/* Community Option */}
                <button
                  onClick={() => {
                    setLocationType('community');
                    setCommunityType(null);
                  }}
                  className={`w-full p-4 rounded-lg border-2 transition text-left ${
                    locationType === 'community'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="font-semibold text-white">Community (지역사회)</div>
                  <div className="text-sm text-slate-400 mt-1">
                    Device assigned for outpatient or home care
                  </div>
                </button>
              </div>

              {/* Community Sub-selection */}
              {locationType === 'community' && (
                <div className="space-y-3 mt-6 pt-6 border-t border-slate-700 animate-fadeIn">
                  <p className="text-sm text-slate-400">Select community type:</p>
                  <button
                    onClick={() => setCommunityType('outpatient')}
                    className={`w-full p-3 rounded-lg border-2 transition text-left text-sm ${
                      communityType === 'outpatient'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-semibold text-white">외래 (Outpatient)</div>
                  </button>
                  <button
                    onClick={() => setCommunityType('home')}
                    className={`w-full p-3 rounded-lg border-2 transition text-left text-sm ${
                      communityType === 'home'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-semibold text-white">재택 (Home Care)</div>
                  </button>
                </div>
              )}

              {/* Next Button */}
              <div className="flex gap-3 pt-6">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!locationType || (locationType === 'community' && !communityType)}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white transition font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            // Step 2: Patient Information Form
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Step 2: Patient Information
                  </h3>
                  <p className="text-sm text-slate-400">
                    {locationType === 'hospital'
                      ? 'Hospital Ward Assignment'
                      : communityType === 'outpatient'
                      ? 'Outpatient Assignment'
                      : 'Home Care Assignment'}
                  </p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition"
                >
                  Back
                </button>
              </div>

              {/* Device Info (Read-only) */}
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-3">
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wide">Device ID</label>
                  <div className="text-sm font-mono text-blue-400 mt-1">{asset?.id}</div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wide">Patient Type</label>
                  <div className="text-sm text-slate-300 mt-1">
                    {locationType === 'hospital'
                      ? 'Inpatient'
                      : communityType === 'outpatient'
                      ? 'Outpatient'
                      : 'Home Care'}
                  </div>
                </div>
              </div>

              {/* Common Fields */}
              <div className="space-y-4">
                <InputField
                  label="Patient Name"
                  value={formData.patientName}
                  onChange={(value) => handleInputChange('patientName', value)}
                  placeholder="Enter patient name"
                  required
                />

                <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <input
                    type="checkbox"
                    id="infection"
                    checked={formData.infection}
                    onChange={() => handleToggle('infection')}
                    className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                  />
                  <label htmlFor="infection" className="text-sm text-slate-300 cursor-pointer flex-1">
                    Infection Risk
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Start Date"
                    type="date"
                    value={formData.startDate}
                    onChange={(value) => handleInputChange('startDate', value)}
                    required
                  />
                  <InputField
                    label="End Date"
                    type="date"
                    value={formData.endDate}
                    onChange={(value) => handleInputChange('endDate', value)}
                    required
                  />
                </div>
              </div>

              {/* Hospital-Specific Fields */}
              {locationType === 'hospital' && (
                <div className="space-y-4 pt-4 border-t border-slate-700 animate-fadeIn">
                  <InputField
                    label="Ward"
                    value={formData.ward}
                    onChange={(value) => handleInputChange('ward', value)}
                    placeholder="e.g., 내과 3병동"
                    required
                  />
                  <InputField
                    label="Room"
                    value={formData.room}
                    onChange={(value) => handleInputChange('room', value)}
                    placeholder="e.g., 314-B"
                    required
                  />
                  <InputField
                    label="Admission Date"
                    type="date"
                    value={formData.admissionDate}
                    onChange={(value) => handleInputChange('admissionDate', value)}
                  />
                  <InputField
                    label="Surgery Date (Optional)"
                    type="date"
                    value={formData.surgeryDate}
                    onChange={(value) => handleInputChange('surgeryDate', value)}
                  />
                </div>
              )}

              {/* Community-Specific Fields */}
              {locationType === 'community' && (
                <div className="space-y-4 pt-4 border-t border-slate-700 animate-fadeIn">
                  <InputField
                    label="Contact Number"
                    value={formData.contact}
                    onChange={(value) => handleInputChange('contact', value)}
                    placeholder="e.g., 010-1234-5678"
                    required
                  />
                  <InputField
                    label="Address"
                    value={formData.address}
                    onChange={(value) => handleInputChange('address', value)}
                    placeholder="Enter patient address"
                    required
                  />

                  {/* Home-Specific Fields */}
                  {communityType === 'home' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-3 border border-slate-700">
                        <input
                          type="checkbox"
                          id="delivery"
                          checked={formData.delivery}
                          onChange={() => handleToggle('delivery')}
                          className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                        />
                        <label htmlFor="delivery" className="text-sm text-slate-300 cursor-pointer flex-1">
                          Home Delivery Required
                        </label>
                      </div>

                      <div>
                        <label className="text-sm text-slate-300 block mb-2">Device Return Method</label>
                        <select
                          value={formData.returnMethod}
                          onChange={(e) => handleInputChange('returnMethod', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 hover:border-slate-600 focus:border-blue-500 focus:outline-none transition"
                        >
                          <option value="courier">Courier Pickup</option>
                          <option value="mail">Mail Return</option>
                          <option value="hospital">Hospital Return</option>
                          <option value="pharmacy">Pharmacy Return</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-slate-700">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!isFormValid}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white transition font-medium"
                >
                  Assign Device
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetAssignmentModal;
