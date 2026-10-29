import { SystemState } from '../types';
import { INITIAL_SYSTEM_STATE } from './initialData';

const STORAGE_KEY = 'wonderland_arcade_system_state_v1';

export class StorageEngine {
  private memoryState: SystemState | null = null;
  private subscribers: Array<(state: SystemState) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.memoryState = parsed;
            this.notifySubscribers();
          } catch {
            // ignore bad storage json
          }
        }
      });
    }
  }

  public subscribe(callback: (state: SystemState) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback);
    };
  }

  private notifySubscribers() {
    if (this.memoryState) {
      this.subscribers.forEach((cb) => cb(this.memoryState!));
    }
  }

  public getState(): SystemState {
    if (this.memoryState) {
      return this.memoryState;
    }

    if (typeof window === 'undefined') {
      return INITIAL_SYSTEM_STATE;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure new schema keys exist
        this.memoryState = {
          ...INITIAL_SYSTEM_STATE,
          ...parsed,
          settings: { ...INITIAL_SYSTEM_STATE.settings, ...(parsed.settings || {}) }
        };
        return this.memoryState!;
      }
    } catch {
      // Fallback
    }

    this.memoryState = JSON.parse(JSON.stringify(INITIAL_SYSTEM_STATE));
    this.saveState(this.memoryState!);
    return this.memoryState!;
  }

  public saveState(state: SystemState): void {
    this.memoryState = state;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn('LocalStorage save failed, running in memory-only:', err);
      }
    }
    this.notifySubscribers();
  }

  public resetToDefault(): SystemState {
    const fresh = JSON.parse(JSON.stringify(INITIAL_SYSTEM_STATE));
    this.saveState(fresh);
    return fresh;
  }

  public exportBackupJson(): string {
    const state = this.getState();
    return JSON.stringify(
      {
        app: 'Wonderland Arcade Management System',
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        state
      },
      null,
      2
    );
  }

  public importBackupJson(jsonString: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      const incomingState = parsed.state || parsed;

      // Validate core required entities
      if (
        !incomingState.products ||
        !incomingState.resources ||
        !incomingState.gameCategories ||
        !incomingState.customers
      ) {
        return { success: false, error: 'Invalid backup structure. Missing essential arcade entities.' };
      }

      const mergedState: SystemState = {
        ...INITIAL_SYSTEM_STATE,
        ...incomingState,
        settings: {
          ...INITIAL_SYSTEM_STATE.settings,
          ...(incomingState.settings || {})
        }
      };

      this.saveState(mergedState);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Malformed JSON file' };
    }
  }
}

export const storageEngine = new StorageEngine();
