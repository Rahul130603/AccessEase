import React, { useId, useMemo, useState } from 'react';

import { useAudit } from '../../core/audit/AuditContext.jsx';
import { getFixExample } from '../../core/audit/fixExamples.js';
import { useA11ySettings } from '../../core/SettingsContext.jsx';
import { formatMessage } from '../../strings.js';
import FindingList from '../screenReader/FindingList.jsx';
import { useAltTextSession } from './AltTextContext.jsx';
import { snapshotImage } from './altTextWorkflow.js';
import { correctionIdentity, deleteCorrection, generateAlt, readImageForAlt, saveCorrection } from './altTextClient.js';

const MEANINGFUL_DEMO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='90' role='img'%3E%3Crect width='160' height='90' fill='%23cfe3ff'/%3E%3Crect x='18' y='50' width='20' height='24' fill='%230b4fd8'/%3E%3Crect x='48' y='34' width='20' height='40' fill='%230b4fd8'/%3E%3Crect x='78' y='20' width='20' height='54' fill='%230b4fd8'/%3E%3Crect x='108' y='8' width='20' height='66' fill='%230b4fd8'/%3E%3C/svg%3E";
const DECORATIVE_DEMO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='24'%3E%3Crect width='160' height='24' fill='%23e7e9f2'/%3E%3Ccircle cx='16' cy='12' r='5' fill='%23b9c0d4'/%3E%3Ccircle cx='40' cy='12' r='5' fill='%23b9c0d4'/%3E%3Ccircle cx='64' cy='12' r='5' fill='%23b9c0d4'/%3E%3C/svg%3E";
const cardIds = new WeakMap();
let nextCardId = 1;
function cardKey(image) {
  if (!cardIds.has(image)) cardIds.set(image, `host-image-${nextCardId++}`);
  return cardIds.get(image);
}

/**
 * Feature: image alternative text.
 *
 * The panel's job is to keep two things apart:
 *  1. what the audit can prove (no alt attribute at all; an icon link left with no
 *     accessible name; alt text that is literally a file name), and
 *  2. what only a person can decide (whether a description is accurate, whether an
 *     image is decorative).
 *
 * AI suggestions are proposals for explicit review, never automatic truth.
 */
