# NutriSense — An Explainable, Multimodal Nutrition Companion for Real-World Indian Eating

> **Hackathon Release Candidate (v1.0.0)**  
> *"What should I eat next, based on what I have already eaten?"*

NutriSense is a production-grade, multimodal nutrition intelligence platform designed specifically for Indian dietary patterns. Built with strict ICMR-NIN (National Institute of Nutrition, 2024) daily RDA targets, NutriSense closes the loop from complex meal capture to personalized, explainable recommendations.

---

## 🌟 Core Loop & Capabilities

```
FOOD INPUT ──► FOOD UNDERSTANDING ──► NUTRITION ESTIMATE ──► DAILY LOG ──► NUTRIENT GAP ──► EXPLAINABLE RECOMMENDATION
 (Photo, OCR,    (Multi-dish detection,     (Ranges & ICMR        (Timestamp &     (7 NutriMotes      ("Why this was recommended",
  Delivery,        regional aliases,         confidence bands,     meal slot        concentric         bioavailability, cost,
  Voice, Search)   cooking style)            no fake precision)    tracking)        rings)             blood report targets)
```

1. **Multimodal Food Capture**:
   - **Dish Photo Scan**: Live camera with viewfinder & gallery upload. Detects multi-item thalis and street food combinations.
   - **Restaurant Menu OCR**: Instant camera snapshot of print menus, extracting items, prices, and ranking them by your live daily deficit.
   - **Food Delivery Screenshot**: Upload screenshots from Swiggy / Zomato carts; parses items and quantities.
   - **Voice Logging**: Bilingual Indian English & Hindi food logger with live speech-to-text waveform.
   - **Quick Search (`⌘K` / `Ctrl+K`)**: Global instant search across authentic regional Indian dishes.
2. **Honest Nutrition Ranges (No Fake Precision)**:
   - Eliminates misleading exact single-number calories.
   - Computes realistic min-max ranges accounting for restaurant vs. home cooking, oil levels, and portion sizes.
   - Displays 3-tier confidence bands (High >80%, Moderate 50–79%, Uncertain <50%).
3. **NutriMotes Creature System**:
   - 7 abstract biological organisms representing core nutrients: **Protein** (hex-chain), **Iron** (faceted pebble), **Calcium** (crystal shard), **Vitamin B12** (halo orb), **Fiber** (leaf spiral), **Hydration** (water droplet), and **Energy** (pulsing ember).
   - Reactive emotional states: *idle*, *curious*, *happy*, *celebrating*, *resting*.
   - 5-second skippable cinematic awakening splash scene.
4. **Interactive Concentric Rings Orbit**:
   - Hand-crafted SVG orbit showing all micronutrient deficits simultaneously.
   - **"What-If" Live Preview**: Hovering or selecting candidate dishes instantly previews how your rings and gaps will close.
