@AGENTS.md

# Portfolio project

Personal portfolio site for Petter (Bergen, Norway), built with Next.js (App Router) + TypeScript + Tailwind CSS.
Code lives on GitHub (Petter-sebak-berge/portfolio), hosting is on Vercel, and the address is
https://www.servereniskogen.no. The site links to my other projects and is used on my CV.

This repository is public. Nothing personal or private belongs in it, including in commit messages.

How to work with me and the rules shared by all my projects are kept in a private overview file outside this
repository, which Claude reads automatically. They are kept only there; don't copy them here.

## Where things are

- `app/[lang]/page.tsx` – the page, at `/no` and `/en`. `lib/dictionaries.ts` holds all text in both languages.
- `proxy.ts` and `lib/i18n.ts` – redirect `/` by the browser's language.
- `app/_components/ForestScene.tsx`, `lib/sky.ts`, `lib/forest.ts` – the forest scene at the top.
- `app/api/weather/route.ts` – fetches Bergen's weather from MET Norway.

## Useful commands

- `npm run dev` – start the local dev server at http://localhost:3000
- `npm run build` – build the production version (the same thing Vercel runs)
- `npm run lint` – check the code for common mistakes
