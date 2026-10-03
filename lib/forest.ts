// Builds the forest silhouettes for the hero scene as SVG path strings.
// It runs on the server (see app/page.tsx), so none of this code is sent to the visitor's browser:
// they only receive the finished shapes.

export const WORLD = { width: 3200, height: 900 };

// Where the server stands. The closest tree line leaves a clearing around this point.
const CLEARING_X = WORLD.width / 2;

// A tiny seeded random number generator ("mulberry32"). Unlike Math.random() it gives the same
// numbers every time for the same seed, so the forest looks identical on every visit.
function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Ridge = (x: number) => number;

// Each ridge is a couple of sine waves added together, which gives a natural rolling line.
// y grows downwards in SVG, so a smaller number is higher up.
const ridges: Record<"mountains" | "ridge" | "forest" | "near", Ridge> = {
  mountains: (x) =>
    575 - 70 * Math.sin(x * 0.0021 + 0.6) - 35 * Math.sin(x * 0.0057 + 2.1) - 12 * Math.sin(x * 0.013),
  ridge: (x) => 655 + 22 * Math.sin(x * 0.004 + 1) + 10 * Math.sin(x * 0.011),
  forest: (x) => 735 + 18 * Math.sin(x * 0.0033 + 4) + 8 * Math.sin(x * 0.009 + 1),
  near: (x) =>
    822 + 10 * Math.sin(x * 0.0028 + 2) + 5 * Math.sin(x * 0.008) + 12 * Math.exp(-(((x - CLEARING_X) / 170) ** 2)),
};

// The ground under a tree line: follow the ridge left to right, then close the shape along the bottom.
function ground(ridge: Ridge, step: number) {
  let path = `M0,${WORLD.height}`;
  for (let x = 0; x <= WORLD.width; x += step) path += `L${x},${Math.round(ridge(x))}`;
  return `${path}L${WORLD.width},${WORLD.height}Z`;
}

// One pine tree: stacked tiers that get narrower towards the tip. We trace the left side going up,
// then mirror those points to come back down the right side.
function pine(cx: number, base: number, height: number, width: number, tiers: number) {
  const left: [number, number][] = [];
  for (let i = 0; i < tiers; i++) {
    const half = (width / 2) * (1 - (i / tiers) * 0.72);
    const y = base - ((height * i) / tiers) * 0.9;
    left.push([cx - half, y + (i > 0 ? height * 0.03 : 12)]); // outer tip of the tier, drooping a little
    if (i < tiers - 1) left.push([cx - half * 0.42, base - ((height * (i + 1)) / tiers) * 0.9]);
  }
  const right = left.map(([x, y]) => [2 * cx - x, y] as [number, number]).reverse();
  const points = [...left, [cx, base - height] as [number, number], ...right];
  return `M${points.map(([x, y]) => `${Math.round(x)},${Math.round(y)}`).join("L")}Z`;
}

type TreeLine = {
  ridge: Ridge;
  seed: number;
  gap: [number, number]; // distance between trees: min, max
  height: [number, number];
  slim: number; // width as a share of height
  tiers: number;
  clearing?: number; // leave this much room on each side of the server
};

function treeLine({ ridge, seed, gap, height, slim, tiers, clearing = 0 }: TreeLine) {
  const random = seededRandom(seed);
  const between = ([min, max]: [number, number]) => min + random() * (max - min);

  let path = ground(ridge, 40);
  for (let x = -20; x < WORLD.width + 20; x += between(gap)) {
    const h = between(height);
    if (Math.abs(x - CLEARING_X) < clearing) continue;
    path += pine(x, ridge(x), h, h * slim, tiers);
  }
  return path;
}

export type Forest = ReturnType<typeof buildForest>;

// Four layers, from the mountains far away to the trees right in front of us.
export function buildForest() {
  return {
    mountains: ground(ridges.mountains, 16),
    ridge: treeLine({ ridge: ridges.ridge, seed: 7, gap: [16, 28], height: [26, 52], slim: 0.5, tiers: 1 }),
    forest: treeLine({ ridge: ridges.forest, seed: 21, gap: [42, 72], height: [80, 135], slim: 0.42, tiers: 3 }),
    near: treeLine({
      ridge: ridges.near,
      seed: 4,
      gap: [95, 150],
      height: [150, 250],
      slim: 0.4,
      tiers: 4,
      clearing: 140,
    }),
    server: { x: CLEARING_X, y: Math.round(ridges.near(CLEARING_X)) + 6 },
  };
}
