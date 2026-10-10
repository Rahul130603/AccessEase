import React, { useId, useState } from 'react';

import Icon from './icons.jsx';

/**
 * Disclosure section (APG "Disclosure" pattern).
 *
 * A real heading wraps a button that shows and hides a region, so the panel keeps a
 * navigable structure: heading navigation reaches every feature, and the disclosure
 * state is exposed with `aria-expanded` / `aria-controls`.
 *
 * `headingLevel` exists because the panel nests features under category headings; the
 * default of 3 suits a flat panel, and the widget passes 4. `summary` is rendered as a
 * paragraph *outside* the heading (so heading navigation stays short) and is wired to
 * the button with `aria-describedby`, which is how a screen reader user hears what the
 * feature does when they land on the button.
 *
 * `defaultOpen` is used for notices that must be visible without interaction.
 */
export default function Disclosure({
  title,
  badge,
  badgeLabel,
  defaultOpen = false,
  headingLevel = 3,
  icon = null,
  summary = null,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const regionId = useId();
  const summaryId = useId();
  const Heading = `h${Math.min(6, Math.max(1, Number(headingLevel) || 3))}`;

  return (
    <section className="a11ytb-disclosure">
      <Heading className="a11ytb-disclosure__heading">
        <button
          type="button"
          className="a11ytb-disclosure__button"
          aria-expanded={open}
          aria-controls={regionId}
          aria-describedby={summary ? summaryId : undefined}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="a11ytb-disclosure__chevron" aria-hidden="true">
            {open ? '▾' : '▸'}
          </span>
          {icon ? (
            <span className="a11ytb-disclosure__icon" aria-hidden="true">
              <Icon name={icon} />
            </span>
          ) : null}
          <span className="a11ytb-disclosure__title">{title}</span>
          {badge ? (
            <span className="a11ytb-badge">
              {badge}
              {badgeLabel ? <span className="a11ytb-visually-hidden-inline"> {badgeLabel}</span> : null}
            </span>
          ) : null}
        </button>
      </Heading>
      {summary ? (
        <p className="a11ytb-disclosure__summary" id={summaryId}>
          {summary}
        </p>
      ) : null}
      <div className="a11ytb-disclosure__region" id={regionId} hidden={!open}>
        {children}
      </div>
    </section>
  );
}
