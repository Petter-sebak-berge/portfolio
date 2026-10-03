"use client";
// "use client" makes this a Client Component: it runs in the visitor's browser, which it has to,
// because it needs their clock, a <canvas> and click handlers. The rest of the page stays on the server.

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import type { Dictionary } from "../../lib/dictionaries";
import { WORLD, type Forest } from "../../lib/forest";
import type { Lang } from "../../lib/i18n";
import {
  atBergenMinutes,
  bergenMinutes,
  computeSky,
  describeSymbol,
  formatClock,
  type Precip,
  type Weather,
} from "../../lib/sky";

// The weather buttons in the "Change the sky" panel. `null` in state means "use the live weather".
// Their names come from the dictionary, so they follow the page's language.
const PRESETS = {
  clear: { cloud: 0.05, precip: "none" },
  cloudy: { cloud: 0.9, precip: "none" },
  rain: { cloud: 0.95, precip: "rain" },
  snow: { cloud: 0.9, precip: "snow" },
} satisfies Record<string, { cloud: number; precip: Precip }>;
type Preset = keyof typeof PRESETS;

// A clock React can subscribe to. It ticks twice a minute and reports the current minute.
// On the server there is no "now" for the visitor, so the server snapshot is null and the scene
// stays hidden until the browser takes over. That avoids a mismatch between the two renders.
const subscribeToClock = (onTick: () => void) => {
  const id = setInterval(onTick, 30_000);
  return () => clearInterval(id);
};
const currentMinute = () => Math.floor(Date.now() / 60_000);
const noMinuteOnServer = () => null;

// Star positions, picked once. Values are shares of the scene's width and height.
const STARS = Array.from({ length: 90 }, (_, i) => {
  const pseudo = (n: number) => Math.abs(Math.sin(i * 127.1 + n * 311.7) * 43758.5453) % 1;
  return { x: pseudo(1), y: pseudo(2) * 0.6, size: 0.4 + pseudo(3) * 0.9, alpha: 0.35 + pseudo(4) * 0.65 };
});

type Props = {
  forest: Forest;
  lang: Lang;
  labels: Dictionary["scene"]; // the scene's text, in the page's language
};

