# grip-react-demo

A React + TypeScript demo application showcasing GRIP (Generalized Retrieval Intent Provisioning) using `@owebeeone/grip-react`.

This demo demonstrates reactive data flows, async state management, and context-aware data resolution through React hooks. It includes examples of atom taps, function taps, and async taps with real-world use cases.

## Features

- **Calculator** - Demonstrates function taps with state management
- **Weather Integration** - Shows async taps with OpenMeteo API integration
- **Time Clock** - Simple atom tap example
- **Context Scoping** - Demonstrates hierarchical context resolution

## Getting Started

### Prerequisites

- Node.js 20+ 
- npm or yarn

### Installation

```bash
npm install
```

This will install `@owebeeone/grip-react` from npm (version 0.2.0 or higher).

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the next available port).

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

- `src/grips.ts` - Grip definitions
- `src/grips.weather.ts` - Weather-specific Grips
- `src/taps.ts` - Tap implementations
- `src/taps_calculator.ts` - Calculator function taps
- `src/openmeteo_taps.ts` - Async weather data taps
- `src/runtime.ts` - GRIP runtime setup
- `src/App.tsx` - Main application component

## Key Concepts Demonstrated

### Atom Taps
Simple state containers for local values (e.g., counter, current tab).

### Function Taps
Derived/computed values that transform inputs (e.g., calculator operations).

### Async Taps
Asynchronous data fetching with caching and state management (e.g., weather data).

### Context Hierarchy
Demonstrates how data resolution works through the context graph.

## Documentation

- **Weather Tap Implementation**: See `WEATHER_TAP.md` for detailed explanation of the weather async tap
- **Setup Guide**: See `SETTING_UP_THIS.md` for local development setup (using `npm link`) and architecture details

> **Note**: This demo uses the published `@owebeeone/grip-react` package from npm. For local development of both packages together, see `SETTING_UP_THIS.md`.

## Related Packages

- **`@owebeeone/grip-core`** - Framework-agnostic GRIP engine
- **`@owebeeone/grip-react`** - React hooks and components for GRIP
- **`grip-vue-demo`** - Vue 3 version of this demo

## License

MIT
