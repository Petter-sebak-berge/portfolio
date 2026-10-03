import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { hasLocale, htmlLang, locales } from "@/lib/i18n";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The serif used for the big headings. It only comes in one weight (400).
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

// This folder is called [lang], so the first part of the address ends up in `params.lang`:
// /no gives "no", /en gives "en". generateStaticParams lists the values that exist, which lets
// Next.js build both pages ahead of time. With dynamicParams off, anything else is a 404.
export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

// Metadata is what search engines and link previews (e.g. on LinkedIn) read about the page.
export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { meta } = getDictionary(lang);

  return {
    metadataBase: new URL("https://www.servereniskogen.no"),
    title: meta.title,
    description: meta.description,
    // Tells search engines that /no and /en are the same page in two languages.
    alternates: {
      canonical: `/${lang}`,
      languages: { nb: "/no", en: "/en", "x-default": "/" },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `/${lang}`,
      siteName: "servereniskogen.no",
      locale: lang === "no" ? "nb_NO" : "en_GB",
      type: "website",
    },
  };
}

// Colours the browser's own bars on phones to match the page.
export const viewport: Viewport = {
  themeColor: "#0a100e",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html
      lang={htmlLang[lang]}
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
