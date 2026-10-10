import React from 'react';
import { ChevronDown } from 'lucide-react';
import './Select.css';

export function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  id,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
        </label>
      )}
      <div className="select-wrapper">
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="form-select"
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const optVal = typeof opt === 'string' ? opt : opt.value;
            const optLabel = typeof opt === 'string' ? opt : opt.label;
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            );
          })}
        </select>
        <ChevronDown size={16} className="select-icon" />
      </div>
    </div>
  );
}

export default Select;
