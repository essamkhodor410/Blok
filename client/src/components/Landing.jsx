import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Square, ArrowRight, MousePointerClick, Layers, Palette, Globe, Zap, Shapes,
  Type, Image as ImageIcon, LayoutGrid, Check, Github, Twitter, Menu,
} from "lucide-react";

/* reveal-on-scroll */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.14 }
    );
    els.forEach((x) => io.observe(x));
    return () => io.disconnect();
  }, []);
  return ref;
}

export default function Landing() {
  const ref = useReveal();
  return (
    <div className="lp" ref={ref}>
      <Nav />
      <Hero />
      <Marquee />
      <Features />
      <Bento />
      <HowItWorks />
      <Showcase />
      <Pricing />
      <Quote />
      <CTA />
      <Footer />
    </div>
  );
}

/* ---------------- nav ---------------- */
function Nav() {
  return (
    <header className="lp-nav">
      <div className="lp-nav-inner">
        <a href="#top" className="lp-logo"><span className="lp-logo-mark"><Square size={16} color="#fff" fill="#fff" /></span> Blok</a>
        <nav className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#showcase">Showcase</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="lp-nav-cta">
          <Link to="/login" className="lp-link-ghost">Sign in</Link>
          <Link to="/register" className="lp-btn lp-btn-primary">Start building <ArrowRight size={15} /></Link>
        </div>
        <button className="lp-nav-burger" aria-label="Menu"><Menu size={20} /></button>
      </div>
    </header>
  );
}

/* ---------------- hero ---------------- */
function Hero() {
  return (
    <section className="lp-hero" id="top">
      <div className="lp-hero-glow" />
      <div className="lp-hero-inner">
        <div className="lp-hero-copy" data-reveal>
          <span className="lp-eyebrow"><Zap size={13} /> Design, connect &amp; publish — in one place</span>
          <h1>Build the whole website.<br /><em>Block by block.</em></h1>
          <p>Blok is a visual builder with a real backend. Drag blocks onto an infinite canvas, style every pixel, link your pages together, and publish to a live URL — no code required.</p>
          <div className="lp-hero-actions">
            <Link to="/register" className="lp-btn lp-btn-primary lp-btn-lg">Start building free <ArrowRight size={16} /></Link>
            <a href="#showcase" className="lp-btn lp-btn-outline lp-btn-lg">See what’s possible</a>
          </div>
          <div className="lp-hero-note"><Check size={14} /> Free to start · No credit card · Publish in one click</div>
        </div>
        <div className="lp-hero-art" data-reveal>
          <BuilderMock />
        </div>
      </div>
    </section>
  );
}

