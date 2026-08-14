/*
 * scroll-world scrub engine — MID-PAGE EMBED adaptation of
 * `.agents/skills/scroll-world/references/scrub-engine.js` (vanilla, zero deps).
 *
 * Differences from the stock engine (which assumes it owns the page from
 * scrollY=0 with position:fixed layers) — per the wiring plan in
 * `.scratch/product-restructure/issue-03.md`:
 *   - A sticky viewport (100svh on capable browsers, 100vh fallback) inside
 *     the container; the container's
 *     height is (Σ scroll weights + 1) × vh, so the sticky range equals the
 *     scrub distance. All layers are position:absolute inside the viewport.
 *   - Segment offsets are measured from the container's document top (read
 *     per frame — cheap, rAF-gated) instead of scrollY=0.
 *   - Scroll progress is clamped to the band, so the first segment holds
 *     opacity 1 above it and the last holds opacity 1 below it (no black
 *     frame while the section scrolls in/out). Clip prefetch uses the
 *     UNCLAMPED offset so nothing loads until the section is actually near.
 *   - Engine topbar/scrollbar/nav/particles dropped (the page has its own
 *     masthead + StickyCta); route rail + scroll hint kept.
 *   - Architecture A: no connectors; consecutive scenes crossfade directly.
 *   - Sections may carry `media` (real product screens / the MoMo logo) —
 *     rendered in the HTML copy overlay, never baked into the video.
 *   - Save-Data is treated like prefers-reduced-motion (stills only, no clip
 *     fetch) per ADR-0047's Rwanda data-budget guard.
 *   - Returns a cleanup function (listeners, rAF, blob URLs, DOM) so a React
 *     effect can mount/unmount it safely (incl. dev StrictMode double-mount).
 */

export interface ScrollWorldMedia {
  src: string;
  alt: string;
  /** "logo" = small brand badge; "screen" = product screenshot chip. */
  kind: "logo" | "screen";
}

export interface ScrollWorldSection {
  id: string;
  label: string;
  still: string;
  /** Scrubbed clip; omit for still-crossfade sections (scenes 3–6 of this preview). */
  clip?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  tags?: readonly string[];
  media?: ScrollWorldMedia;
  cta?: { label: string; href: string };
  /** Viewport-heights of scroll for this scene (overrides diveScroll). */
  scroll?: number;
  /** 0..1 — camera settles mid-scene while the copy peaks. Keep ≤ 0.6. */
  linger?: number;
}

export interface ScrollWorldConfig {
  sections: readonly ScrollWorldSection[];
  /** Default viewport-heights of scroll per scene. */
  diveScroll?: number;
  /** Seam dissolve width in vh (arch A direct crossfade). */
  crossfade?: number;
  hint?: string;
}

interface Segment {
  section: ScrollWorldSection;
  index: number;
  w: number;
  linger: number;
  start: number;
  end: number;
  el: HTMLElement;
  img: HTMLImageElement;
  video: HTMLVideoElement | null;
  objectUrl: string | null;
  hasClip: boolean;
  loading: boolean;
  ready: boolean;
  cur: number;
  target: number;
  visible: boolean;
}

