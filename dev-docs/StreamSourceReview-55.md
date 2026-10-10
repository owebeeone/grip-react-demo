# StreamSource Review 55

Fresh review of `dev-docs/StreamSourceDemo.md` and
`dev-docs/StreamSourceDemoPlan.md`.

## Verdict

The design is ready to start roll-building, with the TypeScript path first.
The current split is correct: keyed contexts and stream taps are core runtime
work, the React demo validates the UX and matcher shape, then Python mirrors
the semantics.

I would treat the plan as implementation-ready through the mock React demo,
provided the first implementation step also tightens the stream-tap lifecycle
rules called out below. The live-provider and Python phases are directionally
ready, but they still need a few concrete policy choices to avoid runtime drift
between TypeScript and Python.

Readiness estimate: about 85-90%.

## Strong Points

- The plan correctly starts with local package wiring. This matters because the
  demo has to prove unreleased `grip-core` and `grip-react` APIs before they are
  published.
- The column-local matcher shape is now right: `parent -> home/source ->
  presentation`. That is the key detail for `destinationParamGrips` to resolve
  source/product atoms from presentation consumers.
- The decision to put live provider bindings in the column matching context,
  while registering `MockCoin` as a parent fallback, matches the intended GRIP
  scoping model.
- Using the same stream primitive for mock, Coinbase, and Binance is the right
  demo constraint. It prevents the mock from becoming a special-case code path.
- Cross-runtime parity is explicit. Keyed context helpers and stream taps belong
  in both `grip-core` and `grip-py`, not just in React demo code.
- The roll-build phases are small enough to tag and verify. The stop conditions
  are also useful and should be enforced.

## High-Priority Findings

### 1. Stream error/restart policy needs to be pinned before live providers

`grip-core` already has `createAsyncStreamMultiTap`, but the current lifecycle
shape appears terminal after a stream error while destinations are still
attached. The tap can publish reset/error outputs, but if the stream remains in
the request-key map with the same attached destinations, a later `produce()` may
see the same request key and not recreate the stream.

The plan should require bounded exponential reconnect for live providers:

- retry after a short randomized initial delay, roughly 250-500 ms
- double the retry window on repeated failure, roughly 500-1000 ms, 1-2 s,
  2-4 s, and so on
- cap the retry period, then continue retrying at the max period with random
  jitter, for example 10-30 s
- stop the retry loop immediately when the last destination detaches
- reset the attempt counter after a stable open period

Use deterministic terminal or slow-probe status for any provider later marked
unavailable. Do not hot-retry a known unsupported or auth-required endpoint.

### 2. Matching-context init should follow existing ownership policy

The docs now correctly say the initializer lambda is the natural place to add
structural matcher bindings. Keep that rule. Taps, tap factories, matchers, and
drips should continue to follow the existing GRIP ownership policy instead of
adding a new disposal model for this demo.

The implementation goal for this roll-build is narrow:

- keyed context factories create the correct structural graph
- initializer bindings are installed once
- consumers detach through normal drip/tap lifecycle paths
- no explicit matcher disposal API is introduced unless the existing runtime
  policy already requires one

Deep lifecycle leak checks should be deferred to a later hardening pass. The
demo should not block on proving GC behavior as part of Step 1.

### 3. WeakRef cache tests should not depend on actual GC timing

The plan says stale weak-ref entries are ignored if the facade is gone. That is
the right behavior, but tests that depend on the JavaScript or Python GC running
on command will be brittle.

The implementation should either:

- expose a tiny internal-only prune/test hook
- inject a fake weak-ref entry in tests
- test opportunistic pruning with a manually dead weak-ref shim

This keeps the keyed-context feature testable without making the suite
environment-dependent.

### 4. Python stream cancellation contract is under-specified

The Python stream helper should define what `subscribe` returns and how it is
closed. In practice it should accept async iterables and async generators, and
the runtime should cancel the owning task and call `aclose()` when available.

Without this rule, websocket cleanup will vary by provider implementation.
Mirror the TS `AbortSignal` semantics as closely as Python allows:

- one task per request key
- cancellation requested when last destination leaves after cleanup delay
- async generator `aclose()` is called if present
- cancellation is not reported as a provider error
- non-cancellation exceptions produce deterministic status/reset outputs

### 5. Python demo package target is `grip_py_demo` only

The plan targets `grip_py_demo`. That should remain the scope for this
roll-build. Pyrolyze-oriented demo modules are WIP and should not mirror the
stream-source demo yet.

This is not a design blocker, but the plan should say it explicitly to prevent
edits from spreading across both demo packages by accident.

## Medium-Priority Findings

### 6. MockCoin destination params are correct, but request keys should ignore source

The docs say all coin taps use:

