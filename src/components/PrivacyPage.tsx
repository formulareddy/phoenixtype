export default function PrivacyPage() {
  return (
    <div class="page-full">
      <div class="page-full-back" onClick={() => window.history.back()}>
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        back
      </div>
      <div class="page-full-content" style="max-width:48rem;margin:0 auto;padding:2rem 1rem">
        <p style="color:var(--sub);margin-bottom:2rem">Effective date: September 8, 2021<br />Last updated: May 12, 2025</p>

        <p>
          Thanks for trusting Phoenixtype ('Phoenixtype', 'we', 'us', 'our') with
          your personal information! We take our responsibility to you very
          seriously, and so this Privacy Statement describes how we handle your
          data.
        </p>
        <p>
          This Privacy Statement applies to all websites we own and operate and to
          all services we provide (collectively, the 'Services'). So... PLEASE READ
          THIS PRIVACY STATEMENT CAREFULLY. By using the Services, you are expressly
          and voluntarily accepting the terms and conditions of this Privacy
          Statement and our Terms of Service, which include allowing us to process
          information about you.
        </p>
        <p>
          Under this Privacy Statement, we are the data controller responsible for
          processing your personal information. Our contact information appears at
          the end of this Privacy Statement.
        </p>

        <p style="margin-top:2rem;color:var(--sub);font-weight:600">Table of Contents</p>
        <ul style="padding-left:1.5rem;color:var(--main)">
          <li><a href="#collect" style="color:var(--main)">What data do we collect?</a></li>
          <li><a href="#collect-how" style="color:var(--main)">How do we collect your data?</a></li>
          <li><a href="#use" style="color:var(--main)">How will we use your data?</a></li>
          <li><a href="#store" style="color:var(--main)">How do we store your data?</a></li>
          <li><a href="#rights" style="color:var(--main)">What are your data protection rights?</a></li>
          <li><a href="#analytics" style="color:var(--main)">Analytics</a></li>
          <li><a href="#sentry" style="color:var(--main)">Sentry</a></li>
          <li><a href="#ads" style="color:var(--main)">Advertisements</a></li>
          <li><a href="#common-id" style="color:var(--main)">Common ID Cookie</a></li>
          <li><a href="#ad-privacy" style="color:var(--main)">Advertising Privacy Settings</a></li>
          <li><a href="#cookies" style="color:var(--main)">What are cookies?</a></li>
          <li><a href="#cookies-use" style="color:var(--main)">How do we use cookies?</a></li>
          <li><a href="#cookies-types" style="color:var(--main)">What types of cookies do we use?</a></li>
          <li><a href="#cookies-manage" style="color:var(--main)">How to manage your cookies</a></li>
          <li><a href="#other" style="color:var(--main)">Privacy policies of other websites</a></li>
          <li><a href="#changes" style="color:var(--main)">Changes to our privacy policy</a></li>
          <li><a href="#contact" style="color:var(--main)">How to contact us</a></li>
        </ul>

        <h1 id="collect" style="font-size:2rem;color:var(--main);margin:3rem 0 1rem">What data do we collect?</h1>
        <p>Phoenixtype collects the following data:</p>
        <ul style="padding-left:1.5rem">
          <li>Email</li>
          <li>Username</li>
          <li>Discord id and discord avatar id (if you provide it)</li>
          <li>Information about each typing test</li>
          <li>Your currently active settings</li>
          <li>How many typing tests you've started and completed</li>
          <li>How long you've been typing on the website</li>
        </ul>
        <p>Phoenixtype does NOT collect:</p>
        <ul style="padding-left:1.5rem">
          <li>custom texts (they are stored in your browser's local storage)</li>
        </ul>
        <p>
          If you believe a certain data type is missing from the lists above, feel
          free to contact us and we will answer any questions and update the
          privacy policy.
        </p>

        <h1 id="collect-how" style="font-size:2rem;color:var(--main);margin:3rem 0 1rem">How do we collect your data?</h1>
        <p>You directly provide most of the data we collect. We collect data and process data when you:</p>
        <ul style="padding-left:1.5rem">
          <li>Create an account</li>
          <li>Complete a typing test</li>
          <li>Change settings on the website</li>
        </ul>

        <h1 id="use" style="font-size:2rem;color:var(--main);margin:3rem 0 1rem">How will we use your data?</h1>
        <p>Phoenixtype collects your data so that we can:</p>
        <ul style="padding-left:1.5rem">
          <li>Allow you to view result history of previous tests you completed</li>
          <li>Save results from tests you take and show you statistics based on them</li>
          <li>Remember your settings</li>
          <li>Display leaderboards</li>
        </ul>
        <p>
          If you are found to be cheating or exploiting the website, we may store
          hashed versions of your username, email and/or discord id to prevent you
          from creating new accounts.
        </p>

        <h1 id="store" style="font-size:2rem;color:var(--main);margin:3rem 0 1rem">How do we store your data?</h1>
        <p>Phoenixtype securely stores your data using MongoDB.</p>

        <h1 id="rights" style="font-size:2rem;color:var(--main);margin:3rem 0 1rem">What are your data protection rights?</h1>
        <p>
          Phoenixtype would like to make sure you are fully aware of all of your
          data protection rights. Every user is entitled to the following:
        </p>
        <ul style="padding-left:1.5rem">
          <li>
            <strong>The right to access</strong> – You have the right to request
            Phoenixtype for copies of your personal data. We may limit the number of
            times this request can be made depending on the size of the request.
          </li>
          <li>
            <strong>The right to rectification</strong> – You have the right to
            request that Phoenixtype correct any information you believe is
            inaccurate. You also have the right to request Phoenixtype to complete
            the information you believe is incomplete.
          </li>
          <li>
            <strong>The right to erasure</strong> – You have the right to request
            that Phoenixtype erase your personal data, under certain conditions.
            (Hashed data mentioned in the "How will we use your data?" section will
            not be deleted, as it is essential in preventing the exploitation of the
            website)
          </li>
          <li>
            <strong>The right to restrict processing</strong> – You have the right
            to request that Phoenixtype restrict the processing of your personal
            data, under certain conditions.
          </li>
          <li>
            <strong>The right to object to processing</strong> – You have the right
            to object to Phoenixtype processing of your personal data, under certain
            conditions.
          </li>
          <li>
            <strong>The right to data portability</strong> – You have the right to
            request that Phoenixtype transfer the data that we have collected to
            another organization, or directly to you, under certain conditions.
          </li>
        </ul>

        <h1 id="analytics" style="font-size:2rem;color:var(--main);margin:3rem 0 1rem">Analytics</h1>
        <p>
          Like most websites, we use Google Analytics, which collects information
          that your browser sends whenever you visit the website. This data may
          include internet protocol (IP) addresses, browser type, Internet Service
          Provider (ISP), date and time stamp, referring/exit pages, and time spent
          on each page. THIS DATA DOES NOT CONTAIN ANY PERSONALLY IDENTIFIABLE
          INFORMATION. We use this information for analyzing trends, administering
          the site, tracking users' movement on the website, and gathering
          demographic information.
        </p>
        <p>
          For more information on Google Analytics' privacy policy, please visit:
          <a href="https://support.google.com/analytics/answer/6004245?hl=en" target="_blank" rel="noreferrer noopener" style="color:var(--main)">
            https://support.google.com/analytics/answer/6004245?hl=en
          </a>
        </p>

        <h1 id="sentry" style="font-size:2rem;color:var(--main);margin:3rem 0 1rem">Sentry</h1>
        <p>
          Sentry is a crash reporting service that helps us track errors and
          crashes on the website. It collects information about your device,
          browser, and the error that occurred. Sometimes it might also include an
          anonymized replay of your session. This information is used to track down
          bugs faster and improve our website.
        </p>
        <p>
          For more information on Sentry's privacy policy, please visit:
          <a href="https://sentry.io/privacy/" target="_blank" rel="noreferrer noopener" style="color:var(--main)">
            https://sentry.io/privacy/
          </a>
        </p>

        <h1 id="ads" style="font-size:2rem;color:var(--main);margin:3rem 0 1rem">Advertisements</h1>
        <p>
          Advertisements on Phoenixtype are optional. This section only applies to
          you if you have not disabled them.
        </p>
        <p>
          All the ads served by us come through a third-party advertising company,
          Playwire. When you first load our website, before any ads are displayed,
          you are presented with a consent form (from a "Content Management
          Platform", or CMP).
        </p>
        <p>
          Depending on the consent you provide in this form, various pieces of
          information may be used in order to provide advertisements on this
          website, other sites, and other forms of media about goods and services
          that may be of interest to you. This information is collected from you
          through the use of cookies, and you can withdraw your consent at any time
          by deleting the cookies from your Internet browser. Once deleted, the
          consent form from the CMP will be displayed to you again when you visit
          next time.
        </p>

        <h1 id="common-id" style="font-size:2rem;color:var(--main);margin:3rem 0 1rem">Common ID Cookie</h1>
        <p>
          This site uses cookies and similar tracking technologies such as the
          Common ID cookie to provide its services. Cookies are important devices
          for measuring advertising effectiveness and ensuring a robust online
          advertising industry. The Common ID cookie stores a unique user id in the
          first party domain and is accessible to our ad partners. This simple ID
          can be utilized to improve user matching, especially for delivering ads to
          iOS and MacOS browsers. Users can opt out of the Common ID tracking cookie
          by clicking here.
        </p>

        <h1 id="ad-privacy" style="font-size:2rem;color:var(--main);margin:3rem 0 1rem">Advertising Privacy Settings</h1>
        <p>
          FOR EU USERS ONLY: When you use our site, pre-selected companies may
          access and use certain information on your device and about your interests
          to serve ads or personalized content. To change your consent-choices, go
          to Phoenixtype &gt; Settings &gt; Danger Zone section &gt; Update cookie
          preferences. From there you can open the CMP by clicking "Click to change
          your preferences on ad related cookies".
        </p>

        <h1 id="cookies" style="font-size:2rem;color:var(--main);margin:3rem 0 1rem">What are cookies?</h1>
        <p>
          Cookies are text files placed on your computer to collect standard
          Internet log information and visitor behavior information. When you visit
          our websites, we may collect information from you automatically through
          cookies or similar technology.
        </p>
        <p>
          For further information, see
          <a href="https://en.wikipedia.org/wiki/HTTP_cookie" target="_blank" rel="noreferrer noopener" style="color:var(--main)">
            HTTP cookie on Wikipedia
          </a>.
        </p>

        <h1 id="cookies-use" style="font-size:2rem;color:var(--main);margin:3rem 0 1rem">How do we use cookies?</h1>
        <p>Phoenixtype uses cookies in a range of ways to improve your experience on our website, including:</p>
        <ul style="padding-left:1.5rem">
          <li>Keeping you signed in</li>
          <li>Remembering your active settings</li>
          <li>Remembering your active tags</li>
          <li>Traffic analysis</li>
          <li>Advertisement purposes</li>
        </ul>

        <h1 id="cookies-types" style="font-size:2rem;color:var(--main);margin:3rem 0 1rem">What types of cookies do we use?</h1>
        <p>
          There are a number of different types of cookies; however, our website
          uses functionality cookies. Phoenixtype uses these cookies so we recognize
          you on our website and remember your previously selected settings.
        </p>

        <h1 id="cookies-manage" style="font-size:2rem;color:var(--main);margin:3rem 0 1rem">How to manage your cookies</h1>
        <p>
          You can set your browser not to accept cookies, and the above website
          tells you how to remove cookies from your browser. However, in a few
          cases, some of our website features may behave unexpectedly or fail to
          function as a result.
        </p>

        <h1 id="other" style="font-size:2rem;color:var(--main);margin:3rem 0 1rem">Privacy policies of other websites</h1>
        <p>
          Phoenixtype contains links to other external websites. Our privacy policy
          only applies to our website, so if you click on a link to another website,
          you should read their privacy policy.
        </p>

        <h1 id="changes" style="font-size:2rem;color:var(--main);margin:3rem 0 1rem">Changes to our privacy policy</h1>
        <p>
          Phoenixtype keeps its privacy policy under regular review and places any
          updates on this web page. The Phoenixtype privacy policy may be subject to
          change at any given time without notice.
        </p>

        <h1 id="contact" style="font-size:2rem;color:var(--main);margin:3rem 0 1rem">How to contact us</h1>
        <p>
          If you have any questions about Phoenixtype's privacy policy, the data we
          hold on you, or you would like to exercise one of your data protection
          rights, please do not hesitate to contact us.
        </p>
        <p>General inquiries: <a href="mailto:contact@phoenixtype.com" style="color:var(--main)">contact@phoenixtype.com</a></p>
        <p>Advertising related inquiries: <a href="https://www.playwire.com/contact-direct-sales" target="_blank" rel="noreferrer noopener" style="color:var(--main)">https://www.playwire.com/contact-direct-sales</a></p>
        <p>Discord: @miodec</p>
      </div>
    </div>
  );
}
