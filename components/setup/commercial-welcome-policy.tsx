import React from "react";

export function CommercialWelcomePolicyArticle() {
  return (
    <article
      className="commercial-policy-article text-black antialiased"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      <header className="mb-9 border-b border-neutral-200 pb-5 text-left sm:mb-11">
        <h1 className="text-[1.35rem] font-semibold leading-tight tracking-tight text-neutral-950 sm:text-xl">
          Platform Usage Policy
        </h1>
        <p className="mt-2 max-w-[30rem] text-[0.84rem] leading-relaxed text-neutral-700 sm:text-[0.8rem]">
          CockpitOS is owned, designed, and developed by <strong>Ripun Basumatary</strong> as part
          of the work published at <strong>theripun.com</strong>.
        </p>
      </header>

      <section className="policy-section">
        <p>
          Welcome to <strong>CockpitOS</strong> (Cockpit Operating Surface), a browser-accessible
          platform for managing servers, remote systems, and connected infrastructure from one focused
          operating environment.
        </p>
        <p>
          CockpitOS enables users to securely access, control, and operate Virtual Private Servers (VPS) and
          remote systems through an integrated visual interface, eliminating traditional command-line barriers
          while preserving full system capability.
        </p>
        <p className="font-medium text-neutral-950">
          By proceeding with the setup of your environment, you are initiating access to a system that
          operates at administrative and infrastructure level.
        </p>
      </section>

      <section className="policy-section">
        <p>This Commercial Access &amp; Platform Usage Policy governs your access to and use of:</p>
        <ul>
          <li>CockpitOS interface</li>
          <li>CogNode orchestration services</li>
          <li>Cocktail agent installed on user infrastructure</li>
          <li>Associated APIs, services, and integrations</li>
        </ul>
        <p>
          This policy applies to all users of the platform and forms an understanding between you and{" "}
          <strong>Ripun Basumatary</strong>, the owner and developer of CockpitOS.
        </p>
      </section>

      <hr className="my-4 border-neutral-200" />
      <section className="policy-section">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By selecting <strong>&ldquo;Accept &amp; Continue&rdquo;</strong>, installing any CockpitOS
          component, or accessing the platform, you acknowledge that you have read, understood, and agreed
          to:
        </p>
        <ul>
          <li>Platform Terms of Use</li>
          <li>Security &amp; Acceptable Use Standards</li>
          <li>Data Handling &amp; Privacy Principles</li>
          <li>Licensing and Commercial Usage Conditions</li>
        </ul>
        <p className="font-semibold text-neutral-950">
          If you do not agree with any part of this policy, you must discontinue setup immediately.
        </p>
      </section>

      <section className="policy-section">
        <h2>2. Platform Nature &amp; System Access</h2>
        <p>CockpitOS operates as a meta-operating layer over your infrastructure.</p>
        <p>By using CockpitOS, you acknowledge:</p>
        <ul>
          <li>The platform provides direct system-level interaction with your servers</li>
          <li>Actions executed through CockpitOS are equivalent to native system commands</li>
          <li>
            The platform does not sandbox or restrict administrative privileges unless explicitly configured
          </li>
        </ul>
        <p>
          Users retain full control over their infrastructure and assume responsibility for all executed
          operations.
        </p>
      </section>

      <section className="policy-section">
        <h2>3. User Responsibility &amp; Operational Risk</h2>
        <p>You are solely responsible for:</p>
        <ul>
          <li>All commands, configurations, and actions executed via CockpitOS</li>
          <li>Security of your servers, credentials, and connected devices</li>
          <li>Compliance with infrastructure provider policies and applicable laws</li>
        </ul>
        <p>You understand that improper usage may result in:</p>
        <ul>
          <li>Data loss or corruption</li>
          <li>Service disruption or downtime</li>
          <li>Security vulnerabilities or unauthorized exposure</li>
        </ul>
        <p className="font-medium text-neutral-950">
          CockpitOS provides tools - not safeguards against user misconfiguration.
        </p>
      </section>

      <section className="policy-section">
        <h2>4. Acceptable Use Policy</h2>
        <p>
          CockpitOS may not be used for activities that violate applicable laws, regulations, or ethical
          standards, including but not limited to:
        </p>
        <ul>
          <li>Unauthorized system access or exploitation</li>
          <li>Deployment of malicious software, scripts, or payloads</li>
          <li>Network abuse, including denial-of-service activities or spam</li>
          <li>Hosting or distributing illegal or harmful content</li>
          <li>Circumventing third-party service terms or safeguards</li>
        </ul>
        <p>Violation of this policy may result in:</p>
        <ul>
          <li>Immediate suspension of access</li>
          <li>Permanent termination of services</li>
          <li>Legal reporting where required</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>5. Commercial Usage &amp; Billing</h2>
        <p>CockpitOS is offered as a commercial platform and may include:</p>
        <ul>
          <li>Subscription-based plans</li>
          <li>Usage-based billing models</li>
          <li>Tiered feature access</li>
          <li>Advertisements</li>
        </ul>
        <p>Users agree that:</p>
        <ul>
          <li>Access to certain features may require active payment</li>
          <li>Usage beyond included limits may incur additional charges</li>
          <li>Pricing structures may evolve with prior notice</li>
        </ul>
        <p className="font-medium">Continued usage implies acceptance of applicable pricing terms.</p>
      </section>

      <section className="policy-section">
        <h2>6. Data Handling &amp; Privacy</h2>
        <p>
          CockpitOS may process operational and system-related data necessary to provide services, including:
        </p>
        <ul>
          <li>System metrics (CPU, memory, processes)</li>
          <li>File metadata and user-managed content</li>
          <li>Authentication and session data</li>
        </ul>
        <p>
          <strong>Ripun Basumatary</strong> does not claim ownership of user data.
        </p>
        <p>However:</p>
        <ul>
          <li>Data may be processed, transmitted, or temporarily stored for functionality</li>
          <li>Third-party infrastructure (e.g., storage providers) may be utilized</li>
          <li>Users are responsible for securing sensitive data within their systems</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>7. Security Architecture</h2>
        <p>CockpitOS is designed with a security-first approach, including:</p>
        <ul>
          <li>Encrypted communication channels (TLS)</li>
          <li>Authenticated session management</li>
          <li>Secure agent-based command execution</li>
          <li>Integrity verification mechanisms</li>
        </ul>
        <p>
          Despite these measures, no system is immune to risk. Users must implement their own security best
          practices.
        </p>
      </section>

      <section className="policy-section">
        <h2>8. Service Availability &amp; Continuity</h2>
        <p>
          CockpitOS is provided on an &ldquo;as-is&rdquo; and &ldquo;as-available&rdquo; basis.
        </p>
        <p>While we strive for reliability:</p>
        <ul>
          <li>Service interruptions may occur due to maintenance or unforeseen events</li>
          <li>Features and capabilities may be updated, modified, or deprecated</li>
          <li>Performance may vary based on infrastructure and network conditions</li>
        </ul>
        <p className="font-medium">No guarantee of uninterrupted or error-free operation is provided.</p>
      </section>

      <section className="policy-section">
        <h2>9. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable law, <strong>Ripun Basumatary</strong>{" "}
          shall not be liable for:
        </p>
        <ul>
          <li>Direct or indirect damages arising from platform use</li>
          <li>Loss of data, revenue, or business continuity</li>
          <li>Infrastructure failures or third-party service issues</li>
          <li>Misuse or misconfiguration by the user</li>
        </ul>
        <p className="font-semibold text-neutral-950">
          Use of CockpitOS is entirely at your own discretion and risk.
        </p>
      </section>

      <section className="policy-section">
        <h2>10. Licensing &amp; Intellectual Property</h2>
        <p>
          CockpitOS includes proprietary technology owned and developed by{" "}
          <strong>Ripun Basumatary</strong>. Official project and owner information may be found at{" "}
          <strong>theripun.com</strong>.
        </p>
        <p className="font-medium">Users are granted a limited, non-exclusive license to:</p>
        <ul>
          <li>Use the platform for personal or commercial purposes</li>
          <li>Install and operate CockpitOS components on authorized systems</li>
        </ul>
        <p className="font-medium">Users may not:</p>
        <ul>
          <li>Reverse engineer or replicate core systems</li>
          <li>Redistribute proprietary components without authorization</li>
          <li>Use the platform beyond licensed scope</li>
        </ul>
        <p className="font-semibold tracking-tight text-neutral-950">All rights remain reserved.</p>
      </section>

      <section className="policy-section">
        <h2>11. Updates &amp; Modifications</h2>
        <p>This policy may be updated periodically to reflect:</p>
        <ul>
          <li>Platform changes</li>
          <li>Legal or regulatory requirements</li>
          <li>Service enhancements</li>
        </ul>
        <p className="font-medium">Continued use of CockpitOS constitutes acceptance of the latest version.</p>
      </section>

      <section className="policy-section pb-2">
        <h2>12. Acknowledgment &amp; Consent</h2>
        <p>By proceeding, you explicitly acknowledge that:</p>
        <ul>
          <li>You understand the nature of system-level access provided by CockpitOS</li>
          <li>You accept full responsibility for all actions performed through the platform</li>
          <li>You agree to all terms outlined in this policy</li>
        </ul>
 
      </section>
    </article>
  );
}
