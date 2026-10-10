import regular from '../assets/fonts/opendyslexic/OpenDyslexic-Regular.woff2?url';
import bold from '../assets/fonts/opendyslexic/OpenDyslexic-Bold.woff2?url';
import italic from '../assets/fonts/opendyslexic/OpenDyslexic-Italic.woff2?url';
import boldItalic from '../assets/fonts/opendyslexic/OpenDyslexic-BoldItalic.woff2?url';

// Vite bundles these assets; the standalone SDK embeds them in its single file.
export const dyslexiaFontCss = [[regular,400,'normal'],[bold,700,'normal'],[italic,400,'italic'],[boldItalic,700,'italic']]
  .map(([url, weight, style]) => `@font-face{font-family:"UAW OpenDyslexic";src:url("${url}") format("woff2");font-weight:${weight};font-style:${style};font-display:swap;}`)
  .join('');
