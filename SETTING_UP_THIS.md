# SETTING\_UP\_THIS — `@owebeeone/grip-react` and Demo App

A step‑by‑step guide to:

1. Create the **grip-react** library (TypeScript, tsup, React peer deps)
2. (Optional) Publish it to npm as `@owebeeone/grip-react`
3. Scaffold a **Vite React+TS demo app**
4. **Link** the library into the demo with `npm link`
5. Run, debug, and iterate quickly

> You do **not** need to publish to npm to test the demo—`npm link` symlinks your local library into the app.

---

## Prerequisites

- Node 18+ and npm 9+ (macOS/Linux or Windows)
- An npm account (username: **owebeeone**) logged in: `npm login`
- Git installed; GitHub SSH set up (optional but recommended)

---

## 1) Create the library repo: `grip-react`

### 1.1 Initialize (macOS/Linux)

```bash
mkdir grip-react && cd grip-react
git init
npm init -y
```

### 1.1 Initialize (Windows PowerShell)

```powershell
mkdir grip-react; cd grip-react
git init
npm init -y
```

### 1.2 Package metadata & scripts

```bash
# Set scoped package name and public access
npm pkg set name='@owebeeone/grip-react'
npm pkg set publishConfig.access='public'

# Entrypoints & exports (CJS + ESM + types)
npm pkg set main='./dist/index.cjs'
npm pkg set module='./dist/index.mjs'
npm pkg set types='./dist/index.d.ts'
npm pkg set exports='{".":{"types":"./dist/index.d.ts","import":"./dist/index.mjs","require":"./dist/index.cjs"}}'

# Keep builds tree-shakeable
npm pkg set sideEffects=false

# Scripts
npm pkg set scripts.build='tsup'
npm pkg set scripts.dev='tsup --watch'
npm pkg set scripts.test='vitest run'
# Build when installed via path/git (helps for local testing)
npm pkg set scripts.prepare='tsup'

# Limit published files
npm pkg set files[0]='dist'
npm pkg set files[1]='README.md'
```

### 1.3 Install dev deps

```bash
npm i -D typescript tsup vitest @types/node @types/react @types/react-dom
# React is a peer dep so apps bring their own
npm pkg set peerDependencies.react='>=18'
npm pkg set peerDependencies.react-dom='>=18'
```

### 1.4 Add configs

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

Create `tsup.config.ts`:

```ts
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom']
});
```

### 1.5 Minimal library code

Create `src/index.ts`:

```ts
import { useSyncExternalStore } from 'react';

export type GripStore<T> = {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (fn: () => void) => () => void;
};

export function createStore<T>(initial: T): GripStore<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach(l => l());
  return {
    get: () => state,
    set: (next) => {
      state = typeof next === 'function' ? (next as (p: T) => T)(state) : next;
      notify();
    },
    subscribe: (fn) => (listeners.add(fn), () => listeners.delete(fn))
  };
}

export function useGrip<T, S = T>(store: GripStore<T>, selector?: (s: T) => S): S {
  const getSnapshot = () => (selector ? selector(store.get()) : (store.get() as unknown as S));
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
```

### 1.6 Build and commit

```bash
npm install
npm run build

git add -A
git commit -m "chore: init @owebeeone/grip-react"
```

(Optional) Push to GitHub

```bash
gh repo create owebeeone/grip-react --public --source=. --remote=origin --push
```

---

## 2) (Optional) First publish to npm

> Not required for local demo. Do this only when you want to reserve the name.

```bash
npm whoami            # should print: owebeeone
npm publish           # publishes scoped package public (thanks to publishConfig.access)
```

---

## 3) Create the **demo app**: `grip-react-demo`

### 3.1 Scaffold with Vite (macOS/Linux)

```bash
npm create vite@latest grip-react-demo -- --template react-ts
cd grip-react-demo
npm install
```

### 3.1 Scaffold with Vite (Windows PowerShell)

```powershell
npx create-vite@latest grip-react-demo --template react-ts
cd grip-react-demo
npm install
```

> Tip: If PowerShell swallows flags, use `npx --% create-vite@latest grip-react-demo --template react-ts`.

### 3.2 (Recommended) Vite tweaks for linked packages

Edit `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { dedupe: ['react', 'react-dom'] },
  optimizeDeps: { exclude: ['@owebeeone/grip-react'] }
});
```

### 3.3 Demo UI code

Replace `src/App.tsx`:

```tsx
import { createStore, useGrip } from '@owebeeone/grip-react';

type State = { count: number; text: string };
const store = createStore<State>({ count: 0, text: '' });

function Counter() {
  const count = useGrip(store, s => s.count);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button onClick={() => store.set(s => ({ ...s, count: s.count - 1 }))}>-</button>
      <span style={{ minWidth: 32, textAlign: 'center' }}>{count}</span>
      <button onClick={() => store.set(s => ({ ...s, count: s.count + 1 }))}>+</button>
    </div>
  );
}

function TextBox() {
  const text = useGrip(store, s => s.text);
  return (
    <input
      placeholder="Type something…"
      value={text}
      onChange={e => store.set(s => ({ ...s, text: e.target.value }))}
      style={{ padding: 6, width: 260 }}
    />
  );
}

function UppercasePreview() {
  const upper = useGrip(store, s => s.text.toUpperCase());
  return <code style={{ padding: 4, background: '#f5f5f5' }}>{upper || '...'}</code>;
}

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, display: 'grid', gap: 16 }}>
      <h1>grip-react demo</h1>
      <Counter />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <TextBox />
        <UppercasePreview />
      </div>
      <small>Only components that depend on a changed slice re-render.</small>
    </div>
  );
}
```

---

## 4) Link the library into the demo (no publish required)

