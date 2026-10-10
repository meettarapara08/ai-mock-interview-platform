import React from 'react';
import './ScoreMeter.css';

export function ScoreMeter({
  score = 82,
  maxScore = 100,
  size = 110,
  strokeWidth = 9,
  metrics = [
    { label: 'Knowledge', value: 88, color: 'var(--color-accent-indigo)' },
    { label: 'Relevance', value: 80, color: 'var(--color-accent-cyan)' },
    { label: 'Communication', value: 76, color: 'var(--color-success)' },
    { label: 'Confidence', value: 85, color: 'var(--color-warning)' },
  ],
  showLegend = true,
  className = '',
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(score / maxScore, 0), 1);
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <div className={`score-meter-container ${className}`}>
      <div className="score-meter-gauge" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="gauge-svg">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
          />
          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="gauge-progress"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>

        <div className="score-meter-text">
          <span className="score-value">{score}</span>
          <span className="score-divider">/{maxScore}</span>
        </div>
      </div>

      {showLegend && metrics && (
        <div className="score-meter-legend">
          {metrics.map((item) => (
            <div key={item.label} className="legend-row">
              <span className="legend-dot" style={{ backgroundColor: item.color }} />
              <span className="legend-label">{item.label}</span>
              <span className="legend-value">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ScoreMeter;
