# AutoSRE — Landing Page

### From production incident to verified fix.

The official landing page for **AutoSRE**, an AI-powered Site Reliability Engineering agent designed to investigate incidents, identify likely root causes, generate and verify code fixes, and prepare pull requests for human review.

🌐 **Live website:** [landing-page-for-auto-sre.vercel.app](https://landing-page-for-auto-sre.vercel.app)

🔗 **Main project:** [zero-ops-autosre](https://github.com/shv-codes/zero-ops-autosre)

---

## Overview

This repository contains the public-facing website for AutoSRE. It presents the product's purpose, capabilities, workflow, and technical approach through a modern, interactive web experience.

The landing page is a separate frontend project; the incident investigation, coding agent, sandbox verification, and pull-request workflows live in the main AutoSRE repository.

## Tech stack

| Technology | Purpose |
|---|---|
| React 19 | Component-based user interface |
| TypeScript | Type-safe application code |
| Vite | Development server and production build |
| Tailwind CSS 4 | Styling infrastructure |
| Framer Motion | UI animation and transitions |
| Three.js | 3D graphics |
| React Three Fiber | React-based 3D rendering |
| React Three Drei | Helpers for Three.js scenes |
| React Router | Client-side navigation |
| Geist & Instrument Serif | Typography |

## Getting started

### Prerequisites

- Node.js compatible with the installed Vite version
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/shv-codes/Landing_page_for_AutoSRE.git
cd Landing_page_for_AutoSRE
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal.

## Available commands

| Command | Description |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Run TypeScript project checks and build for production |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Preview the production build locally |

Before deploying changes, run:

```bash
npm run lint
npm run build
```

## Project structure

```text
Landing_page_for_AutoSRE/
├── public/          # Static assets
├── src/             # Application source code
├── index.html       # HTML entry point
├── package.json     # Scripts and dependencies
├── package-lock.json
├── tsconfig.json    # TypeScript configuration
├── vite.config.ts   # Vite configuration
└── README.md
```

## Deployment

The live website is hosted on Vercel:

**[Open the AutoSRE landing page](https://landing-page-for-auto-sre.vercel.app)**

To deploy an updated version, connect this GitHub repository to Vercel and configure the project using the standard Vite settings:

- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`

Push changes to the configured deployment branch to trigger a deployment if automatic deployments are enabled.

## Related project

The landing page is only the presentation layer. Visit the main repository for the actual AutoSRE implementation, architecture, setup instructions, agent workflow, safety controls, and tests.

**[Explore AutoSRE →](https://github.com/shv-codes/zero-ops-autosre)**

## License

Refer to the main project's licensing terms and any license files included in this repository.

