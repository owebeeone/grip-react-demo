# StreamSourceDemo

Plan for a small streaming-provider demo in both `grip-react-demo` and
`grip-py-demo` using local column contexts, matcher-selected taps, and three
independently selectable coin data sources.

## Goal

Build a coin-market tab that mirrors the existing weather two-column demo in
both runtimes:

- each column has its own child context
- each column selects a coin/product
- each column selects a stream source: `mock`, `binance`, or `coinbase`
- each source is implemented as a separate tap file/module in each demo
- a `MatchingContext` per column observes source/product state in a column
  source context and installs the selected tap in a column destination context
- only active columns/listeners keep websocket streams open

This is primarily a demo for `createAsyncStreamMultiTap` and for local matcher
scope in TypeScript, plus the matching Python streaming tap concept in
`grip-py`. It is not intended to be a trading UI.

## External Feed Notes

Use public feeds only and treat endpoint behavior as part of the spike:

- Coinbase Exchange websocket: `wss://ws-feed.exchange.coinbase.com`
  subscribed with `product_ids` and `channels: ["ticker"]`. Coinbase documents
  this as the public Exchange websocket feed for market data.
- Binance public websocket: `wss://stream.binance.com:9443/ws/btcusdt@ticker`
  for a single stream, or
  `wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker`
  for combined streams.

CoinCap is deferred. A quick unauthenticated websocket check showed that
`wss://ws.coincap.io/prices?assets=bitcoin,ethereum` returns an API-key
authorization error, and `wss://ws.coincap.io/trades/binance` is not a valid
path. Reconsider CoinCap later only if the demo grows API-key configuration.

## UI Shape

Add a new tab, probably `coins`, next to `clock`, `calc`, and `weather`.

The `CoinPanel` has two columns:

```text
Coin A                              Coin B
source: [Mock | Binance | Coinbase] source: [Mock | Binance | Coinbase]
symbol/product selector             symbol/product selector
price                               price
bid/ask or last trade fields        bid/ask or last trade fields
volume / trade size                 volume / trade size
last update time                    last update time
connection status                   connection status
event count                         event count
```

Suggested defaults:

- Column A: `BTC-USD`, source `mock`
- Column B: `ETH-USD`, source `mock`

Selectors:

- Coinbase products: `BTC-USD`, `ETH-USD`, `SOL-USD`, `DOGE-USD`
- Binance symbols map from the same products to `BTCUSDT`, `ETHUSDT`,
  `SOLUSDT`, and `DOGEUSDT`
- Mock accepts the same normalized coin ids and maps display labels locally

## Grips

Create parallel grip catalogs:

- React: `grip-react-demo/src/grips.coin.ts`
- Python: `grip-py-demo/src/grip_py_demo/grips.py` adds a `CoinGrips` catalog

Local column input grips:

- `COIN_SOURCE`: `"mock" | "binance" | "coinbase"`
- `COIN_SOURCE_TAP`
- `COIN_PRODUCT`: normalized UI selection such as `"BTC-USD"`
- `COIN_PRODUCT_TAP`
- `COIN_EXCHANGE_SYMBOL`: optional provider symbol such as `"BTCUSDT"` if a
  provider cannot use normalized product ids directly
- `COIN_EXCHANGE_SYMBOL_TAP`

Produced output grips:

- `COIN_PROVIDER`: provider label actually serving the data
- `COIN_SYMBOL`: display symbol/product
- `COIN_PRICE_USD`
- `COIN_BID`
- `COIN_ASK`
- `COIN_VOLUME`
- `COIN_TRADE_SIZE`
- `COIN_TRADE_SIDE`
- `COIN_EVENT_TIME`
- `COIN_EVENT_COUNT`
- `COIN_STREAM_STATUS`

Keep the output schema deliberately provider-neutral. Provider-specific payloads
can be logged during the spike, but they should not leak into the component.

## Tap Files

Create parallel tap modules:

- React: `grip-react-demo/src/cointaps.ts`
- Python: `grip-py-demo/src/grip_py_demo/cointaps.py`

Each module has three independent taps:

1. `createMockCoinTap()`
2. `createBinanceTap()`
3. `createCoinbaseTap()`

Each tap provides the same output grips and reads destination params from the
column context.

React stream taps should use `createAsyncStreamMultiTap` once the local
`@owebeeone/grip-react` build exposes it. Python stream taps should use the new
`grip-py` streaming tap helper described below.

Keep websocket setup inside the tap or a small helper local to the coin tap
module. Do not introduce a generic service client for this demo.

All coin data taps, including parent fallback `MockCoin`, must use destination
parameters for column-local data:

