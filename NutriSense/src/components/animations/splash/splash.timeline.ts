export const SPLASH_TIMELINE = {
  DURATION_MS: 5000,
  
  BEATS: {
    // 0–700 ms (Morning): Drop plate from y=5 → 0 (Spring 1.2), apply 3 spins (easeOutExpo). Kolam draws itself.
    MORNING_START: 0,
    MORNING_END: 700,

    // 700–1400 ms (Served): Six items pop into the thali sequentially based on their polar position (Spring 1.05). Small scale-bounce (0 → 1.1 → 1).
    SERVED_START: 700,
    SERVED_END: 1400,

    // 1400–2800 ms (Understand): Thali yaws smoothly (-15° → 15°). Mint-white scan beam translates over it.
    SCAN_START: 1400,
    SCAN_END: 2800,

    // 2800–3600 ms (Balance): 6 bright arcs grow around the items. A glowing leaf mark appears in the center.
    BALANCE_START: 2800,
    BALANCE_END: 3600,

    // 3600–4400 ms (Reveal): Everything idles and slightly drifts. Wordmark rises.
    REVEAL_START: 3600,
    REVEAL_END: 4400,

    // 4400–5000 ms (Promise): App content crossfades in underneath.
    PROMISE_START: 4400,
    PROMISE_END: 5000,
    WIPE_START: 4750,
  }
} as const;
