# StreamSourceDemoPlan

Roll-build plan for the stream source demo described in
`dev-docs/StreamSourceDemo.md`.

The build order is intentional:

1. Get the JavaScript/TypeScript path working end-to-end:
   `grip-core` -> `grip-react` -> `grip-react-demo`.
2. Apply the same core concepts to Python:
   `grip-py` -> `grip-py-demo`.

Do not build the full demo in one change. Each step should be implemented,
verified, and tagged before moving on.

## Tag Prefix

Use one tag prefix across all involved repositories:

```text
stream-source-build/
```

Suggested tags:

```text
stream-source-build/start
stream-source-build/step-0-baseline
stream-source-build/step-1-core-keyed-contexts
stream-source-build/step-2-react-keyed-contexts
stream-source-build/step-3-core-stream-tap
stream-source-build/step-4-react-demo-mock
stream-source-build/step-5-react-demo-live
stream-source-build/step-6-py-keyed-contexts
stream-source-build/step-7-py-stream-tap
stream-source-build/step-8-py-demo-mock
stream-source-build/step-9-py-demo-live
stream-source-build/step-10-hardening
```

These are per-repository tags, not one cross-repo tag. When a step changes more
than one repository, tag each changed repository with the same step name and
record the SHA tuple in the step notes or final hardening docs.

## Step 0: Baseline And Local Package Wiring

Scope:

- Confirm local package wiring for `grip-core`, `grip-react`, and
  `grip-react-demo`.
- Confirm Python editable wiring for `grip-py` and `grip-py-demo`.
- Capture current test/build state.

Deliverables:

- `grip-react-demo` uses local `grip-react` and local `grip-core`, not npm
  registry packages.
- `grip-react` uses local `grip-core`.
- `grip-py-demo` runs against local `grip-py`.
- `grip-react/package.json` uses `"@owebeeone/grip-core": "file:../grip-core"`
  for this roll-build.
- `grip-react-demo/package.json` uses
  `"@owebeeone/grip-react": "file:../grip-react"`.
- If `grip-react-demo` imports `@owebeeone/grip-core` directly during tests,
  it also uses `"@owebeeone/grip-core": "file:../grip-core"`.
- No source behavior changes.

Verification:

- `grip-core`: `npm test -- --run` and `npm run build`
- `grip-react`: `npm test` and `npm run build`
- `grip-react-demo`: `npm run build`
- `grip-py`: existing test suite or focused context/async tests if full suite is
  too slow
- `grip-py-demo`: existing demo tests
- Confirm package resolution prints local paths for GRIP packages.
- Confirm direct and transitive package resolution:
  - `grip-react` resolves `@owebeeone/grip-core` from `../grip-core`.
  - `grip-react-demo` resolves `@owebeeone/grip-react` from `../grip-react`.
  - Any direct `grip-react-demo` import of `@owebeeone/grip-core` resolves from
    `../grip-core`.
- Import smoke:
  `import { createAsyncStreamMultiTap } from "@owebeeone/grip-react"` resolves
  from the local checkout.

Exit:

- Local dependency path is trustworthy before changing core APIs.

## Step 1: TypeScript Core Keyed Contexts

Scope:

- Add keyed context helpers to `grip-core`.

Deliverables:

- `GripContext.getOrCreateChildContext(key, init?, opts?)`
- `GripContext.getOrCreateMatchingContext(key, init?, opts?)`
- Keyed cache lives on the live `GripContext` facade, not in the graph id map.
- Cache stores weak references so it does not own child lifetimes.
- Initializer runs exactly once for a newly created facade/container.
- Matching helper creates source and presentation contexts, then passes the
  `MatchingContext` to `init`.
- Matching helper creates presentation as a child of source/home, not as a
  sibling.

Rules:

- Do not use `context.id` as the authoritative cache key.
- Generated context ids are debug-readable only.
- Stale weak refs are pruned opportunistically on lookup.
- Matcher initializer bindings are structural setup. Do not add a new matcher
  disposal model for this demo; follow the existing GRIP tap/drip/context
  ownership policy.
- Destination parameter resolution must work from presentation destinations up
  through the source/home parent chain.

Tests:

- same key returns same live child context.
- different keys return different contexts.
- different parents can reuse the same key without collision.
- initializer runs once for a live entry.
- matching helper returns a `MatchingContext` with distinct home and consumer
  contexts.
