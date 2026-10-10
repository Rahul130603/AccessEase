import React, { useState } from 'react';

import {
  ConfirmButton,
  PasswordField,
  StatusMessage,
  TextField,
} from '../src/accessibility/index.js';

/**
 * A small but realistic site, used to exercise the widget by hand.
 *
 * Most of it is written the way the toolbar recommends — landmarks, one h1, real
 * labels, alt text, a data table with scoped headers — so the page check stays quiet.
 * Four defects are left in on purpose, each labelled in the UI, so every audit check has
 * something to find:
 *
 *   1. an image with no alt attribute (card 3),
 *   2. an image whose alt text is its file name (card 2),
 *   3. a placeholder-only input in the newsletter form,
 *   4. a fast-flashing promo banner, to exercise flashing protection and the motion
 *      controls.
 *
 * Nothing here talks to a server: the forms validate locally and report what they would
 * have done.
 */
export default function DemoPage() {
  const [newsletter, setNewsletter] = useState({ email: '', name: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [account, setAccount] = useState({ email: '', password: '' });
  const [rows] = useState([
    { plan: 'Starter', seats: 3, price: '£29' },
    { plan: 'Team', seats: 12, price: '£99' },
    { plan: 'Business', seats: 40, price: '£249' },
  ]);

  const submitNewsletter = (event) => {
    event.preventDefault();
    const next = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newsletter.email)) {
      next.email = 'Enter an email address in the form name@example.com.';
    }
    setErrors(next);
    if (Object.keys(next).length === 0) {
      setStatus('Thanks — this demo would have subscribed you now.');
    }
  };

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <header className="site-header">
        <div className="wrap">
          <p className="logo">Northwind Digital</p>
          <nav aria-label="Main">
            <ul>
              <li>
                <a href="#services">Services</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="hero">
          <div className="wrap">
            <p className="eyebrow">Accessibility and design</p>
            <h1>We build digital products everyone can use</h1>
            <p className="lede">
              A demo page with real content, real forms and a few deliberate faults, so the
              accessibility widget can be tested by hand.
            </p>
            <div className="hero-actions">
              <a className="button" href="#services">
                See services
              </a>
              <a className="button button--ghost" href="#contact">
                Talk to us
              </a>
            </div>
          </div>
        </section>

        <section className="promo" aria-labelledby="promo-heading">
          <div className="wrap">
            <h2 id="promo-heading">Deliberate test element: fast flashing banner</h2>
            <p>
              This banner alternates black and white about six times per second. Switch
              flashing protection on in the widget and it should be paused; use “Allow” to
              let it run again. On a real site this is exactly the content that should never
              ship — see “Flashing content protection” for the safe pattern.
            </p>
            <p className="flash-demo" aria-hidden="true">
              FLASHING TEST BANNER
            </p>
          </div>
        </section>

        <section className="cards" id="services" aria-labelledby="services-heading">
          <div className="wrap">
            <h2 id="services-heading">Services</h2>
            <p className="section-note">
              The first card is written correctly. The second uses its file name as alt text,
              and the third has no alt attribute at all — both are deliberate, so the page
              check has something to report.
            </p>
            <ul className="card-grid">
              <li className="card">
                <img
                  src="./card-research.svg"
                  width="320"
                  height="180"
                  alt="Two researchers reviewing a journey map covered in sticky notes"
                />
                <h3>Research</h3>
                <p>Interviews, usability testing and accessibility reviews with real users.</p>
              </li>
              <li className="card">
                <img src="./card-design.svg" width="320" height="180" alt="card-design.svg" />
                <h3>Design</h3>
                <p>Design systems, components and documentation that teams can maintain.</p>
              </li>
              <li className="card">
                {/* Deliberate defect: no alt attribute. */}
                <img src="./card-build.svg" width="320" height="180" />
                <h3>Build</h3>
                <p>React front ends with accessibility wired in rather than bolted on.</p>
              </li>
            </ul>
          </div>
        </section>

        <section className="pricing" id="pricing" aria-labelledby="pricing-heading">
          <div className="wrap">
            <h2 id="pricing-heading">Pricing</h2>
            <table>
              <caption>Monthly plans and what they include</caption>
              <thead>
                <tr>
                  <th scope="col">Plan</th>
                  <th scope="col">Seats</th>
                  <th scope="col">Price</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.plan}>
                    <th scope="row">{row.plan}</th>
                    <td>{row.seats}</td>
                    <td>{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="contact" id="contact" aria-labelledby="contact-heading">
          <div className="wrap">
            <h2 id="contact-heading">Contact and account</h2>

            <form className="panel-form" onSubmit={submitNewsletter} noValidate>
              <h3>Newsletter</h3>
              <p>
                The name field is deliberately left without a label, so the page check reports
                it. The email field uses the module&apos;s labelled field component.
              </p>
              <p>
                {/* Deliberate defect: placeholder only, no label. */}
                <input type="text" placeholder="First name" />
              </p>
              <TextField
                id="newsletter-email"
                label="Email address"
                type="email"
                autoComplete="email"
                hint="We send one short update a month."
                value={newsletter.email}
                error={errors.email}
                onChange={(next) => {
                  setNewsletter({ ...newsletter, email: next });
                  setErrors({});
                }}
                required
              />
              <div className="actions">
                <button type="submit" className="button">
                  Subscribe
                </button>
              </div>
              <StatusMessage className="status">{status}</StatusMessage>
            </form>

            <form className="panel-form">
              <h3>Sign in</h3>
              <p>
                Shows the password toggle, autocomplete values that let password managers work,
                and paste left unblocked.
              </p>
              <TextField
                id="account-email"
                label="Email address"
                type="email"
                autoComplete="username"
                value={account.email}
                onChange={(next) => setAccount({ ...account, email: next })}
                required
              />
              <PasswordField
                id="account-password"
                label="Password"
                autoComplete="current-password"
                hint="At least 12 characters. Pasting from a password manager is fine."
                value={account.password}
                onChange={(next) => setAccount({ ...account, password: next })}
                required
              />
              <div className="actions">
                <button type="button" className="button">
                  Sign in
                </button>
                <ConfirmButton
                  className="button button--danger"
                  confirm={{
                    title: 'Delete this demo account?',
                    description: 'The demo account and its saved drafts would be removed.',
                    details: ['3 drafts would be deleted', 'This cannot be undone'],
                    confirmLabel: 'Delete the account',
                    cancelLabel: 'Keep the account',
                    destructive: true,
                  }}
                  onConfirm={() => setStatus('The demo account was deleted. Nothing real was removed.')}
                >
                  Delete account
                </ConfirmButton>
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <p>Northwind Digital — a demo page for the accessibility widget.</p>
          <p className="small">
            This page is a test fixture. The widget cannot make it conform to WCAG, and it does
            not claim to.
          </p>
        </div>
      </footer>
    </>
  );
}
