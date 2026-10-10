import React from 'react';
import './Card.css';

export function Card({
  children,
  className = '',
  elevation = 'sm', // 'none' | 'sm' | 'md' | 'lg'
  padding = 'md', // 'none' | 'sm' | 'md' | 'lg'
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`ui-card card-elevation-${elevation} card-padding-${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', action }) {
  return (
    <div className={`card-header ${className}`}>
      <div className="card-header-content">{children}</div>
      {action && <div className="card-header-action">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`card-body ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`card-footer ${className}`}>{children}</div>;
}

export default Card;
