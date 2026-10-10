import React from 'react';

import { useConfirm } from '../core/confirm/ConfirmContext.jsx';

/**
 * Button that asks for confirmation before running its action.
 *
 * @example
 * <ConfirmButton
 *   confirm={{ title: 'Remove this member?', description: 'They lose access immediately.',
 *              confirmLabel: 'Remove', destructive: true }}
 *   onConfirm={removeMember}
 * >
 *   Remove
 * </ConfirmButton>
 *
 * The confirm options are identical to `useConfirm()`'s. Prefer this over wrapping
 * every click handler by hand: it keeps the request next to the control it protects,
 * which is also where the "does this need a confirmation at all?" question belongs.
 */
export default function ConfirmButton({ confirm: confirmOptions, onConfirm, children, ...rest }) {
  const confirm = useConfirm();

  return (
    <button
      type="button"
      {...rest}
      onClick={async (event) => {
        const accepted = await confirm(confirmOptions || {});
        if (accepted && typeof onConfirm === 'function') onConfirm(event);
      }}
    >
      {children}
    </button>
  );
}
