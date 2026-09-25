# Splash Screen Progress (The Living Thali)

- [x] **1. Foundations:** tokens import, `utils/motion.ts`, `splash.timeline.ts`, `AmbientBackdrop`, `SplashScene` skeleton with master clock, Skip, and `OnboardingShell` wiring.
  *Gate: Skip and 5 s auto-advance work with placeholder content.*
- [x] **2. Scene core:** renderer, lights, environment, table, kolam texture, thali and all foods, shadows.
  *Gate: the final static pose looks polished at 390 px and 1440 px.*
- [x] **3. Choreography:** drop, serve, scan, rings, leaf, reveal.
  *Gate: screenshots at t = 0.5, 1.5, 2.5, 3.5, 4.5 s.*
- [x] **4. Interaction and overlay:** chips, gestures, hold-scan, Spin button, balance moment, a11y buttons.
  *Gate: every row of the interaction table passes under touch emulation and mouse.*
- [x] **5. Adaptive logic:** reduced motion mode, screen sizing, pixel ratio scaling.
  *Gate: `prefers-reduced-motion` locks it to the final state instantly.*
- [x] **6. Integration:** route handoff, preload logic.
  *Gate: user drops into Dashboard seamlessly after 5 seconds or Skip.*
- [x] **7. Final review:** typecheck, lint, Lighthouse score, `ThaliHero`, shared ring style, docs, final QA.
  *Gate: no TS/eslint errors.*
