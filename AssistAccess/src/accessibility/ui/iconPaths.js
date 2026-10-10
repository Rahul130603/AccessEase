/**
 * Icon geometry for the widget, as plain data.
 *
 * Kept out of the JSX so it can be asserted in the self-test (every icon a feature
 * references must exist) and reused by anything that needs the names without pulling
 * in React. Icons are outline paths on a 24×24 grid, drawn with `stroke:
 * currentColor`, so they inherit the surrounding colour and never carry meaning on
 * their own — every icon in the widget sits next to a text label and is rendered with
 * `aria-hidden="true"`.
 */

export const ICON_PATHS = Object.freeze({
  // Categories
  motion: ['M3 12h3l2.5-6 3 12 2.5-8 2 4h5'],
  visual: [
    'M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4',
    'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
  ],
  reader: ['M4 6h16v10H4z', 'M8 20h8', 'M9 12l2-2 2 2 2-3'],
  forms: ['M5 4h14v16H5z', 'M8 8h8M8 12h8M8 16h4'],

  // Features
  flashing: ['M13 3 5 14h5l-1 7 8-11h-5l1-7Z'],
  brightness: [
    'M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z',
    'M12 3v2M12 19v2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4',
  ],
  screenReader: ['M4 5h16v9H4z', 'M9 18h6', 'M12 14v4', 'M8 9h8'],
  altText: ['M4 5h16v14H4z', 'M8 15l3-3 2 2 3-4 2 3', 'M9 9.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'],
  formLabels: ['M5 5h14v4H5z', 'M5 13h6M5 17h10'],
  structure: ['M6 4h12', 'M6 12h12', 'M6 20h7', 'M3 4v16'],
  announcements: ['M11 5 6 9H3v6h3l5 4V5Z', 'M16 9a4 4 0 0 1 0 6', 'M19 6a8 8 0 0 1 0 12'],
  errorMessages: ['M12 4 3 20h18L12 4Z', 'M12 10v4M12 17h.01'],
  password: ['M7 10V8a5 5 0 0 1 10 0v2', 'M5 10h14v10H5z', 'M12 14v2'],
  auth: ['M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 21v-1a6 6 0 0 1 12 0v1', 'M18 10v4M20 12h-4'],
  confirm: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M8 12.5l2.5 2.5L16 9.5'],
  preferences: ['M5 5h14v14H5z', 'M9 5v14', 'M13 10h4M13 14h4'],
  reset: ['M4 12a8 8 0 1 1 2.5 5.8', 'M4 20v-5h5'],
  profiles: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M5 20a7 7 0 0 1 14 0'],
});

export const ICON_NAMES = Object.freeze(Object.keys(ICON_PATHS));

export function getIconPaths(name) {
  return ICON_PATHS[name] || null;
}
