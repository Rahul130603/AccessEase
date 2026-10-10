/**
 * The 14 features, grouped into the four categories of the assignment.
 *
 * This is presentation metadata only: the category a feature appears under in the
 * widget, and which icon it uses. It is kept in a plain module (no JSX) for two
 * reasons:
 *   1. the registry decorates its descriptors from this single table, so a feature
 *      cannot appear in the panel without a category and an icon, and
 *   2. the self-test can assert, without a bundler, that all fourteen features are
 *      present exactly once, each with a valid category and an icon that exists.
 *
 * The order below is the order the widget renders.
 */

import { FEATURE_IDS } from '../constants.js';

export const FEATURE_CATEGORIES = Object.freeze([
  {
    id: 'motion-sensory',
    label: 'Motion and sensory',
    description: 'Reduce movement and adjust how colours are perceived.',
    icon: 'motion',
  },
  {
    id: 'screen-reader',
    label: 'Screen reader',
    description: 'What assistive technology reads, and how to check it.',
    icon: 'reader',
  },
  {
    id: 'forms',
    label: 'Forms and interaction',
    description: 'Labels, errors, passwords and confirmation for anything people type or submit.',
    icon: 'forms',
  },
  {
    id: 'personalization',
    label: 'Personalization',
    description: 'Saved preferences, reset, and profiles that combine settings.',
    icon: 'visual',
  },
]);

/** feature id → { category, icon } */
export const FEATURE_META = Object.freeze({
  [FEATURE_IDS.FLASHING]: { category: 'motion-sensory', icon: 'flashing' },
  [FEATURE_IDS.VISUALS]: { category: 'motion-sensory', icon: 'brightness' },
  [FEATURE_IDS.SCREEN_READER]: { category: 'screen-reader', icon: 'screenReader' },
  [FEATURE_IDS.ALT_TEXT]: { category: 'screen-reader', icon: 'altText' },
  [FEATURE_IDS.FORM_LABELS]: { category: 'screen-reader', icon: 'formLabels' },
  [FEATURE_IDS.HEADINGS]: { category: 'screen-reader', icon: 'structure' },
  [FEATURE_IDS.ANNOUNCEMENTS]: { category: 'screen-reader', icon: 'announcements' },
  [FEATURE_IDS.ERROR_MESSAGES]: { category: 'forms', icon: 'errorMessages' },
  [FEATURE_IDS.PASSWORD]: { category: 'forms', icon: 'password' },
  [FEATURE_IDS.AUTH]: { category: 'forms', icon: 'auth' },
  [FEATURE_IDS.CONFIRM]: { category: 'forms', icon: 'confirm' },
  [FEATURE_IDS.PREFERENCES]: { category: 'personalization', icon: 'preferences' },
  [FEATURE_IDS.RESET]: { category: 'personalization', icon: 'reset' },
  [FEATURE_IDS.PROFILES]: { category: 'personalization', icon: 'profiles' },
});

export function getFeatureCategory(categoryId) {
  return FEATURE_CATEGORIES.find((category) => category.id === categoryId) || null;
}

/** Features of one category, in registry order. */
export function groupFeaturesByCategory(features) {
  return FEATURE_CATEGORIES.map((category) => ({
    category,
    features: (features || []).filter((feature) => feature.category === category.id),
  })).filter((group) => group.features.length > 0);
}

export default FEATURE_CATEGORIES;
