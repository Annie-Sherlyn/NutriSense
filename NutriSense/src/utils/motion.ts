// Seeded PRNG to ensure reproducibility (no raw Math.random in animation)
export class PRNG {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

export const prng = new PRNG(12345);

// Easing functions
export const easeOutBack = (x: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

// Custom overshoot spring (e.g., overshoot = 1.2)
export const easeOutSpring = (x: number, overshoot: number = 1.2): number => {
  const c1 = overshoot;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export const easeInOutCubic = (x: number): number => {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export const easeOutExpo = (x: number): number => {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
};

export const easeOutElastic = (x: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
};

// Math utils
export const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
export const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

// Map progress 0-1 across a time range [start, end]
export const mapTime = (t: number, start: number, end: number): number => {
  return clamp((t - start) / (end - start), 0, 1);
};

// Framer Motion shared springs
export const springTransition = {
  type: 'spring',
  stiffness: 260,
  damping: 16,
};

export const springJelly = {
  type: 'spring',
  stiffness: 300,
  damping: 10,
};