export default function ForestScene({ forest, lang, labels }: Props) {
  const minute = useSyncExternalStore<number | null>(subscribeToClock, currentMinute, noMinuteOnServer);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [scrub, setScrub] = useState<number | null>(null); // minutes since midnight, when the slider is used
  const [preset, setPreset] = useState<Preset | null>(null);
  const [open, setOpen] = useState(false);

  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Ask our own API for Bergen's weather once, when the page has loaded.
  useEffect(() => {
    fetch("/api/weather")
      .then((response) => (response.ok ? response.json() : null))
      .then(setWeather)
      .catch(() => setWeather(null)); // no weather is fine: the sky still follows the sun
  }, []);

  // Work out what to draw from the time and the weather.
  const ready = minute !== null;
  const now = new Date((minute ?? 0) * 60_000);
  const shown = scrub === null ? now : atBergenMinutes(now, scrub);
  const live = weather ? describeSymbol(weather.symbol, lang) : null;
  const cloud = preset ? PRESETS[preset].cloud : (weather?.cloud ?? 0.3);
  const precip: Precip = preset ? PRESETS[preset].precip : (live?.precip ?? "none");
  const intensity = preset ? 1 : (live?.intensity ?? 0);
  const wind = weather?.wind ?? 3;
  const sky = computeSky(shown, cloud);
  const isLive = scrub === null && preset === null;
  const sunHeight = Math.round(sky.elevation);

  // Rain, snow and stars are drawn on a <canvas>, which is much cheaper than hundreds of HTML elements.
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const slant = Math.min(0.5, wind / 14);
    let width = 0;
    let height = 0;
    let frame = 0;
    let last = 0;
    let visible = true;
    let flakes: { x: number; y: number; size: number; speed: number }[] = [];

    const draw = (time: number) => {
      const step = Math.min(0.05, (time - last) / 1000 || 0); // seconds since the previous frame
      last = time;
      context.clearRect(0, 0, width, height);

      context.fillStyle = "#fff";
      for (const star of STARS) {
        context.globalAlpha = star.alpha * sky.stars;
        context.fillRect(star.x * width, star.y * height, star.size, star.size);
      }

      context.globalAlpha = precip === "snow" ? 0.8 : 0.35;
      context.strokeStyle = "#cfe0e6";
      context.lineWidth = 1;
      context.beginPath();
      for (const flake of flakes) {
        flake.y += flake.speed * step;
        flake.x += flake.speed * slant * step;
        if (flake.y > height) flake.y = -20;
        if (flake.x > width) flake.x = 0;
        if (precip === "snow") {
          context.moveTo(flake.x + flake.size, flake.y);
          context.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        } else {
          context.moveTo(flake.x, flake.y);
          context.lineTo(flake.x - slant * flake.size * 9, flake.y - flake.size * 9);
        }
      }
      if (precip === "snow") context.fill();
      else context.stroke();

      if (precip !== "none" && !still && visible) frame = requestAnimationFrame(draw);
    };

    const resize = () => {
      const pixels = Math.min(window.devicePixelRatio || 1, 2); // sharp on phone screens
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * pixels;
      canvas.height = height * pixels;
      context.setTransform(pixels, 0, 0, pixels, 0, 0);

      const count = precip === "none" ? 0 : Math.round(Math.max(40, (width / 1000) * 150) * intensity);
      flakes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 0.8 + Math.random() * 1.4,
        speed: precip === "snow" ? 30 + Math.random() * 40 : 520 + Math.random() * 380,
      }));
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };

    // Redraw when the scene changes size, and pause the animation while it is scrolled out of view.
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(canvas);
    const viewObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(frame);
      if (visible) frame = requestAnimationFrame(draw);
    });
    viewObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      viewObserver.disconnect();
    };
  }, [precip, intensity, wind, sky.stars]);

  // Parallax: as you scroll, far layers slide more than near ones, which gives a sense of depth.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const progress = Math.min(1, Math.max(0, window.scrollY / scene.offsetHeight));
        scene.style.setProperty("--shift", progress.toFixed(3));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // The colours travel to the stylesheet as CSS variables (see the "Forest scene" part of globals.css).
  const variables = {
    "--sky-top": sky.skyTop,
    "--sky-bottom": sky.skyBottom,
    "--c-mountains": sky.mountains,
    "--c-ridge": sky.ridge,
    "--c-forest": sky.forest,
    "--sun-x": sky.sunX,
    "--sun-y": sky.sunY,
    "--sun-color": sky.sunColor,
    "--sun-opacity": sky.sunOpacity,
    "--halo": sky.halo,
    "--moon-x": sky.moonX,
    "--moon-opacity": sky.moonOpacity,
    "--moon-lit": `${(sky.moonWaxing ? -1 : 1) * sky.moonLit * 2.25}rem`,
    "--mist": sky.mist,
    "--glow": sky.glow,
  } as CSSProperties;

  return (
    <div ref={sceneRef} className="scene" data-ready={ready} style={variables}>
      <div className="scene-fade absolute inset-0">
        <div className="scene-sky" />
        <div className="scene-sun" />
        <div className="scene-moon" />

        {/* The drawing is 3200 x 900 units. "slice" scales it to cover the box and crops the sides,
            so phones see the middle of the forest and wide screens see more of it. */}
        <svg
          className="scene-svg"
          viewBox={`0 0 ${WORLD.width} ${WORLD.height}`}
          preserveAspectRatio="xMidYMax slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: "var(--sky-bottom)", stopOpacity: 0 }} />
              <stop offset="0.6" style={{ stopColor: "var(--sky-bottom)", stopOpacity: "var(--mist)" }} />
              <stop offset="1" style={{ stopColor: "var(--sky-bottom)", stopOpacity: 0 }} />
            </linearGradient>
            <radialGradient id="glow">
              <stop offset="0" stopColor="#f2b544" stopOpacity="0.9" />
              <stop offset="0.35" stopColor="#f2b544" stopOpacity="0.25" />
              <stop offset="1" stopColor="#f2b544" stopOpacity="0" />
            </radialGradient>
          </defs>

          <path className="layer layer-mountains" d={forest.mountains} />
          <path className="layer layer-ridge" d={forest.ridge} />
          <rect className="layer layer-ridge" style={{ fill: "url(#mist)" }} y="560" width={WORLD.width} height="230" />
          <path className="layer layer-forest" d={forest.forest} />

          {/* The server in the forest. Clicking it opens the sky controls. */}
          <g
            className="server"
            transform={`translate(${forest.server.x} ${forest.server.y}) scale(1.45)`}
            onClick={() => setOpen((value) => !value)}
          >
            <circle className="server-glow" cy="-60" r="230" fill="url(#glow)" />
            <rect x="-34" y="-118" width="68" height="118" rx="4" fill="#0e1613" stroke="#2c3b34" strokeWidth="2" />
            {[0, 1, 2, 3, 4].map((unit) => (
              <g key={unit} transform={`translate(-28 ${-112 + unit * 22})`}>
                <rect width="56" height="18" rx="2" fill="#18241f" />
                <circle className="led" cx="8" cy="9" r="2.6" style={{ animationDelay: `${unit * -0.7}s` }} />
                <circle cx="17" cy="9" r="2.6" fill={unit === 1 ? "#f2b544" : "#2c3b34"} />
                <rect x="28" y="6" width="22" height="2" fill="#2c3b34" />
                <rect x="28" y="10" width="22" height="2" fill="#2c3b34" />
              </g>
            ))}
          </g>

          <path className="layer-near" d={forest.near} />
        </svg>

        <canvas ref={canvasRef} className="scene-weather" aria-hidden="true" />
      </div>

      {/* The readout: what the sky is showing right now, plus the controls to play with it. */}
      <div className="scene-fade absolute inset-x-0 top-[4.5rem] z-10 mx-auto w-full max-w-5xl px-5 sm:px-8">
        <div className="glass inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl py-1.5 pl-3.5 pr-1.5 font-mono text-xs text-ink">
          <span className="flex items-center gap-2 tracking-widest">
            <span className={`h-2 w-2 rounded-full ${isLive ? "live-dot bg-led" : "bg-accent"}`} />
            {isLive ? labels.live : labels.preview}
          </span>
          <span>Bergen {formatClock(bergenMinutes(shown))}</span>
          {preset ? (
            <span>{labels.presets[preset]}</span>
          ) : (
            weather && (
              <span>
                {Math.round(weather.temperature)}°C · {live?.label}
              </span>
            )
          )}
          <span className="hidden text-muted sm:inline">
            {(sunHeight >= 0 ? labels.sunAbove : labels.sunBelow).replace("{n}", String(Math.abs(sunHeight)))}
          </span>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="sky-controls"
            className="min-h-10 rounded-xl bg-ink/10 px-3 py-2 font-sans text-xs font-medium transition-colors hover:bg-ink/20"
          >
            {open ? labels.close : labels.open}
          </button>
        </div>

        {open && (
          <div id="sky-controls" className="glass mt-2 w-full max-w-sm rounded-2xl p-4 text-sm text-ink">
            <label className="flex items-center justify-between gap-3" htmlFor="sky-time">
              <span>{labels.time}</span>
              <span className="font-mono text-accent">{formatClock(scrub ?? bergenMinutes(now))}</span>
            </label>
            <input
              id="sky-time"
              type="range"
              min={0}
              max={1435}
              step={5}
              value={scrub ?? bergenMinutes(now)}
              onChange={(event) => setScrub(Number(event.target.value))}
              className="mt-2 h-8 w-full accent-accent"
            />

            <p className="mt-3">{labels.weather}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(PRESETS) as Preset[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPreset(preset === key ? null : key)}
                  aria-pressed={preset === key}
                  className={`rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                    preset === key
                      ? "border-accent bg-accent text-bg"
                      : "border-ink/20 hover:border-ink/50"
                  }`}
                >
                  {labels.presets[key]}
                </button>
              ))}
            </div>

            {!isLive && (
              <button
                type="button"
                onClick={() => {
                  setScrub(null);
                  setPreset(null);
                }}
                className="mt-4 text-xs font-medium text-accent underline underline-offset-4"
              >
                {labels.backToLive}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
