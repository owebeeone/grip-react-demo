import {
  applyLocalPersistenceSnapshot,
  type Grok,
} from '@owebeeone/grip-react';
import { HttpGlialClient } from '@owebeeone/glial-net';
import type { SessionSnapshot } from '@owebeeone/glial-local';
import type { DemoSessionStore } from './demo_session';

export interface DemoGlialSyncOptions {
  grok: Grok;
  store: DemoSessionStore;
  sessionId: string;
  title?: string;
  baseUrl: string;
  userId: string;
  sessionKind: 'glial-storage' | 'glial-shared';
  pollIntervalMs?: number;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value);
}

function snapshotToRecord(snapshot: SessionSnapshot): Record<string, unknown> {
  return snapshot as unknown as Record<string, unknown>;
}

function coerceSnapshot(snapshot: Record<string, unknown>): SessionSnapshot {
  return snapshot as unknown as SessionSnapshot;
}

function isMissingRemoteSessionError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('404');
}

export class DemoGlialSessionSync {
  private readonly grok: Grok;
  private readonly store: DemoSessionStore;
  private readonly sessionId: string;
  private readonly title?: string;
  private readonly client: HttpGlialClient;
  private readonly userId: string;
  private readonly sessionKind: 'glial-storage' | 'glial-shared';
  private readonly pollIntervalMs: number;

  private timer: ReturnType<typeof setInterval> | null = null;
  private syncing = false;
  private disposed = false;
  private lastRemoteModifiedMs = 0;
  private lastAppliedSignature = '';

  constructor(opts: DemoGlialSyncOptions) {
    this.grok = opts.grok;
    this.store = opts.store;
    this.sessionId = opts.sessionId;
    this.title = opts.title;
    this.client = new HttpGlialClient({ baseUrl: opts.baseUrl });
    this.userId = opts.userId;
    this.sessionKind = opts.sessionKind;
    this.pollIntervalMs = opts.pollIntervalMs ?? 750;
  }

  async start(): Promise<void> {
    const localSnapshot = await this.readLocalSnapshot();
    this.lastAppliedSignature = stableStringify(localSnapshot);
    try {
      const remote = await this.client.loadRemoteSession(this.userId, this.sessionId);
      this.lastRemoteModifiedMs = remote.last_modified_ms;
      const remoteSignature = stableStringify(remote.snapshot);
      if (remoteSignature !== this.lastAppliedSignature) {
        await this.applyRemoteSnapshot(coerceSnapshot(remote.snapshot));
        this.lastAppliedSignature = remoteSignature;
      }
    } catch (error) {
      if (!isMissingRemoteSessionError(error)) {
        throw error;
      }
      const saved = await this.client.saveRemoteSession(
        this.userId,
        this.sessionId,
        snapshotToRecord(localSnapshot),
        this.title,
      );
      this.lastRemoteModifiedMs = saved.last_modified_ms;
    }
    this.timer = setInterval(() => {
      void this.syncNow();
    }, this.pollIntervalMs);
  }

  stop(): void {
    this.disposed = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async flushNow(): Promise<void> {
    await this.syncNow();
  }

  private async syncNow(): Promise<void> {
    if (this.disposed || this.syncing) {
      return;
    }
    this.syncing = true;
    try {
      let localSnapshot = await this.readLocalSnapshot();
      let localSignature = stableStringify(localSnapshot);

      if (this.sessionKind === 'glial-shared') {
        try {
          const remote = await this.client.loadRemoteSession(this.userId, this.sessionId);
          const remoteSignature = stableStringify(remote.snapshot);
          if (
            remote.last_modified_ms > this.lastRemoteModifiedMs &&
            remoteSignature !== localSignature
          ) {
            await this.applyRemoteSnapshot(coerceSnapshot(remote.snapshot));
            this.lastRemoteModifiedMs = remote.last_modified_ms;
            this.lastAppliedSignature = remoteSignature;
            return;
          }
          this.lastRemoteModifiedMs = Math.max(this.lastRemoteModifiedMs, remote.last_modified_ms);
        } catch (error) {
          if (!isMissingRemoteSessionError(error)) {
            throw error;
          }
        }
      }

      if (localSignature === this.lastAppliedSignature) {
        return;
      }

      const saved = await this.client.saveRemoteSession(
        this.userId,
        this.sessionId,
        snapshotToRecord(localSnapshot),
        this.title,
      );
      this.lastRemoteModifiedMs = saved.last_modified_ms;
      this.lastAppliedSignature = localSignature;
    } finally {
      this.syncing = false;
    }
  }

  private async readLocalSnapshot(): Promise<SessionSnapshot> {
    await this.grok.flushLocalPersistence();
    const hydrated = await this.store.hydrate(this.sessionId);
    return hydrated.snapshot;
  }

  private async applyRemoteSnapshot(snapshot: SessionSnapshot): Promise<void> {
    this.grok.runWithLocalPersistenceSuppressed(() => {
      applyLocalPersistenceSnapshot(this.grok, snapshot);
    });
    await this.store.replaceSnapshot(this.sessionId, snapshot, 'glial_resync');
  }
}
