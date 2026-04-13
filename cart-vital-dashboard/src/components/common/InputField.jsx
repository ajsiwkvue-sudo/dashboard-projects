/**
 * InputField.jsx
 * -----------------------------------------------
 * 재사용 가능한 폼 입력 필드 컴포넌트
 * - text / date 타입 지원
 * - date 타입: 네이티브 date picker를 커스텀 UI로 감싸 일관된 디자인 유지
 */
import React from "react";

const InputField = React.memo(
  ({ label, value, onChange, placeholder, optional, disabled, type = "text" }) => {
    if (type === "date") {
      return (
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1.5 flex justify-between">
            {label}
            {optional && <span className="text-slate-600 font-normal">(선택)</span>}
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
                try { if (e.target.showPicker) e.target.showPicker(); } catch (err) {}
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
          {label}
          {optional && <span className="text-slate-600 font-normal">(선택)</span>}
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
  }
);

InputField.displayName = "InputField";

export default InputField;
