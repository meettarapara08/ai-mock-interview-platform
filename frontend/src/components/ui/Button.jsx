import React from 'react';
import './Button.css';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  fullWidth = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="btn-icon" size={16} />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="btn-icon" size={16} />}
    </button>
  );
}

export default Button;