export function mountScrollWorld(
  container: HTMLElement,
  config: ScrollWorldConfig,
): () => void {
  const nav =
    typeof navigator !== "undefined"
      ? (navigator as Navigator & { connection?: { saveData?: boolean } })
      : undefined;
  // Save-Data counts as reduced motion: stills crossfade, clips never load.
  const reduce =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    Boolean(nav?.connection?.saveData);
  const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  const smallMQ = window.matchMedia("(max-width: 860px)");
  const isMobile = () => coarse || smallMQ.matches;

  const SECTIONS = config.sections;
  const DIVE_W = config.diveScroll ?? 1.3;
  const CROSSFADE = config.crossfade ?? 0.08;
  const N = SECTIONS.length;
  if (!N) return () => {};

  injectCSS();
  container.classList.add("sw-root");

  // ---- DOM (all inside a stable sticky viewport) ----
  const viewport = el("div", "sw-viewport");

  const sky = el("div", "sw-sky");
  sky.appendChild(el("div", "sw-sky__grad"));
  sky.appendChild(el("div", "sw-sky__glow"));

  const stage = el("div", "sw-stage");
  const copylayer = el("div", "sw-copylayer");
  const route = el("div", "sw-route");
  const hint = el("div", "sw-hint");
  const hintText = el("span");
  hintText.textContent = config.hint ?? "scroll";
  hint.appendChild(hintText);
  hint.appendChild(el("i"));

  [sky, stage, copylayer, route, hint].forEach((n) => viewport.appendChild(n));
  container.appendChild(viewport);

  // Architecture A, no connectors: one segment per section.
  const SEGMENTS: Segment[] = SECTIONS.map((s, i) => {
    const scene = el("div", "sw-scene");
    const img = el("img", "sw-scene__still") as HTMLImageElement;
    img.alt = "";
    img.decoding = "async";
    img.loading = "lazy";
    img.src = s.still;
    scene.appendChild(img);
    stage.appendChild(scene);
    return {
      section: s,
      index: i,
      w: s.scroll ?? DIVE_W,
      linger: s.linger ?? 0,
      start: 0,
      end: 0,
      el: scene,
      img,
      video: null,
      objectUrl: null,
      hasClip: false,
      loading: false,
      ready: false,
      cur: 0,
      target: 0,
      visible: false,
    };
  });

  // ---- copy overlay + route rail ----
  const copies: HTMLElement[] = [];
  const dots: HTMLElement[] = [];
  SECTIONS.forEach((s, i) => {
    const c = el("article", "sw-copy");
    c.innerHTML =
      `<span class="sw-copy__num">${pad(i + 1)} / ${pad(N)}</span>` +
      (s.eyebrow ? `<span class="sw-copy__eyebrow">${esc(s.eyebrow)}</span>` : "") +
      (s.title ? `<h3 class="sw-copy__title">${esc(s.title)}</h3>` : "") +
      (s.body ? `<p class="sw-copy__body">${esc(s.body)}</p>` : "") +
      (s.media
        ? s.media.kind === "screen"
          ? // UI screenshots ride inside a phone chassis (ScreenCardDeck look:
            // no notch, uniform elongated screen, screenshot uncropped top-down)
            `<div class="sw-copy__media sw-copy__media--screen"><div class="sw-phone">` +
            `<span class="sw-phone__btn sw-phone__btn--l"></span>` +
            `<span class="sw-phone__btn sw-phone__btn--r"></span>` +
            `<div class="sw-phone__screen">` +
            `<img src="${esc(s.media.src)}" alt="${esc(s.media.alt)}" loading="lazy" decoding="async" />` +
            `<span class="sw-phone__sheen"></span></div></div></div>`
          : `<div class="sw-copy__media sw-copy__media--${s.media.kind}">` +
            `<img src="${esc(s.media.src)}" alt="${esc(s.media.alt)}" loading="lazy" decoding="async" /></div>`
        : "") +
      (s.tags?.length
        ? `<ul class="sw-copy__tags">${s.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`
        : "") +
      (s.cta
        ? `<div class="sw-copy__cta"><a class="sw-btn sw-btn--primary" href="${esc(
            s.cta.href,
          )}">${esc(s.cta.label)}</a></div>`
        : "");
    copylayer.appendChild(c);
    copies.push(c);

    const dot = el("button", "sw-route__dot");
    dot.setAttribute("type", "button");
    dot.setAttribute("aria-label", s.label);
    dot.innerHTML = `<span class="sw-route__label">${esc(s.label)}</span><i></i>`;
    dot.addEventListener("click", () => jumpTo(i));
    route.appendChild(dot);
    dots.push(dot);
  });

  // ---- math ----
  const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = (x: number) => {
    x = clamp(x);
    return x * x * (3 - 2 * x);
  };
  const lingerEase = (x: number, L: number) => {
    L = clamp(L);
    const c = x - 0.5;
    return (1 - L) * x + L * (4 * c * c * c + 0.5);
  };

  let vh = window.innerHeight;
  let stageX = 0;
  let totalW = 0;
  let activeIndex = -1;
  let ticking = false;
  let laidOutW = window.innerWidth;
  let disposed = false;
  let rafId = 0;

  function containerTop(): number {
    return container.getBoundingClientRect().top + (window.scrollY || window.pageYOffset);
  }

  function stableViewportHeight(): number {
    // The CSS viewport uses 100svh on capable browsers. Reading the rendered
    // sticky viewport keeps the scroll math on the same stable unit instead of
    // window.innerHeight, which changes when mobile browser chrome expands or
    // collapses and makes the scrub band jump under the user's finger.
    const measured = viewport.getBoundingClientRect().height;
    return measured > 0 ? measured : window.innerHeight;
  }

  function layout() {
    laidOutW = window.innerWidth;
    vh = stableViewportHeight();
    stageX = window.innerWidth > 860 ? 4 : 0;
    let off = 0;
    SEGMENTS.forEach((s) => {
      s.start = off * vh;
      off += s.w;
      s.end = off * vh;
    });
    totalW = off;
    // Sticky range = container height − viewport height ⇒ (Σ weights + 1) × vh.
    container.style.height = `${totalW * vh + vh}px`;
    read();
  }

  function jumpTo(i: number) {
    const seg = SEGMENTS[i];
    window.scrollTo({
      top: containerTop() + seg.start + (seg.end - seg.start) * 0.5,
      behavior: reduce ? "auto" : "smooth",
    });
  }

  function loadClip(s: Segment) {
    // Reduced-motion / Save-Data: never fetch clips — stills cross-dissolve.
    if (reduce || s.loading || !s.section.clip) return;
    s.loading = true;
    // Blob URL: always seekable regardless of host byte-range support.
    fetch(s.section.clip)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((blob) => {
        if (disposed) return;
        const v = document.createElement("video");
        v.className = "sw-scene__video";
        v.muted = true;
        v.playsInline = true;
        v.preload = "auto";
        v.setAttribute("muted", "");
        v.setAttribute("playsinline", "");
        s.objectUrl = URL.createObjectURL(blob);
        v.src = s.objectUrl;
        v.addEventListener("loadedmetadata", () => {
          s.ready = true;
          read();
        });
        // Reveal only once a real frame painted (iOS blank-video guard).
        v.addEventListener("seeked", () => s.el.classList.add("has-clip"), { once: true });
        v.addEventListener("loadeddata", () => {
          try {
            v.pause();
          } catch {
            /* noop */
          }
          if (userReady) primeVideo(v);
        });
        s.el.appendChild(v);
        s.video = v;
        s.hasClip = true;
      })
      .catch(() => {
        s.loading = false;
      });
  }

  function read() {
    if (disposed) return;
    const rawY = (window.scrollY || window.pageYOffset) - containerTop();
    // Clamp to the band: first/last segments hold their edge frame at full
    // opacity while the sticky section scrolls into / out of view.
    const y = clamp(rawY, 0, totalW * vh);
    const fade = CROSSFADE * vh;
    let ci = 0;
    for (let i = 0; i < SEGMENTS.length; i++) if (y >= SEGMENTS[i].start) ci = i;

    for (let i = 0; i < SEGMENTS.length; i++) {
      const s = SEGMENTS[i];
      // Prefetch on the UNCLAMPED offset so nothing loads until we're near.
      if (rawY > s.start - 1.6 * vh && rawY < s.end + 1.6 * vh) loadClip(s);
      const local = clamp((y - s.start) / (s.end - s.start), 0, 1);
      s.target = s.linger ? lingerEase(local, s.linger) : local;
      let outside = 0;
      if (y < s.start) outside = s.start - y;
      else if (y > s.end) outside = y - s.end;
      const op = smooth(1 - outside / fade);
      s.el.style.opacity = String(op);
      s.visible = op > 0.001;
      s.el.style.zIndex = i === ci ? "40" : String(20 + Math.round(op * 10));
      if (!s.hasClip || !s.ready) {
        // Still-only scenes get a slow scale drift instead of scrubbed video.
        const sc = reduce ? 1 : 1.03 + local * 0.14;
        s.img.style.transform = `translateX(${stageX - 2}vw) scale(${sc.toFixed(3)})`;
      }
    }

    for (let i = 0; i < N; i++) {
      const seg = SEGMENTS[i];
      const pr = clamp((y - seg.start) / (seg.end - seg.start), 0, 1);
      const before = y < seg.start;
      const after = y > seg.end;
      let cop: number;
      if (i === 0) cop = after ? 0 : smooth(1 - pr / 0.62); // greets on entry
      else if (i === N - 1) cop = before ? 0 : smooth(pr / 0.4); // holds CTA
      else cop = before || after ? 0 : smooth(1 - Math.abs(pr - 0.5) / 0.5);
      const c = copies[i];
      c.style.opacity = String(cop);
      // Desktop copy is vertically centered (top:50%); the parallax transform
      // must carry the -50% or it would overwrite the CSS centering and let a
      // tall block (title + body + media chip) spill past the viewport.
      // Mobile is bottom-anchored via CSS, so only the parallax applies.
      const dy = reduce ? 0 : (0.5 - pr) * 4;
      c.style.transform = isMobile()
        ? dy
          ? `translateY(${dy}vh)`
          : "none"
        : `translateY(calc(-50% + ${dy}vh))`;
      c.style.pointerEvents = cop > 0.5 ? "auto" : "none";
    }

    if (ci !== activeIndex) {
      activeIndex = ci;
      dots.forEach((d, k) => d.classList.toggle("is-active", k === ci));
    }
    hint.style.opacity = String(clamp(1 - y / (0.5 * vh)));
    ticking = false;
  }

  function raf() {
    if (disposed) return;
    const eps = isMobile() ? 0.02 : 0.008;
    for (const s of SEGMENTS) {
      if (!s.hasClip || !s.ready || !s.video) continue;
      if (s.video.seeking) continue;
      if (!s.visible && Math.abs(s.cur - s.target) < 0.002) continue;
      // Eased catch-up: use a cubic ease-out curve toward the target so the
      // scrub decelerates smoothly instead of snapping. The factor decreases
      // as the gap shrinks, giving a bouncy settling feel.
      const gap = s.target - s.cur;
      const absGap = Math.abs(gap);
      const k = reduce
        ? 1
        : isMobile()
          ? 0.22 + 0.14 * (1 - absGap)
          : 0.12 + 0.10 * (1 - absGap);
      s.cur += gap * k;
      // Snap to target when very close to avoid endless micro-seeks.
      if (absGap < 0.003) s.cur = s.target;
      const dur = s.video.duration || 1;
      const t = clamp(s.cur, 0, 0.999) * dur;
      if (Math.abs(s.video.currentTime - t) > eps) {
        try {
          s.video.currentTime = t;
        } catch {
          /* noop */
        }
      }
    }
    rafId = requestAnimationFrame(raf);
  }

  // iOS: prime muted videos on first gesture so seeks paint instantly.
  let userReady = false;
  function primeVideo(v: HTMLVideoElement | null) {
    if (!isMobile() || !v) return;
    try {
      const p = v.play();
      if (p?.then)
        p.then(() => {
          try {
            v.pause();
          } catch {
            /* noop */
          }
        }).catch(() => {});
    } catch {
      /* noop */
    }
  }
  function onFirstGesture() {
    if (userReady) return;
    userReady = true;
    SEGMENTS.forEach((s) => primeVideo(s.video));
  }

  function scheduleRead() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(read);
    }
  }
  function onResize() {
    // Ignore URL-bar-only (height) resizes on touch — no scroll jump.
    if (isMobile() && window.innerWidth === laidOutW) {
      scheduleRead();
      return;
    }
    layout();
  }

  window.addEventListener("pointerdown", onFirstGesture, { once: true, passive: true });
  window.addEventListener("touchstart", onFirstGesture, { once: true, passive: true });
  window.addEventListener("scroll", scheduleRead, { passive: true });
  // Some mobile engines coalesce scroll events while a finger is down. A
  // passive touchmove listener only schedules the same rAF read; it never
  // prevents native vertical scrolling.
  window.addEventListener("touchmove", scheduleRead, { passive: true });
  window.addEventListener("touchend", scheduleRead, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", layout);
  window.addEventListener("load", layout);
  layout();
  rafId = requestAnimationFrame(raf);

  return function destroy() {
    disposed = true;
    cancelAnimationFrame(rafId);
    window.removeEventListener("pointerdown", onFirstGesture);
    window.removeEventListener("touchstart", onFirstGesture);
    window.removeEventListener("scroll", scheduleRead);
    window.removeEventListener("touchmove", scheduleRead);
    window.removeEventListener("touchend", scheduleRead);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("orientationchange", layout);
    window.removeEventListener("load", layout);
    SEGMENTS.forEach((s) => {
      if (s.objectUrl) URL.revokeObjectURL(s.objectUrl);
    });
    container.style.height = "";
    container.classList.remove("sw-root");
    container.innerHTML = "";
  };
}

