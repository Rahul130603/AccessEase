import React, { useCallback, useEffect, useId, useMemo, useRef } from 'react';

import { useConfirmStyles } from '../patterns/appStyles.js';

/**
 * Confirmation dialog (feature: confirmation before important actions).
 *
 * Native first
 * ------------
 * The dialog is a real `<dialog>` opened with `showModal()`. That gives, from the
 * browser itself: the focus trap, the inert background, the top layer (so an
 * ancestor's transform or overflow cannot clip it), `::backdrop`, and Escape to
 * cancel through the `cancel` event. None of it is re-implemented, because every
 * hand-rolled modal is a place where focus escapes.
 *
 * When `showModal` is unavailable, the same component falls back to a fixed overlay
 * with `aria-modal="true"`, a manual Tab cycle and Escape handling — the documented
 * accessible dialog pattern, rather than a div that merely looks modal.
 *
 * Semantics and focus
 * -------------------
 *  - The dialog is named by its title (`aria-labelledby`) and described by its
 *    description (`aria-describedby`), so opening it produces exactly one utterance.
 *    Nothing is announced through the live regions: that would say it twice.
 *  - Focus moves in on open — to Cancel for a destructive action, to the primary
 *    action otherwise — and returns to the control that opened the dialog on close,
 *    for confirm and cancel alike.
 *  - The buttons are real buttons inside no form, so there is no implicit submission
 *    and Enter cannot fire a destructive action by accident.
 *  - A backdrop press cancels.
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function supportsShowModal() {
  return (
    typeof HTMLDialogElement !== 'undefined' &&
    typeof HTMLDialogElement.prototype.showModal === 'function'
  );
}

export default function ConfirmDialog({
  open,
  title,
  description,
  details = [],
  confirmLabel,
  cancelLabel,
  destructive = false,
  initialFocus,
  returnFocusTo,
  onConfirm,
  onCancel,
  titleLevel = 2,
}) {
  const dialogRef = useRef(null);
  const confirmRef = useRef(null);
  const cancelRef = useRef(null);
  const invokerRef = useRef(null);
  const optionsRef = useRef({ destructive, initialFocus, returnFocusTo });
  optionsRef.current = { destructive, initialFocus, returnFocusTo };

  const titleId = useId();
  const descriptionId = useId();
  const native = useMemo(() => supportsShowModal(), []);
  useConfirmStyles();

  // Open/close, initial focus and focus restoration. Depends only on `open`, so
  // changing the labels of an open dialog cannot close and reopen it.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return undefined;

    const options = optionsRef.current;
    const explicit = options.returnFocusTo && options.returnFocusTo.current;
    invokerRef.current =
      explicit || (typeof document !== 'undefined' ? document.activeElement : null);

    if (native) {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }

    const preferred =
      options.initialFocus === 'confirm'
        ? confirmRef.current
        : options.initialFocus === 'cancel'
          ? cancelRef.current
          : options.destructive
            ? cancelRef.current
            : confirmRef.current;
    if (preferred && typeof preferred.focus === 'function') preferred.focus();

    return () => {
      if (native) {
        if (dialog.open) dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
      const invoker = invokerRef.current;
      invokerRef.current = null;
      if (invoker && invoker.isConnected !== false && typeof invoker.focus === 'function') {
        // After the dialog is gone, so the browser does not move focus back for us.
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(() => {
            try {
              invoker.focus();
            } catch (error) {
              /* the invoker may have been removed by the confirmed action */
            }
          });
        }
      }
    };
  }, [open, native]);

  // Escape through the native cancel event (the browser also refuses to close a
  // modal dialog on its own, so this is where the decision is made).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open || !native) return undefined;
    const handleCancel = (event) => {
      event.preventDefault();
      onCancel();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [open, native, onCancel]);

  const handleKeyDown = useCallback(
    (event) => {
      if (native) return; // the browser handles Escape and the focus trap
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCancel();
        return;
      }
      if (event.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const nodes = Array.from(dialog.querySelectorAll(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null || node === document.activeElement,
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [native, onCancel],
  );

  const handleBackdropClick = useCallback(
    (event) => {
      if (event.target === dialogRef.current) onCancel();
    },
    [onCancel],
  );

  if (!open) return null;

  const Heading = `h${Math.min(6, Math.max(1, Number(titleLevel) || 2))}`;

  const dialog = (
    <dialog
      ref={dialogRef}
      className="a11ytb-dialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      /* aria-modal is only needed by the fallback: a native modal dialog is modal. */
      aria-modal={native ? undefined : 'true'}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <Heading className="a11ytb-dialog__title" id={titleId}>
        {title}
      </Heading>
      {description ? (
        <p className="a11ytb-dialog__description" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {details && details.length ? (
        <ul className="a11ytb-dialog__details">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
      <div className="a11ytb-dialog__actions">
        <button
          type="button"
          className="a11ytb-dialog__button"
          ref={cancelRef}
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`a11ytb-dialog__button ${
            destructive ? 'a11ytb-dialog__button--destructive' : 'a11ytb-dialog__button--primary'
          }`}
          ref={confirmRef}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );

  if (native) return dialog;

  return (
    <div className="a11ytb-dialog-backdrop" data-a11ytb-dialog-fallback="">
      {dialog}
    </div>
  );
}