```ts
destinationParamGrips: [COIN_SOURCE, COIN_PRODUCT]
```

That is fine for consistent column-local resolution, including parent fallback.
However `MockCoin` should keep its request key as `mock:${product}` and ignore
the source value. If the key includes source, switching from `mock` to a live
source and back can fragment the mock stream cache unnecessarily.

The plan mostly says this already; keep it explicit in the tests.

### 7. `COIN_STREAM_STATUS` should distinguish provider state from transport state

The demo status values are useful, but they mix several concepts:

- provider unavailable
- websocket connecting/open/closed
- stale data
- provider error
- no selected request key

Use a small normalized enum and do not overload `closed` for unsupported
providers. A practical v1 set is:

```text
idle, connecting, open, stale, reconnecting, error, unavailable, closed
```

This will make mapper tests and UI rendering much cleaner.

### 8. Live-provider availability should degrade cleanly

Coinbase and Binance both worked in the quick unauthenticated websocket checks.
CoinCap is deferred because its old prices websocket now reports an API-key
authorization error and the proposed trades path is invalid.

The plan should still make live-provider availability non-fatal. If Coinbase or
Binance is temporarily unreachable, the demo should publish
`reconnecting`/`error`/`unavailable` status instead of blocking the
stream/matcher work.

### 9. React demo test harness should be an explicit deliverable

`grip-react-demo` currently should not be assumed to have the same test harness
shape as `grip-core` or `grip-react`. Step 4 says to add `vitest` or another
lightweight harness if none exists. That is correct, but make the exit sharper:
Step 4 is not done until mapper/request-key/context tests can be run by a
documented command.

### 10. Hook widening should cover every public context-like path

The plan correctly calls out `useAtomValueTap` and `useTap`. During Step 2,
check all React public helpers that accept a context. `useGrip` already accepts
context-like values, but any helper that is still typed as concrete
`GripContext` will make matching containers awkward.

The goal is not to widen everything blindly; it is to make the common pattern
work without casts:

```ts
useAtomValueTap(..., { ctx: column.getGripHomeContext() })
useGrip(COIN_PRICE_USD, column)
```

### 11. Step 0 should verify direct and transitive package resolution

The local dependency plan is right. Add a small verification command or script
that proves:

- `grip-react` resolves `@owebeeone/grip-core` from `../grip-core`
- `grip-react-demo` resolves `@owebeeone/grip-react` from `../grip-react`
- any direct demo import of `@owebeeone/grip-core` resolves locally

This avoids debugging against the npm versions by mistake.

## Lower-Priority Notes

- The UI should not import provider modules directly. The current docs state
  this; keep it enforced by file structure.
- The source selector and product selector should write GRIP atoms only. Avoid
  duplicating product/source in React component state.
- A parent fallback `MockCoin` plus local live overrides is a good demonstration
  of context scoping. It is also a good regression test for matcher priority.
- A weather-column migration to keyed child context is useful, but keep it
  optional. It should not delay the coin mock step.
- The stream cache should store only latest event/count for this demo. Avoid
  introducing chart history until the stream lifecycle is proven.
- Websocket tests should mock the provider transport. Manual live testing is
  useful but should not be required for normal CI.

## Suggested Plan Patches

I would patch the plan with these small additions before coding:

1. Step 1: keep matcher initializer bindings as structural setup and avoid
   adding a new disposal API for the demo.
2. Step 1: replace GC-dependent weak-ref assertions with a deterministic stale
   weak-ref/prune test strategy.
3. Step 3: pin bounded exponential backoff with jitter, capped max-period retry
   with jitter, and deterministic unavailable behavior for known unsupported
   providers.
4. Step 7: specify Python async iterable cancellation and `aclose()` behavior.
5. Step 8/9: state that only `grip_py_demo` is in scope; pyrolyze demo parity is
   deferred.
6. Step 4: require a runnable React demo test command before exit.
7. Step 5/9: make live-provider websocket failures degrade to
   `reconnecting`/`error`/`unavailable` status instead of blocking the build.

## Roll-Build Readiness

Start:

- Step 0 local wiring
- Step 1 TypeScript keyed contexts
- Step 3 stream-tap lifecycle hardening, if the current stream primitive is
  already exported and testable

Do not start live provider UI until:

- local package wiring is verified
- keyed matching context hierarchy works
- stream error/restart behavior is deterministic
- mock stream demo passes with two independent columns

Do not start Python parity until:

- the TS API names and lifecycle semantics settle
- the React mock demo proves the context/matcher shape

Bottom line: the design is solid and the plan is close. The remaining first-pass
risks are stream error/retry behavior, deterministic weak-cache behavior, and
cross-runtime API drift. Deeper lifecycle leak verification can be handled in a
later hardening pass after the demo proves the context and stream model.
