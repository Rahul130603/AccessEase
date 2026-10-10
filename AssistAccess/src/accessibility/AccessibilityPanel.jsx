import React, { useId, useMemo } from 'react';

import { isFeatureEnabled } from './config.js';
import { a11yFeatures } from './features/registry.js';
import { groupFeaturesByCategory } from './features/categories.js';
import { useA11ySettings } from './core/SettingsContext.jsx';
import AccessibilityAudit from './AccessibilityAudit.jsx';
import AccessibilitySettings from './AccessibilitySettings.jsx';
import Disclosure from './ui/Disclosure.jsx';
import Icon from './ui/icons.jsx';
import Panel from './ui/Panel.jsx';

/**
 * The expandable accessibility panel.
 *
 * Structure, and why it is shaped this way
 * ---------------------------------------
 *   header    the panel's `<h2>` title (the dialog's accessible name) and a close
 *             button; the subtitle is a `<p>` referenced with aria-describedby, so the
 *             dialog is announced once as "Accessibility · <subtitle>" instead of
 *             dragging the subtitle into the name.
 *   quick     profiles, motion, display and preference actions — the controls people
 *             use most (AccessibilitySettings).
 *   check     a compact summary of the page audit (AccessibilityAudit).
 *   14 rows   every assigned feature, grouped under four `<h3>` category headings, each
 *             with an icon, a one-line description and its own panel inside a
 *             disclosure. Heading order stays h2 → h3 → h4.
 *   footer    the honest limitation statement.
 *
 * The features come from the registry, so this file never lists them by hand: adding a
 * feature there makes it appear here with its category and icon, and the self-test
 * asserts that all fourteen are present.
 *
 * Opening and closing is driven by React state in the module chrome
 * (AccessibilityModule → AccessibilityChrome): the launcher's `onToggle` flips it, the
 * panel mounts when it is true, and the chrome restores focus to the launcher when it
 * goes back to false. Escape and the close button call the same `onClose`.
 */
export default function AccessibilityPanel({ id, config, onClose }) {
  const { strings } = useA11ySettings();
  const copy = strings.widget;
  const instanceId = useId().replace(/:/g, '');

  const groups = useMemo(
    () => groupFeaturesByCategory(a11yFeatures.filter((feature) => isFeatureEnabled(config, feature.id))),
    [config],
  );

  const panelIcon = <Icon name="reader" />;
  const panelFooter = <p>{copy.limitations}</p>;

  return (
    <Panel
      id={id}
      variant="widget"
      icon={panelIcon}
      title={strings.panel.title}
      subtitle={copy.subtitle}
      closeLabel={strings.panel.close}
      onClose={onClose}
      footer={panelFooter}
    >
      <AccessibilitySettings />
      <AccessibilityAudit />

      <h3 className="a11ytb-quick__heading" id={`a11ytb-all-settings-${instanceId}`}>
        {copy.featuresHeading}
      </h3>

      {groups.map(({ category, features }) => (
        <section
          className="a11ytb-category"
          key={category.id}
          aria-labelledby={`a11ytb-category-${category.id}-${instanceId}`}
        >
          <h3 className="a11ytb-category__heading" id={`a11ytb-category-${category.id}-${instanceId}`}>
            <span className="a11ytb-category__icon" aria-hidden="true">
              <Icon name={category.icon} />
            </span>
            {category.label}
          </h3>
          <p className="a11ytb-category__description">{category.description}</p>

          {features.map((feature) => (
            <Disclosure
              key={feature.id}
              headingLevel={4}
              icon={feature.icon}
              title={feature.title}
              summary={feature.summary}
            >
              {typeof feature.Panel === 'function' ? (
                <feature.Panel />
              ) : (
                <p className="a11ytb-hint">{copy.missingPanel}</p>
              )}
            </Disclosure>
          ))}
        </section>
      ))}
    </Panel>
  );
}