/* stylized product mock */
function BuilderMock() {
  return (
    <div className="lp-mock">
      <div className="lp-mock-bar">
        <span className="lp-dot r" /><span className="lp-dot y" /><span className="lp-dot g" />
        <div className="lp-mock-url">blok.studio/editor</div>
      </div>
      <div className="lp-mock-body">
        <div className="lp-mock-rail">
          {[Shapes, Type, ImageIcon, LayoutGrid, Palette].map((I, i) => (
            <div key={i} className={`lp-mock-railbtn${i === 0 ? " on" : ""}`}><I size={15} /></div>
          ))}
        </div>
        <div className="lp-mock-canvas">
          <div className="lp-mock-hero">
            <div className="lp-mock-tag">Section</div>
            <div className="lp-mock-h" />
            <div className="lp-mock-p" /><div className="lp-mock-p short" />
            <div className="lp-mock-btn">Get started</div>
          </div>
          <div className="lp-mock-cols">
            <div className="lp-mock-col"><div className="lp-mock-ic" /><div className="lp-mock-sm" /><div className="lp-mock-sm short" /></div>
            <div className="lp-mock-col"><div className="lp-mock-ic" /><div className="lp-mock-sm" /><div className="lp-mock-sm short" /></div>
            <div className="lp-mock-col"><div className="lp-mock-ic" /><div className="lp-mock-sm" /><div className="lp-mock-sm short" /></div>
          </div>
        </div>
        <div className="lp-mock-panel">
          <div className="lp-mock-panel-t">Typography</div>
          <div className="lp-mock-row"><span /><span className="w" /></div>
          <div className="lp-mock-row"><span /><span className="w" /></div>
          <div className="lp-mock-panel-t">Background</div>
          <div className="lp-mock-swatches"><i style={{ background: "#2b59ff" }} /><i style={{ background: "#0b0d12" }} /><i style={{ background: "#10b981" }} /><i style={{ background: "#f97316" }} /></div>
          <div className="lp-mock-slider"><b /></div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- marquee ---------------- */
function Marquee() {
  const words = ["Landing pages", "Portfolios", "Product sites", "Link-in-bio", "Docs", "Events", "Agencies", "Startups", "Newsletters"];
  return (
    <div className="lp-marquee" data-reveal>
      <div className="lp-marquee-label">Made for</div>
      <div className="lp-marquee-track">
        {[...words, ...words].map((w, i) => <span key={i}>{w}<Square size={7} className="lp-marquee-dot" /></span>)}
      </div>
    </div>
  );
}

/* ---------------- features (alternating rows) ---------------- */
const FEATURES = [
  { icon: MousePointerClick, kicker: "Visual editing", title: "Drag, drop, and it’s exactly where you want it", body: "Grab any block from the palette and place it on the canvas. Nest sections, split into columns, and rearrange with a click. What you build is what you ship.", bullets: ["15+ block types", "Nested layouts", "Inline text editing"] },
  { icon: Palette, kicker: "Total control", title: "Style every pixel without touching CSS", body: "Fonts, weights, spacing, gradients, shadows, radius, opacity — every property is a control on the right. Make it minimal or make it loud. It’s yours.", bullets: ["Gradients & shadows", "Per-side spacing", "Live style panel"] },
  { icon: Layers, kicker: "Multi-page", title: "Real websites have more than one page", body: "Add pages, set your home page, and link buttons straight to them. Blok wires up the navigation so every link just works when you publish.", bullets: ["Unlimited pages", "Page linking", "Home routing"] },
];
function Features() {
  return (
    <section className="lp-features" id="features">
      <div className="lp-section-head" data-reveal>
        <span className="lp-eyebrow dark"><Shapes size={13} /> The builder</span>
        <h2>A canvas that keeps up with your ideas</h2>
        <p>Everything you’d expect from a pro design tool, tuned so anyone can use it.</p>
      </div>
      <div className="lp-rows">
        {FEATURES.map((f, i) => (
          <div key={i} className={`lp-row${i % 2 ? " rev" : ""}`} data-reveal>
            <div className="lp-row-copy">
              <span className="lp-row-kicker"><f.icon size={15} /> {f.kicker}</span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
              <ul className="lp-checks">{f.bullets.map((b) => <li key={b}><Check size={15} /> {b}</li>)}</ul>
            </div>
            <div className="lp-row-art"><FeatureArt kind={i} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}
function FeatureArt({ kind }) {
  if (kind === 0) return (
    <div className="lp-fa lp-fa-drag">
      <div className="lp-fa-palette">{[Type, ImageIcon, Square, LayoutGrid].map((I, i) => <div key={i} className="lp-fa-chip"><I size={14} /></div>)}</div>
      <div className="lp-fa-drop"><div className="lp-fa-ghost">Heading</div><div className="lp-fa-line" /><div className="lp-fa-line short" /></div>
    </div>
  );
  if (kind === 1) return (
    <div className="lp-fa lp-fa-style">
      <div className="lp-fa-preview" />
      <div className="lp-fa-controls">
        <div className="lp-fa-ctl"><span>Radius</span><i /></div>
        <div className="lp-fa-ctl"><span>Shadow</span><i style={{ width: "70%" }} /></div>
        <div className="lp-fa-grad" />
      </div>
    </div>
  );
  return (
    <div className="lp-fa lp-fa-pages">
      {["Home", "About", "Pricing", "Contact"].map((p, i) => <div key={p} className={`lp-fa-page${i === 0 ? " on" : ""}`}>{p}</div>)}
      <div className="lp-fa-link">Button → <b>Pricing</b></div>
    </div>
  );
}

/* ---------------- bento ---------------- */
function Bento() {
  return (
    <section className="lp-bento-wrap">
      <div className="lp-bento" data-reveal>
        <div className="lp-bento-cell big">
          <Globe size={22} />
          <h3>Publish to a live URL</h3>
          <p>One click freezes your site into fast, standalone pages and serves them at a shareable link. Re-publish any time you make changes.</p>
          <div className="lp-bento-url">yoursite.blok.studio</div>
        </div>
        <div className="lp-bento-cell">
          <Zap size={20} /><h4>Autosave</h4><p>Every edit is saved as you work.</p>
        </div>
        <div className="lp-bento-cell">
          <Layers size={20} /><h4>Undo history</h4><p>Step back through 60 changes.</p>
        </div>
        <div className="lp-bento-cell wide">
          <LayoutGrid size={20} /><h4>Responsive preview</h4><p>Check desktop, tablet and mobile before you ship — the layout adapts on publish.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- how it works ---------------- */
const STEPS = [
  { n: "01", title: "Create a project", body: "Start from a clean home page. Give it a name — that’s it." },
  { n: "02", title: "Build & style", body: "Drop blocks, edit text inline, and shape every property on the canvas." },
  { n: "03", title: "Publish it", body: "Hit publish and share your live link with the world." },
];
function HowItWorks() {
  return (
    <section className="lp-how" id="how">
      <div className="lp-section-head" data-reveal>
        <span className="lp-eyebrow"><Zap size={13} /> How it works</span>
        <h2>From blank canvas to live in minutes</h2>
      </div>
      <div className="lp-steps">
        {STEPS.map((s, i) => (
          <div key={s.n} className="lp-step" data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
            <div className="lp-step-n">{s.n}</div>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
            {i < STEPS.length - 1 && <ArrowRight className="lp-step-arrow" size={18} />}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- showcase ---------------- */
function Showcase() {
  const shots = [
    { seed: "studio42", label: "Design studio", tall: true },
    { seed: "cafeblue", label: "Local café" },
    { seed: "founderx", label: "SaaS landing" },
    { seed: "gallery9", label: "Portfolio", tall: true },
    { seed: "eventnl", label: "Event page" },
    { seed: "shopmint", label: "Product store" },
  ];
  return (
    <section className="lp-showcase" id="showcase">
      <div className="lp-section-head" data-reveal>
        <span className="lp-eyebrow dark"><ImageIcon size={13} /> Showcase</span>
        <h2>One tool. Every kind of site.</h2>
        <p>These are the sorts of things people build with Blok.</p>
      </div>
      <div className="lp-gallery" data-reveal>
        {shots.map((s) => (
          <figure key={s.seed} className={`lp-shot${s.tall ? " tall" : ""}`}>
            <img src={`https://picsum.photos/seed/${s.seed}/640/${s.tall ? 900 : 560}`} alt={s.label} loading="lazy" />
            <figcaption>{s.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ---------------- pricing ---------------- */
const PLANS = [
  { name: "Free", price: "$0", per: "forever", tagline: "Everything you need to build your first site.", cta: "Start free",
    features: ["1 published project", "Unlimited pages", "All blocks & styles", "Blok subdomain"] },
  { name: "Pro", price: "$12", per: "/ month", tagline: "For makers shipping more than one thing.", highlight: true, cta: "Go Pro",
    features: ["Unlimited projects", "Custom domains", "Remove Blok badge", "Priority publishing", "Version history"] },
  { name: "Studio", price: "$39", per: "/ month", tagline: "For teams and client work.", cta: "Choose Studio",
    features: ["Everything in Pro", "5 team seats", "Shared workspace", "Client hand-off", "Priority support"] },
];
function Pricing() {
  return (
    <section className="lp-pricing" id="pricing">
      <div className="lp-section-head" data-reveal>
        <span className="lp-eyebrow"><Check size={13} /> Pricing</span>
        <h2>Start free. Upgrade when you grow.</h2>
        <p>Simple plans, no surprises. Cancel any time.</p>
      </div>
      <div className="lp-plans">
        {PLANS.map((p) => (
          <div key={p.name} className={`lp-plan${p.highlight ? " hl" : ""}`} data-reveal>
            {p.highlight && <span className="lp-plan-badge">Most popular</span>}
            <h3>{p.name}</h3>
            <div className="lp-plan-price">{p.price}<span>{p.per}</span></div>
            <p className="lp-plan-tag">{p.tagline}</p>
            <Link to="/register" className={`lp-btn ${p.highlight ? "lp-btn-primary" : "lp-btn-outline"} lp-btn-block`}>{p.cta}</Link>
            <ul className="lp-checks">{p.features.map((f) => <li key={f}><Check size={15} /> {f}</li>)}</ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- quote ---------------- */
function Quote() {
  return (
    <section className="lp-quote" data-reveal>
      <div className="lp-quote-mark">“</div>
      <blockquote>I stopped fighting page templates and just built the thing I pictured. Shipped my studio site the same afternoon.</blockquote>
      <div className="lp-quote-by"><span className="lp-quote-avatar">M</span> A designer, on their first Blok site</div>
    </section>
  );
}

/* ---------------- final CTA ---------------- */
function CTA() {
  return (
    <section className="lp-cta" data-reveal>
      <div className="lp-cta-inner">
        <h2>Your idea deserves a real website.</h2>
        <p>Open the canvas and start building. It’s free to begin.</p>
        <Link to="/register" className="lp-btn lp-btn-light lp-btn-lg">Start building free <ArrowRight size={16} /></Link>
      </div>
    </section>
  );
}

/* ---------------- footer ---------------- */
function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-brand">
          <a href="#top" className="lp-logo"><span className="lp-logo-mark"><Square size={15} color="#fff" fill="#fff" /></span> Blok</a>
          <p>The visual builder for the whole website.</p>
          <div className="lp-footer-social"><a href="#top" aria-label="GitHub"><Github size={17} /></a><a href="#top" aria-label="Twitter"><Twitter size={17} /></a></div>
        </div>
        <div className="lp-footer-cols">
          <div><h5>Product</h5><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#showcase">Showcase</a></div>
          <div><h5>Company</h5><a href="#top">About</a><a href="#top">Blog</a><a href="#top">Careers</a></div>
          <div><h5>Account</h5><Link to="/login">Sign in</Link><Link to="/register">Create account</Link></div>
        </div>
      </div>
      <div className="lp-footer-bottom">© {new Date().getFullYear()} Blok. Built with Blok.</div>
    </footer>
  );
}
