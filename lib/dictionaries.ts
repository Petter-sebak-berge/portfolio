// Every piece of text on the site, once per language. A "dictionary" maps a name (like `intro.lede`)
// to the words for it. The page picks the Norwegian or the English dictionary and reads from it,
// so the markup in app/[lang]/page.tsx contains no language-specific text at all.
//
// To change wording, edit it here. To add text, add it to BOTH languages: TypeScript will complain
// if the English one is missing something the Norwegian one has (see `Dictionary` at the bottom).

import type { Lang } from "./i18n";

const no = {
  meta: {
    title: "Petter Sebak Berge – Portefølje",
    description: "Petter Sebak Berge fra Bergen bygger verktøy som han kan lære noe av, og for å utfordre seg selv. Helst skal det også bli noe han faktisk får bruk for.",
  },
  nav: {
    home: "servereniskogen, til toppen",
    about: "Om",
    projects: "Prosjekter",
    contact: "Kontakt",
    // The link to the other language is written in that language, so its readers recognise it.
    switchTo: "English",
    switchShort: "EN",
  },
  intro: {
    tagline: "", // empty: the line above the name is left out in Norwegian
    lede: "Jeg bygger verktøy som jeg kan lære noe av, og for å utfordre meg. Helst skal det også bli noe jeg faktisk får bruk for.",
    primary: "Se hva jeg har bygget",
    secondary: "Ta kontakt",
  },
  about: {
    label: "Om meg",
    heading: "Ti år i salg, og alltid dratt mot det tekniske.",
    paragraphs: [
      "Jeg har jobbet med B2B-salg i over ti år. Jeg startet som salgskonsulent og jobbet meg opp til salgssjef. Underveis har jeg ledet team, tatt nye produkter fra idé til lansering, og lært hvordan man får folk fra ulike avdelinger og med ulik teknisk bakgrunn til å jobbe godt sammen.",
      "Jeg har alltid vært dratt mot det tekniske. Jeg har en bachelorgrad i Computer Game Design. Nå lærer jeg webutvikling ved å bygge ekte verktøy, med vekt på API-er og databaser.",
    ],
    facts: [
      { value: "10+ år", label: "i B2B-salg" },
      { value: "Bachelorgrad", label: "Computer Game Design" },
      { value: "API-er og databaser", label: "det jeg lærer nå" },
    ],
  },
  projects: {
    label: "Prosjekter",
    heading: "Ting jeg har bygget",
    d4: {
      title: "D4 Build tool",
      description:
        "Et fanlaget Build verktøy for Diablo IV: legg inn eller importer utstyret til en karakter, se hvordan skaden regnes ut og hva du bør forbedre først.",
      link: "Åpne verktøyet",
    },
    portfolio: {
      title: "Denne porteføljen",
      description:
        "Min personlige nettside. Skogen øverst følger det virkelige dagslyset og været i Bergen, hentet fra Meteorologisk institutts åpne API.",
      link: "Se koden på GitHub",
    },
  },
  principles: {
    label: "Slik bygger jeg",
    items: [
      {
        title: "Bygget med KI, forstått av meg",
        text: "Jeg bygger med Claude Code, og er nøye på å forstå det som havner i koden: hva hver del gjør, og hvorfor den er der.",
      },
      {
        title: "Hemmeligheter holdes utenfor koden",
        text: "Passord, nøkler og tokens ligger i miljøvariabler, aldri i kodelageret.",
      },
      {
        title: "Git fra første linje",
        text: "Alt er versjonert fra start, så enhver endring kan rulles tilbake.",
      },
    ],
  },
  contact: {
    label: "Kontakt",
    heading: "Si hei",
    text: "Den enkleste måten å nå meg på er e-post.",
    githubBefore: "Du finner meg også på ",
    githubAfter: ".",
  },
  footer: {
    place: "Bergen, Norge",
    weatherBefore: "Værdata fra ",
    weatherSource: "Meteorologisk institutt",
  },
  // The text inside the forest scene. {n} is replaced with a number.
  scene: {
    live: "DIREKTE",
    preview: "FORHÅNDSVISNING",
    sunAbove: "Solen {n}° over horisonten",
    sunBelow: "Solen {n}° under horisonten",
    open: "Endre himmelen",
    close: "Lukk",
    time: "Klokken i Bergen",
    weather: "Vær",
    presets: { clear: "Klart", cloudy: "Skyet", rain: "Regn", snow: "Snø" },
    backToLive: "Tilbake til direkte",
  },
};

