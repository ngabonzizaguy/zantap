import Image from "next/image";
import { BriefingAccessGate } from "@/components/briefing/BriefingAccessGate";
import { BriefingInterest } from "@/components/briefing/BriefingInterest";
import { BriefingMotion } from "@/components/briefing/BriefingMotion";
import { BriefingNotice } from "@/components/briefing/BriefingNotice";
import { BriefingSignalField } from "@/components/briefing/BriefingSignalField";
import {
  BRIEFING_CHAPTERS,
  DOCUMENTS,
  EVIDENCE,
  ORDER_JOURNEY,
} from "@/lib/briefing/content";
import {
  getBriefingPreviewConfig,
  hasBriefingPreviewSession,
  isBriefingPreviewExpired,
} from "@/lib/briefing/preview-access";

interface BriefingPageProps {
  searchParams: Promise<{ error?: string; state?: string }>;
}

export default async function BriefingPage({ searchParams }: BriefingPageProps) {
  const query = await searchParams;
  const config = getBriefingPreviewConfig();
  if (!config) return <BriefingAccessGate state="unavailable" />;
  if (isBriefingPreviewExpired(config)) {
    return <BriefingAccessGate state="expired" />;
  }
  if (!(await hasBriefingPreviewSession())) {
    return <BriefingAccessGate error={query.error === "invalid"} />;
  }

  return (
    <main className="briefing-page">
      <BriefingNotice
        recipient={config.recipient}
        expiresAt={config.expiresAt.toISOString()}
      />
      <BriefingMotion />

      <header className="briefing-hero" id="top">
        <Image
          src="/marketing/kigali-vendor-hero.png"
          alt="Atmospheric view of a Kigali food-business setting"
          fill
          priority
          sizes="100vw"
          className="briefing-hero__image"
          data-briefing-parallax
        />
        <div className="briefing-hero__veil" aria-hidden />
        <BriefingSignalField />
        <nav className="briefing-nav" aria-label="Briefing chapters">
          <a href="#top" data-briefing-brand className="briefing-nav__brand">
            <Image
              src="/brand/approved-z/zantap-wordmark-logo2-darkbg.png"
              alt="ZanTap"
              width={170}
              height={54}
              priority
            />
          </a>
          <div className="briefing-nav__links">
            {BRIEFING_CHAPTERS.map((chapter) => (
              <a key={chapter.id} href={`#${chapter.id}`}>
                {chapter.label}
              </a>
            ))}
          </div>
        </nav>
        <div className="briefing-hero__copy">
          <p className="briefing-kicker" data-briefing-hero>
            Private briefing · Rwanda, 2026
          </p>
          <h1 data-briefing-hero>
            Good food already moves people.
            <em>ZanTap helps the business move with it.</em>
          </h1>
          <p className="briefing-hero__summary" data-briefing-hero>
            One simple link connects a customer&apos;s choice, a familiar MoMo
            moment and a kitchen that knows what comes next.
          </p>
          <a href="#why" className="briefing-scroll-cue" data-briefing-hero>
            <span>Enter the story</span>
            <span aria-hidden>↓</span>
          </a>
        </div>
      </header>

      <section className="briefing-section briefing-problem" id="why">
        <div className="briefing-section__intro" data-briefing-reveal>
          <p className="briefing-kicker">The opportunity</p>
          <h2>A busy service should not depend on finding the right message.</h2>
        </div>
        <div className="briefing-problem__grid">
          {[
            ["Orders arrive everywhere", "Calls, chats and paper can each hold a different piece of the same order."],
            ["Payment needs certainty", "The kitchen needs to know when to begin without chasing a conversation."],
            ["Growth needs memory", "Sales, stock and costs become useful only when today leaves a clear record."],
          ].map(([title, body]) => (
            <article key={title} data-briefing-reveal>
              <span aria-hidden />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="briefing-section briefing-product" id="product">
        <div className="briefing-product__copy" data-briefing-reveal>
          <p className="briefing-kicker">Meet ZanTap</p>
          <h2>From their phone to your kitchen—without losing the order between.</h2>
          <p>
            ZanTap gives a local food business its own mobile storefront and a
            live kitchen view. Customers do not need another app. The team does
            not need to search through a thread.
          </p>
          <details>
            <summary>What the working product includes</summary>
            <p>
              Menu and branding, order customization, MoMo handoff, kitchen
              stages, delivery assignment, history, receipts, stock and profit
              tools, guided onboarding and an installable experience.
            </p>
          </details>
        </div>
        <div className="briefing-product__stage" data-briefing-reveal>
          <div className="briefing-phone briefing-phone--front">
            <Image
              src="/marketing/screen-storefront.png"
              alt="A real ZanTap mobile storefront"
              width={690}
              height={1380}
              sizes="(max-width: 768px) 55vw, 290px"
            />
          </div>
          <div className="briefing-screen">
            <Image
              src="/marketing/screen-kitchen.png"
              alt="The ZanTap kitchen view"
              width={1400}
              height={900}
              sizes="(max-width: 768px) 78vw, 620px"
            />
          </div>
        </div>
      </section>

      <section className="briefing-section briefing-journey" id="journey">
        <div className="briefing-section__intro" data-briefing-reveal>
          <p className="briefing-kicker">One order, start to finish</p>
          <h2>Six ordinary moments. One continuous view.</h2>
        </div>
        <div className="briefing-journey__rail">
          {ORDER_JOURNEY.map((item, index) => (
            <article key={item.step} data-briefing-reveal>
              <span className="briefing-journey__number">{String(index + 1).padStart(2, "0")}</span>
              <p className="briefing-kicker">{item.step}</p>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <figure className="briefing-journey__image" data-briefing-reveal>
          <Image
            src="/marketing/scroll/kitchen.webp"
            alt="Atmospheric kitchen scene"
            fill
            sizes="100vw"
            data-briefing-parallax
          />
          <figcaption>Designed around the rhythm of service—not the rhythm of a software demo.</figcaption>
        </figure>
      </section>

      <section className="briefing-section briefing-proof" id="proof">
        <div className="briefing-section__intro" data-briefing-reveal>
          <p className="briefing-kicker">Evidence so far · August 2026</p>
          <h2>The product loop exists. The next work is adoption.</h2>
        </div>
        <div className="briefing-proof__grid">
          {EVIDENCE.map((item) => (
            <article key={item.label} data-briefing-reveal>
              <p>{item.label}</p>
              <strong>{item.value}</strong>
              <span>{item.detail}</span>
            </article>
          ))}
        </div>
        <div className="briefing-docs" data-briefing-reveal>
          {DOCUMENTS.map((document) => (
            <details key={document.title}>
              <summary>{document.title}</summary>
              <p>{document.body}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="briefing-section briefing-future" id="future">
        <div className="briefing-future__image" data-briefing-reveal>
          <Image
            src="/marketing/scroll/grow.webp"
            alt="Conceptual Rwanda food-business growth scene"
            fill
            sizes="(max-width: 768px) 100vw, 48vw"
            data-briefing-parallax
          />
        </div>
        <div className="briefing-future__copy" data-briefing-reveal>
          <p className="briefing-kicker">Rwanda first</p>
          <h2>Start close enough to learn. Build strong enough to travel.</h2>
          <p>
            ZanTap&apos;s early path is deliberately practical: help real food
            businesses go live, learn from service, and grow a per-order model
            around value that can be seen in the kitchen.
          </p>
          <ul>
            <li>Vendors shape the product through real daily use.</li>
            <li>Partners extend reach, trust and operating capability.</li>
            <li>Sponsors can widen access to guided digital adoption.</li>
            <li>Investors can help a working loop become a durable company.</li>
          </ul>
        </div>
      </section>

      <section className="briefing-section briefing-close">
        <div data-briefing-reveal>
          <p className="briefing-kicker">Continue the conversation</p>
          <h2>What could ZanTap make possible with you?</h2>
          <p className="briefing-close__lead">
            Choose the perspective closest to yours and tell us what you would
            like to explore.
          </p>
        </div>
        <div data-briefing-reveal>
          <BriefingInterest />
        </div>
        <footer>
          <Image
            src="/brand/approved-z/zantap-wordmark-logo2-darkbg.png"
            alt="ZanTap"
            width={150}
            height={48}
          />
          <span>Tap. Serve. Grow. · Kigali, Rwanda</span>
        </footer>
      </section>
    </main>
  );
}
