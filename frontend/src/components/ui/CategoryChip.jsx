import React from 'react';
import { FileText, Code2, User, Users } from 'lucide-react';
import './CategoryChip.css';

const CHIP_CONFIGS = {
  resume: {
    label: 'Resume Interview',
    icon: FileText,
    className: 'chip-resume',
  },
  technical: {
    label: 'Technical',
    icon: Code2,
    className: 'chip-technical',
  },
  behavioral: {
    label: 'Behavioral',
    icon: User,
    className: 'chip-behavioral',
  },
  hr: {
    label: 'HR',
    icon: Users,
    className: 'chip-hr',
  },
};

export function CategoryChip({
  type = 'resume',
  label,
  icon: CustomIcon,
  active = false,
  onClick,
  className = '',
}) {
  const config = CHIP_CONFIGS[type] || CHIP_CONFIGS.resume;
  const Icon = CustomIcon || config.icon;
  const displayLabel = label || config.label;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`category-chip ${config.className} ${active ? 'chip-active' : ''} ${className}`}
    >
      {Icon && <Icon size={14} className="chip-icon" />}
      <span className="chip-label">{displayLabel}</span>
    </div>
  );
}

export default CategoryChip;