```ts
destinationParamGrips: [COIN_SOURCE, COIN_PRODUCT]
```

The provider-specific request key should be built from those destination params.
Do not depend on `homeParamGrips` for column-local product/source selection.

## Matcher Scope

Do not install the coin source matcher globally.

Core already has the right primitive for this shape:

- `DualContextContainer`: wraps a home/source context and a
  presentation/destination context
- `MatchingContext`: extends that container and owns a `TapMatcher`
- `TapMatcher`: subscribes to query inputs in the home context and applies
  producer deltas to the presentation context

Each `CoinColumn` should therefore get or create a small keyed context pair from
its parent context:

- column source context: owns local atom taps for `COIN_SOURCE` and
  `COIN_PRODUCT`
- column presentation context: where `COIN_PRICE_USD` and other output grips are
  consumed
- matching container: keyed by a stable column id such as `coin:left`

The generated hierarchy must make presentation a child of home/source:

```text
parent consumer context
  column home/source
    column presentation
```

This is required because destination parameter drips are created on the
presentation destination and resolve through its parent chain. If home and
presentation are siblings, a parent fallback tap using `destinationParamGrips`
will not see `COIN_SOURCE` or `COIN_PRODUCT`.

The intended shape is:

```ts
const column = parentCtx
  .getGripConsumerContext()
  .getOrCreateMatchingContext(`coin:${props.columnId}`, (ctx) => {
    ctx.addBinding({
      id: "coin-source-coinbase",
      query: withOneOf(COIN_SOURCE, "coinbase", 10).build(),
      tap: createCoinbaseTap(),
      baseScore: 5,
    });

    ctx.addBinding({
      id: "coin-source-binance",
      query: withOneOf(COIN_SOURCE, "binance", 10).build(),
      tap: createBinanceTap(),
      baseScore: 5,
    });
  });

useAtomValueTap(COIN_SOURCE, {
  ctx: column.getGripHomeContext(),
  initial: "mock",
  tapGrip: COIN_SOURCE_TAP,
});

useAtomValueTap(COIN_PRODUCT, {
  ctx: column.getGripHomeContext(),
  initial: "BTC-USD",
  tapGrip: COIN_PRODUCT_TAP,
});
```

Consumers read from the matching container, or explicitly from
`column.getGripConsumerContext()`.

`MockCoin` should be registered once in a higher context as the normal fallback
provider. The column matcher only installs the live-source overrides. When
`COIN_SOURCE` is `mock`, no live override matches and normal context resolution
falls back to `MockCoin`.

The matching-context initializer lambda receives the newly created
`MatchingContext`; `getOrCreateMatchingContext()` owns the standard subgraph
creation. The initializer runs only on first creation, so bindings belong there
as structural context setup.

This demonstrates the important behavior: Column A can resolve `COIN_PRICE_USD`
from `Coinbase` while Column B resolves the same output grip from `MockCoin`,
because each column has its own source context, matcher, and presentation
context.

## Core Extension Check

The existing core API is close, but needs a small keyed context helper. Current
`GripContext` has an `id` and graph child links, but does not expose a public
named-child lookup API.

Existing usable pieces:

- `MatchingContext` is exported from `@owebeeone/grip-react`.
- `GripProvider` and `useGrip` accept `GripContextLike`, so a matching container
  can be passed as a context-like object.
- `useAtomValueTap` can receive the source context directly.

Add these core helpers:

```ts
getOrCreateChildContext(
  key: string,
  init?: (ctx: GripContext) => void,
  opts?: { id?: string; priority?: number },
): GripContext;

getOrCreateMatchingContext(
  key: string,
  init?: (ctx: MatchingContext) => void,
  opts?: {
    sourceId?: string;
    presentationId?: string;
    sourcePriority?: number;
    presentationPriority?: number;
  },
): MatchingContext;
```

Use the named child key as the cache key. Generated ids should default to
readable values derived from the parent id and key, but callers can override
them through `opts`.

`getOrCreateMatchingContext` must create presentation as a child of home/source,
not as a sibling:

```text
parent
  source
    presentation
```

Weather can use the non-matcher helper:

```ts
const ctx = parentCtx
  .getGripConsumerContext()
  .getOrCreateChildContext(`weather:${props.columnId}`);
```

Coin columns can use the matcher helper as shown above.

Potential gaps to verify during the spike:

- whether `useGrip(..., matchingContext)` consistently reads from
  `getGripConsumerContext()`
- whether `useAtomValueTap` and `useTap` should accept `GripContextLike`; this
  is required if components pass matching containers or other context-like
  facades through hook APIs
