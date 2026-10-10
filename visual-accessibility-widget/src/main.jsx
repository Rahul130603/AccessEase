import React from 'react';
import { createRoot } from 'react-dom/client';
import { PublishingWebsite } from './demo/PublishingWebsite.jsx';
import { AccessibilityWidget } from '../sdk/index.js';
import './styles/demo.css';

window.AccessibilityWidget = AccessibilityWidget;
createRoot(document.getElementById('root')).render(<PublishingWebsite />);
// Wait until the first React commit to measure the authored typography.
requestAnimationFrame(() => AccessibilityWidget.init({ siteKey: 'site_demo_001', language: 'en' }));
