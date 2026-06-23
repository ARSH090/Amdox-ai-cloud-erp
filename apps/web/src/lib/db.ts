import Dexie, { Table } from 'dexie';

export interface OfflineMutation {
  id?: number;
  url: string;
  method: string;
  payload: any;
  createdAt: number;
}

export class AmdoxOfflineDB extends Dexie {
  mutations!: Table<OfflineMutation>;

  constructor() {
    super('AmdoxERP');
    this.version(1).stores({
      mutations: '++id, url, method, createdAt',
    });
  }
}

export const db = new AmdoxOfflineDB();

export async function queueOfflineMutation(url: string, method: string, payload: any) {
  await db.mutations.add({
    url,
    method,
    payload,
    createdAt: Date.now(),
  });
}

export async function syncOfflineMutations() {
  const mutations = await db.mutations.orderBy('createdAt').toArray();
  for (const mutation of mutations) {
    try {
      const res = await fetch(mutation.url, {
        method: mutation.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mutation.payload),
      });
      if (res.ok) {
        await db.mutations.delete(mutation.id!);
      }
    } catch (e) {
      console.error('Failed to sync mutation', mutation.id, e);
    }
  }
}
