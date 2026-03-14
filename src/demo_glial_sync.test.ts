import { describe, expect, it } from 'vitest';
import {
  createAtomValueTap,
  GripOf,
  GripRegistry,
  Grok,
} from '@owebeeone/grip-react';
import { InMemoryGripSessionStore, type SessionSnapshot } from '@owebeeone/glial-local';
import { DemoGlialSessionSync, type DemoGlialSyncClient } from './demo_glial_sync';

function snapshotToRecord(snapshot: SessionSnapshot): Record<string, unknown> {
  return snapshot as unknown as Record<string, unknown>;
}

function readCountFromRecord(snapshot: Record<string, unknown>): number | undefined {
  const contexts = (snapshot.contexts ?? {}) as Record<string, { drips?: Record<string, { value?: unknown }> }>;
  for (const context of Object.values(contexts)) {
    const value = context.drips?.['app:Count']?.value;
    if (typeof value === 'number') {
      return value;
    }
  }
  return undefined;
}

class FakeDemoGlialClient implements DemoGlialSyncClient {
  remoteSnapshot: Record<string, unknown>;
  remoteLastModifiedMs: number;
  loadCalls = 0;
  saveCalls = 0;
  sharedSaveCalls = 0;

  constructor(snapshot: Record<string, unknown>, lastModifiedMs = 1) {
    this.remoteSnapshot = structuredClone(snapshot);
    this.remoteLastModifiedMs = lastModifiedMs;
  }

  async loadRemoteSession(_userId: string, _sessionId: string) {
    this.loadCalls += 1;
    return {
      session_id: 'demo-sync',
      snapshot: structuredClone(this.remoteSnapshot),
      last_modified_ms: this.remoteLastModifiedMs,
    };
  }

  async saveRemoteSession(
    _userId: string,
    _sessionId: string,
    snapshot: Record<string, unknown>,
    _title?: string,
  ) {
    this.saveCalls += 1;
    this.remoteSnapshot = structuredClone(snapshot);
    this.remoteLastModifiedMs += 1;
    return {
      session_id: 'demo-sync',
      snapshot: structuredClone(this.remoteSnapshot),
      last_modified_ms: this.remoteLastModifiedMs,
    };
  }

  async saveSharedSession(
    _userId: string,
    _sessionId: string,
    snapshot: Record<string, unknown>,
    _title?: string,
  ) {
    this.sharedSaveCalls += 1;
    return {
      session_id: 'demo-sync',
      snapshot: structuredClone(snapshot),
      leases: {},
      last_modified_ms: this.remoteLastModifiedMs,
    };
  }
}

async function createSyncFixture() {
  const registry = new GripRegistry();
  const gripOf = GripOf(registry);
  const COUNT = gripOf<number>('Count', 1);
  const grok = new Grok(registry);
  const countTap = createAtomValueTap(COUNT, { initial: 1 });
  grok.registerTap(countTap);

  const store = new InMemoryGripSessionStore();
  await grok.attachLocalPersistence({
    sessionId: 'demo-sync',
    store,
    flushDelayMs: 0,
  });
  await grok.flushLocalPersistence();

  return { COUNT, countTap, grok, store };
}

describe('DemoGlialSessionSync', () => {
  it('prefers unsynced local changes over a newer remote snapshot', async () => {
    const { COUNT, countTap, grok, store } = await createSyncFixture();
    const initialSnapshot = (await store.hydrate('demo-sync')).snapshot;
    const client = new FakeDemoGlialClient(snapshotToRecord(initialSnapshot), 10);
    let now = 0;

    const sync = new DemoGlialSessionSync({
      grok,
      store,
      sessionId: 'demo-sync',
      baseUrl: 'http://glial.test',
      userId: 'demo-user',
      sessionKind: 'glial-shared',
      client,
      remotePollMinMs: 100,
      remotePollMaxMs: 500,
      nowMs: () => now,
    });

    await sync.start();

    countTap.set(2);
    await grok.flushLocalPersistence();
    const staleRemoteSnapshot = snapshotToRecord((await store.hydrate('demo-sync')).snapshot);

    countTap.set(3);
    client.remoteSnapshot = staleRemoteSnapshot;
    client.remoteLastModifiedMs = 11;

    now = 200;
    await sync.flushNow();

    const countDrip = grok.query(COUNT, grok.mainPresentationContext);
    expect(countDrip.get()).toBe(3);
    expect(readCountFromRecord(client.remoteSnapshot)).toBe(3);
    expect(client.saveCalls).toBe(1);
  });

  it('backs off remote polling while the session is idle', async () => {
    const { grok, store } = await createSyncFixture();
    const initialSnapshot = (await store.hydrate('demo-sync')).snapshot;
    const client = new FakeDemoGlialClient(snapshotToRecord(initialSnapshot), 10);
    let now = 0;

    const sync = new DemoGlialSessionSync({
      grok,
      store,
      sessionId: 'demo-sync',
      baseUrl: 'http://glial.test',
      userId: 'demo-user',
      sessionKind: 'glial-shared',
      client,
      remotePollMinMs: 100,
      remotePollMaxMs: 400,
      nowMs: () => now,
    });

    await sync.start();
    expect(client.loadCalls).toBe(1);

    await sync.flushNow();
    expect(client.loadCalls).toBe(1);

    now = 100;
    await sync.flushNow();
    expect(client.loadCalls).toBe(2);

    now = 250;
    await sync.flushNow();
    expect(client.loadCalls).toBe(2);

    now = 350;
    await sync.flushNow();
    expect(client.loadCalls).toBe(3);
  });
});
