import { createSignal, Show } from "solid-js";

const IcoInfo = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>;
const IcoAlignLeft = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>;
const IcoKeyboard = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 12H4V7h16v10zM6 9h2v2H6V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9zm-8 4h2v2H6v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/></svg>;
const IcoListOl = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>;
const IcoChartArea = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.88 18.47c.44-.7.7-1.51.7-2.39 0-2.49-2.01-4.5-4.5-4.5s-4.5 2.01-4.5 4.5 2.01 4.5 4.5 4.5c.88 0 1.69-.26 2.39-.7L21 22.39 22.39 21l-2.51-2.53zm-3.8.11c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm-.36-8.5L11 5.5 7.5 9.09 3 4.5 1.59 5.91 7.5 11.8l4.5-4.5 4.02 4.02c.45-.35.95-.63 1.5-.82l-1.8-1.82z"/></svg>;
const IcoBug = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/></svg>;
const IcoLifeRing = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.36 14.83l-2.15-2.15c.5-.81.79-1.74.79-2.68 0-.94-.29-1.87-.79-2.68l2.15-2.15c.96 1.23 1.54 2.75 1.54 4.43 0 1.68-.58 3.2-1.54 4.43zM14.83 5.64l-2.15 2.15c-.81-.5-1.74-.79-2.68-.79-.94 0-1.87.29-2.68.79L5.17 5.64C6.4 4.68 7.92 4.1 9.6 4.1c1.68 0 3.2.58 4.43 1.54zM5.64 9.17l2.15 2.15c-.5.81-.79 1.74-.79 2.68 0 .94.29 1.87.79 2.68l-2.15 2.15C4.68 17.6 4.1 16.08 4.1 14.4c0-1.68.58-3.2 1.54-4.43zM9.17 18.36l2.15-2.15c.81.5 1.74.79 2.68.79.94 0 1.87-.29 2.68-.79l2.15 2.15c-1.23.96-2.75 1.54-4.43 1.54-1.68 0-3.2-.58-4.43-1.54zM12 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>;
const IcoEnvelope = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>;
const IcoUsers = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>;
const IcoCodeBranch = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.06-7.44 7-7.93v15.86zm2 0V4.07c3.94.49 7 3.85 7 7.93s-3.06 7.44-7 7.93z"/></svg>;
const IcoDonate = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>;
const IcoTwitter = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.46 6c-.85.38-1.78.64-2.73.76 1-.6 1.76-1.54 2.12-2.67-.93.55-1.96.95-3.06 1.17a4.77 4.77 0 00-8.13 4.35C7.3 9.1 4.7 7.8 2.82 5.8a4.77 4.77 0 001.48 6.38c-.77-.02-1.5-.24-2.13-.6v.06a4.77 4.77 0 003.83 4.68c-.7.2-1.43.22-2.14.08a4.78 4.78 0 004.46 3.32A9.58 9.58 0 012 21.54 13.5 13.5 0 009.3 24c8.2 0 12.7-6.8 12.7-12.7 0-.2-.02-.4-.02-.58.86-.62 1.6-1.4 2.18-2.3z"/></svg>;
const IcoDiscord = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 5.5A18.2 18.2 0 0015.5 4c-.2.4-.5.9-.7 1.4a16.9 16.9 0 00-5.6 0C8.9 4.9 8.7 4.4 8.5 4A18 18 0 003.7 5.5 18.8 18.8 0 000 18.4c1 .7 2 1.3 3 1.7.7-.9 1.3-1.9 1.8-2.9a11.6 11.6 0 01-1.9-1l.5-.3c3.8 1.7 7.9 1.7 11.7 0l.5.3c-.6.4-1.2.7-1.9 1 .5 1 1.2 2 1.8 2.9 1-.4 2-.9 3-1.7a18.5 18.5 0 00-3.2-12.9zM8.7 15.8c-1.1 0-2-1-2-2.2 0-1.2.9-2.2 2-2.2s2 1 2 2.2c0 1.2-.9 2.2-2 2.2zm6.6 0c-1.1 0-2-1-2-2.2 0-1.2.9-2.2 2-2.2s2 1 2 2.2c0 1.2-.9 2.2-2 2.2z"/></svg>;
const IcoGithub = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/></svg>;
const IcoHandHoldingUsd = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 9.5c.73 0 1.41.2 2 .55V11c-.55-.45-1.25-.75-2-.75s-1.45.3-2 .75v-1.05c.59-.35 1.27-.55 2-.55zM11 15.25v1.05c.59.35 1.27.55 2 .55.73 0 1.45-.2 2-.55V15c-.55.45-1.27.75-2 .75s-1.45-.3-2-.75z"/><path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10zm-9-3.75c.73 0 1.41.2 2 .55V7.5c-.59-.35-1.27-.55-2-.55s-1.41.2-2 .55v.8c.59-.35 1.27-.55 2-.55zM8.5 12c0 .83.67 1.5 1.5 1.5h4c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5h-4c-.83 0-1.5.67-1.5 1.5zM13 15.25c.73 0 1.41-.2 2-.55v.8c-.59.35-1.27.55-2 .55s-1.41-.2-2-.55v-1.05c.59.35 1.27.55 2 .55z"/></svg>;
const IcoHeart = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
const IcoAd = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9 8h2v8H9zm4 0h2v8h-2z"/></svg>;
const IcoTshirt = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.58 6.09l-4.02-2.68c-.18-.12-.38-.18-.58-.18H17c-.55 0-1 .45-1 1v.17c0 .33-.14.65-.37.88l-.75.75c-.25.25-.58.37-.93.29-.51-.13-1.04-.21-1.6-.21s-1.09.08-1.6.21c-.35.09-.69-.04-.93-.29l-.75-.75c-.23-.23-.37-.55-.37-.88V4.23c0-.55-.45-1-1-1h-.02c-.2 0-.4.06-.58.18L2.42 6.09c-.49.33-.59 1.02-.26 1.51l.76 1.14c.32.49.99.64 1.48.34l1.2-.8V18c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V8.28l1.2.8c.49.33 1.15.17 1.48-.34l.76-1.14c.33-.49.23-1.18-.26-1.51z"/></svg>;
const IcoPatreon = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.82 2.82C11.93 2.82 9.59 5.16 9.59 8.05c0 2.89 2.34 5.23 5.23 5.23 1.5 0 2.86-.63 3.82-1.64.96-1.01 1.55-2.38 1.55-3.86 0-2.89-2.34-5.23-5.23-5.23zM4.41 2.82H2.27V22h2.14V2.82z"/></svg>;