function ImageCard({ image, finding, audit, config, announce, session }) {
  const id = useId();
  const record = session.records.get(image) || {};
  const [consent, setConsent] = useState(false);
  const [replace, setReplace] = useState(false);
  const [decorativeConfirmed, setDecorativeConfirmed] = useState(false);
  const existing = image.getAttribute('alt');
  const changedByHost = record.status === 'overridden';
  const busy = ['generating', 'applying', 'saving'].includes(record.status);
  const isFunctional = Boolean(image.closest('a[href],button'));
  const control = image.closest('a[href],button');
  const controlNamed = Boolean(control?.getAttribute('aria-label')?.trim() || control?.textContent?.trim());

  function fail(error) {
    const message = error?.message || 'The operation failed. Please retry.';
    session.update(image, { status: 'failed', error: message });
    announce(`Alt text: ${message}`, { dedupeKey: `alt.error.${id}`, level: 'critical' });
  }

  async function onGenerate() {
    try {
      const snapshot = snapshotImage(image);
      session.update(image, { status: 'generating', error: '' });
      const prepared = await readImageForAlt(image);
      const result = await generateAlt(config, image, prepared);
      if (!image.isConnected || image.getAttribute('src') !== snapshot.src ||
          image.getAttribute('srcset') !== snapshot.srcset || image.getAttribute('alt') !== snapshot.alt) {
        throw new Error('The image changed during generation. Scan again and retry.');
      }
      session.update(image, { status: 'suggestion', draft: result.suggestion, snapshot, prepared,
        complex: result.complex === true, error: '' });
      announce('Alt-text suggestion ready for review. It has not been applied.', { dedupeKey: `alt.suggest.${id}` });
    } catch (error) { fail(error); }
  }

  async function onApply(decorative) {
    try {
      session.update(image, { status: 'applying', error: '' });
      const snapshot = record.snapshot || snapshotImage(image);
      session.apply(image, { snapshot, text: record.draft || '', decorative, allowReplace: replace });
      audit?.rescan();
    } catch (error) { fail(error); }
  }

  async function onSave() {
    try {
      if (!record.edit || image.getAttribute('alt') !== record.edit.applied) {
        throw new Error('Apply and verify the alt text on the page before saving it.');
      }
      if (image.getAttribute('src') !== record.edit.before.src ||
          image.getAttribute('srcset') !== record.edit.before.srcset) {
        throw new Error('The image source changed after the alt text was applied. Review it again before saving.');
      }
      session.update(image, { status: 'saving', error: '' });
      const prepared = record.prepared || await readImageForAlt(image);
      const identity = correctionIdentity(config, image, prepared.imageHash);
      await saveCorrection(config, identity, record.edit.applied);
      session.update(image, { status: 'saved', saved: true, savedAlt: record.edit.applied, identity, error: '' });
      announce('Approved alt text saved for this exact image and page.', { dedupeKey: `alt.save.${id}`, level: 'critical' });
    } catch (error) { fail(error); }
  }

  async function onRemoveSaved() {
    try {
      await deleteCorrection(config, record.identity);
      session.update(image, { saved: false, savedAlt: null, status: 'applied', error: '' });
      announce('Saved correction removed. The current page edit remains until you undo it.', { dedupeKey: `alt.delete.${id}` });
    } catch (error) { fail(error); }
  }

  const canGenerate = config?.enabled && config?.allowExternalProcessing && config?.disclosure && consent;
  const unavailable = changedByHost || record.status === 'already-corrected';
  return (
    <article className="a11ytb-alt-card">
      <div className="a11ytb-alt-card__top">
        <img src={image.currentSrc || image.src} alt="" loading="lazy" className="a11ytb-alt-card__preview" />
        <div>
          <strong>{finding?.label || 'Edited page image'}</strong>
          <p className="a11ytb-hint">{finding?.code === 'missing-alt' ? 'Missing alt attribute' :
            finding ? 'Existing alt needs human review' : 'Edited on this page'}</p>
        </div>
      </div>
      {existing !== null && !record.edit ? <p className="a11ytb-hint">Current alt: {existing || '(empty, possibly decorative)'}</p> : null}
      {isFunctional ? <p className="a11ytb-note a11ytb-note--warning">This image is inside a link or button. Its alt text may need to name the action or destination.</p> : null}
      {!config?.enabled ? <p className="a11ytb-hint">AI suggestions are unavailable until this site configures its authorized server endpoint.</p> : null}
      {config?.enabled && (!config.allowExternalProcessing || !config.disclosure) ?
        <p className="a11ytb-hint">AI generation is disabled until the site enables image processing and provides a disclosure.</p> : null}
      {config?.enabled && config?.allowExternalProcessing ? (
        <label className="a11ytb-alt-card__consent">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          <span>{config.disclosure || 'Allow this image and limited nearby context to be processed by the configured AI provider.'}</span>
        </label>
      ) : null}
      <div className="a11ytb-button-row">
        <button type="button" className="a11ytb-button" onClick={onGenerate} disabled={!canGenerate || busy || unavailable || !image.isConnected}>
          {record.status === 'generating' ? 'Generating…' : 'Generate Alt Text'}
        </button>
        <button type="button" className="a11ytb-button" onClick={() => {
          if (finding) audit?.jump(finding.id);
          else image.scrollIntoView?.({ block: 'center' });
        }} disabled={!image.isConnected}>Locate</button>
      </div>
      <label htmlFor={`a11ytb-alt-${id}`}>Description to apply</label>
      <textarea id={`a11ytb-alt-${id}`} className="a11ytb-alt-card__input" maxLength={500}
        value={record.draft ?? ''} onChange={(event) => session.update(image, { draft: event.target.value })}
        disabled={busy || unavailable} />
      {record.complex ? <p className="a11ytb-note a11ytb-note--warning">This chart or diagram may need a longer text explanation on the website.</p> : null}
      {existing?.trim() && !record.edit ? <label className="a11ytb-alt-card__consent">
        <input type="checkbox" checked={replace} onChange={(event) => setReplace(event.target.checked)} />
        <span>I reviewed the existing alt text and choose to replace it.</span>
      </label> : null}
      {!record.edit ? <label className="a11ytb-alt-card__consent">
        <input className="a11ytb-alt-card__decorative-confirm" type="checkbox" checked={decorativeConfirmed}
          onChange={(event) => setDecorativeConfirmed(event.target.checked)} />
        <span>I reviewed this image and confirm it carries no information or required control name.</span>
      </label> : null}
      <div className="a11ytb-button-row">
        <button type="button" className="a11ytb-button" onClick={() => onApply(false)}
          disabled={busy || unavailable || Boolean(record.edit) || !record.draft?.trim() || (Boolean(existing?.trim()) && !replace)}>Apply Alt</button>
        <button type="button" className="a11ytb-button" onClick={() => onApply(true)}
          disabled={busy || unavailable || Boolean(record.edit) || !decorativeConfirmed || (isFunctional && !controlNamed) || (Boolean(existing?.trim()) && !replace)}>Mark Decorative</button>
        {record.edit && !changedByHost ? <button type="button" className="a11ytb-button" onClick={() => {
          try { session.undo(image); audit?.rescan(); } catch (error) { fail(error); }
        }}>Undo</button> : null}
        {config?.persistence?.enabled && config?.persistence?.canWrite && record.edit &&
          (!record.saved || record.savedAlt !== record.edit.applied) && !changedByHost ?
          <button type="button" className="a11ytb-button" onClick={onSave} disabled={busy}>Save correction</button> : null}
        {config?.persistence?.canWrite && record.saved && record.identity ? <button type="button" className="a11ytb-button" onClick={onRemoveSaved}>Remove saved correction</button> : null}
      </div>
      {record.status ? <p className="a11ytb-hint">{({ generating: 'Generating suggestion…', suggestion: 'Suggestion ready for review; not applied.', applying: 'Applying…', applied: 'Applied to the host image.', restored: 'Saved correction restored to this page.', saved: 'Saved correction confirmed.', undone: 'Original alt restored.', overridden: 'Host page changed this image after the edit.', 'already-corrected': 'The website changed this alt text. Scan again before editing.', failed: 'Operation failed; retry is available.' })[record.status] || ''}</p> : null}
      {record.error ? <p className="a11ytb-note a11ytb-note--warning">{record.error}</p> : null}
    </article>
  );
}