const en: Dictionary = {
  meta: {
    title: "Petter Sebak Berge – Portfolio",
    description: "Petter Sebak Berge from Bergen, Norway, builds tools he can learn something from, and to challenge himself. Ideally it also turns into something he'll actually use.",
  },
  nav: {
    home: "servereniskogen, back to the top",
    about: "About",
    projects: "Projects",
    contact: "Contact",
    switchTo: "Norsk",
    switchShort: "NO",
  },
  intro: {
    tagline: "Norwegian for “the server in the forest”",
    lede: "I build tools I can learn something from, and to challenge myself. Ideally it also turns into something I'll actually use.",
    primary: "See what I've built",
    secondary: "Get in touch",
  },
  about: {
    label: "About",
    heading: "Ten years in sales, and always drawn to the technical side.",
    paragraphs: [
      "I've worked in B2B sales for more than ten years, starting as a sales consultant and working my way up to Sales Manager. Along the way I've led teams, taken new products from idea to launch, and learned how to get people from different departments and technical backgrounds working well together.",
      "I've always been drawn to the technical side. I have a bachelor's degree in Computer Game Design. Now I'm learning web development by building real tools, with a focus on APIs and databases.",
    ],
    facts: [
      { value: "10+ years", label: "in B2B sales" },
      { value: "Bachelor's degree", label: "Computer Game Design" },
      { value: "APIs & databases", label: "what I'm learning now" },
    ],
  },
  projects: {
    label: "Projects",
    heading: "Things I've built",
    d4: {
      title: "D4 Build tool",
      description:
        "A fan-made build tool for Diablo IV: enter or import a character's gear, see how the damage is calculated and what to improve next.",
      link: "Open the tool",
    },
    portfolio: {
      title: "This portfolio",
      description:
        "My personal site. The forest at the top follows Bergen's real daylight and weather, fetched from MET Norway's open API.",
      link: "View the code on GitHub",
    },
  },
  principles: {
    label: "How I build",
    items: [
      {
        title: "Built with AI, understood by me",
        text: "I build with Claude Code, and I make a point of understanding what goes in: what each part does and why it is there.",
      },
      {
        title: "Secrets stay out of the code",
        text: "Passwords, keys and tokens live in environment variables, never in the repository.",
      },
      {
        title: "Git from the first line",
        text: "Everything is versioned from the start, so any change can be rolled back.",
      },
    ],
  },
  contact: {
    label: "Contact",
    heading: "Say hello",
    text: "The best way to reach me is by email.",
    githubBefore: "You can also find me on ",
    githubAfter: ".",
  },
  footer: {
    place: "Bergen, Norway",
    weatherBefore: "Weather data from ",
    weatherSource: "MET Norway",
  },
  scene: {
    live: "LIVE",
    preview: "PREVIEW",
    sunAbove: "Sun {n}° above the horizon",
    sunBelow: "Sun {n}° below the horizon",
    open: "Change the sky",
    close: "Close",
    time: "Time in Bergen",
    weather: "Weather",
    presets: { clear: "Clear", cloudy: "Cloudy", rain: "Rain", snow: "Snow" },
    backToLive: "Back to live",
  },
};

// The Norwegian dictionary defines the shape; English has to match it key for key.
export type Dictionary = typeof no;

const dictionaries: Record<Lang, Dictionary> = { no, en };

export const getDictionary = (lang: Lang) => dictionaries[lang];