- whether the keyed context cache should store `WeakRef` entries and purge dead
  entries opportunistically, matching the existing context GC policy

Only extend `grip-core`/`grip-react` if the existing API makes the correct
source/destination split awkward or error-prone. The expected extension is a
small named context creation helper, not a matcher rewrite.

## Cross-Runtime Parity

This is core context functionality, so add the same public API to `grip-py`.

The Python runtime mirrors the TypeScript shape:

- `GripContext` is a facade over an internal `GripContextNode`
- `GrokGraph` holds nodes in a global map by context id
- context nodes weakly reference their facade
- cleanup depends on the facade disappearing and the node having no live graph
  edges/consumers
- Python already has `MatchingContext(home_context, presentation_context)`

Do not use `context_id` as the authoritative named-child key in either runtime.
It is a graph/debug/cleanup marker and is globally indexed inside the graph.
Named children should be held by the live facade using weak references:

- TypeScript: `Map<string, WeakRef<GripContextLike>>`
- Python: `weakref.WeakValueDictionary[str, GripContextLike]` or an equivalent
  weak-ref map

The public APIs should align:

```ts
ctx.getOrCreateChildContext(key, init?, opts?)
ctx.getOrCreateMatchingContext(key, init?, opts?)
```

```py
ctx.get_or_create_child_context(key, init=None, *, priority=0, context_id=None)
ctx.get_or_create_matching_context(key, init=None, *, source_id=None, presentation_id=None)
```

The initializer receives the newly created facade/container and runs exactly
once. It is the right place for structural setup such as matcher bindings.
When the facade is gone and only a stale weak map entry remains, the next
`get_or_create*` call creates a fresh facade/node pair.

## Python Streaming Tap

`grip-py` currently has `create_async_tap(...)`, which is request/response:
`fetcher(params) -> dict[Grip, value]`. It does not have a long-lived stream tap
equivalent yet.

Add a Python primitive that mirrors the TypeScript stream tap:

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

Python field names can be snake_case, but semantics should map directly to the
TypeScript stream tap:

- `replay_latest` maps to the TS latest-event cache behavior
- `request_key_of` maps to `requestKeyOf`
- errors/reset events should be mappable to `COIN_STREAM_STATUS`

Expected behavior:

- one async stream task per request key
- destinations with the same key share the stream
- latest mapped event is replayed to late listeners when `replay_latest=True`
- destination param changes detach from the old key and attach to the new key
- when the last destination leaves a key, the stream task is cancelled after the
  cleanup delay
- stream errors publish state/error output and cleanly detach that key

Implementation can reuse concepts from `AsyncTap`:

- destination/home param collection
- request key building
- destination id to request key map
- request key to destination id set
- cleanup task scheduling

Keep it as a separate class/helper from `AsyncTap`; the control flow is event
consumption until cancellation, not fetch-once.

## Stream Semantics

Use `createAsyncStreamMultiTap` for all three data taps, including mock. That
keeps the demo focused on one streaming primitive.

Request keys:

- Mock: `mock:${product}`
- Coinbase: `coinbase:${product}`
- Binance: `binance:${exchangeSymbol}`

The request key must not include display-only fields. Mock receives
`COIN_SOURCE` as a destination param for consistent column-local resolution, but
it should ignore source in the request key and share by product. A request key
may include the destination context id only if a source cannot safely share a
websocket stream between columns. Prefer shared streams by request key for
identical provider and product selections.

Lifecycle:

- connect when the first destination listens
- share one stream for identical request keys
- replay latest event to later listeners
- close websocket/timer when the last listener for the key disconnects
- publish `COIN_STREAM_STATUS` transitions: `idle`, `connecting`, `open`,
  `stale`, `reconnecting`, `error`, `unavailable`, `closed`

Caching:

- cache only the latest materialized event plus event count per request key
- no historical chart buffer in v1
- add a short stale timer if no event arrives for 15 seconds

## Provider Mapping

### MockCoin

Timer-driven simulation:

- tick every 500-1000 ms
- deterministic seed from product id
- price follows a bounded random walk
- emits bid/ask around price, synthetic volume, event count, and timestamp

This tap should be deterministic enough for tests.

### Coinbase

Websocket:

```text
wss://ws-feed.exchange.coinbase.com
```

On open, send:

```json
{
  "type": "subscribe",
  "product_ids": ["BTC-USD"],
  "channels": ["ticker"]
}
```

Map `ticker` messages:

- `price` -> `COIN_PRICE_USD`
- `best_bid` -> `COIN_BID`
- `best_ask` -> `COIN_ASK`
- `volume_24h` or `last_size` -> volume/trade size fields
- `time` -> `COIN_EVENT_TIME`