5. **Explainable Recommendations ("Why this was recommended")**:
   - Transparent explanations breaking down nutrient density, cost constraints (under user's ₹ budget), and nutrient interactions (e.g. Vitamin C aiding plant iron absorption).
6. **Blood Lab Report Personalization**:
   - Upload CBC / Vitamin blood lab reports (PDF/image) to auto-extract deficiencies and set therapeutic daily RDA targets.

---

## 🏗️ Architecture & Technology Stack

- **Framework**: React 18 with TypeScript (Strict mode, zero `any`, `--max-warnings 0`).
- **Styling**: Tailwind CSS + Custom CSS Variables. Warm editorial aesthetic:
  - Cream canvas (`#FBF6EE`), Deep forest green (`#1F5B45`), Warm amber, Lavender, Sage accents.
  - Dark mode support (`Night Forest`).
  - No generic blue/purple AI gradients.
- **Typography**: Self-hosted `@fontsource/fraunces` (warm editorial display serif) and `@fontsource/plus-jakarta-sans` (geometric interface sans).
- **Animations**: Framer Motion with reduced-motion accessibility preference support.
- **Graphics & Data Visualization**: Hand-crafted pure SVG rings, bars, and creature shaders (**zero heavy chart library bloat**).
- **Authentication**: Firebase Authentication (Email/Password + Google Popup) with **automatic zero-config Demo Mode fallback** if Firebase environment variables are missing.
- **PWA & Offline First**: `vite-plugin-pwa` service worker with icon assets and local cache.
- **Routing**: React Router v6 with `React.lazy` code-splitting and responsive desktop/mobile shells.

---

## 📁 Repository Structure

```
NutriSense/
├── public/
│   ├── images/food/          # 15+ curated Indian dish SVG illustrations
│   ├── pwa-192x192.png       # PWA manifest icons
│   ├── pwa-512x512.png
│   ├── apple-touch-icon.png
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── animations/       # NutriMote, MoteBurst, ScanLine, Waveform, SplashScene
│   │   ├── common/           # Button, Card, Badge, Modal, Toast, UploadZone, etc.
│   │   ├── food/             # FoodCard, RecommendationCard, MealCard, PortionControl
│   │   ├── layout/           # AppShell, Sidebar, BottomNav, TopBar, QuickSearchModal
│   │   └── nutrition/        # NutrientOrbit, ProgressRing, RangeBar, WhyThisRecommendation
│   ├── config/               # Design tokens, ICMR RDA guidelines, Firebase config, env
│   ├── context/              # AuthContext (Firebase + Demo), AppContext (state & settings)
│   ├── mocks/                # Curated Indian foods, meal seed data, nutrition & OCR fixtures
│   ├── pages/
│   │   ├── auth/             # SplashPage, WelcomePage, LoginPage, RegisterPage, ForgotPassword
│   │   ├── onboarding/       # Intro, Goals, PersonalizeChoice, Manual, LabReport, Confirm
│   │   ├── dashboard/        # DashboardPage (Hero Concentric Orbit, Quick Log, Next Best Food)
│   │   ├── meal/             # DishCapture, PhotoResult, Portion, NutritionEstimate, SaveMeal,
│   │   │                     # MenuScan, DeliveryScan, VoiceLog, SearchLog, Today, Recommendations, Compare
│   │   ├── profile/          # ProfilePage, EditProfilePage, SettingsPage
│   │   ├── reports/          # ReportsPage (Weekly analytics), AchievementsPage, AssistantPage
│   │   └── NotFoundPage.tsx  # 404 Recovery screen
│   ├── routes/               # AppRoutes.tsx (Lazy routing, route guards)
│   ├── services/             # Clean API layer (api, auth, food, nutrition, ocr, speech, etc.)
│   └── types/                # Strict TypeScript contracts & domain models
├── .eslintrc.cjs             # ESLint config with no-restricted-imports on mocks
├── tailwind.config.ts        # Custom theme extensions, tokens, safe-area utilities
├── vite.config.ts            # Vite + PWA + compression setup
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or 20.x
- npm 9.x or later

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/NutriSense.git
cd NutriSense
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Required | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | No | Production backend URL. If omitted, uses mock service layer. |
| `VITE_FIREBASE_API_KEY` | Optional | Firebase API Key for cloud authentication. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Optional | Firebase Auth Domain. |
| `VITE_FIREBASE_PROJECT_ID` | Optional | Firebase Project ID. |
| `VITE_FIREBASE_STORAGE_BUCKET`| Optional | Firebase Storage Bucket. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional | Firebase Cloud Messaging Sender ID. |
| `VITE_FIREBASE_APP_ID` | Optional | Firebase App ID. |

> **Zero-Config Demo Mode**:  
> If Firebase credentials are not provided, NutriSense **automatically activates Demo Mode**. You can click *"Demo Account / Quick Access"* or enter any dummy credentials on the Login/Register screens without setting up Firebase.

### 3. Run Locally in Development Mode
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

To run the combined voice and DL backend in the background on Windows, from the
`NutriSense` directory run:
```powershell
.\scripts\start_backend.ps1
```
The combined backend owns port `8000`, which is the port used by the Vite proxy.
Do not start `dl_service/server.py` on that port at the same time. The standalone
DL service uses port `8001` by default and can be changed with `DL_SERVICE_PORT`.
If Windows has temporarily reserved port `8000`, use another backend port and
point the Vite proxy at it:
```powershell
$env:VITE_BACKEND_PORT = "8002"
.\scripts\start_backend.ps1 -Port 8002
```

---

## 🧪 Quality Gates & Verification

```bash
# 1. Strict TypeScript Compiler Check (Zero 'any', strict types)
npm run typecheck

# 2. Strict ESLint Check (Zero warnings, forbids mock imports in components)
npm run lint

# 3. Production Vite Bundle
npm run build

# 4. Preview Production Build Locally
npm run preview
```

---

## 🔌 Backend & Deep Learning Integration Points

The frontend is strictly decoupled from the data layer via the `src/services/` directory. Direct imports of `src/mocks/` from components or pages are forbidden by ESLint (`no-restricted-imports`).

To connect your real AI models and backend microservices, implement the corresponding endpoints in `src/services/`:

| Module | Service File | Integration Tag | Real-World Integration Details |
| :--- | :--- | :--- | :--- |
| **Dish Vision Model** | `src/services/food.service.ts` | `// TODO(DL)` | Connect YOLOv8 / ViT multi-label Indian food classifier to identify items and bounding boxes. |
| **Menu OCR** | `src/services/ocr.service.ts` | `// TODO(OCR)` | Connect Google Cloud Vision / PaddleOCR endpoint to parse restaurant menus into dish items and prices. |
| **Delivery Parsing** | `src/services/ocr.service.ts` | `// TODO(OCR)` | OCR + LLM heuristic to parse Swiggy/Zomato cart breakdown. |
| **Speech-to-Text** | `src/services/speech.service.ts` | `// TODO(SPEECH)` | Connect Whisper or Bhashini API for bilingual Indic voice transcription. |
| **Next Best Food** | `src/services/recommendation.service.ts`| `// TODO(RECOMMENDATION)`| Connect RL / greedy knapsack recommendation engine balancing nutrient gaps, budget, and time of day. |
| **Lab Report Extraction**| `src/services/report.service.ts` | `// TODO(BACKEND)` | Connect Medical Document LLM parser to extract Hemoglobin, Serum Ferritin, B12, and 25-OH Vitamin D. |

---

## 🛠️ Judge & Developer Demonstration Tools

Navigate to **App Settings** (`/profile/settings`) to access judge controls:
- **Simulate Network & API Failure**: Toggle network error simulator to verify UI error resilience and recovery actions.
- **Load 7-Day Indian Meal History**: Instantly populates realistic breakfast, lunch, and dinner logs with longitudinal nutrient variations.
- **Reset Local App State**: Clears browser cache and restores factory demo state.
- **Replay Onboarding & Intro Splash**: Re-experience the 5-second NutriMote awakening animation.
- **Quick Dish Search**: Press <kbd>⌘K</kbd> (Mac) or <kbd>Ctrl+K</kbd> (Windows/Linux) anytime.

---

## 📄 License & Standards

- Adheres to **ICMR-NIN 2024 Dietary Guidelines for Indians**.
- Built for the Indian Eating Ecosystem with authentic dishes across South, North, East, and West India.
