import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — ZanTap",
  description: "Terms governing use of the ZanTap food ordering platform.",
};

export default function TermsPage() {
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
          <span className="font-body text-body-sm text-muted">Terms of Service</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <h1 className="font-display text-display-lg text-ink">Terms of Service</h1>
        <p className="mt-2 font-body text-caption text-muted">
          Last updated: August 2026
        </p>

        <div className="legal-prose mt-10 space-y-8 font-body text-body-md text-body leading-relaxed">
          <p className="rounded-brand-lg border border-hairline bg-surface-card p-4 text-caption text-muted">
            This document is provided for general information only and does not constitute legal advice.
          </p>

          <section>
            <h2>1. Acceptance</h2>
            <p>
              By accessing or using ZanTap (&ldquo;the Platform&rdquo;), you agree
              to these Terms of Service. If you do not agree, please do not use the
              Platform.
            </p>
          </section>

          <section>
            <h2>2. The service</h2>
            <p>
              ZanTap provides food businesses in Rwanda with a digital ordering
              link, integration with MTN MoMo for mobile payments, and a kitchen
              management dashboard (&ldquo;KDS&rdquo;). ZanTap facilitates
              transactions between customers and food vendors but is not itself a
              food vendor, delivery service, or financial institution.
            </p>
          </section>

          <section>
            <h2>3. Eligibility</h2>
            <p>
              Vendors must be legally operating food businesses in Rwanda. Customers
              must have a valid Rwandan phone number and MTN MoMo account to place
              paid orders.
            </p>
          </section>

          <section>
            <h2>4. Vendor responsibilities</h2>
            <ul>
              <li>Maintaining accurate menu items, prices, and availability.</li>
              <li>Fulfilling orders in a timely manner once payment is confirmed.</li>
              <li>Complying with Rwanda food safety and business regulations.</li>
              <li>Keeping payout phone and contact details up to date.</li>
            </ul>
          </section>

          <section>
            <h2>5. Customer responsibilities</h2>
            <ul>
              <li>Providing accurate delivery information (sector, landmark, phone).</li>
              <li>Completing MoMo payment promptly when prompted.</li>
              <li>Communicating directly with the vendor for order-specific queries.</li>
            </ul>
          </section>

          <section>
            <h2>6. Payments</h2>
            <p>
              All payments are processed via MTN Mobile Money. ZanTap does not hold
              customer funds. Payment is made directly to the vendor&rsquo;s
              registered MoMo number. ZanTap may charge the vendor a service fee as
              agreed during onboarding — fee details are communicated separately and
              are not part of these general terms.
            </p>
          </section>

          <section>
            <h2>7. Cancellations &amp; refunds</h2>
            <p>
              Once a MoMo payment is confirmed and the order appears on the
              vendor&rsquo;s kitchen dashboard, cancellation is at the
              vendor&rsquo;s discretion. Refund disputes are between the customer
              and vendor. ZanTap will assist with communication where possible but
              does not guarantee refunds.
            </p>
          </section>

          <section>
            <h2>8. Delivery</h2>
            <p>
              Delivery is arranged and fulfilled by the vendor or their assigned
              driver. ZanTap provides a delivery slip for coordination but is not
              responsible for delivery times, food quality upon arrival, or
              delivery-related damages.
            </p>
          </section>

          <section>
            <h2>9. Account security</h2>
            <p>
              Vendors receive an owner token upon registration. This token grants
              full access to the vendor&rsquo;s dashboard and settings. Keep it
              secure. ZanTap is not liable for unauthorized actions made with a
              compromised owner token.
            </p>
          </section>

          <section>
            <h2>10. Intellectual property</h2>
            <p>
              The ZanTap name, logo, and platform design are our intellectual
              property. Vendors retain ownership of their menu content, images, and
              branding uploaded to the Platform. By uploading, vendors grant ZanTap
              a license to display that content on the storefront.
            </p>
          </section>

          <section>
            <h2>11. Limitation of liability</h2>
            <p>
              ZanTap is provided &ldquo;as is.&rdquo; We do not guarantee
              uninterrupted service. To the maximum extent permitted by Rwandan law,
              ZanTap is not liable for indirect, incidental, or consequential
              damages arising from use of the Platform, including lost revenue or
              missed orders.
            </p>
          </section>

          <section>
            <h2>12. Suspension &amp; termination</h2>
            <p>
              We reserve the right to suspend or terminate vendor access for
              violations of these terms, fraudulent activity, or at our discretion
              with reasonable notice. Vendors may deactivate their account by
              contacting us.
            </p>
          </section>

          <section>
            <h2>13. Governing law</h2>
            <p>
              These terms are governed by the laws of the Republic of Rwanda. Any
              disputes shall be resolved through mediation in Kigali before
              escalation to the competent courts.
            </p>
          </section>

          <section>
            <h2>14. Changes</h2>
            <p>
              We may update these terms. Continued use after changes constitutes
              acceptance. Significant changes will be communicated via WhatsApp or
              through the Platform.
            </p>
          </section>

          <section>
            <h2>15. Contact</h2>
            <p>
              Questions about these terms:
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
