import React from 'react';
import './Input.css';

export function Input({
  label,
  icon: Icon,
  placeholder = '',
  value,
  onChange,
  type = 'text',
  error,
  disabled = false,
  className = '',
  id,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <div className={`input-wrapper ${Icon ? 'has-icon' : ''} ${error ? 'has-error' : ''}`}>
        {Icon && <Icon size={16} className="input-icon" />}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="form-input"
          {...props}
        />
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

export default Input;
