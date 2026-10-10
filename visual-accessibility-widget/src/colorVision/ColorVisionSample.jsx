import React from 'react';
import { CheckCircle2, CircleX, TriangleAlert, Info, BarChart3 } from 'lucide-react';
import { STATUS_TYPES } from './colorModes.js';
const symbols = { success: CheckCircle2, error: CircleX, warning: TriangleAlert, information: Info };
const categories = [
  { status: 'success', label: 'Completed', count: 72 },
  { status: 'error', label: 'Blocked', count: 18 },
  { status: 'warning', label: 'Needs review', count: 46 },
  { status: 'information', label: 'Scheduled', count: 60 },
];

export function ColorVisionSample({ onOpen }) {
  return <section className="cv-sample" aria-labelledby="cv-sample-title">
    <div className="cv-section-heading"><div><p className="cv-kicker">LIVE COLOR ASSISTANCE</p><h2 id="cv-sample-title">Every signal, clearly understood.</h2><p>Try a different palette across backgrounds, buttons, features and project status.</p></div><button className="cv-primary" type="button" onClick={onOpen}>Open Color Blindness Settings</button></div>
    <div className="cv-features">{categories.slice(0, 3).map(({ status, label, count }) => <article className="cv-feature cv-surface" key={status} data-cv-category={status}><div className="cv-feature-mark" data-cv-status={status}><BarChart3 aria-hidden="true" size={24}/></div><h3>{label} projects</h3><p>{count} projects tracked with clear labels and distinct visual cues.</p><a className="cv-link" href="#cv-chart">View project overview</a></article>)}</div>
    <div className="cv-dashboard"><section className="cv-surface cv-status-list" aria-labelledby="cv-status-title"><h3 id="cv-status-title">Status indicators</h3>{STATUS_TYPES.map(status => { const StatusIcon = symbols[status.id]; return <div className="cv-status" data-cv-status={status.id} key={status.id}><StatusIcon aria-hidden="true" size={19}/><span><strong>{status.label}</strong><small>{ {success:'Published and ready',error:'Action required',warning:'Review before publishing',information:'Next update scheduled'}[status.id]}</small></span><span className={`cv-pattern cv-pattern-${status.id}`} aria-hidden="true"/></div>; })}</section>
      <section className="cv-surface cv-chart" id="cv-chart" aria-labelledby="cv-chart-title"><h3 id="cv-chart-title">Project overview</h3><p>Project count by category. Each bar includes a pattern, label and value.</p><ul>{categories.map(({status,label,count}) => <li key={status}><div className="cv-chart-label"><span>{STATUS_TYPES.find(item => item.id === status).symbol} {label}</span><strong>{count} projects</strong></div><div className="cv-bar-track"><div className={`cv-bar cv-pattern-${status}`} data-cv-bar={status} style={{width:`${count}%`}}/></div></li>)}</ul></section></div>
  </section>;
}
