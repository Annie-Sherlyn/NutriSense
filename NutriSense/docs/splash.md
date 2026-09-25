# NutriSense — 3D Splash Screen ("The Nutrient Bloom")

A morning-light, 3D WebGL splash screen for **NutriSense**, an explainable nutrition companion for real-world Indian eating.

---

## 🎨 Creative Concept & Storyline

**"The Nutrient Bloom"**: Five nutrient organisms are born from a drop of morning light, spiral together into a helix orbit, converge into a bud, and bloom into the NutriSense mark—a lotus-like leaf composed of five bevelled petals with an orbital ring.

### The Five NutriMotes (3D Organisms)
| NutriMote | 3D Form | Material & Color |
| :--- | :--- | :--- |
| **Protein** | Chain of 3 linked rounded beads | Glossy clearcoat green (`#2E9E5B`) |
| **Iron** | Faceted low-poly gem (icosahedron, flat-shaded) | Warm metallic (`#E2582E`), metalness 0.72 |
| **Calcium** | Cluster of 4 small crystal shards (octahedra) | Translucent glass (`#2BB3CE`), IOR 1.48 |
| **Vitamin B12** | Glowing sphere with thin tilted halo ring | Soft emissive violet (`#7B5CD6`) |
| **Fiber** | Twisted leaf-spiral ribbon | Satin teal (`#2F9E8F`) |

---

## ⏱️ Master Timeline (5000 ms, Single Clock)

The entire sequence is driven from one high-precision clock (`requestAnimationFrame` + `performance.now()`) with paused tab synchronization:

| Time (ms) | Beat | Visual Action |
| :--- | :--- | :--- |
| **0 – 600** | **Dawn** | Sunrise gradient fades in (`#FFF8EC` → `#FFE9D6` → `#EAF6EC`). Light drop descends into center. Soft expanding ripples. |
| **600 – 1800** | **Release** | Five NutriMotes spring from the drop with squash-and-stretch into a 3D helix orbit. Camera dollies in and arcs 25°. |
| **1800 – 2800** | **Convergence** | Orbit tightens and accelerates (ease-in). Motes streak to slot into a central bud. Soft warm bloom + 40 pollen burst. |
| **2800 – 3800** | **Bloom** | Five extruded, bevelled petals unfold in staggered spring (70 ms apart). 360° mark yaw with ease-out. Golden orbit ring draws. |
| **3800 – 4400** | **Reveal** | Wordmark **NutriSense** rises with masked reveal in deep forest (`#1F5B45`). Specular glint sweeps across mark. |
| **4400 – 5000** | **Promise & Exit**| Tagline *"Better choices begin with understanding."* fades in. Radial sunrise wipe expands to `#FBF6EE`. `onComplete()` called at exactly 5000 ms. |

---

## ⚡ Performance & Quality Tiers

Automatically detected at startup:
- **High Tier**: `MeshPhysicalMaterial` with transmission, 60 pollen particles, max pixel ratio 2.0.
- **Medium Tier**: Physical materials with opacity + envMap, 30 pollen particles, max pixel ratio 1.75.
- **Low Tier / No WebGL**: CSS 3D fallback (`SplashSceneCSS.tsx`) with 3D perspective transforms and identical 5000 ms timing.
- **Safety Fallback**: If the 3D chunk takes >1200 ms to mount, seamlessly switches to CSS fallback so the 5 s timeline is never blocked.

---

## 🛠️ Debug & Verification Parameters (Dev Builds)

Use URL query parameters for deterministic testing:
- `?splash=freeze&t=2400`: Freezes the scene at 2400 ms (works at any `t`).
- `?splash=css`: Forces the CSS 3D fallback component.
- `?quality=low|medium|high`: Overrides the auto-detected quality tier.
- `?splash=debug`: Displays an interactive timeline scrubber bar.

---

## ♿ Accessibility & Interactions
- **Skip Button**: Accessible glass pill in top-right, visible from frame 0. Supports click, `Enter`, and `Escape` with smooth ≤200 ms handoff.
- **Reduced Motion**: Automatically respected. Displays a composed static mark with gentle typography fade, still completing by 5000 ms.
- **Parallax**: Pointer or touch drag tilts the scene up to ±12° with smooth critically damped spring interpolation.
- **Tap the Mark**: Tapping the bloomed mark after 3800 ms produces a delicate sparkle burst.