export default function AltTextPanel() {
  const { strings, config, actions } = useA11ySettings();
  const audit = useAudit();
  const announce = actions.announce;
  const session = useAltTextSession();
  const copy = strings.altText;

  const findings = useMemo(
    () => (audit ? audit.findings.filter((finding) => finding.checkId === 'image-alt') : []),
    [audit],
  );
  const counters = (audit && audit.counters) || {};
  const example = getFixExample('image-alt-missing');
  const cards = useMemo(() => {
    const images = new Map();
    findings.forEach((finding) => {
      if (!['missing-alt', 'filename-alt', 'large-empty-alt', 'empty-alt-in-control'].includes(finding.code)) return;
      const image = audit?.getElement(finding.id);
      if (image?.tagName?.toLowerCase() === 'img' && !images.has(image)) images.set(image, finding);
    });
    session.records.forEach((record, image) => {
      if (image.isConnected && (record.edit || record.status === 'already-corrected' ||
          record.status === 'suggestion' || record.status === 'failed') && !images.has(image)) images.set(image, null);
    });
    return Array.from(images, ([image, finding]) => ({ image, finding }));
  }, [findings, audit, session.records]);

  return (
    <div className="a11ytb-feature">
      <p className="a11ytb-hint">{copy.intro}</p>

      <ul className="a11ytb-uninspectable">
        <li>
          {strings.audit.counterLabels.images}: <strong>{counters.images || 0}</strong>
        </li>
        <li>
          {strings.audit.counterLabels.withAltText}: <strong>{counters.withAltText || 0}</strong>
        </li>
        <li>
          {strings.audit.counterLabels.missingAlt}: <strong>{counters.missingAlt || 0}</strong>
        </li>
        <li>
          {strings.audit.counterLabels.emptyAlt}: <strong>{counters.emptyAlt || 0}</strong>
        </li>
      </ul>

      <p className="a11ytb-note a11ytb-note--warning">{copy.qualityCaveat}</p>
      <p className="a11ytb-note">AI descriptions are suggestions for review. Applying changes this page’s DOM only; saving requires the site’s authorized backend.</p>

      <h4 className="a11ytb-note__heading">Images to review on this page</h4>
      {cards.length ? cards.map(({ image, finding }) => <ImageCard key={cardKey(image)}
        image={image} finding={finding} audit={audit} config={config.altText} announce={announce} session={session} />) :
        <p className="a11ytb-hint">No missing or suspicious image alt attributes detected in the scanned page. Existing descriptions still need human review.</p>}

      <h4 className="a11ytb-note__heading">{copy.examplesHeading}</h4>
      <div className="a11ytb-example-grid">
        <figure className="a11ytb-example">
          <img
            src={MEANINGFUL_DEMO}
            width="160"
            height="90"
            alt="Bar chart: revenue rose from 2.1 million in Q1 to 3.4 million in Q4"
          />
          <figcaption>
            <strong>{copy.exampleMeaningfulLabel}</strong>
            <span className="a11ytb-hint">{copy.exampleMeaningfulNote}</span>
          </figcaption>
        </figure>
        <figure className="a11ytb-example">
          {/* Decorative: alt="" is the semantic way to remove it from the accessibility tree. */}
          <img src={DECORATIVE_DEMO} width="160" height="24" alt="" />
          <figcaption>
            <strong>{copy.exampleDecorativeLabel}</strong>
            <span className="a11ytb-hint">{copy.exampleDecorativeNote}</span>
          </figcaption>
        </figure>
      </div>

      <h4 className="a11ytb-note__heading">{copy.exampleCodeHeading}</h4>
      {example ? (
        <>
          <pre className="a11ytb-code">
            <code>{example.code}</code>
          </pre>
          <ul className="a11ytb-uninspectable">
            {example.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </>
      ) : null}

      <h4 className="a11ytb-note__heading">{copy.componentHeading}</h4>
      <p className="a11ytb-hint">{copy.componentIntro}</p>
      <pre className="a11ytb-code">
        <code>{copy.componentCode}</code>
      </pre>

      <h4 className="a11ytb-note__heading">{copy.fixHeading}</h4>
      <FindingList findings={findings} emptyMessage={strings.audit.detectedEmpty} />

      <div className="a11ytb-button-row">
        <button
          type="button"
          className="a11ytb-button"
          onClick={() => {
            if (audit) audit.rescan();
          }}
        >
          {strings.audit.run}
        </button>
      </div>
      <p className="a11ytb-hint">
        {formatMessage(strings.audit.statusChecked, {
          time: audit && audit.ranAt ? new Date(audit.ranAt).toLocaleTimeString() : '',
          findings: audit ? audit.summary.total : 0,
        })}
      </p>
    </div>
  );
}
