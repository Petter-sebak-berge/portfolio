// Everything the hero scene needs to know about the sky, as plain functions with no React in them.
// Given a moment in time and the weather, `computeSky` returns the colours and positions to draw.

export const BERGEN = { lat: 60.39, lon: 5.32 };

// What our own /api/weather endpoint returns.
export type Weather = {
  temperature: number; // °C
  wind: number; // m/s
  cloud: number; // 0 (clear) to 1 (fully overcast)
  symbol: string; // MET Norway's weather code, e.g. "lightrain" or "fair_day"
};

export type Precip = "none" | "rain" | "snow";

/* ------------------------------------------------------------------ */
/* Where is the sun?                                                    */
/* ------------------------------------------------------------------ */

const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;

// Low-precision solar position (the formula from the Astronomical Almanac, good to about 0.01°).
// `elevation` is degrees above the horizon (negative = below). `hourAngle` is degrees from due
// south: negative in the morning, 0 at solar noon, positive in the afternoon.
export function sunPosition(date: Date, lat = BERGEN.lat, lon = BERGEN.lon) {
  const days = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / DAY_MS;
  const meanAnomaly = (357.529 + 0.98560028 * days) * RAD;
  const meanLongitude = 280.459 + 0.98564736 * days;
  const eclipticLongitude =
    (meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * RAD;
  const tilt = (23.439 - 0.00000036 * days) * RAD;

  const rightAscension = Math.atan2(
    Math.cos(tilt) * Math.sin(eclipticLongitude),
    Math.cos(eclipticLongitude),
  );
  const declination = Math.asin(Math.sin(tilt) * Math.sin(eclipticLongitude));

  const siderealHours = 18.697374558 + 24.06570982441908 * days;
  const hourAngle = siderealHours * 15 * RAD + lon * RAD - rightAscension;

  const elevation = Math.asin(
    Math.sin(lat * RAD) * Math.sin(declination) +
      Math.cos(lat * RAD) * Math.cos(declination) * Math.cos(hourAngle),
  );

  // Wrap the hour angle into -180..180 so "morning" is negative and "afternoon" positive.
  const wrapped = ((((hourAngle / RAD + 180) % 360) + 360) % 360) - 180;
  return { elevation: elevation / RAD, hourAngle: wrapped };
}

// 0 = new moon, 0.5 = full moon, then back to 1. Counted from a known new moon (6 Jan 2000).
export function moonPhase(date: Date) {
  const cycles = (date.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / DAY_MS / 29.530588853;
  return cycles - Math.floor(cycles);
}

/* ------------------------------------------------------------------ */
/* Clock helpers (Bergen local time, whatever timezone the visitor is in) */
/* ------------------------------------------------------------------ */

const bergenClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Oslo",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// Minutes since midnight in Bergen, e.g. 14:30 -> 870.
export function bergenMinutes(date: Date) {
  const parts = bergenClock.formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

// The same Bergen day as `now`, but at another time of day. Used by the time slider.
export function atBergenMinutes(now: Date, minutes: number) {
  return new Date(now.getTime() + (minutes - bergenMinutes(now)) * 60_000);
}

export function formatClock(minutes: number) {
  const hours = Math.floor(minutes / 60) % 24;
  return `${String(hours).padStart(2, "0")}:${String(Math.floor(minutes % 60)).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/* Weather codes                                                        */
/* ------------------------------------------------------------------ */

// The words for each kind of weather, in both of the site's languages.
const WEATHER_WORDS = {
  en: {
    plain: { clearsky: "Clear sky", fair: "Fair", partlycloudy: "Partly cloudy", cloudy: "Cloudy", fog: "Fog" },
    kind: { rain: "rain", sleet: "sleet", snow: "snow" },
    showers: { rain: "rain showers", sleet: "sleet showers", snow: "snow showers" },
    // [before a single word, before "showers"]. English uses the same form for both.
    light: ["light ", "light "],
    heavy: ["heavy ", "heavy "],
    thunder: " and thunder",
  },
  no: {
    plain: { clearsky: "Klar himmel", fair: "Lettskyet", partlycloudy: "Delvis skyet", cloudy: "Skyet", fog: "Tåke" },
    kind: { rain: "regn", sleet: "sludd", snow: "snø" },
    showers: { rain: "regnbyger", sleet: "sluddbyger", snow: "snøbyger" },
    // Norwegian adjectives change in the plural: "lett regn" but "lette regnbyger".
    light: ["lett ", "lette "],
    heavy: ["kraftig ", "kraftige "],
    thunder: " og torden",
  },
};

// Turns a MET Norway symbol code such as "lightrainshowers_day" into words plus what to draw.
export function describeSymbol(
  symbol: string,
  lang: keyof typeof WEATHER_WORDS = "en",
): { label: string; precip: Precip; intensity: number } {
  const words = WEATHER_WORDS[lang];
  const code = symbol.split("_")[0]; // drop "_day" / "_night"
  if (code in words.plain) {
    return { label: words.plain[code as keyof typeof words.plain], precip: "none", intensity: 0 };
  }

  const kind = code.includes("snow") ? "snow" : code.includes("sleet") ? "sleet" : "rain";
  const showers = code.includes("showers");
  const strength = code.startsWith("light") ? "light" : code.startsWith("heavy") ? "heavy" : null;
  const label =
    (strength ? words[strength][showers ? 1 : 0] : "") +
    (showers ? words.showers[kind] : words.kind[kind]) +
    (code.includes("thunder") ? words.thunder : "");

  return {
    label: label.charAt(0).toUpperCase() + label.slice(1),
    precip: kind === "snow" ? "snow" : "rain",
    intensity: strength === "light" ? 0.5 : strength === "heavy" ? 1.7 : 1,
  };
}

/* ------------------------------------------------------------------ */
/* Colours                                                              */
/* ------------------------------------------------------------------ */

type Rgb = [number, number, number];

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function toRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

// Pulls a colour towards the grey of the same brightness: this is what cloud cover does to a sky.
function desaturate(color: Rgb, amount: number): Rgb {
  const grey = 0.3 * color[0] + 0.59 * color[1] + 0.11 * color[2];
  return mix(color, [grey, grey, grey], amount);
}

const css = (color: Rgb) => `rgb(${color.map(Math.round).join(" ")})`;

// The palette at four sun heights. Anything in between is blended from its two neighbours.
// Layers get darker the closer they are; the closest one is the page background itself.
const STOPS = [
  { at: -12, top: "#05080f", bottom: "#12232f", mountains: "#0e1b24", ridge: "#0c161b", forest: "#0b1215", stars: 1 },
  { at: -5, top: "#141c3a", bottom: "#a85b52", mountains: "#3a3550", ridge: "#1f2333", forest: "#111a1c", stars: 0.35 },
  { at: 0.5, top: "#4a6d94", bottom: "#f4b27a", mountains: "#6d6f86", ridge: "#34424d", forest: "#15221f", stars: 0 },
  { at: 8, top: "#6fa3c7", bottom: "#d9e8ea", mountains: "#7fa0a6", ridge: "#3f6460", forest: "#183029", stars: 0 },
];

export type Sky = ReturnType<typeof computeSky>;

// `cloud` is 0..1. Returns ready-to-use CSS values for the scene.
export function computeSky(date: Date, cloud: number) {
  const { elevation, hourAngle } = sunPosition(date);

  // Find the two palette stops the sun currently sits between, and how far along we are.
  const upper = STOPS.findIndex((stop) => elevation < stop.at);
  const b = STOPS[upper === -1 ? STOPS.length - 1 : upper];
  const a = STOPS[upper === -1 ? STOPS.length - 1 : Math.max(0, upper - 1)];
  const t = a === b ? 0 : clamp((elevation - a.at) / (b.at - a.at));

  const blend = (key: "top" | "bottom" | "mountains" | "ridge" | "forest", grey: number) =>
    css(desaturate(mix(toRgb(a[key]), toRgb(b[key]), t), cloud * grey));

  const darkness = clamp((8 - elevation) / 20); // 0 in full daylight, 1 at night
  const lowSun = clamp(1 - Math.abs(elevation) / 12); // strongest right at the horizon
  const phase = moonPhase(date);

  return {
    elevation,
    skyTop: blend("top", 0.8),
    skyBottom: blend("bottom", 0.8),
    mountains: blend("mountains", 0.45),
    ridge: blend("ridge", 0.45),
    forest: blend("forest", 0.45),

    // The sun travels left to right (east to west when you face south) and up with its elevation.
    sunX: `${clamp(50 + (hourAngle / 90) * 34, 4, 96).toFixed(1)}%`,
    sunY: `${clamp(62 - elevation * 1.6, 10, 82).toFixed(1)}%`,
    sunColor: css(mix(toRgb("#ffcf8a"), toRgb("#fff8e6"), clamp(elevation / 15))),
    sunOpacity: elevation > -3 ? 1 - cloud * 0.75 : 0,
    halo: `rgb(255 196 120 / ${(lowSun * 0.55 * (1 - cloud * 0.7)).toFixed(2)})`,

    stars: lerp(a.stars, b.stars, t) * (1 - cloud),
    moonOpacity: clamp((-elevation - 2) / 6) * (1 - cloud * 0.85),
    moonX: `${(18 + 64 * ((bergenMinutes(date) / 1440 + 0.5) % 1)).toFixed(1)}%`,
    moonLit: (1 - Math.cos(2 * Math.PI * phase)) / 2, // 0 = new, 1 = full
    moonWaxing: phase < 0.5,

    mist: 0.15 + cloud * 0.4,
    glow: 0.2 + darkness * 0.6, // the server's light shows more in the dark
  };
}
