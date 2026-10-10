import React, { useCallback, useId, useMemo, useState } from 'react';

import { useConfirm } from '../../core/confirm/ConfirmContext.jsx';
import { getProfiles, resolveActiveProfile } from '../../core/profiles/profiles.js';
import { useA11ySettings } from '../../core/SettingsContext.jsx';
import { formatMessage } from '../../strings.js';

/**
 * Feature: accessibility profiles.
 *
 * A profile is a named patch of existing settings — it has no visual implementation
 * of its own. Selecting one dispatches a single patch, so the appliers run once, the
 * change is persisted like any manual edit, and every other feature sees it.
 *
 * The radio group shows the profile the settings currently match. The moment a user
 * changes one of the values a profile set, `resolveActiveProfile` stops matching and
 * the panel shows "Custom" instead — derived on every render, so it cannot drift out
 * of sync with the actual values.
 *
 * The panel is deliberately explicit about the limits: profiles are starting points,
 * not diagnoses; they only change the settings they list; and the "Default" profile
 * returns motion control to the operating system rather than forcing it off.
 */
export default function ProfilesPanel() {
  const { settings, actions, config, strings } = useA11ySettings();
  const confirm = useConfirm();
  const copy = strings.profiles;

  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const nameFieldId = `a11ytb-profile-name-${useId().replace(/:/g, '')}`;

  const profiles = useMemo(() => getProfiles({ config, settings }), [config, settings]);
  const active = useMemo(() => resolveActiveProfile(settings, profiles), [settings, profiles]);
  const userProfiles = profiles.filter((profile) => profile.source === 'user');

  const trimmed = name.trim();
  const duplicate = profiles.some(
    (profile) => profile.label.toLowerCase() === trimmed.toLowerCase(),
  );
  const canSave = trimmed.length > 0 && !duplicate;

  const saveProfile = useCallback(() => {
    if (!canSave) {
      setStatus(duplicate ? copy.saveDuplicate : copy.saveEmpty);
      return;
    }
    actions.addUserProfile(trimmed);
    setName('');
    setStatus(formatMessage(strings.announcements.profileSaved, { name: trimmed }));
  }, [canSave, duplicate, actions, trimmed, copy, strings]);

  const deleteProfile = useCallback(
    async (profile) => {
      const accepted = await confirm({
        title: formatMessage(copy.deleteConfirmTitle, { name: profile.label }),
        description: copy.deleteConfirmDescription,
        confirmLabel: copy.deleteButton,
        destructive: true,
      });
      if (accepted) actions.removeUserProfile(profile.id, profile.label);
    },
    [confirm, actions, copy],
  );

  return (
    <div className="a11ytb-feature">
      <p className="a11ytb-hint">{copy.intro}</p>

      <fieldset className="a11ytb-fieldset">
        <legend className="a11ytb-legend">{copy.legend}</legend>
        {profiles.map((profile) => (
          <div className="a11ytb-choice-row" key={profile.id}>
            <label className="a11ytb-choice">
              <input
                type="radio"
                name="a11ytb-profile"
                value={profile.id}
                checked={!active.isCustom && active.id === profile.id}
                onChange={() => actions.applyProfile(profile)}
              />
              <span className="a11ytb-choice__text">
                <span className="a11ytb-choice__label">
                  {profile.label}
                  {profile.source === 'user' ? ` (${copy.savedByYou})` : ''}
                </span>
                {profile.description ? (
                  <span className="a11ytb-hint">{profile.description}</span>
                ) : null}
              </span>
            </label>
            {profile.source === 'user' ? (
              <button
                type="button"
                className="a11ytb-button"
                aria-label={formatMessage(copy.deleteLabel, { name: profile.label })}
                onClick={() => deleteProfile(profile)}
              >
                {copy.deleteButton}
              </button>
            ) : null}
          </div>
        ))}
      </fieldset>

      {active.isCustom ? (
        <p className="a11ytb-status" role="status">
          <strong>{copy.customLabel}</strong>: {copy.customActive}
        </p>
      ) : (
        <p className="a11ytb-status" role="status">
          {formatMessage(copy.activeLine, { name: active.profile.label })}
        </p>
      )}

      <p className="a11ytb-hint">{copy.applyHint}</p>
      <p className="a11ytb-hint">{copy.osNote}</p>
      <p className="a11ytb-hint">{copy.scopeNote}</p>
      <p className="a11ytb-hint">{copy.configNote}</p>

      <div className="a11ytb-note a11ytb-note--warning">
        <h4 className="a11ytb-note__heading">{copy.honestNote}</h4>
      </div>

      <h4 className="a11ytb-note__heading">{copy.saveHeading}</h4>
      <div className="a11ytb-field">
        <label className="a11ytb-field__label" htmlFor={nameFieldId}>
          {copy.saveLabel}
        </label>
        <p className="a11ytb-hint">{copy.saveHint}</p>
        <input
          className="a11ytb-form__control"
          id={nameFieldId}
          type="text"
          value={name}
          maxLength={60}
          onChange={(event) => {
            setName(event.target.value);
            setStatus('');
          }}
        />
      </div>
      <div className="a11ytb-button-row">
        <button type="button" className="a11ytb-button" onClick={saveProfile} disabled={!canSave}>
          {copy.saveButton}
        </button>
      </div>
      {status ? <p className="a11ytb-status">{status}</p> : null}

      <h4 className="a11ytb-note__heading">{copy.userHeading}</h4>
      {userProfiles.length === 0 ? (
        <p className="a11ytb-hint">{copy.userEmpty}</p>
      ) : (
        <ul className="a11ytb-uninspectable">
          {userProfiles.map((profile) => (
            <li key={profile.id}>
              {profile.label} ({Object.keys(profile.patch).length} group(s))
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
