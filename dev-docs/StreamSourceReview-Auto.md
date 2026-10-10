# StreamSourceDemo + StreamSourceDemoPlan Review (Auto)

> **Status:** review only — not incorporated into `StreamSourceDemo.md` or
> `StreamSourceDemoPlan.md`. **B1 corrected 2026-05-29:** parent MockCoin +
> destination params is valid; issue is undocumented context hierarchy.

Review of:

- `dev-docs/StreamSourceDemo.md` (design)
- `dev-docs/StreamSourceDemoPlan.md` (roll-build plan)

Against:

- `grip-core` (`createAsyncStreamMultiTap`, `MatchingContext`, resolver)
- `grip-react` hooks (`useGrip`, `useAtomValueTap`)
- `grip-react-demo` weather column pattern (`WeatherColumn.tsx`)
- `grip-py` (`create_async_tap`, `MatchingContext`)
- `scratch/GLIntegrationPlan-ReviewAuto.md` (stream tap preflight parallels)

## Verdict

The stream source demo is a **well-scoped spike** with clear goals: exercise
`createAsyncStreamMultiTap`, column-local `MatchingContext`, keyed child contexts,
and cross-runtime parity — without building a generic service client.

The roll-build plan’s **TS-first, then Python** ordering is correct. Step
granularity, stop conditions, and separation of mock UI (Step 4/8) from live
websockets (Step 5/9) are sound.

**Readiness score:** ~85% — design and plan are implementable after documenting
**destination-param wiring and matching-context hierarchy** (see B1), tightening
preflight dependency wiring, and clarifying a few API / naming details.

---

## Strengths

### S1. Clear pedagogical goal

The demo teaches the same primitives `grip-lab` service integration needs:
long-lived streams, request-key sharing, matcher-scoped providers, and keyed
column contexts — in isolation from websocket protocol complexity.

### S2. Provider-neutral output schema

`COIN_PRICE_USD`, `COIN_STREAM_STATUS`, etc. keep components decoupled from
Coinbase/CoinCap payload shapes. Pure mapper tests are called out in both docs.

### S3. CoinCap degradation rule

Treating CoinCap as spike-risk with `status: "unavailable"` avoids blocking the
whole demo — matches pragmatic roll-build guardrails.

### S4. No generic service client

Websocket setup stays inside coin tap modules. Correct scope boundary for this
demo.

### S5. Roll-build plan structure

| Plan strength | Detail |
|---------------|--------|
| TS path first | Steps 0–5 before Python 6–9 |
| Mock before live | Steps 4/8 vs 5/9 |
| Core before demo | Keyed contexts → stream tap hardening → UI |
| Stop conditions | GC leaks, API drift, global bindings, CoinCap blocking |
| Weather migration | Optional keyed-child proof in Step 4 |

### S6. `createAsyncStreamMultiTap` already exists

`grip-core` ships the spike with vitest coverage (`async_stream_tap.spec.ts`):
per-key sharing, replay latest, cleanup on last listener, param change detach.
Plan Step 3 is **hardening/verify**, not greenfield — appropriate.

### S7. Cross-runtime parity section

Weak-ref keyed cache on the facade (not graph id map) aligns with existing
context GC policy. Python API naming is mostly aligned.

---

## Blocking Issues

### B1. Document destination-param wiring + context hierarchy (parent MockCoin is OK)

**Correction (2026-05-29):** An earlier draft of this review claimed parent
MockCoin fallback cannot see column-local params. That was **too strong**.
**Destination parameters are exactly the mechanism** for “one tap registered
higher up, per-column inputs” — the same pattern as `fileContentTap`
(`destinationParamGrips: [ACTIVE_FILE, FILE_REF]`, each editor column supplies
its own params from its destination context).

The design’s matcher story remains valid:

- Column **home** owns `COIN_SOURCE` / `COIN_PRODUCT` atom taps (matcher queries
  observe home).
- Column **presentation** is where consumers read `COIN_PRICE_USD`.
- Matcher installs live taps in presentation when source matches.
- **`MockCoin` registered in a parent context**; when source is `mock`, resolver
  falls back to the parent provider.

**What the design must make explicit (currently implicit):**