// ---- helpers ----
function el(tag: string, cls?: string): HTMLElement {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}
function pad(n: number) {
  return String(n).padStart(2, "0");
}
function esc(s: string) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );
}

function injectCSS() {
  if (document.getElementById("sw-css")) return;
  // Deliberately NOT wrapped in @layer (deviation from the stock engine):
  // Tailwind's preflight is unlayered, and unlayered styles beat ANY layered
  // rule — `video{height:auto}` letterboxed the clips and `h3{font-size:
  // inherit}` collapsed the titles when this CSS sat in `@layer sw`. The dark
  // theme is baked into `.sw-root` defaults instead, so no page override is
  // needed.
  const css = `
  .sw-root{--sw-bg:#0c0a09;--sw-ink:#f4f4f3;--sw-ink-soft:rgba(244,244,243,.62);--sw-accent:#f5a623;
    --sw-font-display:var(--font-display),Georgia,serif;
    --sw-font-body:var(--font-body),system-ui,sans-serif;
    position:relative;color:var(--sw-ink);font-family:var(--sw-font-body);background:var(--sw-bg);touch-action:pan-y;overscroll-behavior-x:none;}
  .sw-viewport{position:sticky;top:0;height:100vh;height:100svh;overflow:hidden;}
  .sw-sky{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:var(--sw-bg);}
  .sw-sky__grad{position:absolute;inset:-10%;background:linear-gradient(178deg,color-mix(in srgb,var(--sw-accent) 8%,var(--sw-bg)) 0%,var(--sw-bg) 55%,color-mix(in srgb,var(--sw-accent) 4%,var(--sw-bg)) 100%);}
  .sw-sky__glow{position:absolute;inset:0;background:radial-gradient(60% 42% at 74% 16%,color-mix(in srgb,var(--sw-accent) 14%,transparent),transparent 70%);}
  .sw-stage{position:absolute;inset:0;z-index:10;pointer-events:none;}
  .sw-scene{position:absolute;inset:0;opacity:0;overflow:hidden;will-change:opacity;transition:opacity .18s ease-out;}
  .sw-scene__video,.sw-scene__still{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 42%;}
  .sw-scene__still{will-change:transform;}
  .sw-scene.has-clip .sw-scene__still{opacity:0;}
  .sw-scene__video{z-index:1;}
  .sw-copylayer{position:absolute;inset:0;z-index:50;pointer-events:none;}
  .sw-copylayer::before{content:"";position:absolute;inset:0;width:min(58vw,780px);background:linear-gradient(90deg,color-mix(in srgb,var(--sw-bg) 92%,transparent) 0%,color-mix(in srgb,var(--sw-bg) 68%,transparent) 34%,color-mix(in srgb,var(--sw-bg) 28%,transparent) 62%,transparent 100%);}
  .sw-copy{position:absolute;left:clamp(18px,5vw,64px);top:50%;transform:translateY(-50%);width:min(42vw,460px);opacity:0;will-change:opacity,transform;}
  .sw-copy__num{font-family:ui-monospace,Menlo,monospace;font-size:.74rem;letter-spacing:.12em;color:var(--sw-ink-soft);}
  .sw-copy__eyebrow{display:block;margin-top:16px;font-family:var(--sw-font-body);font-weight:600;font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;color:var(--sw-accent);}
  .sw-copy__title{font-family:var(--sw-font-display);font-weight:400;color:var(--sw-ink);font-size:clamp(2rem,4.2vw,3.3rem);line-height:1.05;margin:12px 0 0;letter-spacing:-.01em;text-shadow:0 2px 20px color-mix(in srgb,var(--sw-bg) 70%,transparent);}
  .sw-copy__body{margin-top:16px;font-size:clamp(1rem,1.2vw,1.12rem);line-height:1.55;color:color-mix(in srgb,var(--sw-ink) 80%,var(--sw-ink-soft));max-width:40ch;text-shadow:0 1px 12px color-mix(in srgb,var(--sw-bg) 90%,transparent);}
  .sw-copy__media{margin-top:20px;}
  .sw-copy__media--logo img{height:64px;width:auto;border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.45);}
  .sw-phone{position:relative;width:160px;border-radius:26px;background:#1c1917;padding:6px;box-shadow:0 24px 70px rgba(0,0,0,.6);}
  .sw-phone__btn{position:absolute;width:2px;background:#292524;}
  .sw-phone__btn--l{left:-2px;top:18%;height:34px;border-radius:2px 0 0 2px;}
  .sw-phone__btn--r{right:-2px;top:26%;height:22px;border-radius:0 2px 2px 0;}
  .sw-phone__screen{position:relative;aspect-ratio:10/19;overflow:hidden;border-radius:20px;background:#0c0a09;}
  .sw-phone__screen img{display:block;width:100%;height:auto;}
  .sw-phone__sheen{pointer-events:none;position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.08),transparent 55%);}
  .sw-copy__tags{list-style:none;display:flex;flex-wrap:wrap;gap:8px;margin:20px 0 0;padding:0;}
  .sw-copy__tags li{font-size:.8rem;font-weight:500;color:color-mix(in srgb,var(--sw-accent) 88%,#fff);padding:6px 13px;border-radius:999px;background:color-mix(in srgb,var(--sw-accent) 14%,transparent);border:1px solid color-mix(in srgb,var(--sw-accent) 32%,transparent);}
  .sw-copy__cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px;pointer-events:auto;}
  .sw-btn{text-decoration:none;font-weight:600;font-size:.95rem;padding:13px 26px;border-radius:999px;transition:transform .2s,background .2s;}
  .sw-btn--primary{color:#1a1205;background:var(--sw-accent);}
  .sw-btn--primary:hover{transform:translateY(-2px);background:#ffd24c;}
  .sw-route{position:absolute;right:clamp(14px,2.4vw,30px);top:50%;z-index:60;transform:translateY(-50%);display:flex;flex-direction:column;gap:22px;padding:18px 10px;}
  .sw-route::before{content:"";position:absolute;left:50%;top:22px;bottom:22px;width:2px;transform:translateX(-50%);background:var(--sw-accent);opacity:.28;}
  .sw-route__dot{position:relative;border:0;background:transparent;cursor:pointer;width:14px;height:14px;display:grid;place-items:center;}
  .sw-route__dot i{width:9px;height:9px;border-radius:50%;background:color-mix(in srgb,var(--sw-accent) 40%,transparent);transition:transform .3s,background .3s,box-shadow .3s;}
  .sw-route__dot:hover i{transform:scale(1.25);background:var(--sw-accent);}
  .sw-route__dot.is-active i{background:var(--sw-accent);transform:scale(1.4);box-shadow:0 0 0 5px color-mix(in srgb,var(--sw-accent) 22%,transparent);}
  .sw-route__label{position:absolute;right:24px;top:50%;transform:translateY(-50%) translateX(6px);white-space:nowrap;font-size:.78rem;font-weight:500;color:var(--sw-ink);background:rgba(12,10,9,.78);backdrop-filter:blur(6px);padding:5px 11px;border-radius:999px;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;border:1px solid color-mix(in srgb,var(--sw-accent) 20%,transparent);}
  .sw-route__dot:hover .sw-route__label,.sw-route__dot.is-active .sw-route__label{opacity:1;transform:translateY(-50%) translateX(0);}
  .sw-hint{position:absolute;left:50%;bottom:26px;z-index:55;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;font-size:.74rem;letter-spacing:.14em;text-transform:uppercase;color:var(--sw-ink);transition:opacity .3s;pointer-events:none;padding:12px 20px;border-radius:22px;background:rgba(12,10,9,.42);backdrop-filter:blur(12px) saturate(1.2);-webkit-backdrop-filter:blur(12px) saturate(1.2);border:1px solid rgba(255,255,255,.14);box-shadow:0 8px 28px rgba(0,0,0,.35);text-shadow:0 1px 8px rgba(0,0,0,.6);}
  .sw-hint i{width:22px;height:34px;border-radius:12px;border:2px solid color-mix(in srgb,var(--sw-ink) 28%,transparent);position:relative;}
  .sw-hint i::after{content:"";position:absolute;left:50%;top:7px;width:4px;height:7px;border-radius:2px;background:var(--sw-accent);transform:translateX(-50%);animation:sw-wheel 1.7s ease-in-out infinite;}
  @keyframes sw-wheel{0%{opacity:0;top:6px}40%{opacity:1}100%{opacity:0;top:17px}}
  @media (max-width:860px){
    .sw-copylayer::before{width:100%;height:62%;top:auto;bottom:0;background:linear-gradient(0deg,color-mix(in srgb,var(--sw-bg) 94%,transparent) 8%,color-mix(in srgb,var(--sw-bg) 64%,transparent) 46%,transparent 100%);}
    .sw-copy{left:clamp(18px,5vw,64px);right:clamp(18px,5vw,64px);top:auto;bottom:clamp(64px,14vh,120px);transform:none;width:auto;max-width:560px;}
    .sw-copy{bottom:calc(clamp(56px,12vh,110px) + env(safe-area-inset-bottom));bottom:calc(clamp(56px,12svh,110px) + env(safe-area-inset-bottom));}
    .sw-copy__title{font-size:clamp(1.7rem,7vw,2.4rem);}
    .sw-copy__body{max-width:none;font-size:clamp(.95rem,3.4vw,1.05rem);}
    .sw-copy__media--logo img{height:48px;}
    .sw-phone{width:108px;border-radius:20px;padding:5px;}
    .sw-phone__screen{border-radius:15px;}
    .sw-phone__btn--l{height:26px;}
    .sw-phone__btn--r{height:17px;}
    .sw-scene__video,.sw-scene__still{object-position:center 46%;}
    /* Sits below the TornEdge seam overlay (64px tall on mobile) */
    .sw-hint{left:20px;right:auto;top:calc(76px + env(safe-area-inset-top));bottom:auto;transform:none;flex-direction:row;gap:8px;padding:8px 14px;border-radius:999px;}
    .sw-hint i{width:18px;height:28px;transform:scale(.82);transform-origin:center;}
    .sw-route{gap:16px;right:6px;}
    .sw-route__label{display:none;}
  }
  @media (max-width:860px) and (orientation:portrait){
    .sw-scene__video,.sw-scene__still{object-position:center 44%;}
  }
  @media (hover:none) and (pointer:coarse){
    .sw-route{padding:14px 6px;}
    .sw-route__dot{width:28px;height:28px;}
    .sw-btn{padding:15px 26px;}
  }
  @media (prefers-reduced-motion:reduce){ .sw-hint i::after{animation:none;} }
  `;
  const style = document.createElement("style");
  style.id = "sw-css";
  style.textContent = css;
  document.head.appendChild(style);
}
