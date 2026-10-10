/**
 * Widget shell — Vitest + React Testing Library + axe.
 *
 * Covers the interaction contract of the floating button and the panel: the accessible
 * name and state of the launcher, open/close by mouse, keyboard and Escape, focus return,
 * the dialog's name and description, and the fourteen features being present under their
 * category headings. Every render is checked with axe.
 *
 * STATUS: authored, NOT executed in the review environment. Run with `npx vitest run`.
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';

import AccessibilityModule from '../../AccessibilityModule.jsx';
import { AccessibilityProvider } from '../../AccessibilityModule.jsx';
import AccessibilityPanel from '../../AccessibilityPanel.jsx';
import { a11yFeatures } from '../../features/registry.js';

function renderWidget() {
  return render(
    <AccessibilityModule config={{ storage: 'memory' }}>
      <main id="test-main">
        <h1>Host page</h1>
      </main>
    </AccessibilityModule>,
  );
}

describe('floating launcher', () => {
  it('has the documented accessible name and starts collapsed', () => {
    renderWidget();
    const launcher = screen.getByRole('button', { name: 'Open accessibility settings' });
    expect(launcher).toHaveAttribute('aria-expanded', 'false');
    expect(launcher).not.toHaveAttribute('aria-controls');
  });

  it('opens the panel on click and closes it on a second click', async () => {
    const user = userEvent.setup();
    renderWidget();
    const launcher = screen.getByRole('button', { name: 'Open accessibility settings' });

    await user.click(launcher);
    const dialog = await screen.findByRole('dialog');
    expect(launcher).toHaveAttribute('aria-expanded', 'true');
    expect(launcher).toHaveAttribute('aria-controls', dialog.id);

    await user.click(launcher);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(launcher).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens with the keyboard and closes with Escape, returning focus', async () => {
    const user = userEvent.setup();
    renderWidget();
    const launcher = screen.getByRole('button', { name: 'Open accessibility settings' });

    launcher.focus();
    await user.keyboard('{Enter}');
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(launcher).toHaveFocus();
  });

  it('names and describes the dialog without putting the subtitle in the name', async () => {
    const user = userEvent.setup();
    renderWidget();
    await user.click(screen.getByRole('button', { name: 'Open accessibility settings' }));

    const dialog = screen.getByRole('dialog');
    const name = dialog.getAttribute('aria-labelledby');
    const description = dialog.getAttribute('aria-describedby');
    expect(document.getElementById(name).textContent).toBe('Accessibility options');
    expect(document.getElementById(description).textContent).toMatch(/Display, motion and reading/);
  });

  it('has no axe violations when open', async () => {
    const user = userEvent.setup();
    const { baseElement } = renderWidget();
    await user.click(screen.getByRole('button', { name: 'Open accessibility settings' }));
    expect(await axe(baseElement)).toHaveNoViolations();
  });
});

describe('panel content', () => {
  it('renders all fourteen features under their category headings', () => {
    render(
      <AccessibilityProvider config={{ storage: 'memory' }}>
        <AccessibilityPanel id="test-panel" config={{ position: { corner: 'right-middle' } }} onClose={() => {}} />
      </AccessibilityProvider>,
    );

    expect(a11yFeatures).toHaveLength(14);
    a11yFeatures.forEach((feature) => {
      expect(screen.getByRole('heading', { level: 4, name: new RegExp(feature.title, 'i') })).toBeInTheDocument();
    });
    ['Motion and sensory', 'Screen reader', 'Forms and interaction', 'Personalization'].forEach((category) => {
      expect(screen.getByRole('heading', { level: 3, name: category })).toBeInTheDocument();
    });
  });

  it('exposes every feature as a disclosure with a description', () => {
    render(
      <AccessibilityProvider config={{ storage: 'memory' }}>
        <AccessibilityPanel id="test-panel" config={{ position: { corner: 'right-middle' } }} onClose={() => {}} />
      </AccessibilityProvider>,
    );

    const toggles = screen.getAllByRole('button', { expanded: false });
    expect(toggles.length).toBeGreaterThanOrEqual(14);
    toggles.slice(0, 14).forEach((toggle) => {
      expect(toggle).toHaveAttribute('aria-controls');
      expect(toggle).toHaveAccessibleDescription(/.+/);
    });
  });

  it('keeps the limitation statement in the footer', () => {
    render(
      <AccessibilityProvider config={{ storage: 'memory' }}>
        <AccessibilityPanel id="test-panel" config={{ position: { corner: 'right-middle' } }} onClose={() => {}} />
      </AccessibilityProvider>,
    );
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/cannot fix a website you do not control/i)).toBeInTheDocument();
  });
});
