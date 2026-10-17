# grip-react-demo

A React + TypeScript demo application showcasing GRIP (Generalized Retrieval Intent Provisioning) using `@owebeeone/grip-react`.

This demo demonstrates reactive data flows, async state management, and context-aware data resolution through React hooks. It includes examples of atom taps, function taps, and async taps with real-world use cases.

## Features

- **Calculator** - Demonstrates function taps with state management
- **Counter & Clock** - Edit the buffered numeric counter or use its buttons;
  the independent clock view reacts to the same GRIP value. Draft text and caret
  are preserved while typing, including an unfinished negative value.
- **Weather Integration** - Shows async taps with OpenMeteo API integration
- **Time Clock** - Simple atom tap example
- **Live Text Editing** - The Clock & Counter page uses `GripInput` to preserve
  a focused edit and caret while publishing an uppercase stored value on every
  keystroke. A FunctionTap derives a slug and text statistics from that value.
- **Context Scoping** - Weather and coin columns use `GripScope` for independent
  values and mutators. Their keys identify columns, while cities and coin products
  are mutable data inside those scopes.

## Getting Started

### Prerequisites

- Node.js 24 (used for verification)
- pnpm
- Sibling `grip-core` and `grip-react` checkouts, built before installing this demo

### Installation

```bash
pnpm install
```

The current checkout uses `file:../grip-react`, which also depends on the sibling
core checkout. It requires the local React package that exports `GripScope`.
It does not currently install the published React release from npm.

### Development

```bash
pnpm dev
```

The application will be available at `http://localhost:5173` (or the next available port).

### Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

- `src/grips.ts` - Grip definitions
- `src/grips.weather.ts` - Weather-specific Grips
- `src/taps.ts` - Tap implementations
- `src/taps_calculator.ts` - Calculator function taps
- `src/openmeteo_taps.ts` - Async weather data taps
- `src/runtime.ts` - GRIP runtime setup
- `src/App.tsx` - Main application component
- `src/WeatherPanel.tsx` - Weather scopes, each initialized with a location atom
- `src/WeatherColumn.tsx` - Display and location controls using inherited grips
- `src/CoinPanel.tsx` and `src/coinScope.ts` - Coin scope initialization and matchers

## Scope checks

```bash
pnpm test
```

The local tests use deterministic weather data and mock coin streams. They check
independent column edits, inherited mutators, and preservation of edited values
when parents rerender. Scope initializers configure a new live context only;
later changes go through the column's mutators.

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

> The setup guide includes historical npm-link instructions. This checkout uses
> the sibling file dependency described above.

## Related Packages

- **`@owebeeone/grip-core`** - Framework-agnostic GRIP engine
- **`@owebeeone/grip-react`** - React hooks and components for GRIP
- **`grip-vue-demo`** - Vue 3 version of this demo

## License

MIT