- matching helper hierarchy is `parent -> home/source -> presentation`.
- matching initializer can add bindings and drive producer selection.
- parent fallback tap using `destinationParamGrips` sees atom params registered
  in matching home/source when consumed from presentation.
- stale weak-ref entries are ignored if the facade is gone. Do not depend on
  actual GC timing in the test; use a deterministic dead-ref/prune test strategy
  or narrow internal test helper.

Verification:

- `npm test -- --run tests/context*.spec.ts tests/tap_matcher.integration.spec.ts`
- `npm run build`

Exit:

- Core TS API is stable enough for React hooks and demo code.

## Step 2: React Hook Ergonomics

Scope:

- Expose the keyed context helpers through `grip-react`.
- Make existing hooks work cleanly with `GripContextLike`.

Deliverables:

- `useAtomValueTap` accepts `GripContextLike`, not only concrete
  `GripContext`.
- `useTap` accepts `GripContextLike`.
- `useAtomValueTap` widening is required for matching-context ergonomics.
- Optional `useKeyedChildContext(parent, key, init?, opts?)`.
- Optional `useKeyedMatchingContext(parent, key, init?, opts?)`.
- Export any helper types needed by the demo.

Tests:

- hook can register an atom tap into `matchingContext.getGripHomeContext()`.
- `useGrip(grip, matchingContext)` reads from the matching consumer context.
- keyed hook does not recreate context across re-renders with the same key.
- changing key creates a new keyed context.

Verification:

- `grip-react`: `npm test` and `npm run build`
- `grip-react-demo`: compile smoke after dependency update

Exit:

- React can use keyed child contexts without component-local `useMemo`.

## Step 3: TypeScript Async Stream Tap Hardening

Scope:

- Finish or harden `createAsyncStreamMultiTap` in `grip-core` for demo use.

Deliverables:

- Stable public export from `grip-core` and `grip-react`.
- Per-request-key stream sharing.
- Replay latest event to new destinations sharing the key.
- Cancel stream when last destination leaves.
- Destination parameter changes move destination between keys.
- Error handling path publishes deterministic state or terminal output.
- Live-provider error handling uses bounded exponential backoff with random
  jitter:
  - initial retry window around 250-500 ms
  - repeated failure windows around 500-1000 ms, 1-2 s, 2-4 s, and so on
  - capped max retry period with jitter, for example 10-30 s
  - retry loop stops immediately when the last destination detaches
  - attempt counter resets after a stable open period
- Known unsupported/auth-required providers enter `unavailable` or slow-probe
  state, not hot retry.
- Stale/no-event status is representable by a tap-level timer and output state;
  core does not need to own the 15 second coin stale policy.

Tests:

- stream starts on first listener.
- stream stops after last listener.
- two destinations with the same key share one stream.
- different keys use different streams.
- late listener receives latest event.
- destination param change detaches old key and attaches new key.
- error event/state behavior is deterministic.
- provider error retries with bounded exponential backoff and jitter while a
  destination remains attached.
- retry loop cancels when the last destination detaches.
- stream tap exposes enough hooks/options for coin taps to publish
  `COIN_STREAM_STATUS` on error/reset.

Verification:

- `grip-core`: focused stream tap tests and full `npm test -- --run`
- `grip-core`: `npm run build`
- `grip-react`: import/export smoke and `npm run build`

Exit:

- React demo can implement MockCoin with the same streaming primitive as live
  providers.

## Step 4: React Demo Mock Coin Surface

Scope:

- Add the coin tab and two-column UI in `grip-react-demo` using only `MockCoin`.

Deliverables:

- `src/grips.coin.ts`
- `src/cointaps.ts` with `createMockCoinTap()`
- `vitest` or another lightweight demo test harness if none exists yet.
- A runnable demo test command, for example `npm test -- --run` or the local
  equivalent chosen in this step.
- `CoinPanel.tsx`
- `CoinColumn.tsx`
- `CoinProductSelect.tsx`
- `CoinSourceSelect.tsx`
- `CURRENT_TAB` includes `"coins"`.
- `MockCoin` registered in a parent context as fallback provider.
- `MockCoin` uses `destinationParamGrips: [COIN_SOURCE, COIN_PRODUCT]`.
- Weather column can optionally migrate from `useMemo(createChild())` to keyed
  child context as a small proof.

Rules:

- No live websockets in this step.
- No global live provider bindings.
- Column ids are stable, e.g. `"A"` and `"B"`.
- Coin components do not import provider modules directly.

