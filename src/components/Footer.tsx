import { createSignal, Show } from "solid-js";

const IcoQuestion = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>;
const IcoComment = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/></svg>;
const IcoBug = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/></svg>;
const IcoUserCircle = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>;
const IcoBriefcase = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>;
const IcoEllipsis = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>;
const IcoHeart = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
const IcoAd = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9 8h2v8H9zm4 0h2v8h-2z"/></svg>;
const IcoDonate = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>;
const IcoPatreon = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.82 2.82C11.93 2.82 9.59 5.16 9.59 8.05c0 2.89 2.34 5.23 5.23 5.23 1.5 0 2.86-.63 3.82-1.64.96-1.01 1.55-2.38 1.55-3.86 0-2.89-2.34-5.23-5.23-5.23zM4.41 2.82H2.27V22h2.14V2.82z"/></svg>;
const IcoTshirt = <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.58 6.09l-4.02-2.68c-.18-.12-.38-.18-.58-.18H17c-.55 0-1 .45-1 1v.17c0 .33-.14.65-.37.88l-.75.75c-.25.25-.58.37-.93.29-.51-.13-1.04-.21-1.6-.21s-1.09.08-1.6.21c-.35.09-.69-.04-.93-.29l-.75-.75c-.23-.23-.37-.55-.37-.88V4.23c0-.55-.45-1-1-1h-.02c-.2 0-.4.06-.58.18L2.42 6.09c-.49.33-.59 1.02-.26 1.51l.76 1.14c.32.49.99.64 1.48.34l1.2-.8V18c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V8.28l1.2.8c.49.33 1.15.17 1.48-.34l.76-1.14c.33-.49.23-1.18-.26-1.51z"/></svg>;

export default function Footer(props: { onNavigate?: (page: string) => void }) {
  const [showContact, setShowContact] = createSignal(false);
  const [showSupport, setShowSupport] = createSignal(false);

  return (
    <>
      <div class="footer-shortcuts">
        <span class="shortcut">
          <kbd>tab</kbd><span class="shortcut-plus">+</span><kbd>enter</kbd>
          <span class="shortcut-action">restart test</span>
        </span>
        <span class="shortcut">
          <kbd>esc</kbd>
          <span class="shortcut-or">or</span>
          <kbd>ctrl</kbd><span class="shortcut-plus">+</span><kbd>shift</kbd><span class="shortcut-plus">+</span><kbd>p</kbd>
          <span class="shortcut-action">command line</span>
        </span>
      </div>
      <footer>
        <span class="footer-link" onClick={() => setShowContact(true)} title="contact" style="cursor:pointer">
          <span class="footer-link-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg></span>
          <span class="footer-link-label">contact</span>
        </span>
        <a class="footer-link" href="https://discord.gg/monkeytype" target="_blank" rel="noopener" title="discord">
          <span class="footer-link-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg></span>
          <span class="footer-link-label">discord</span>
        </a>
        <a class="footer-link" href="https://github.com" target="_blank" rel="noopener" title="GitHub">
          <span class="footer-link-icon"><svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg></span>
          <span class="footer-link-label">github</span>
        </a>
        <a class="footer-link" href="https://twitter.com" target="_blank" rel="noopener" title="Twitter/X">
          <span class="footer-link-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></span>
          <span class="footer-link-label">twitter</span>
        </a>
        <span class="footer-text">|</span>
        <span class="footer-link" onClick={() => setShowSupport(true)} title="support" style="cursor:pointer">
          <span class="footer-link-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg></span>
          <span class="footer-link-label">support</span>
        </span>
        <span class="footer-link" onClick={() => props.onNavigate?.("terms")} title="terms" style="cursor:pointer">
          <span class="footer-link-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM6 20V4h5v7h7v9H6z"/></svg></span>
          <span class="footer-link-label">terms</span>
        </span>
        <span class="footer-link" onClick={() => props.onNavigate?.("security")} title="security" style="cursor:pointer">
          <span class="footer-link-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg></span>
          <span class="footer-link-label">security</span>
        </span>
        <span class="footer-link" onClick={() => props.onNavigate?.("privacy")} title="privacy" style="cursor:pointer">
          <span class="footer-link-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg></span>
          <span class="footer-link-label">privacy</span>
        </span>
      </footer>

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






    </>
  );
}