1. **Coin stream taps use `destinationParamGrips: [COIN_SOURCE, COIN_PRODUCT]`**
   (and/or map product inside `requestKeyOf` via `params.get(...)`). Do not rely
   on `homeParamGrips` alone for column-local keys — matcher-attached taps get
   `homeContext` = presentation, so `homeParamGrips` would read the wrong node
   unless `paramsContext` is overridden.

2. **Param values must be visible from each presentation destination context.**
   Destination param drips are created on the **destination node** and resolve
   via the context **parent chain**, not sibling links. Today’s matcher tests use
   **home and presentation as siblings** under the same parent; atoms in home are
   **not** visible when resolving params on presentation.

   **Recommended hierarchy for `getOrCreateMatchingContext`:**

   ```text
   parent consumer ctx
     └── column home          ← atom taps (COIN_SOURCE, COIN_PRODUCT)
           └── column presentation   ← output consumers + dest params
   ```

   With presentation **child of home**, destination-param resolution on
   presentation walks up to home and sees column-local atoms. Matcher still
   observes home; stream taps read per-column params from presentation
   destinations.

3. **Alternative fixes** (if presentation stays a sibling of home):
   - Register mock (and live) taps only via matcher bindings (mock binding when
     `COIN_SOURCE === "mock"`), or
   - Mirror param atoms into presentation, or
   - Core support: matcher attach sets `paramsContext =
     matchingContext.getGripHomeContext()`.

**Weather contrast:** `WeatherColumn` uses one child context for both params and
outputs — no home/presentation split — so the sibling issue does not appear.

**Design doc edits:**

- State that parent MockCoin uses **`destinationParamGrips`**, not parent-level
  `homeParamGrips`.
- Specify presentation-is-child-of-home in `getOrCreateMatchingContext`.
- Add a grip-core unit test: parent tap + dest params + atoms in home + consumer
  in child presentation → distinct `requestKeyOf` per column.

Until documented, implementers may copy the sibling layout from
`tap_matcher.integration.spec.ts` and break column-local mock/live params even
though destination params are the right abstraction.

### B2. Step 0 local wiring is not met today

Plan Step 0 requires local `grip-core` / `grip-react` for `grip-react-demo`.
Current `package.json` uses `"@owebeeone/grip-react": "^0.2.0"` (registry).

Published packages may not export `createAsyncStreamMultiTap` yet (spike is on
`grip-core` `main` at `8411a1b`).

**Fix:** Make Step 0 explicit deliverable:

```json
"@owebeeone/grip-react": "file:../grip-react"
```

(and `grip-react` → `file:../grip-core`), plus a one-line verification that
`import { createAsyncStreamMultiTap } from '@owebeeone/grip-react'` resolves.

Preflight in design (“decide release vs local pin”) should **default to local pin**
for the roll-build; publish in Step 10 only.

### B3. `useCoinSourceMatcher(column)` is undefined

Design snippet references `useCoinSourceMatcher(column)` but no module defines
it. Plan Step 5 says `getOrCreateMatchingContext("coin:<id>", init)` with
bindings in `init`.

**Fix:** Remove `useCoinSourceMatcher` from design or define it as a thin wrapper
around `useKeyedMatchingContext` that only runs structural `addBinding` in
`init`. Bindings belong in the initializer lambda (runs once), not a separate
effect hook that re-adds bindings each render.

---

## High-Priority Gaps

### H1. Stream tap API naming: design vs implementation

| Design (Python) | `grip-core` (TS) |
|-----------------|------------------|
| `replay_latest=True` | `cacheLatest ?? true` |
| `state_grip` | `initialState` + tap `state` map + `setState` |
| `request_key_of=None` | `requestKeyOf` required |

Plan Step 7 Python API should mirror TS field names in prose even if Python uses
snake_case. Document `getResetUpdates` for stream errors → `COIN_STREAM_STATUS`.

### H2. `useAtomValueTap` vs `GripContextLike`

Plan Step 2 says widen `useAtomValueTap` to `GripContextLike`. `useGrip` already
accepts `GripContextLike`; `useAtomValueTap` overloads still say `ctx?: GripContext`
only.

Coin columns need atom taps on `column.getGripHomeContext()` while `useGrip` reads
from `column` (matching container) or `column.getGripConsumerContext()`. Step 2
is **required**, not optional, for the design snippet to typecheck.

### H3. Request keys and stream sharing demo

Design request keys omit column id (good — enables sharing). Step 5 manual check
(two columns, same Coinbase product → one stream) is the right proof.

