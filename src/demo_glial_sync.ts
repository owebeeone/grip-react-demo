import {
  applyLocalPersistenceSnapshot,
  buildSharedProjectionSnapshot,
  type Grok,
} from '@owebeeone/grip-react';
import { HttpGlialClient } from '@owebeeone/glial-net';
import type { SessionSnapshot } from '@owebeeone/glial-local';
import type { DemoSessionStore } from './demo_session';

export interface DemoGlialSyncClient {
  loadRemoteSession(userId: string, sessionId: string): Promise<{
    session_id: string;
    title?: string;
    snapshot: Record<string, unknown>;
    last_modified_ms: number;
  }>;
  saveRemoteSession(
    userId: string,
    sessionId: string,
    snapshot: Record<string, unknown>,
    title?: string,
  ): Promise<{
    session_id: string;
    title?: string;
    snapshot: Record<string, unknown>;
    last_modified_ms: number;
  }>;
  saveSharedSession(
    userId: string,
    sessionId: string,
    snapshot: Record<string, unknown>,
    title?: string,
  ): Promise<{
    session_id: string;
    title?: string;
    snapshot: Record<string, unknown>;
    leases: Record<string, Record<string, unknown>>;
    last_modified_ms: number;
  }>;
}

export interface DemoGlialSyncOptions {
  grok: Grok;
  store: DemoSessionStore;
  sessionId: string;
  title?: string;
  baseUrl: string;
  userId: string;
  sessionKind: 'glial-storage' | 'glial-shared';
  pollIntervalMs?: number;
  remotePollMinMs?: number;
  remotePollMaxMs?: number;
  client?: DemoGlialSyncClient;
  nowMs?: () => number;
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
  private readonly client: DemoGlialSyncClient;
  private readonly userId: string;
  private readonly sessionKind: 'glial-storage' | 'glial-shared';
  private readonly pollIntervalMs: number;
  private readonly remotePollMinMs: number;
  private readonly remotePollMaxMs: number;
  private readonly nowMs: () => number;

  private timer: ReturnType<typeof setInterval> | null = null;
  private syncing = false;
  private disposed = false;
  private lastRemoteModifiedMs = 0;
  private lastAppliedSignature = '';
  private lastSharedSignature = '';
  private nextRemotePollAtMs = 0;
  private currentRemotePollMs = 0;

  constructor(opts: DemoGlialSyncOptions) {
    this.grok = opts.grok;
    this.store = opts.store;
    this.sessionId = opts.sessionId;
    this.title = opts.title;
    this.client = opts.client ?? new HttpGlialClient({ baseUrl: opts.baseUrl });
    this.userId = opts.userId;
    this.sessionKind = opts.sessionKind;
    this.pollIntervalMs = opts.pollIntervalMs ?? 750;
    this.remotePollMinMs = opts.remotePollMinMs ?? this.pollIntervalMs;
    this.remotePollMaxMs = opts.remotePollMaxMs ?? Math.max(this.remotePollMinMs, 5_000);
    this.nowMs = opts.nowMs ?? (() => Date.now());
    this.currentRemotePollMs = this.remotePollMinMs;
  }

  async start(): Promise<void> {
    const localSnapshot = await this.readLocalSnapshot();
    this.lastAppliedSignature = stableStringify(localSnapshot);
    if (this.sessionKind === 'glial-shared') {
      this.lastSharedSignature = '';
    }
    try {
      const remote = await this.client.loadRemoteSession(this.userId, this.sessionId);
      this.lastRemoteModifiedMs = remote.last_modified_ms;
      const remoteSignature = stableStringify(remote.snapshot);
      if (remoteSignature !== this.lastAppliedSignature) {
        await this.applyRemoteSnapshot(coerceSnapshot(remote.snapshot));
        this.lastAppliedSignature = remoteSignature;
      }
      this.resetRemotePollBackoff();
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
      this.resetRemotePollBackoff();
    }
    if (this.sessionKind === 'glial-shared') {
      await this.saveSharedSnapshot();
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
      const localSnapshot = await this.readLocalSnapshot();
      const localSignature = stableStringify(localSnapshot);
      const hasUnsyncedLocalChanges = localSignature !== this.lastAppliedSignature;

      if (this.sessionKind === 'glial-shared' && !hasUnsyncedLocalChanges && this.shouldPollRemote()) {
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
            this.resetRemotePollBackoff();
            return;
          }
          this.lastRemoteModifiedMs = Math.max(this.lastRemoteModifiedMs, remote.last_modified_ms);
          this.bumpRemotePollBackoff();
        } catch (error) {
          if (!isMissingRemoteSessionError(error)) {
            throw error;
          }
          this.resetRemotePollBackoff();
        }
      }

      if (!hasUnsyncedLocalChanges) {
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
      this.resetRemotePollBackoff();
      if (this.sessionKind === 'glial-shared') {
        await this.saveSharedSnapshot();
      }
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

  private shouldPollRemote(): boolean {
    return this.nowMs() >= this.nextRemotePollAtMs;
  }

  private resetRemotePollBackoff(): void {
    this.currentRemotePollMs = this.remotePollMinMs;
    this.nextRemotePollAtMs = this.nowMs() + this.currentRemotePollMs;
  }

  private bumpRemotePollBackoff(): void {
    this.currentRemotePollMs = Math.min(this.remotePollMaxMs, this.currentRemotePollMs * 2);
    this.nextRemotePollAtMs = this.nowMs() + this.currentRemotePollMs;
  }

  private readLocalSharedSnapshot(): Record<string, unknown> {
    return buildSharedProjectionSnapshot(this.grok, this.sessionId) as unknown as Record<string, unknown>;
  }

  private async saveSharedSnapshot(): Promise<void> {
    const sharedSnapshot = this.readLocalSharedSnapshot();
    const sharedSignature = stableStringify(sharedSnapshot);
    if (sharedSignature === this.lastSharedSignature) {
      return;
    }
    await this.client.saveSharedSession(
      this.userId,
      this.sessionId,
      sharedSnapshot,
      this.title,
    );
    this.lastSharedSignature = sharedSignature;
  }
}
