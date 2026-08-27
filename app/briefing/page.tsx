import Image from "next/image";
import { BriefingAcknowledgement } from "@/components/briefing/BriefingAcknowledgement";
import { BriefingAccessGate } from "@/components/briefing/BriefingAccessGate";
import { BriefingInterest } from "@/components/briefing/BriefingInterest";
import { BriefingMotion } from "@/components/briefing/BriefingMotion";
import { BriefingNotice } from "@/components/briefing/BriefingNotice";
import { BriefingSignalField } from "@/components/briefing/BriefingSignalField";
import {
  BRIEFING_CHAPTERS,
} from "@/lib/briefing/content";
import { getBriefingPreviewConfig, isBriefingPreviewExpired } from "@/lib/briefing/preview-access";
import { getBriefingViewerContext } from "@/lib/briefing/viewer-session";

interface BriefingPageProps {
  searchParams: Promise<{ error?: string; state?: string }>;
}

export default async function BriefingPage({ searchParams }: BriefingPageProps) {
  const query = await searchParams;
  const context = await getBriefingViewerContext();
  if (!context) {
    const preview = getBriefingPreviewConfig();
    if (preview && isBriefingPreviewExpired(preview)) {
      return <BriefingAccessGate state="expired" />;
    }
    return <BriefingAccessGate error={Boolean(query.error)} />;
  }
  if (context.session && !context.session.acknowledgedAt) {
    return <BriefingAcknowledgement recipient={context.recipient} expiresAt={context.expiresAt} />;
  }
  const document = context.document;
  const visibleChapters = [...BRIEFING_CHAPTERS]
    .filter((chapter) => !document.hiddenChapters.includes(chapter.id))
    .sort(
      (left, right) =>
        document.chapterOrder.indexOf(left.id) - document.chapterOrder.indexOf(right.id)
    );
  const chapterStyle = (id: (typeof document.chapterOrder)[number]) => ({
    order: document.chapterOrder.indexOf(id),
  });

  return (
    <main className="briefing-page">
      <BriefingNotice
        recipient={context.recipient}
        expiresAt={context.expiresAt.toISOString()}
      />
      <BriefingMotion />

      <header className="briefing-hero" id="top">
        <Image
          src={document.media.hero}
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
            {visibleChapters.map((chapter) => (
              <a key={chapter.id} href={`#${chapter.id}`}>
                {chapter.label}
              </a>
            ))}
          </div>
        </nav>
        <div className="briefing-hero__copy">
          <p className="briefing-kicker" data-briefing-hero>
            {document.hero.kicker}
          </p>
          <h1 data-briefing-hero>
            {document.hero.title}
            <em>{document.hero.emphasis}</em>
          </h1>
          <p className="briefing-hero__summary" data-briefing-hero>
            {document.hero.summary}
          </p>
          <a href="#why" className="briefing-scroll-cue" data-briefing-hero>
            <span>Enter the story</span>
            <span aria-hidden>↓</span>
          </a>
        </div>
      </header>

      <div className="briefing-chapter-flow">

      {!document.hiddenChapters.includes("why") ? <section style={chapterStyle("why")} className="briefing-section briefing-problem" id="why">
        <div className="briefing-section__intro" data-briefing-reveal>
          <p className="briefing-kicker">{document.opportunity.kicker}</p>
          <h2>{document.opportunity.title}</h2>
        </div>
        <div className="briefing-problem__grid">
          {document.opportunity.cards.map(({ title, body }) => (
            <article key={title} data-briefing-reveal>
              <span aria-hidden />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section> : null}

      {!document.hiddenChapters.includes("product") ? <section style={chapterStyle("product")} className="briefing-section briefing-product" id="product">
        <div className="briefing-product__copy" data-briefing-reveal>
          <p className="briefing-kicker">{document.product.kicker}</p>
          <h2>{document.product.title}</h2>
          <p>{document.product.body}</p>
          <details>
            <summary>What the working product includes</summary>
            <p>{document.product.includes}</p>
          </details>
        </div>
        <div className="briefing-product__stage" data-briefing-reveal>
          <div className="briefing-phone briefing-phone--front">
            <Image
              src={document.media.storefront}
              alt="The current ZanTap mobile storefront"
              width={466}
              height={761}
              sizes="(max-width: 768px) 55vw, 290px"
            />
          </div>
          <div className="briefing-screen">
            <Image
              src={document.media.dashboard}
              alt="The current ZanTap Inventory dashboard"
              width={376}
              height={805}
              sizes="(max-width: 768px) 62vw, 410px"
            />
          </div>
        </div>
      </section> : null}

      {!document.hiddenChapters.includes("journey") ? <section style={chapterStyle("journey")} className="briefing-section briefing-journey" id="journey">
        <div className="briefing-section__intro" data-briefing-reveal>
          <p className="briefing-kicker">{document.journey.kicker}</p>
          <h2>{document.journey.title}</h2>
        </div>
        <div className="briefing-journey__rail">
          {document.journey.steps.map((item, index) => (
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
            src={document.media.journey}
            alt="Atmospheric kitchen scene"
            fill
            sizes="100vw"
            data-briefing-parallax
          />
          <figcaption>{document.journey.caption}</figcaption>
        </figure>
      </section> : null}

      {!document.hiddenChapters.includes("proof") ? <section style={chapterStyle("proof")} className="briefing-section briefing-proof" id="proof">
        <div className="briefing-section__intro" data-briefing-reveal>
          <p className="briefing-kicker">{document.proof.kicker}</p>
          <h2>{document.proof.title}</h2>
        </div>
        <div className="briefing-proof__grid">
          {document.proof.evidence.map((item) => (
            <article key={item.label} data-briefing-reveal>
              <p>{item.label}</p>
              <strong>{item.value}</strong>
              <span>{item.detail}</span>
            </article>
          ))}
        </div>
        <div className="briefing-docs" data-briefing-reveal>
          {document.proof.documents.map((entry) => (
            <details key={entry.title}>
              <summary>{entry.title}</summary>
              <p>{entry.body}</p>
            </details>
          ))}
        </div>
      </section> : null}

      {!document.hiddenChapters.includes("future") ? <section style={chapterStyle("future")} className="briefing-section briefing-future" id="future">
        <div className="briefing-future__image" data-briefing-reveal>
          <Image
            src={document.media.future}
            alt="Conceptual Rwanda food-business growth scene"
            fill
            sizes="(max-width: 768px) 100vw, 48vw"
            data-briefing-parallax
          />
        </div>
        <div className="briefing-future__copy" data-briefing-reveal>
          <p className="briefing-kicker">{document.future.kicker}</p>
          <h2>{document.future.title}</h2>
          <p>{document.future.body}</p>
          <ul>
            {document.future.points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        </div>
      </section> : null}
      </div>

      <section className="briefing-section briefing-close">
        <div data-briefing-reveal>
          <p className="briefing-kicker">{document.closing.kicker}</p>
          <h2>{document.closing.title}</h2>
          <p className="briefing-close__lead">{document.closing.body}</p>
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
