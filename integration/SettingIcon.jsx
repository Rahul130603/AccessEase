import React from 'react';
import Icon from '../AssistAccess/src/accessibility/ui/icons.jsx';
import { icon } from '../visual-accessibility-widget/sdk/icons.js';

const assistIcons = {
  visuals:'brightness', 'screen-reader':'screenReader', 'alt-text':'altText',
  'form-labels':'formLabels', headings:'structure', announcements:'announcements',
  'error-messages':'errorMessages', password:'password', auth:'auth', confirm:'confirm',
  preferences:'preferences', profiles:'profiles', flashing:'flashing', 'reduce-motion':'motion',
};
const visualIcons = {
  fontScale:'font', contrast:'contrast', dark:'moon', light:'sun', grayscale:'grayscale',
  colorVisionMode:'eye', spacingPreset:'spacing', magnifier:'zoom', highlightLinks:'link',
  dyslexiaFont:'font', readingGuide:'guide', readingMask:'mask',
};
const paths = {
  audioTranscripts:'M4 4h16v16H4z M7 8h10M7 12h10M7 16h6',
  summary:'M4 4h16v16H4z M7 8h10M7 12h7M7 16h4',
  progress:'M12 3a9 9 0 1 0 9 9 M12 3v9h9',
  distraction:'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5 M9 12h6',
  steps:'M4 6h1M4 12h1M4 18h1 M9 6h11M9 12h11M9 18h11',
  notifications:'M5 17h14l-2-3V9a5 5 0 0 0-10 0v5z M10 21h4',
  liveCaptions:'M3 5h18v14H3z M10 9H7v6h3M17 9h-3v6h3',
  simplifiedNav:'M4 5h16M4 12h10M4 19h6 M17 9l3 3-3 3',
  'pause-animations':'M8 4v16M16 4v16',
  'pause-auto-media':'M3 5h18v14H3z M9 9v6M15 9v6',
  timeLimits:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5h4',
};

export default function SettingIcon({ id }) {
  if (assistIcons[id]) return <Icon name={assistIcons[id]} />;
  if (visualIcons[id]) return <span dangerouslySetInnerHTML={{__html:icon(visualIcons[id])}} />;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[id]} /></svg>;
}
