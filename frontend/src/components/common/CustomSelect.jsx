import React from 'react';

/**
 * Reusable CustomSelect component with 8px border radius & synchronized gold-accent ChevronDown icon.
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  className = '',
  style = {},
  placeholder,
  name,
  disabled = false,
  id,
  children,
  ...props
}) {
  return (
    <div className={`relative inline-flex items-center min-w-[160px] ${className}`} style={style}>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-white border border-[#EBE4DD] text-[#1C1612] text-sm font-medium pl-3.5 pr-9 py-2 rounded-lg outline-none cursor-pointer transition-all hover:border-[#775932] focus:border-[#775932] focus:ring-2 focus:ring-[#775932]/15 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children ||
          options.map((opt) => {
            const optValue = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={optValue} value={optValue}>
                {optLabel}
              </option>
            );
          })}
      </select>
    </div>
  );
}
