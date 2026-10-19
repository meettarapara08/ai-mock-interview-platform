import React, { useRef, useMemo } from 'react';
import './CodeEditor.css';

export function CodeEditor({
  value = '',
  onChange,
  language = 'python',
  readOnly = false,
  minHeight = '360px',
  id = 'code-editor',
}) {
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // Calculate lines
  const lines = useMemo(() => {
    return value.split('\n');
  }, [value]);

  const lineCount = lines.length;

  // Sync scroll between line numbers gutter and textarea
  const handleScroll = (e) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
  };

  // Keyboard navigation and indentation support
  const handleKeyDown = (e) => {
    if (readOnly) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;

    // Handle Tab key -> 4 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const indent = '    ';
      const before = value.substring(0, selectionStart);
      const after = value.substring(selectionEnd);
      const newValue = before + indent + after;

      onChange(newValue);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + indent.length;
      }, 0);
    }

    // Auto-indent on Enter
    else if (e.key === 'Enter') {
      const before = value.substring(0, selectionStart);
      const lastLine = before.split('\n').pop() || '';
      const match = lastLine.match(/^(\s*)/);
      let indent = match ? match[1] : '';

      // Extra indent if previous line ends with : or {
      if (lastLine.trim().endsWith(':') || lastLine.trim().endsWith('{')) {
        indent += '    ';
      }

      if (indent.length > 0) {
        e.preventDefault();
        const after = value.substring(selectionEnd);
        const newValue = before + '\n' + indent + after;
        onChange(newValue);

        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + indent.length;
        }, 0);
      }
    }

    // Auto-closing brackets & quotes
    else if (['(', '[', '{', '"', "'"].includes(e.key)) {
      const pairs = {
        '(': ')',
        '[': ']',
        '{': '}',
        '"': '"',
        "'": "'",
      };
      const closing = pairs[e.key];

      if (selectionStart === selectionEnd) {
        e.preventDefault();
        const before = value.substring(0, selectionStart);
        const after = value.substring(selectionEnd);
        const newValue = before + e.key + closing + after;
        onChange(newValue);

        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
        }, 0);
      }
    }
  };

  return (
    <div className="code-editor-container" style={{ minHeight }}>
      <div className="code-editor-header">
        <div className="code-editor-dots" aria-hidden="true">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <span className="code-editor-lang-badge">
          {language.toUpperCase()}
        </span>
        <span className="code-editor-line-indicator">
          {lineCount} {lineCount === 1 ? 'line' : 'lines'}
        </span>
      </div>

      <div className="code-editor-body">
        {/* Line Numbers Gutter */}
        <div className="code-editor-gutter" ref={lineNumbersRef} aria-hidden="true">
          {Array.from({ length: Math.max(lineCount, 1) }).map((_, idx) => (
            <div key={idx + 1} className="code-editor-line-num">
              {idx + 1}
            </div>
          ))}
        </div>

        {/* Textarea Code Input */}
        <textarea
          ref={textareaRef}
          id={id}
          className="code-editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          spellCheck="false"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          readOnly={readOnly}
          placeholder="// Write your solution here..."
        />
      </div>
    </div>
  );
}

export default CodeEditor;
