export default function SecurityPage() {
  return (
    <div class="page-full">
      <div class="page-full-back" onClick={() => window.history.back()}>
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        back
      </div>
      <div class="page-full-content" style="max-width:48rem;margin:0 auto;padding:2rem 1rem">
        <p>
          We take the security and integrity of Phoenixtype very seriously. If you
          have found a vulnerability, please report it ASAP so we can quickly
          remediate the issue.
        </p>

        <p style="margin-top:2rem;color:var(--sub);font-weight:600">Table of Contents</p>
        <ul style="padding-left:1.5rem;color:var(--main)">
          <li><a href="#vulnerability" style="color:var(--main)">How to Disclose a Vulnerability</a></li>
          <li><a href="#guidelines" style="color:var(--main)">Submission Guidelines</a></li>
        </ul>

        <h1 id="vulnerability" style="font-size:2rem;color:var(--main);margin:3rem 0 1rem">How to Disclose a Vulnerability</h1>
        <p>
          For vulnerabilities that impact the confidentiality, integrity, and
          availability of Phoenixtype services, please send your disclosure via
          <a href="mailto:contact@phoenixtype.com" style="color:var(--main)"> email</a>.
          &nbsp;For non-security related platform bugs, follow the bug submission
          <a href="https://github.com/monkeytypegame/monkeytype#bug-report-or-feature-request" target="_blank" rel="noreferrer noopener" style="color:var(--main)"> guidelines</a>.
          &nbsp;Include as much detail as possible to ensure reproducibility. At a
          minimum, vulnerability disclosures should include:
        </p>
        <ul style="padding-left:1.5rem">
          <li>Vulnerability Description</li>
          <li>Proof of Concept</li>
          <li>Impact</li>
          <li>Screenshots or Proof</li>
        </ul>

        <h1 id="guidelines" style="font-size:2rem;color:var(--main);margin:3rem 0 1rem">Submission Guidelines</h1>
        <p>
          Do not engage in activities that might cause a denial of service
          condition, create significant strains on critical resources, or
          negatively impact users of the site outside of test accounts.
        </p>
      </div>
    </div>
  );
}
