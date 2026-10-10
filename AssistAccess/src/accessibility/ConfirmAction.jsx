/**
 * ConfirmAction — confirmation before important actions (feature 11).
 *
 * Three ways in, all of them the same service and the same dialog:
 *
 *   const ok = await confirm({ title, description, details, destructive: true });
 *   <ConfirmButton confirm={{ ... }} onConfirm={remove}>Remove</ConfirmButton>
 *   <ReviewAndConfirm items={[...]} onConfirm={send} />        // 3.3.4 review step
 *
 * What the dialog guarantees
 * --------------------------
 *  - Native `<dialog>` opened with `showModal()`: the browser provides the focus trap,
 *    the inert background and the top layer; the fallback path implements the documented
 *    accessible dialog pattern when `showModal` is unavailable.
 *  - Named by its title and described by its description (`aria-labelledby` +
 *    `aria-describedby`), so it is announced once — nothing is also sent to the live
 *    regions.
 *  - Escape and a backdrop press cancel. Focus moves in on open (to Cancel for a
 *    destructive action) and returns to the invoking control on close, for confirm and
 *    cancel alike.
 *  - No implicit submission: Enter activates the focused button only.
 *  - Without a provider it **fails closed** (window.confirm, otherwise `false`), so a
 *    missing dialog never becomes permission.
 *
 * Do not confirm routine, reversible actions: a dialog that appears on every save
 * trains people to dismiss it without reading, which removes the protection where it
 * mattered.
 */

export { ConfirmProvider, useConfirm } from './core/confirm/ConfirmContext.jsx';
export { default as ConfirmButton } from './ui/ConfirmButton.jsx';
export { default as ConfirmDialog } from './ui/ConfirmDialog.jsx';
export { default as ReviewAndConfirm } from './patterns/ReviewAndConfirm.jsx';
