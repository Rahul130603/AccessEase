const palette = (background, primary, success, error, warning, information) => ({
  background, surface: '#ffffff', text: '#17253c', muted: '#475569', primary, link: primary,
  success, error, warning, information,
});

// Assistance palettes, not medical simulations. Both UIs and the SDK share these values.
export const COLOR_MODES = Object.freeze([
  { id: 'default', name: 'Normal / Default', description: 'Original website colors.', colors: palette('#f5f7fb', '#2563eb', '#166534', '#991b1b', '#854b00', '#1d4ed8') },
  { id: 'protanopia', name: 'Protanopia Support', description: 'Blue, amber and violet alternatives for red color vision deficiency.', colors: { ...palette('#f0f7fc', '#005a9c', '#005a9c', '#8b4300', '#603f9b', '#29456f'), surface: '#f8fcff', text: '#16334b', muted: '#3c566b' } },
  { id: 'deuteranopia', name: 'Deuteranopia Support', description: 'Violet, blue and ochre alternatives for green color vision deficiency.', colors: { ...palette('#f6f3fc', '#51439d', '#365899', '#955000', '#65409a', '#07576a'), surface: '#fcfaff', text: '#30264b', muted: '#574b6b' } },
  { id: 'tritanopia', name: 'Tritanopia Support', description: 'Rose, teal and plum alternatives for blue-yellow color vision deficiency.', colors: { ...palette('#fff3f6', '#a3214b', '#007361', '#a3214b', '#624080', '#364d65'), surface: '#fffafb', text: '#482638', muted: '#6b4758' } },
  { id: 'monochrome', name: 'High Distinction / Monochrome', description: 'Neutral tones with distinct labels, icons, borders and patterns.', colors: { ...palette('#f4f4f4', '#252525', '#222222', '#444444', '#555555', '#666666'), text: '#202020', muted: '#505050' } },
]);
export const getColorMode = id => COLOR_MODES.find(mode => mode.id === id) || COLOR_MODES[0];
export const colorModeVariables = id => Object.fromEntries(Object.entries(getColorMode(id).colors).map(([key, value]) => [`--cv-${key}`, value]));

export const STATUS_TYPES = [
  { id: 'success', label: 'Success', symbol: '✓', border: 'solid', angle: 45 },
  { id: 'error', label: 'Error', symbol: '×', border: 'dashed', angle: -45 },
  { id: 'warning', label: 'Warning', symbol: '!', border: 'dotted', angle: 0 },
  { id: 'information', label: 'Information', symbol: 'i', border: 'double', angle: 90 },
];

// Opt-in semantic adapters; arbitrary images/canvas/third-party charts are not recolored.
export function colorSupportCss(scope) {
  let css = `${scope}:where([data-uaw-scope]){background-color:var(--cv-background)!important;color:var(--cv-text)!important;}
    ${scope}:where(.site-header,.site-footer,.service-card,.workflow,.article-reader,.cv-surface){background-color:var(--cv-surface)!important;color:var(--cv-text)!important;}
    ${scope}:where(.announcement-bar,.hero-art,.services-section,.newsletter,.demo-strip,.cv-tint){background-color:var(--cv-background)!important;}
    ${scope}:where(h1,h2,h3,p,.brand,.cv-text){color:var(--cv-text)!important;}
    ${scope}:where(.hero-proof,.hero-proof span,.article-meta,.article-meta span,.art-topline,.art-topline span,.art-bottomline,.art-bottomline span,.footer-bottom,.footer-bottom span,.demo-tag){color:var(--cv-muted)!important;}
    ${scope}:where(a,.text-link,.demo-action,.eyebrow,.hero h1 em,.brand-dot,.cv-link){color:var(--cv-link)!important;}
    ${scope}:where(.button.primary,.brand-mark,.cv-primary){background-color:var(--cv-primary)!important;color:#fff!important;}
    ${scope}:where(.button.secondary,.nav-cta,.service-icon,.demo-symbol,.cv-secondary){color:var(--cv-primary)!important;background-color:var(--cv-surface)!important;border-color:var(--cv-primary)!important;}
    ${scope}:where(.eyebrow-rule){background-color:var(--cv-primary)!important;}
    ${scope}:where(:focus-visible){outline-color:var(--cv-primary)!important;}
    ${scope}:where(a[href]){text-decoration:underline!important;text-underline-offset:3px!important;}`;
  const aliases = { success: 'ready', warning: 'review', information: 'draft' };
  for (const status of STATUS_TYPES) {
    const selector = `${scope}:where([data-cv-status="${status.id}"]${aliases[status.id] ? `,[data-uaw-status="${aliases[status.id]}"]` : ''})`;
    // Patterns live in a separate swatch so readable text has a plain background.
    css += `${selector}{color:var(--cv-${status.id})!important;background-color:var(--cv-surface)!important;border:2px ${status.border} currentColor!important;background-image:none!important;}`;
  }
  return css;
}
