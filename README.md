# RELAY AI — Multi-Agent NLP Decision Platform

Enhanced production React / TypeScript / Tailwind CSS web application based on the **Google Stitch** design system (`https://stitch.withgoogle.com/preview/7918052702810939224?node-id=fb8a0f66b2ef4912802ae5bf23f5826b`), featuring premium interactive animations via **Framer Motion**.

---

## 🌟 Integrated Premium UI Components

### 1. `HeroHighlight` & `Highlight` (`src/components/ui/hero-highlight.tsx`)
- **Brand-Adapted Spotlight**: Responsive cursor-following radial spotlight with a subtle dotted grid matrix.
- **Color Palette Alignment**: Replaced stock purple/indigo gradients with RELAY AI brand tokens:
  - Neural Teal (`#20C6B6`)
  - Electric Blue (`#456BFA`)
  - Midnight Navy (`#101A2B`)
  - Slate & Ice Canvas (`#F5F7FB`)
- **Typography Integration**: Employs `<Highlight>` to selectively accentuate key phrases in the primary hero heading (`"clear next step."`) without obstructing readability or navigation.
- **Accessibility & Touch Safety**: Pointer-events-none layer, passive cursor tracking, and complete graceful degradation on touch devices or under `prefers-reduced-motion`.

### 2. `ContainerScroll` (`src/components/ui/container-scroll-animation.tsx`)
- **Scroll-Driven 3D Perspective**: Smooth 3D tilt-to-flat rotation powered by `useScroll` and `useTransform`.
- **Location**: Positioned immediately below the primary hero section under the title:
  > **"See Intelligence in Action"**  
  > *One query. Two agents. One clear resolution.*
- **Workspace Visual Preview (`WorkspacePreviewCard.tsx`)**:
  - Customer query input simulation (`"I need a refund on order #84920..."`)
  - **A1 Intent Analyst** breakdown (Intent: `BILLING_REFUND_REQUEST`, 98.4% confidence, slot extraction, sentiment scoring)
  - **A2 Response Specialist** drafting (Policy R-104 auto-resolution, confidence 96.8%)
  - **Agent Handoff & Consensus Relay** (Tri-state badge, verified latency: 142ms)
  - **Response Validation & Final Resolution** (Refund authorization, email dispatch preview)
- **Zero Stock Images**: Renders native UI elements and real design tokens rather than static imagery.

---

## 🚫 Components Intentionally Skipped (Per Specification)
- **CardFolder**: Payment card / credit card UI with CVV masking. Skipped as it is irrelevant to multi-agent enterprise NLP support workflows.
- **RouteGlobe**: Hardcoded geographic flight trajectory globe. Skipped as it does not reflect autonomous agent decision orchestration.
- **TiltedGridHero**: Curved decorative photo strip. Skipped to maintain the clean, authoritative Google Stitch layout and avoid visual clutter.

---

## 📁 Project Structure

```
relay-ai/
├── src/
│   ├── components/
│   │   ├── ui/                           # Reusable UI component library (shadcn convention)
│   │   │   ├── hero-highlight.tsx        # HeroHighlight & Highlight
│   │   │   ├── container-scroll-animation.tsx # 3D scroll showcase
│   │   │   └── index.ts                  # Public exports
│   │   ├── landing/                      # Landing page sections
│   │   │   ├── LandingPage.tsx           # Full landing page with Stitch fidelity
│   │   │   └── WorkspacePreviewCard.tsx  # 6-stage live pipeline preview
│   │   ├── workspace/                    # Live AI Autonomous Workspace
│   │   │   └── LiveWorkspace.tsx         # 3-column interactive agent execution workspace
│   │   └── layout/                       # Persistent navigation & header
│   │       ├── Header.tsx                # Top navigation & system status
│   │       └── Sidebar.tsx               # Persistent left navigation
│   ├── data/
│   │   └── presets.ts                    # 5 Bitext benchmark scenarios
│   ├── lib/
│   │   └── utils.ts                      # Tailwind cn() utility (clsx + tailwind-merge)
│   ├── reference/                        # Supplied component source reference files
│   │   ├── component_reference_1.txt     # Reference file 1 (TiltedGridHero, CardFolder, RouteGlobe)
│   │   └── component_reference_2.txt     # Reference file 2 (HeroHighlight, ContainerScroll)
│   ├── styles/
│   │   └── globals.css                   # Tailwind directives & CSS variables
│   ├── App.tsx                           # Top-level view routing (Landing <-> Workspace)
│   └── main.tsx                          # Vite React root
├── index.html                            # Manrope, Inter & JetBrains Mono font imports
├── tailwind.config.js                    # RELAY AI design tokens & theme configuration
├── tsconfig.json                         # TypeScript configuration with @/* path alias
└── vite.config.ts                        # Vite configuration with @ path resolution
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0 or newer recommended)
- npm or pnpm or yarn

### Installation
```bash
# Install all required dependencies
npm install
```

### Running Locally (Development Mode)
```bash
# Start Vite development server
npm run dev
```
Open your browser at `http://localhost:3000`.

### Building for Production
```bash
# Run TypeScript compilation and Vite production bundle
npm run build
```

### Previewing the Production Build
```bash
# Serve the compiled dist/ directory
npm run preview
```
Open your browser at `http://localhost:4173`.

---

## 🎨 Design Tokens & Branding
- **Midnight Navy**: `#101A2B` (primary surface & header)
- **Secondary Navy**: `#17263D` (sidebar & card backgrounds)
- **Electric Blue**: `#456BFA` (primary CTA & A1 highlight)
- **Neural Teal**: `#20C6B6` (A2 specialist & success state)
- **Light Slate Canvas**: `#F5F7FB` (landing surface)
- **Typography**:
  - `font-display-hero`: Manrope (700/800)
  - `font-sans`: Inter (400/500/600)
  - `font-mono`: JetBrains Mono (400/500)