Also document: when source is `mock`, keys are `mock:${product}` — two mock
columns with same product **should** share one mock stream (plan test #7 in
design list). Good consistency check.

### H4. Stale timer (15s) not in plan steps

Design specifies stale status if no event for 15s. Neither plan step nor stream
tap hardening lists it.

**Recommendation:** Add to Step 3 (core) or Step 5 (Coinbase tap) as mapper/state
logic using tap `setState` on `COIN_STREAM_STATUS`, not core primitive change.

### H5. Component `fakeData`-style imports — N/A but parallel issue

Coin tab is new; no migration table needed. Do add explicit rule: **coin
components must not import provider modules directly** — only grips + optional
tap handles.

### H6. Multi-repo tagging

`stream-source-build/*` tags across `grip-core`, `grip-react`, `grip-react-demo`,
`grip-py`, `grip-py-demo` cannot be a single git tag.

**Recommendation:** Add note:

```text
Tag each repository at the same step name when that repo changed.
Record the tuple of SHAs in the demo README or a roll-build manifest.
```

### H7. Step 3 vs design “Preflight”

Design rollout step 4 says “Confirm createAsyncStreamMultiTap available.” Plan
folds this into Step 0 + Step 3. Fine — cross-reference Step 0 exit as
“import stream tap API” and Step 3 as “behavior frozen for demo.”

### H8. Python demo parity scope

Plan Step 9 matches React Step 5 at architecture level. Qt/xterm is N/A; ensure
`demo_runtime.py` snapshot API mirrors React grip reads (`CoinSnapshot` listed).
Add verification that Python matcher bindings and context hierarchy match the
documented B1 wiring (destination params + presentation under home).

---

## Medium-Priority Issues

### M1. Open questions — recommended resolutions

| Open question | Recommendation |
|---------------|----------------|
| Stream tap in core before demo? | Yes on `grip-core` main; demo uses **local file:** deps until Step 10 publish |
| Public debug grip for stream count? | No — logs + graph visualizer sufficient for v1 |
| CoinCap third source if spike fails? | Keep tap registered with `unavailable`; optional doc note to swap in Kraken/Binance public WS later |

### M2. `COIN_ASSET` vs `COIN_PRODUCT`

Design adds optional `COIN_ASSET` for CoinCap slugs while UI uses `COIN_PRODUCT`
(`BTC-USD`). Add a small **product→asset map** in `cointaps.ts` / mapper module;
test mapping for all four products.

### M3. Matcher binding scores

Design uses `baseScore: 5` for live sources; mock uses resolver fallback to
parent MockCoin (no matcher binding). That is fine when B1 wiring is documented.
Optional mock matcher binding is an alternative if presentation stays a sibling
of home — use mutually exclusive `withOneOf(COIN_SOURCE, ...)` queries, no score
tuning needed.

### M4. Error handling in stream tap

`createAsyncStreamMultiTap` calls `onError` and `publishReset` on subscribe
failure. Design lists status transitions but not `getResetUpdates` / `onError`
wiring. Coin taps should map errors to `COIN_STREAM_STATUS: "error"` in
`mapEvent` or `onError`.

### M5. Step 1 keyed context on which facade?

Design uses:

```ts
parentCtx.getGripConsumerContext().getOrCreateMatchingContext(...)
```

Keyed cache should live on the **parent consumer context** facade (the object
that outlives column mounts). Plan Step 1 should state: cache owner is
`GripContext`, not `Grok` global map.

### M6. Weather keyed migration optional

Good proof in Step 4. Replace `useMemo(() => createChild())` with
`getOrCreateChildContext(\`weather:${id}\`)` to show non-matcher keyed pattern
alongside coin matcher columns.

### M7. Tests location

Design lists tests in four packages. Plan should pin commands:

```bash
# grip-core
npm test -- --run tests/async_stream_tap.spec.ts tests/context*.spec.ts

# grip-react-demo — currently no test script
```

Add minimal vitest to `grip-react-demo` in Step 4 for mapper + request-key tests,
or run mapper tests from `grip-core` with fixtures only. **Gap:** demo has no
`npm test` today — Step 4 verification says “existing demo tests” but package
has none.

### M8. Link to grip-lab integration