Tests:

- MockCoin deterministic mapper.
- two columns with different products show independent values.
- same product can share stream by request key.
- keyed context prevents context recreation across re-render.
- parent MockCoin fallback sees per-column destination params.

Verification:

- `npm run build`
- run the demo test command added in this step; include focused
  mapper/request-key/context tests before claiming test coverage
- manual: open `coins`, change products in both columns, confirm values update.

Exit:

- React UI demonstrates keyed contexts and streaming mock data without external
  network risk.

## Step 5: React Demo Live Coin Sources

Scope:

- Add Coinbase and Binance taps in `grip-react-demo`.
- Add per-column matching context for live-source overrides.

Deliverables:

- `createCoinbaseTap()`
- `createBinanceTap()`
- pure Coinbase message mapper tests
- pure Binance message mapper tests
- per-column `getOrCreateMatchingContext("coin:<id>", init)` setup
- matcher bindings for `coinbase` and `binance`
- `mock` source falls back to parent `MockCoin`
- live taps use `destinationParamGrips: [COIN_SOURCE, COIN_PRODUCT]`, matching
  `MockCoin`.
- product-to-symbol map for Binance lives in `cointaps.ts`.
- unavailable/error status for live websocket failures

Rules:

- Live taps normalize to the same output grips as MockCoin.
- Request keys do not include display-only fields.
- Mock receives `COIN_SOURCE` as a destination param for consistent wiring, but
  its request key ignores source and shares by product: `mock:${product}`.
- Stale/no-event timer maps to `COIN_STREAM_STATUS`, not to core stream tap
  global state.
- `COIN_STREAM_STATUS` uses the normalized v1 states: `idle`, `connecting`,
  `open`, `stale`, `reconnecting`, `error`, `unavailable`, `closed`.
- CoinCap is deferred unless API-key configuration is added in a later project.

Tests:

- source switch affects only one column.
- Coinbase mapper handles ticker and ignores non-ticker messages.
- Binance mapper handles 24hr ticker messages and unavailable states.
- switching source detaches old stream and attaches new stream.
- two Coinbase columns with same product share stream.
- two Binance columns with same product share stream.
- `mock` source does not install a matcher override and resolves through parent
  fallback.

Verification:

- `npm run build`
- manual: Column A `Coinbase / BTC-USD`, Column B `Mock / BTC-USD`
- manual: switch Column B to `Coinbase / BTC-USD` and inspect sharing/debug.
- manual: switch either column to `Binance / BTC-USD` and verify ticker fields
  update from Binance.

Exit:

- TS/React path is complete enough to mirror in Python.

## Step 6: Python Keyed Contexts

Scope:

- Add equivalent keyed context helpers to `grip-py`.

Deliverables:

- `GripContext.get_or_create_child_context(key, init=None, ...)`
- `GripContext.get_or_create_matching_context(key, init=None, ...)`
- weak facade-owned named context cache
- exports remain available through `grip_py` and `grip_py.core`

Rules:

- Do not use `context_id` as the authoritative cache key.
- `context_id` remains a graph/debug/cleanup marker.
- Keep naming semantics aligned with TS.

Tests:

- same key returns same live child context.
- same key under different parent does not collide.
- initializer runs once for live context.
- matching context helper creates home/presentation pair.
- matching context helper creates presentation as a child of home/source.
- binding in initializer drives matcher selection.
- parent fallback tap using destination params sees source/home atom values from
  presentation consumers.
- stale weak entry is ignored after facade is gone.

Verification:

- `grip-py`: focused context/matcher tests
- run broader suite if practical

Exit:

- Python can model the same column keyed context structure.

## Step 7: Python Async Stream Tap

Scope:

- Add `create_async_stream_tap` to `grip-py`.

Deliverables:

- `AsyncStreamTap` class or equivalent helper.
- `create_async_stream_tap(...)` public helper.
- one async task per request key.
- destination sharing by request key.
- latest event replay.
- cleanup/cancel when last destination leaves.
- deterministic error/status handling.
- `subscribe` may return an async iterable or async generator.
- cancellation cancels the owner task, calls `aclose()` when available, and is
  not reported as a provider error.
- non-cancellation exceptions publish deterministic status/reset outputs.
- status/error behavior can feed a demo `COIN_STREAM_STATUS` output.
- exports through `grip_py` and `grip_py.core`.

Suggested API:

