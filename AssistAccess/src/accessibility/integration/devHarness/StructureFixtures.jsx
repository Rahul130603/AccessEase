import React from 'react';

import { AccessibleImage, Figure } from '../../patterns/AccessibleImage.jsx';
import { CheckboxField, RadioGroupField, TextField } from '../../patterns/fields.jsx';
import { Section } from '../../patterns/PageStructure.jsx';
import StatusMessage from '../../ui/StatusMessage.jsx';

/**
 * Structural defects and correct patterns, side by side.
 *
 * Every defect below is deliberate: it exists so the audit has something real to
 * find, and so a reviewer can check that the toolbar *reports* rather than silently
 * rewriting the page. Each block states what the audit should say.
 *
 * The correct examples next to them show the markup the application should ship.
 */

export function BrokenMarkupFixture() {
  return (
    <div>
      <h3>Deliberate defects — the audit should report these</h3>

      <h4>Images</h4>
      <p>
        The first image has no <code>alt</code> attribute at all (detected problem). The second is
        an icon-only link whose image has no alt, so the link has no accessible name (also
        detected). The third uses a file name as alt text (review item).
      </p>
      <img src="./structure-photo.png" width="120" height="80" />
      <p>
        <a href="#broken-markup">
          <img src="./structure-icon.svg" width="24" height="24" />
        </a>{' '}
        ← an icon-only link with no name
      </p>
      <img src="./chart.png" width="120" height="80" alt="chart.png" />
      <p>
        <img src="./hero-background.jpg" width="600" height="200" alt="" /> ← a large image claimed
        to be decorative (review item)
      </p>

      <h4>Form controls</h4>
      <p>
        A placeholder-only field (detected: no label), a label pointing at an id that does not
        exist (detected), an unlabelled option group (review), and an icon-only button with no name
        (detected).
      </p>
      <p>
        <input type="text" placeholder="Full name" />
      </p>
      <p>
        <label htmlFor="phone">Phone</label>
        <input id="phone-number" type="tel" />
      </p>
      <p>
        <input type="radio" name="broken-speed" value="standard" /> Standard
        <input type="radio" name="broken-speed" value="express" /> Express
      </p>
      <p>
        <button type="button" aria-hidden="false">
          <span aria-hidden="true">★</span>
        </button>{' '}
        ← a button whose only content is hidden from assistive technology
      </p>

      <h4>Headings</h4>
      <p>
        The next heading jumps from level 4 to level 6 (review), followed by an empty heading
        (detected) and a heading hidden with aria-hidden (detected).
      </p>
      <h6>Jumped from level 4 to level 6</h6>
      <h6 />
      <h6 aria-hidden="true">Hidden heading</h6>
      <div className="harness-fake-heading">Text styled like a heading but not one</div>
    </div>
  );
}

export function CorrectMarkupFixture() {
  const [email, setEmail] = React.useState('');
  const [speed, setSpeed] = React.useState('standard');
  const [copyMe, setCopyMe] = React.useState(false);
  const [saved, setSaved] = React.useState('');

  return (
    <div>
      <h3>Correct markup — the audit should stay quiet</h3>
      <p>
        These use the module&apos;s pattern components: a labelled text field, a named option group,
        an explicit image decision, and a visible status message.
      </p>

      <TextField
        label="Email address"
        type="email"
        hint="Only used to send your receipt."
        value={email}
        onChange={setEmail}
        required
      />

      <RadioGroupField
        legend="Delivery speed"
        name="correct-speed"
        value={speed}
        onChange={setSpeed}
        options={[
          { value: 'standard', label: 'Standard, 3-5 days' },
          { value: 'express', label: 'Express, next day', hint: 'Costs more' },
        ]}
      />

      <CheckboxField label="Email me a copy" checked={copyMe} onChange={setCopyMe} />

      <div className="a11ytb-button-row">
        <button type="button" className="a11ytb-button" onClick={() => setSaved('Draft saved')}>
          Save draft
        </button>
      </div>

      {/* Visible status: the region announces on its own, so no separate call to announce(). */}
      <StatusMessage className="a11ytb-status">{saved}</StatusMessage>

      <Figure caption="Revenue by quarter">
        <AccessibleImage
          src="./chart-accessible.png"
          width="240"
          height="140"
          alt="Bar chart: revenue rose from 2.1 million in Q1 to 3.4 million in Q4"
        />
      </Figure>

      <AccessibleImage src="./divider.svg" decorative width="240" height="16" />

      <p>
        The harness renders <code>SkipLink</code> once at the top of the page, before the header, so
        the keyboard test can use it.
      </p>

      <Section level={3} heading="A section named by its own heading">
        <p>
          A labelled <code>section</code> becomes a navigable region. The page keeps exactly one
          main landmark, which is the one wrapping this content.
        </p>
      </Section>
    </div>
  );
}

export default BrokenMarkupFixture;
