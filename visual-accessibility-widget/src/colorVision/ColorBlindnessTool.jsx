import React, { useId } from 'react';
import { Eye, RotateCcw } from 'lucide-react';
import { COLOR_MODES, getColorMode } from './colorModes.js';

export function ColorBlindnessTool({ mode = 'default', onModeChange }) {
  const groupName = useId();
  return <section className="cv-tool" aria-label="Color Blindness Support">
    <div className="cv-tool-heading"><Eye aria-hidden="true" size={22}/><h2>Color Blindness Support</h2></div>
    <label className="cv-sr-only" htmlFor={groupName}>Color vision assistance</label>
    <select id={groupName} className="cv-mode-select" value={mode} onChange={event => onModeChange(event.target.value)}>{COLOR_MODES.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select>
    <p className="cv-current" role="status">Selected: <strong>{getColorMode(mode).name}</strong></p>
    <button type="button" className="cv-reset" onClick={() => onModeChange('default')}><RotateCcw size={16} aria-hidden="true"/>Reset to Default</button>
  </section>;
}
