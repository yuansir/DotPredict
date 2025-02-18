import { GameState } from '../types';

const GAME_STATE_KEY = 'dotPredict_gameState';
const GAME_HISTORY_KEY = 'dotPredict_gameHistory';

class StorageService {
  private db: IDBDatabase | null = null;
  private dbName = 'dotPredict';
  private version = 1;

  constructor() {
    this.initDB().catch(console.error);
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建游戏状态存储
        if (!db.objectStoreNames.contains('gameState')) {
          const store = db.createObjectStore('gameState', { keyPath: 'date' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 创建游戏历史存储
        if (!db.objectStoreNames.contains('gameHistory')) {
          const store = db.createObjectStore('gameHistory', { keyPath: 'timestamp' });
          store.createIndex('accuracy', 'accuracy', { unique: false });
        }
      };
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }
  }

  // 保存当天的游戏状态
  async saveGameState(state: GameState): Promise<void> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      await this.saveGameStateByDate(state, today);
    } catch (error) {
      console.error('Failed to save game state:', error);
      throw error;
    }
  }

  // 根据日期保存游戏状态
  async saveGameStateByDate(state: GameState, date: string): Promise<void> {
    console.log(`Attempting to save game state for date: ${date}`);
    
    try {
      await this.ensureInitialized();
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      // 尝试使用 IndexedDB 保存
      try {
        await new Promise<void>((resolve, reject) => {
          const transaction = this.db!.transaction('gameState', 'readwrite');
          const store = transaction.objectStore('gameState');

          const stateWithDate = {
            ...state,
            date,
            timestamp: Date.now(),
          };

          console.log(`Saving state to IndexedDB for date ${date}:`, stateWithDate);

          const request = store.put(stateWithDate);

          request.onerror = () => {
            console.error('IndexedDB save failed:', request.error);
            reject(request.error);
          };

          transaction.oncomplete = () => {
            console.log(`Successfully saved state to IndexedDB for date: ${date}`);
            resolve();
          };

          transaction.onerror = () => {
            console.error('IndexedDB transaction failed:', transaction.error);
            reject(transaction.error);
          };
        });

        return; // 如果 IndexedDB 保存成功，直接返回
      } catch (indexedDBError) {
        console.warn('IndexedDB save failed, falling back to localStorage:', indexedDBError);
        // 继续执行，尝试 localStorage
      }

      // 如果 IndexedDB 失败，尝试使用 localStorage
      try {
        const key = `${GAME_STATE_KEY}_${date}`;
        console.log(`Falling back to localStorage with key: ${key}`);
        localStorage.setItem(key, JSON.stringify(state));
        console.log(`Successfully saved state to localStorage for date: ${date}`);
      } catch (localStorageError) {
        console.error('localStorage save failed:', localStorageError);
        throw new Error(`Failed to save game state: ${localStorageError.message}`);
      }
    } catch (error) {
      console.error('Failed to save game state:', error);
      throw error; // 确保错误被传播到调用者
    }
  }

  // 加载当天的游戏状态
  async loadGameState(): Promise<GameState | null> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      return await this.loadGameStateByDate(today);
    } catch (error) {
      console.error('Failed to load game state:', error);
      return null;
    }
  }

  // 根据日期加载游戏状态
  async loadGameStateByDate(date: string): Promise<GameState | null> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction('gameState', 'readonly');
        const store = transaction.objectStore('gameState');
        const request = store.get(date);

        request.onerror = () => {
          console.error('Failed to load game state:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          if (request.result) {
            const { date, timestamp, ...state } = request.result;
            resolve(state);
          } else {
            resolve(null);
          }
        };
      });
    } catch (error) {
      // 如果 IndexedDB 失败，回退到 localStorage
      console.warn('Falling back to localStorage');
      const savedState = localStorage.getItem(`${GAME_STATE_KEY}_${date}`);
      return savedState ? JSON.parse(savedState) : null;
    }
  }

  async saveGameHistory(state: GameState): Promise<void> {
    try {
      const currentHistory = await this.getGameHistory();
      const newHistory = [...currentHistory, {
        timestamp: Date.now(),
        totalPredictions: state.totalPredictions,
        correctPredictions: state.correctPredictions,
        accuracy: state.totalPredictions > 0
          ? (state.correctPredictions / state.totalPredictions) * 100
          : 0,
      }];
      localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save game history:', error);
      throw error;
    }
  }

  async getGameHistory(): Promise<any[]> {
    try {
      const savedHistory = localStorage.getItem(GAME_HISTORY_KEY);
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      console.error('Failed to load game history:', error);
      return [];
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error('Database not initialized');

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['gameState', 'gameHistory'], 'readwrite');
        const gameStateStore = transaction.objectStore('gameState');
        const gameHistoryStore = transaction.objectStore('gameHistory');

        gameStateStore.clear();
        gameHistoryStore.clear();

        transaction.oncomplete = () => {
          // 同时清除 localStorage
          localStorage.clear();
          resolve();
        };

        transaction.onerror = () => {
          reject(transaction.error);
        };
      });
    } catch (error) {
      // 如果 IndexedDB 失败，至少清除 localStorage
      localStorage.clear();
    }
  }
}

export const storageService = new StorageService();