```py
create_async_stream_tap(
    *,
    provides,
    destination_param_grips=None,
    home_param_grips=None,
    request_key_of=None,
    subscribe,
    map_event,
    replay_latest=True,
    cleanup_delay_ms=1000,
    state_grip=None,
)
```

Tests:

- stream starts on first listener.
- stream stops after last listener.
- same key shares one stream.
- different keys create different streams.
- latest event replays to a late destination.
- destination param change moves destination to new key.
- subscribe exception publishes deterministic state/error.
- async generator `aclose()` is called on cancellation when available.
- cancellation is not surfaced as provider failure.

Verification:

- `grip-py`: focused async stream tests
- `grip-py`: existing async tap tests still pass

Exit:

- Python runtime has parity with TS for this demo.

## Step 8: Python Demo Mock Coin Surface

Scope:

- Add the coin tab and two-column UI in `grip-py-demo` using only `MockCoin`.
- Scope is only `grip_py_demo`. Pyrolyze-oriented demo modules are WIP and are
  deferred.

Deliverables:

- `CoinGrips` in `src/grip_py_demo/grips.py`
- `src/grip_py_demo/cointaps.py` with `create_mock_coin_tap`
- Python demo test coverage for mappers/request keys if no existing test covers
  them
- `CoinSnapshot`
- `CoinColumnWidget`
- coin page in `ui.py`
- runtime methods in `demo_runtime.py`
- stable column ids `"A"` and `"B"`
- `MockCoin` registered as parent fallback provider
- `MockCoin` uses destination params for source/product.

Tests:

- runtime exposes coin snapshot.
- setting product in one column does not affect the other.
- mock stream starts/stops with listeners.
- parent fallback sees per-column destination params.
- UI smoke test includes coin tab.

Verification:

- `grip-py-demo`: existing tests plus focused coin runtime tests
- manual: open Qt demo, switch to coins, change products.

Exit:

- Python demo has non-network streaming surface.

## Step 9: Python Demo Live Coin Sources

Scope:

- Add Coinbase and Binance providers to `grip-py-demo`.
- Use keyed matching contexts for live-source overrides.
- Scope is only `grip_py_demo`. Pyrolyze-oriented demo modules are WIP and are
  deferred.

Deliverables:

- `create_coinbase_tap`
- `create_binance_tap`
- pure mapper tests
- product-to-symbol map for Binance lives in `cointaps.py`.
- source selector in `CoinColumnWidget`
- runtime source setter per column
- unavailable/error status for live websocket failures

Tests:

- source switch affects only one column.
- Coinbase mapper handles ticker messages.
- Binance mapper handles 24hr ticker messages and unavailable states.
- two columns sharing provider/product share stream task.
- live taps and parent fallback use the same destination-param wiring.

Verification:

- `grip-py-demo`: tests
- manual: Column A `Coinbase / BTC-USD`, Column B `Mock / BTC-USD`
- manual: switch either column to `Binance / BTC-USD` and verify ticker fields
  update from Binance.

Exit:

- Python demo matches React demo behavior at the architecture level.

## Step 10: Hardening And Documentation

Scope:

- Clean up naming, docs, and release readiness.

Deliverables:

- README updates for both demos.
- `grip-core` release notes for keyed contexts and stream taps.
- `grip-react` release notes for exports/hook widening.
- `grip-py` release notes for keyed contexts and async stream taps.
- Note how this demo maps to `grip-lab` service-client stream taps:
  stream `subscribe` corresponds to `ServiceClient.subscribe()` async event
  streams, and `mapEvent` corresponds to protocol reducers.
- Debug guidance for graph visualizer / Python graph dump.
- Manual verification checklist.

Verification:

- all focused tests from prior steps.
- `grip-core`: `npm test -- --run`, `npm run build`
- `grip-react`: `npm test`, `npm run build`
- `grip-react-demo`: `npm run build`
- `grip-py`: relevant full suite
- `grip-py-demo`: relevant full suite

Exit:

- Ready to release core packages and keep both demos as parity examples.

## Stop Conditions

Pause the roll-build if:

- keyed context cache holds hard references and breaks context GC
- duplicate context ids cause graph node reuse
- matcher bindings cannot be initialized safely in the context factory
- stream tap cancellation leaves upstream websocket/task running
- TS and Python APIs drift in naming or semantics
- demo code needs global live provider bindings to work
- Binance or Coinbase instability blocks the rest of the demo instead of
  degrading to error/reconnecting/unavailable status
