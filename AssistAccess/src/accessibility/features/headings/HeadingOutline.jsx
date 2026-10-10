import React, { useMemo } from 'react';

import { useAudit } from '../../core/audit/AuditContext.jsx';
import { useAnnounce, useA11ySettings } from '../../core/SettingsContext.jsx';
import { formatMessage } from '../../strings.js';

/**
 * Heading outline navigator.
 *
 * Rendered as a genuinely nested `<ol>`, so the structure in the panel mirrors the
 * structure of the page: a screen reader user can hear "list, 4 items, level 1" and
 * step through it, and the nesting conveys the hierarchy that the level badges state
 * in text.
 *
 * Every entry is a real button, so the whole outline is keyboard operable. Jumping
 * scrolls and outlines the heading without stealing focus: the user stays in the
 * panel and decides what to do next.
 */

function buildTree(items) {
  const root = { level: 0, children: [] };
  const stack = [root];
  items.forEach((item) => {
    const level = item.level || 1;
    while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop();
    const node = { ...item, level, children: [] };
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  });
  return root.children;
}

function OutlineList({ nodes, copy, onJump }) {
  if (!nodes.length) return null;
  return (
    <ol className="a11ytb-outline">
      {nodes.map((node) => (
        <li className="a11ytb-outline__item" key={node.id}>
          <div className="a11ytb-outline__row">
            <span className="a11ytb-band a11ytb-band--unverified">
              {node.level
                ? formatMessage(copy.outlineLevel, { level: node.level })
                : copy.outlineUnlevelled}
            </span>
            <button
              type="button"
              className="a11ytb-outline__button"
              onClick={() => onJump(node)}
              aria-label={formatMessage(copy.outlineJump, {
                text: node.text || copy.outlineEmpty,
              })}
            >
              {node.text || `(${copy.outlineEmpty})`}
            </button>
            {node.hidden ? <span className="a11ytb-hint">{copy.outlineHidden}</span> : null}
          </div>
          <OutlineList nodes={node.children} copy={copy} onJump={onJump} />
        </li>
      ))}
    </ol>
  );
}

export default function HeadingOutline() {
  const { strings } = useA11ySettings();
  const audit = useAudit();
  const announce = useAnnounce();
  const copy = strings.headingsLandmarks;
  const outline = (audit && audit.outline) || [];
  const tree = useMemo(() => buildTree(outline), [outline]);

  const handleJump = (node) => {
    const ok = audit ? audit.jumpToElement(node.elementKey) : false;
    if (!ok) {
      announce(strings.audit.jumpFailed, { level: 'critical', source: 'outline', dedupeKey: 'outline.jump' });
      return;
    }
    announce(
      formatMessage(strings.audit.jumped, { label: node.text || copy.outlineEmpty }),
      { level: 'standard', source: 'outline', dedupeKey: `outline.${node.elementKey}` },
    );
  };

  if (!outline.length) {
    return <p className="a11ytb-hint">{copy.outlineEmpty}</p>;
  }

  return <OutlineList nodes={tree} copy={copy} onJump={handleJump} />;
}
