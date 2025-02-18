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
          const store = db.createObjectStore('gameState', { keyPath: 'id' });
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

  async saveGameState(state: GameState): Promise<void> {
    try {
      localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save game state:', error);
      throw error;
    }
  }

  async loadGameState(): Promise<GameState | null> {
    try {
      const savedState = localStorage.getItem(GAME_STATE_KEY);
      return savedState ? JSON.parse(savedState) : null;
    } catch (error) {
      console.error('Failed to load game state:', error);
      return null;
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
      localStorage.removeItem(GAME_STATE_KEY);
      localStorage.removeItem(GAME_HISTORY_KEY);
      if (this.db) {
        await this.clearIndexedDB();
      }
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  private async clearIndexedDB(): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) return;

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['gameState', 'gameHistory'], 'readwrite');
      const gameStateStore = transaction.objectStore('gameState');
      const gameHistoryStore = transaction.objectStore('gameHistory');

      const clearGameState = gameStateStore.clear();
      const clearGameHistory = gameHistoryStore.clear();

      clearGameState.onsuccess = () => {
        console.log('Game state cleared');
      };

      clearGameHistory.onsuccess = () => {
        console.log('Game history cleared');
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }
}

export const storageService = new StorageService();
