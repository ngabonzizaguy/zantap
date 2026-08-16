import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — ZanTap",
  description: "How ZanTap collects, uses and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-hairline py-5">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5">
          <Link href="/" aria-label="Back to home">
            <Image
              src="/brand/approved-z/zantap-z-mark-1024.png"
              alt="ZanTap"
              width={1024}
              height={1024}
              className="h-8 w-8"
            />
          </Link>
          <span className="font-body text-body-sm text-muted">Privacy Policy</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <h1 className="font-display text-display-lg text-ink">Privacy Policy</h1>
        <p className="mt-2 font-body text-caption text-muted">
          Last updated: August 2026
        </p>

        <div className="legal-prose mt-10 space-y-8 font-body text-body-md text-body leading-relaxed">
          <p className="rounded-brand-lg border border-hairline bg-surface-card p-4 text-caption text-muted">
            This policy is provided for general information only and does not constitute legal advice.
          </p>

          <section>
            <h2>1. Who we are</h2>
            <p>
              ZanTap (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a food-ordering
              platform based in Kigali, Rwanda. We provide local food businesses
              with a digital ordering link, mobile payment integration via MTN
              MoMo, and a kitchen management dashboard.
            </p>
          </section>

          <section>
            <h2>2. Data we collect</h2>
            <p>We collect personal data in the following situations:</p>
            <ul>
              <li>
                <strong>Lead form submissions:</strong> business name, type,
                contact person name, WhatsApp phone number, and area/location.
              </li>
              <li>
                <strong>Customer orders:</strong> phone number, delivery sector,
                landmark, and order items (no payment card data — all payments go
                through MTN MoMo&rsquo;s own secure flow).
              </li>
              <li>
                <strong>Vendor onboarding:</strong> business name, slug, phone
                number, payout phone, category, and menu content.
              </li>
              <li>
                <strong>Automatically:</strong> basic server logs (IP address,
                browser type, timestamps) and anonymous analytics to improve our
                service.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. How we use your data</h2>
            <ul>
              <li>To process food orders and relay them to the vendor kitchen.</li>
              <li>To facilitate MoMo payments between customer and vendor.</li>
              <li>To contact potential partners via WhatsApp regarding setup.</li>
              <li>To operate, maintain, and improve the platform.</li>
              <li>To send service-related notifications (order status, delivery).</li>
            </ul>
          </section>

          <section>
            <h2>4. Payment data</h2>
            <p>
              We do not store credit/debit card details. Mobile Money (MTN MoMo)
              transactions are initiated via USSD or the MTN API — payment
              credentials remain within MTN&rsquo;s secure infrastructure. We
              store only the transaction reference and confirmation status.
            </p>
          </section>

          <section>
            <h2>5. Data storage &amp; hosting</h2>
            <p>
              Our service runs on <strong>Vercel</strong> (edge/serverless hosting)
              and stores data in a <strong>Supabase</strong> PostgreSQL database.
              Both providers maintain industry-standard security certifications.
              Data may be processed in data centres outside Rwanda; we ensure
              transfers comply with applicable data protection requirements.
            </p>
          </section>

          <section>
            <h2>6. Data sharing</h2>
            <p>
              We do not sell personal data. We share information only with:
            </p>
            <ul>
              <li>The food vendor fulfilling your order (delivery details).</li>
              <li>MTN Rwanda (payment processing).</li>
              <li>Infrastructure providers (Vercel, Supabase) for hosting.</li>
              <li>Law enforcement when required by Rwandan law.</li>
            </ul>
          </section>

          <section>
            <h2>7. Retention</h2>
            <p>
              Order records are kept for accounting and dispute resolution
              purposes. Lead-form submissions are retained until the business
              relationship concludes or the contact requests deletion. You may
              request deletion of your personal data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2>8. Your rights</h2>
            <p>
              Under Rwanda&rsquo;s data protection framework and applicable
              regulations, you have the right to access, correct, or request
              deletion of your personal data. Contact us using the details below.
            </p>
          </section>

          <section>
            <h2>9. Cookies &amp; analytics</h2>
            <p>
              We use minimal first-party cookies for session management. We do not
              use third-party advertising trackers. We collect anonymous page and
              funnel events such as a landing-page visit, lead-form view, button
              click, and successful submission. These events may include a random
              browser-session ID, selected language, page path, referral host and
              campaign tags, but never the form values, phone number, email address,
              raw IP address, or a browser fingerprint.
            </p>
          </section>

          <section>
            <h2>10. Changes</h2>
            <p>
              We may update this policy from time to time. Significant changes
              will be communicated through our platform or via WhatsApp to
              registered vendors.
            </p>
          </section>

          <section>
            <h2>11. Contact</h2>
            <p>
              For privacy enquiries, data deletion requests, or complaints:
            </p>
            <p>
              Email: <a href="mailto:hello@zantap.app" className="text-ink underline">hello@zantap.app</a><br />
              WhatsApp: <a href="https://wa.me/250784928786" className="text-ink underline">+250 784 928 786</a><br />
              Kigali, Rwanda
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