Ignore non-ticker system/status messages except for status/debug output.

### Binance

Single-symbol websocket:

```text
wss://stream.binance.com:9443/ws/btcusdt@ticker
```

Combined-stream websocket if the tap later wants to share one socket across
multiple symbols:

```text
wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker
```

Map `24hrTicker` messages:

- `c` -> `COIN_PRICE_USD`
- `b` -> `COIN_BID`
- `a` -> `COIN_ASK`
- `v` -> `COIN_VOLUME`
- `E` -> `COIN_EVENT_TIME`
- `s` -> `COIN_SYMBOL`

Use a small product-to-symbol map inside the coin tap module, not in UI
components:

```text
BTC-USD -> BTCUSDT
ETH-USD -> ETHUSDT
SOL-USD -> SOLUSDT
DOGE-USD -> DOGEUSDT
```

## Components

React adds:

- `CoinPanel.tsx`
- `CoinColumn.tsx`
- `CoinProductSelect.tsx`
- `CoinSourceSelect.tsx`
- optional `CoinTickerCard.tsx`

Python adds:

- `CoinColumnWidget` in `grip_py_demo/ui.py`
- a coin page in the main Qt stack
- runtime methods in `grip_py_demo/demo_runtime.py` for source/product setters
  and snapshot reads
- `CoinSnapshot` data object, mirroring the existing `WeatherSnapshot`

Keep component/widget state in GRIP atom taps, matching the weather column
pattern. Avoid React `useState` for domain state.

Coin UI components must not import provider modules directly. They read and
write only grips and optional tap handles.

## Registration

Global registration should remain small in both demos:

- existing base taps stay in `registerAllTaps()` / demo runtime setup
- `MockCoin` is registered in a parent context as fallback data
- coin tab atom for `CURRENT_TAB` adds `"coins"`
- no global live coin provider bindings

Column keyed contexts own local matcher bindings and local atom taps. This is
the main demo point.

## Tests

Add focused tests before wiring the real websocket UI:

1. mock stream starts on first listener and stops on last listener
2. two columns with different source params resolve different taps for the same
   output grips
3. changing `COIN_SOURCE` switches providers in one column without affecting
   the other
4. changing `COIN_PRODUCT` changes request key and closes the old stream when no
   listeners remain
5. Coinbase message mapper handles ticker messages and ignores non-ticker
   messages
6. Binance message mapper handles 24hr ticker messages and unavailable/error
   states
7. latest event is replayed to a second listener sharing the same request key

Run these in both runtimes where applicable:

- `grip-core`: keyed context and stream tap tests
- `grip-py`: keyed context and async stream tap tests
- `grip-react-demo`: component/tap tests for the React coin surface
- `grip-py-demo`: runtime/UI tests for the Qt coin surface

Manual verification:

- run `grip-react-demo` with local `grip-core` and `grip-react` builds
- run `grip-py-demo` with local `grip-py`
- open the `coins` tab in each demo
- set Column A to `Coinbase / BTC-USD`
- set Column B to `Mock / BTC-USD`
- verify the React graph visualizer shows column-local matcher resolution
- verify the Python runtime graph dump or UI diagnostics show column-local
  matcher resolution
- switch Column B to `Coinbase / BTC-USD` and verify stream sharing by request
  key if the stream tap exposes enough debug data

## Rollout Steps

1. Add keyed context helpers in `grip-core` and export them through
   `grip-react`.
2. Add equivalent keyed context helpers in `grip-py`.
3. Add `create_async_stream_tap` in `grip-py`.
4. Confirm `createAsyncStreamMultiTap` is available from local
   `@owebeeone/grip-react`.
5. Add coin grips and pure provider message mappers in both demos.
6. Add `MockCoin` stream tap as parent fallback data in both demos.
7. Add `coins` tab and two-column UI using keyed non-live data in both demos.
8. Add column-local keyed `MatchingContext` for live source overrides in both
   demos.
9. Add Coinbase stream tap in both demos.
10. Add Binance stream tap in both demos.
11. Add tests for keyed context reuse, matcher scope, stream lifecycle, and
   provider mappers across both runtimes.
12. Run `npm run build`, the existing React demo tests, and the Python demo
   tests.

## Open Questions

- Should `createAsyncStreamMultiTap` live permanently in `grip-core` before this
  demo lands, or should the demo temporarily depend on the local checkout?
- Does the stream tap need a public debug grip for active stream count, or are
  logs and graph visualizer output sufficient for this demo?
- Should CoinCap return later as an optional API-key configured provider, or
  stay out of the demo?