const IcoQuestion = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>;
const IcoComment = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/></svg>;
const IcoUserCircle = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>;
const IcoBriefcase = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>;
const IcoEllipsis = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>;

export default function AboutPage() {
  const [showSupport, setShowSupport] = createSignal(false);
  const [showContact, setShowContact] = createSignal(false);

  return (
    <div class="about-page">
      <section class="about-section text-center">
        <div class="text-sub">
          Created with love by Miodec.
          <br />
          <a href="#supporters_title">Supported</a> and{" "}
          <a href="#contributors_title">expanded</a> by many awesome people.
          <br />
          Launched on 13th of June, 2026.
        </div>
      </section>

      <section class="about-section">
        <h2 class="about-h2">{IcoInfo} about</h2>
        <p>
          Monkeytype is a minimalistic and customizable typing test. It features
          many test modes, an account system to save your typing speed history, and
          user-configurable features such as themes, sounds, a smooth caret, and
          more. Monkeytype attempts to emulate the experience of natural keyboard
          typing during a typing test, by unobtrusively presenting the text prompts
          and displaying typed characters in-place, providing straightforward,
          real-time feedback on typos, speed, and accuracy.
          <br /><br />
          Test yourself in various modes, track your progress and improve your
          speed.
        </p>
      </section>

      <section class="about-section">
        <h3 class="about-h3">{IcoAlignLeft} word set</h3>
        <p>
          By default, this website uses the most common 200 words in the English
          language to generate its tests. You can change to an expanded set (1000
          most common words) in the options, or change the language entirely.
        </p>
      </section>

      <section class="about-section">
        <h3 class="about-h3">{IcoKeyboard} keybinds</h3>
        <p>
          You can use <kbd>tab</kbd> &gt; <kbd>enter</kbd> to restart the typing test. Open the
          command line by pressing <kbd>escape</kbd> or <kbd>ctrl</kbd> + <kbd>shift</kbd> + <kbd>p</kbd>
          - there you can access all the functionality you need without touching your mouse.
        </p>
      </section>

      <section class="about-section">
        <h3 class="about-h3">{IcoListOl} stats</h3>
        <dl class="about-dl-grid">
          <dt>wpm</dt>
          <dd>- total number of characters in the correctly typed words (including spaces), divided by 5 and normalised to 60 seconds.</dd>
          <dt>raw wpm</dt>
          <dd>- calculated just like wpm, but also includes incorrect words.</dd>
          <dt>acc</dt>
          <dd>- percentage of correctly pressed keys.</dd>
          <dt>char</dt>
          <dd>- correct characters / incorrect characters. Calculated after the test has ended.</dd>
          <dt>consistency</dt>
          <dd>- based on the variance of your raw wpm. Closer to 100% is better. Calculated using the coefficient of variation of raw wpm and mapped onto a scale from 0 to 100.</dd>
        </dl>
      </section>

      <section class="about-section">
        <h3 class="about-h3">{IcoChartArea} results screen</h3>
        <p>
          After completing a test you will be able to see your wpm, raw wpm,
          accuracy, character stats, test length, leaderboards info and test info
          (you can hover over some values to get floating point numbers). You can
          also see a graph of your wpm and raw over the duration of the test.
          Remember that the wpm line is a global average, while the raw wpm line is
          a local, momentary value (meaning if you stop, the value is 0).
        </p>
      </section>

      <section class="about-section">
        <h3 class="about-h3">{IcoBug} bug report or feature request</h3>
        <p>
          If you encounter a bug, or have a feature request - join the Discord
          server, send me an email, a direct message on Twitter or create an
          issue on GitHub.
        </p>
      </section>

      <div />

      <section class="about-section">
        <h2 class="about-h2">{IcoLifeRing} support</h2>
        <p>
          Thank you so much for thinking about supporting this project. It would
          not be possible without you and your continued support. {IcoHeart}
        </p>
        <div class="about-btn-wrap">
          <button class="about-btn about-btn-full" onClick={() => setShowSupport(true)}>
            {IcoDonate}
            support
          </button>
        </div>
      </section>

      <Show when={showSupport()}>
        <div class="about-modal-overlay" onClick={() => setShowSupport(false)}>
          <div class="about-modal" onClick={(e) => e.stopPropagation()}>
            <div class="about-modal-header">
              <h2>Support Monkeytype</h2>
              <button class="about-modal-close" onClick={() => setShowSupport(false)}>×</button>
            </div>
            <div class="about-modal-body">
              Thank you so much for thinking about supporting this project. It would
              not be possible without you and your continued support. {IcoHeart}
            </div>
            <div class="about-modal-grid support-grid">
              <button class="about-modal-btn" onClick={() => setShowSupport(false)}>
                <span class="about-modal-btn-icon">{IcoAd}</span>
                <span class="about-modal-btn-label">Enable Ads</span>
              </button>
              <a class="about-modal-btn" href="https://ko-fi.com/monkeytype" target="_blank" rel="noreferrer noopener">
                <span class="about-modal-btn-icon">{IcoDonate}</span>
                <span class="about-modal-btn-label">Donate</span>
              </a>
              <a class="about-modal-btn" href="https://www.patreon.com/monkeytype" target="_blank" rel="noreferrer noopener">
                <span class="about-modal-btn-icon">{IcoPatreon}</span>
                <span class="about-modal-btn-label">Join Patreon</span>
              </a>
              <a class="about-modal-btn" href="https://monkeytype.store" target="_blank" rel="noreferrer noopener">
                <span class="about-modal-btn-icon">{IcoTshirt}</span>
                <span class="about-modal-btn-label">Buy Merch</span>
              </a>
            </div>
          </div>
        </div>
      </Show>

      <div />

      <section class="about-section">
        <h2 class="about-h2">{IcoEnvelope} contact</h2>
        <p>
          If you have a bug to report, a feature to request, or just want to say
          hi - here are the different ways you can contact me directly.
        </p>
        <div class="about-contact-grid">
          <button class="about-btn" onClick={() => setShowContact(true)}>
            {IcoEnvelope}
            mail
          </button>
          <a class="about-btn" href="https://x.com/monkeytype" target="_blank" rel="noreferrer noopener">
            {IcoTwitter}
            twitter
          </a>
          <a class="about-btn" href="https://discord.gg/monkeytype" target="_blank" rel="noreferrer noopener">
            {IcoDiscord}
            discord
          </a>
          <a class="about-btn" href="https://github.com/monkeytypegame/monkeytype" target="_blank" rel="noreferrer noopener">
            {IcoGithub}
            github
          </a>
        </div>
      </section>

      <Show when={showContact()}>
        <div class="about-modal-overlay" onClick={() => setShowContact(false)}>
          <div class="about-modal" onClick={(e) => e.stopPropagation()}>
            <div class="about-modal-header">
              <h2>Contact</h2>
              <button class="about-modal-close" onClick={() => setShowContact(false)}>×</button>
            </div>
            <div class="about-modal-body">
              Feel free to send an email to contact@monkeytype.com. For business
              inquiries, email jack@monkeytype.com (the buttons below will open the
              default mail client).
              <br /><br />
              Please <span class="about-text-error">do not send</span> requests to delete
              account, update email, update name or clear personal bests - you can do
              that in the settings page.
            </div>
            <div class="about-modal-grid contact-grid">
              <a class="about-modal-btn" href="mailto:contact@monkeytype.com?subject=[Question] ">
                <span class="about-modal-btn-icon">{IcoQuestion}</span>
                <span class="about-modal-btn-label">Question</span>
              </a>
              <a class="about-modal-btn" href="mailto:contact@monkeytype.com?subject=[Feedback] ">
                <span class="about-modal-btn-icon">{IcoComment}</span>
                <span class="about-modal-btn-label">Feedback</span>
              </a>
              <a class="about-modal-btn" href="mailto:support@monkeytype.com?subject=[Bug] ">
                <span class="about-modal-btn-icon">{IcoBug}</span>
                <span class="about-modal-btn-label">Bug Report</span>
              </a>
              <a class="about-modal-btn" href="mailto:support@monkeytype.com?subject=[Account] ">
                <span class="about-modal-btn-icon">{IcoUserCircle}</span>
                <span class="about-modal-btn-label">Account Help</span>
              </a>
              <a class="about-modal-btn" href="mailto:jack@monkeytype.com?subject=[Business] ">
                <span class="about-modal-btn-icon">{IcoBriefcase}</span>
                <span class="about-modal-btn-label">Business Inquiry</span>
              </a>
              <a class="about-modal-btn" href="mailto:contact@monkeytype.com?subject=[Other] ">
                <span class="about-modal-btn-icon">{IcoEllipsis}</span>
                <span class="about-modal-btn-label">Other</span>
              </a>
            </div>
          </div>
        </div>
      </Show>

      <div />

      <section class="about-section">
        <h2 class="about-h2">{IcoUsers} credits</h2>
        <p>
          <a href="https://www.reddit.com/user/montydrei" target="_blank" rel="noreferrer noopener">Montydrei</a>
          {" "}for the name suggestion
        </p>
        <p>
          <a href="https://www.reddit.com/r/MechanicalKeyboards/comments/gc6wx3/experimenting_with_a_completely_new_type_of/" target="_blank" rel="noreferrer noopener">Everyone</a>
          {" "}who provided valuable feedback on the original reddit post for the
          prototype of this website
        </p>
        <p>
          <a href="#supporters_title">Supporters</a>
          {" "}who helped financially by donating, enabling optional ads or buying merch
        </p>
        <p>
          <a href="https://github.com/monkeytypegame/monkeytype/graphs/contributors" target="_blank" rel="noreferrer noopener">Contributors</a>
          {" "}on GitHub that have helped with implementing various features,
          adding themes and more
        </p>
      </section>

      <section class="about-section">
        <h2 id="supporters_title" class="about-h2">{IcoHandHoldingUsd} top supporters</h2>
        <div class="about-names-grid">
          <div>monkeytypefan</div>
          <div>keyboardlover</div>
          <div>typemaster42</div>
          <div>fastfingers</div>
          <div>speeddemon</div>
          <div>wpmchamp</div>
          <div>clackclack</div>
          <div>keebenthusiast</div>
          <div>tenfastfingers</div>
          <div>qwertymaster</div>
        </div>
      </section>

      <div />

      <section class="about-section">
        <h2 id="contributors_title" class="about-h2">{IcoCodeBranch} contributors</h2>
        <div class="about-names-grid">
          <div>miodec</div>
          <div>fehmer</div>
          <div>monkeytypegame</div>
          <div>Bruception</div>
          <div>Nixo</div>
          <div>LeoVerto</div>
          <div>ngc</div>
          <div>LiquidZulu</div>
          <div>Electru</div>
          <div>jack</div>
          <div>dependabot</div>
          <div>montydrei</div>
        </div>
      </section>
    </div>
  );
}