This demo is the **preflight prototype** for `GLCombinedRollBuildPlan` Preflight.
Note in Step 10 README: patterns map to `serviceClient` stream taps
(`subscribe` → `ServiceClient.subscribe()` async iterable, `mapEvent` → protocol
reducers).

---

## Design ↔ Plan Alignment

| Topic | Design | Plan | Aligned? |
|-------|--------|------|----------|
| Keyed contexts | Core extension | Steps 1, 6 | Yes |
| Stream tap | All three providers use it | Steps 3, 7 | Yes |
| Matcher scope | Per-column, not global | Steps 5, 9 | Yes |
| Mock before live | Rollout steps 6–7 vs 9–10 | Steps 4–5, 8–9 | Yes |
| Parent MockCoin fallback | Described | Not repeated | **Needs B1 doc (dest params + hierarchy)** |
| CoinCap fallback | Yes | Steps 5, 9 | Yes |
| Cross-runtime API | Documented | Steps 6–7 | Yes |
| Local deps | Implied | Step 0 | **Not met (B2)** |
| `useCoinSourceMatcher` | Snippet | Not in plan | **Gap (B3)** |

---

## Alignment with Current Code

| Area | State | Plan fit |
|------|-------|----------|
| `createAsyncStreamMultiTap` | Implemented + tested in grip-core | Step 3 = harden/export |
| `MatchingContext` | Exported TS + Python | Ready for Step 5/9 |
| `getOrCreateChildContext` | **Not implemented** | Steps 1, 6 required |
| Weather column | `useMemo(createChild())` | Step 4 optional migration |
| `useGrip(matchingContext)` | Should use consumer ctx | Verify in Step 2 test |
| `grip-py` stream tap | **Not implemented** | Step 7 |
| `grip-react-demo` tests | No test script | Add vitest or mapper tests in core |

---

## Suggested Edits

### StreamSourceDemo.md

1. Document **B1**: coin taps use **`destinationParamGrips:
   [COIN_SOURCE, COIN_PRODUCT]`**; `getOrCreateMatchingContext` creates
   **presentation as child of home** (not siblings).
2. Replace `useCoinSourceMatcher` with `useKeyedMatchingContext` + `init`
   bindings (B3).
3. Add product→asset map for CoinCap.
4. Document `onError` / `getResetUpdates` → `COIN_STREAM_STATUS`.
5. Resolve open questions table (M1).

### StreamSourceDemoPlan.md

1. Step 0: add concrete `file:` dependency edits + import smoke.
2. Step 1: note cache owner facade; **`getOrCreateMatchingContext` hierarchy**
   (presentation child of home); add unit test for parent tap + destination params
   + per-column keys (B1).
3. Step 2: mark `useAtomValueTap` widening as **required**.
4. Step 3: note spike exists; list any gaps vs design stale timer / error status.
5. Step 4: add vitest setup or move mapper tests to grip-core; fix “existing demo
   tests” wording.
6. Step 5: verify live taps use same `destinationParamGrips` as parent MockCoin.
7. Tagging: per-repo tags + SHA manifest (H6).
8. Step 10: link to grip-lab combined plan preflight (M8).

---

## Recommended Execution Order

1. **Step 0** — local package wiring; verify stream tap import.
2. **Step 1** — keyed contexts + **presentation-under-home hierarchy**; unit test
   for parent tap + destination params + per-column request keys (B1).
3. **Step 2** — hook ergonomics.
4. **Step 3** — stream tap hardening (likely fast — spike exists).
5. **Step 4** — mock coin UI only; prove two columns + request-key sharing.
6. **Step 5** — matcher + live WS; CoinCap degrades gracefully.
7. **Steps 6–9** — Python mirror.
8. **Step 10** — publish packages + docs.

---

## Conclusion

`StreamSourceDemo.md` and `StreamSourceDemoPlan.md` form a coherent spike that
fills the gap identified in grip-lab integration reviews: a small, testable
proof of `createAsyncStreamMultiTap` and matcher-scoped column providers.

**Parent MockCoin fallback is sound** when coin taps use **destination
parameters** and the matching-context tree makes home atoms visible from
presentation destinations (presentation **child of home**). The design should
state that explicitly — it is not spelled out today, and a sibling home/
presentation layout would break params even though destination params are the
right tool.

Complete Step 0 local wiring and Step 2 hook typing, then the roll-build can
proceed with high confidence.
