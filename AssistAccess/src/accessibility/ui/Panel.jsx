import React, { useEffect, useId, useRef } from 'react';

/**
 * Non-modal dialog panel (APG "Dialog (non-modal)" pattern).
 *
 * Why non-modal: the toolbar must not block the page. It deliberately omits
 * `aria-modal` and does not trap focus — the user can Tab out of the panel back into
 * the page at any time, and Esc closes it.
 *
 * On open, focus moves to the panel container (which is labelled by its heading, so
 * the dialog is announced with its name). On close, focus is restored to the element
 * that opened it — handled by the caller, which owns the launcher ref.
 *
 * `variant="widget"` adds the widget chrome classes (`a11ytb-widget*`) on top of the
 * base panel classes, which is how accessibility.css restyles the same, already-tested
 * markup without a second dialog implementation. `icon` and `subtitle` are opt-in:
 * the subtitle is referenced with `aria-describedby` so it becomes the dialog's
 * description instead of padding out its accessible name.
 */
export default function Panel({
  id,
  title,
  subtitle,
  icon,
  closeLabel,
  onClose,
  children,
  footer,
  variant = 'default',
}) {
  const headingId = useId();
  const descriptionId = useId();
  const panelRef = useRef(null);
  const widget = variant === 'widget';
  const classNames = (...names) => names.filter(Boolean).join(' ');

  useEffect(() => {
    const node = panelRef.current;
    if (node && typeof node.focus === 'function') node.focus();
  }, []);

  return (
    <div
      className={classNames('a11ytb-panel', widget && 'a11ytb-widget')}
      id={id}
      role="dialog"
      aria-labelledby={headingId}
      aria-describedby={subtitle ? descriptionId : undefined}
      tabIndex={-1}
      ref={panelRef}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className={classNames('a11ytb-panel__header', widget && 'a11ytb-widget__header')}>
        {icon ? (
          <span className="a11ytb-category__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <div className={widget ? 'a11ytb-widget__heading' : undefined}>
          <h2 className={classNames('a11ytb-panel__title', widget && 'a11ytb-widget__title')} id={headingId}>
            {title}
          </h2>
          {subtitle ? (
            <p className={classNames('a11ytb-widget__subtitle')} id={descriptionId}>
              {subtitle}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className={classNames('a11ytb-icon-button', widget && 'a11ytb-widget__close')}
          onClick={onClose}
        >
          <span aria-hidden="true">✕</span>
          <span className="a11ytb-visually-hidden-inline">{closeLabel}</span>
        </button>
      </div>
      <div className={classNames('a11ytb-panel__body', widget && 'a11ytb-widget__body')}>{children}</div>
      {footer ? (
        <div className={classNames('a11ytb-panel__footer', widget && 'a11ytb-widget__footer')}>
          {footer}
        </div>
      ) : null}
    </div>
  );
}
