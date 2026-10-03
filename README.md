# servereniskogen.no

My personal site, live at [www.servereniskogen.no](https://www.servereniskogen.no).
"Servereniskogen" is Norwegian for "the server in the forest".

## The forest follows Bergen's real sky

The scene at the top of the page is drawn from the current time and weather in Bergen, Norway:

- **Daylight.** The site calculates where the sun is over Bergen right now and colours the sky to match:
  day, sunset, twilight or night, with stars and the moon in its current phase.
- **Weather.** Cloud cover, rain and snow come from [MET Norway](https://api.met.no)'s open forecast API.
- **Try it yourself.** "Change the sky" (or a click on the server) opens a time slider and weather buttons.

## How it is built

[Next.js](https://nextjs.org) (App Router), TypeScript and Tailwind CSS, hosted on Vercel.

| File | What it does |
|---|---|
| `app/[lang]/page.tsx` | The page itself. It exists at `/no` and `/en`. |
| `lib/dictionaries.ts` | All text on the site, once per language. |
| `proxy.ts` and `lib/i18n.ts` | Send a visitor from `/` to Norwegian or English, based on their browser's language. |
| `app/_components/ForestScene.tsx` | The interactive scene: sky, sun, moon, rain, snow and the controls. |
| `lib/sky.ts` | The maths: sun position, moon phase, sky colours and weather codes. |
| `lib/forest.ts` | Generates the tree and mountain shapes. |
| `app/api/weather/route.ts` | A small API endpoint that fetches the weather from MET Norway and caches it for 30 minutes. |

The site stores no personal data and sets no cookies. A visitor's browser talks only to this site; the weather
request to MET Norway is made by the server.

## Run it locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000/no](http://localhost:3000/no) or [/en](http://localhost:3000/en).

## Credits

- Weather data from [MET Norway](https://api.met.no), licensed under CC BY 4.0.
- Built with [Claude Code](https://claude.com/claude-code). I make a point of understanding what goes in.