### 4.1 Link the lib globally

(macOS/Linux)

```bash
cd ../grip-react
npm run build
npm link           # registers @owebeeone/grip-react globally
npm run dev        # keep running to rebuild on save (tsup --watch)
```

(Windows PowerShell)

```powershell
cd ..\grip-react
npm run build
npm link
npm run dev
```

> On Windows, if `npm link` fails, run PowerShell as Admin or enable Developer Mode (symlinks).

### 4.2 Link it into the demo app

(macOS/Linux)

```bash
cd ../grip-react-demo
npm link @owebeeone/grip-react
npm run dev        # start Vite (HMR)
```

(Windows PowerShell)

```powershell
cd ..\grip-react-demo
npm link @owebeeone/grip-react
npm run dev
```

Now edits in `grip-react/src` rebuild to `dist/`; Vite picks them up via the symlink and hot‑reloads.

---

## 5) Troubleshooting

- **Cannot resolve **`` → You likely missed `npm link @owebeeone/grip-react` in the demo, or the library’s `package.json` name is wrong.
- **Invalid hook call / multiple React copies** → Ensure React is only in **peerDependencies** in the lib. Keep the `vite.config.ts` `dedupe` setting in the demo.
- **Sourcemaps/stepping** → `tsup` is configured with `sourcemap: true`; set breakpoints in `.ts` sources in the browser devtools.
- **Demo doesn’t reload on changes** → Make sure `npm run dev` is running in the **library** (watch), and `optimizeDeps.exclude` includes your package name.

---

## 6) Alternatives to `npm link` (optional)

- **Local tarball** (closest to a real publish)
  ```bash
  cd grip-react && npm run build && npm pack
  cd ../grip-react-demo && npm i ../grip-react/owebeeone-grip-react-*.tgz
  ```
- **Path install** (runs `prepare`):
  ```bash
  cd grip-react-demo && npm i ../grip-react
  ```

---

## 7) Unlink / cleanup

(macOS/Linux)

```bash
# in demo
npm unlink --no-save @owebeeone/grip-react
# global
npm unlink -g @owebeeone/grip-react
```

(Windows PowerShell)

```powershell
npm unlink --no-save @owebeeone/grip-react
npm unlink -g @owebeeone/grip-react
```

Then `npm install` in the demo to restore normal deps.

---

## 8) (Optional) First real publish & versioning

```bash
# bump version in grip-react/package.json
npm run build
npm publish
```

Consumers can then:

```bash
npm i @owebeeone/grip-react
```

---

## 9) (Optional) Add the demo as a submodule in your work-area repo

```bash
git submodule add -b main --name grip-react-demo git@github.com:owebeeone/grip-react-demo.git apps/grip-react-demo
git config -f .gitmodules submodule.grip-react-demo.branch main
```

---

**You’re set.** Run both watchers (`grip-react` → `npm run dev`, and demo → `npm run dev`) and iterate quickly with hot reload + sourcemaps.



---

## 10) Debugging with sourcemaps (dev)

**Why your tab might say **``**:** Vite serves the built module and applies a source map so breakpoints hit your original TypeScript. That filename is normal.

### A) Make the maps unmissable (library)

Use inline maps while watching so the browser always has your TS.

```ts
// grip-react/tsup.config.ts
import { defineConfig } from 'tsup';
export default defineConfig((ctx) => ({
  entry: ['src/index.ts'],
  format: ['esm','cjs'],
  dts: true,
  sourcemap: ctx?.watch ? 'inline' : true, // inline in dev, external in prod
  clean: true,
  external: ['react','react-dom'],
}));
```

Then run in the lib:

```bash
npm run dev
```

### B) DevTools setup (Chrome/Edge)

1. Open DevTools → **Settings → Preferences → Sources** → enable **JavaScript source maps**.
2. Press **Cmd/Ctrl‑P** and type `@owebeeone/grip-react/src/index.ts` (or any TS file) to open it directly.
3. Set breakpoints in the TS. They’ll bind to the running code via the map.
4. If changes don’t trigger, hard refresh (**Cmd/Ctrl‑Shift‑R**).

### C) Vite tweaks (demo app)

Keep these to avoid duplicate React and prebundle quirks while linked:

```ts
// grip-react-demo/vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: { dedupe: ['react','react-dom'] },
  optimizeDeps: { exclude: ['@owebeeone/grip-react'] },
});
```

> You generally **do not** need extra `server.fs.allow` when using inline sourcemaps.

### D) Quick self‑check

In **grip-react**:

```bash
# Map present and referenced
tail -n 3 dist/index.mjs            # should end with //# sourceMappingURL=...
# If using inline maps, that line is a long data: URL
```

In **grip-react-demo**:

```bash
npm ls @owebeeone/grip-react
node -p "require.resolve('@owebeeone/grip-react/package.json')"
```

You should see a symlinked path under `node_modules`.

### E) Debug in Cursor / VS Code (optional)

Add `.vscode/launch.json` in the **demo** to attach Chrome with source path mapping:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "pwa-chrome",
      "request": "launch",
      "name": "Debug Vite App",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}",
      "sourceMaps": true,
      "sourceMapPathOverrides": {
        "*/node_modules/@owebeeone/grip-react/*": "C:/ABSOLUTE/PATH/TO/grip-react/*"
      }
    }
  ]
}
```

Replace the path with your actual `grip-react` location. On macOS, use `/Users/<you>/...`.

### F) Common pitfalls

- **Two Reacts installed** → keep `react` only in **peerDependencies** of the lib; ensure the demo does not vendor a second copy.
- **No rebuilds** → make sure `npm run dev` (tsup watch) is running in the lib.
- **Still seeing JS only** → verify inline maps are enabled (A), then hard refresh.

---

