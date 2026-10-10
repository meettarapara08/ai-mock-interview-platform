import React from 'react';
import './ProgressIndicator.css';

export function ProgressIndicator({
  steps = [1, 2, 3, 4],
  currentStep = 1,
  className = '',
}) {
  return (
    <div className={`progress-indicator ${className}`}>
      {steps.map((step, index) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <React.Fragment key={step}>
            <div
              className={`progress-step ${
                isActive ? 'step-active' : isCompleted ? 'step-completed' : 'step-inactive'
              }`}
            >
              <span className="step-number">{step}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`progress-line ${
                  step < currentStep ? 'line-completed' : 'line-inactive'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default ProgressIndicator;
