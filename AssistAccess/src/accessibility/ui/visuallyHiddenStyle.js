/**
 * The visually-hidden pattern, shared so it is defined once.
 * Inline styles (not a global utility class) so nothing has to be added to the
 * page's stylesheet and no teammate's CSS can rename it.
 */
export const VISUALLY_HIDDEN_STYLE = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: '0',
  border: '0',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
};

export default VISUALLY_HIDDEN_STYLE;
