// The homepage. Each section below is plain JSX: HTML-like markup inside TypeScript.
// It exists in two languages, at /no and /en. All the text comes from lib/dictionaries.ts.

import { notFound } from "next/navigation";
import ForestScene from "../_components/ForestScene";
import { getDictionary } from "@/lib/dictionaries";
import { buildForest } from "@/lib/forest";
import { hasLocale, htmlLang } from "@/lib/i18n";

// Used in the Contact section. Kept in one place so it only needs changing here.
const email = "petter@servereniskogen.no";
const github = "https://github.com/Petter-sebak-berge";

// The small heading above each section. Defined once here so all sections look the same.
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
      <span className="h-px w-8 bg-accent/60" />
      {children}
    </p>
  );
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang); // "t" for "translations": the text in this page's language
  const other = lang === "no" ? "en" : "no";

  // Runs on the server while the page is built: the browser just receives the finished shapes.
  const forest = buildForest();

  // A small list of projects. Keeping data separate from the markup makes it easy to add more later:
  // add the text to both dictionaries, then another object to this array.
  const projects = [
    { ...t.projects.d4, stack: ["HTML", "CSS", "JavaScript"], href: "https://d4.servereniskogen.no" },
    { ...t.projects.portfolio, stack: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"], href: github },
  ];

  const sections = [
    { id: "about", label: t.nav.about },
    { id: "projects", label: t.nav.projects },
    { id: "contact", label: t.nav.contact },
  ];

  return (
    <>
      <header id="top" className="relative">
        {/* "fixed" pins the navigation to the top of the window, so it stays in view while scrolling.
            The empty space between the two pills lets clicks through to whatever is underneath. */}
        <nav className="pointer-events-none fixed inset-x-0 top-0 z-50 mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-5 pt-4 sm:px-8">
          <a
            href="#top"
            aria-label={t.nav.home}
            className="glass pointer-events-auto flex min-h-10 items-center gap-2 rounded-full px-3.5 py-2 font-mono text-xs tracking-wide"
          >
            <svg viewBox="0 0 18 22" className="h-4 w-auto fill-accent" aria-hidden="true">
              <path d="M9 0 2.5 9h3L0 17h6.5v5h5v-5H18l-5.5-8h3z" />
            </svg>
            {/* On phones there is only room for the tree */}
            <span className="hidden sm:inline">servereniskogen</span>
          </a>
          <ul className="glass pointer-events-auto flex items-center rounded-full px-2 text-sm">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="block whitespace-nowrap px-2 py-2 text-ink/80 transition-colors hover:text-accent sm:px-3.5"
                >
                  {section.label}
                </a>
              </li>
            ))}
            {/* The language switch. hrefLang and lang tell browsers and screen readers that the
                link, and its label, are in the other language. */}
            <li className="ml-1 border-l border-ink/15 pl-1">
              <a
                href={`/${other}`}
                hrefLang={htmlLang[other]}
                lang={htmlLang[other]}
                aria-label={t.nav.switchTo}
                title={t.nav.switchTo}
                className="block px-2 py-2 font-mono text-xs text-accent transition-colors hover:text-ink sm:px-3"
              >
                {t.nav.switchShort}
              </a>
            </li>
          </ul>
        </nav>

        <ForestScene forest={forest} lang={lang} labels={t.scene} />

        {/* Intro */}
        <div className="relative z-10 mx-auto mt-2 w-full max-w-5xl px-5 sm:px-8">
          {t.intro.tagline && (
            <p className="font-mono text-xs leading-6 text-muted sm:text-sm">
              <span className="text-accent">servereniskogen</span> · {t.intro.tagline}
            </p>
          )}
          <h1 className="mt-3 text-balance font-display text-[clamp(3rem,10vw,7rem)] leading-[0.95] tracking-tight">
            Petter Sebak Berge
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">
            {t.intro.lede}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#projects"
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5"
            >
              {t.intro.primary}
            </a>
            <a
              href="#contact"
              className="rounded-full border border-line px-6 py-3 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
            >
              {t.intro.secondary}
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 sm:px-8">
        {/* About */}
        <section id="about" className="reveal scroll-mt-24 pt-24 sm:pt-32">
          <SectionLabel>{t.about.label}</SectionLabel>
          <div className="mt-6 grid gap-10 md:grid-cols-[1.4fr_1fr] md:gap-16">
            <div>
              <h2 className="text-balance font-display text-4xl leading-tight sm:text-5xl">
                {t.about.heading}
              </h2>
              {t.about.paragraphs.map((paragraph, index) => (
                <p key={index} className={`leading-8 text-muted ${index === 0 ? "mt-6" : "mt-4"}`}>
                  {paragraph}
                </p>
              ))}
            </div>

            {/* <dl> is a "description list": the right HTML element for label/value pairs */}
            <dl className="grid grid-cols-2 content-start gap-x-6 gap-y-8 md:grid-cols-1 md:border-l md:border-line md:pl-10">
              {t.about.facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="font-display text-2xl sm:text-3xl">{fact.value}</dt>
                  <dd className="mt-1 text-sm text-muted">{fact.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Projects: .map() turns each item in the array into a list element */}
        <section id="projects" className="reveal scroll-mt-24 pt-24 sm:pt-32">
          <SectionLabel>{t.projects.label}</SectionLabel>
          <h2 className="mt-6 font-display text-4xl leading-tight sm:text-5xl">{t.projects.heading}</h2>
          <ul className="mt-10 grid gap-5 md:grid-cols-2">
            {projects.map((project) => (
              <li
                key={project.title}
                className="group relative flex flex-col rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-accent/60 sm:p-8"
              >
                <h3 className="font-display text-3xl">{project.title}</h3>
                <p className="mt-3 leading-7 text-muted">{project.description}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {project.stack.map((tech) => (
                    <li
                      key={tech}
                      className="rounded-full border border-line px-3 py-1 font-mono text-xs text-muted"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
                {/* The empty ::after element stretches over the whole card, so the entire card is clickable */}
                {/* target="_blank" opens the link in a new tab. rel="noopener noreferrer" stops the
                    page that opens from being able to control this one. */}
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 pt-2 text-sm font-semibold text-accent after:absolute after:inset-0 after:rounded-2xl md:mt-auto md:pt-8"
                >
                  {project.link}
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* How I build */}
        <section className="reveal pt-24 sm:pt-32">
          <SectionLabel>{t.principles.label}</SectionLabel>
          <ol className="mt-8 grid gap-8 border-t border-line pt-8 md:grid-cols-3 md:gap-10">
            {t.principles.items.map((principle, index) => (
              <li key={principle.title}>
                <span className="font-mono text-xs text-muted">0{index + 1}</span>
                <h3 className="mt-2 font-display text-2xl leading-snug">{principle.title}</h3>
                <p className="mt-3 leading-7 text-muted">{principle.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Contact */}
        <section id="contact" className="reveal scroll-mt-24 py-24 sm:py-32">
          <SectionLabel>{t.contact.label}</SectionLabel>
          <h2 className="mt-6 font-display text-4xl leading-tight sm:text-5xl">{t.contact.heading}</h2>
          <p className="mt-4 max-w-xl leading-8 text-muted">{t.contact.text}</p>
          {/* A "mailto:" link opens the visitor's email app with my address filled in */}
          <a
            href={`mailto:${email}`}
            className="mt-6 inline-block break-all font-display text-[clamp(1.6rem,6vw,3.5rem)] leading-tight underline decoration-accent/50 decoration-2 underline-offset-8 transition-colors hover:text-accent"
          >
            {email}
          </a>
          <p className="mt-6 text-muted">
            {t.contact.githubBefore}
            <a href={github} className="font-medium text-ink underline underline-offset-4 hover:text-accent">
              GitHub
            </a>
            {t.contact.githubAfter}
          </p>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-5 py-8 text-xs text-muted sm:flex-row sm:justify-between sm:px-8">
          <p>
            © {new Date().getFullYear()} Petter Sebak Berge · {t.footer.place}
          </p>
          <p>
            {t.footer.weatherBefore}
            <a href="https://api.met.no" className="underline underline-offset-4 hover:text-accent">
              {t.footer.weatherSource}
            </a>{" "}
            (CC BY 4.0)
          </p>
        </div>
      </footer>
    </>
  );
}
