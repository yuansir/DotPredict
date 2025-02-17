import { DotColor, Position, GameState } from '../types';

const DB_NAME = 'DotPredictDB';
const DB_VERSION = 1;

interface GameHistory {
  id: number;
  timestamp: number;
  grid: (DotColor | null)[][];
  score: {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
  };
}

class StorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // 在构造函数中初始化数据库
    this.initPromise = this.init();
  }

  private async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建游戏历史记录存储
        if (!db.objectStoreNames.contains('gameHistory')) {
          const historyStore = db.createObjectStore('gameHistory', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          historyStore.createIndex('timestamp', 'timestamp');
        }

        // 创建游戏状态存储
        if (!db.objectStoreNames.contains('gameState')) {
          db.createObjectStore('gameState', { keyPath: 'id' });
        }
      };
    });
  }

  async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    } else {
      this.initPromise = this.init();
      await this.initPromise;
    }
  }

  async saveGameState(state: GameState): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction('gameState', 'readwrite');
        const store = transaction.objectStore('gameState');
        
        const request = store.put({
          id: 'current',
          ...state,
          timestamp: Date.now()
        });

        request.onerror = () => {
          console.error('Failed to save game state:', request.error);
          reject(request.error);
        };
        
        request.onsuccess = () => {
          console.log('Game state saved successfully');
          resolve();
        };
      } catch (error) {
        console.error('Error in saveGameState:', error);
        reject(error);
      }
    });
  }

  async loadGameState(): Promise<GameState | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction('gameState', 'readonly');
        const store = transaction.objectStore('gameState');
        const request = store.get('current');

        request.onerror = () => {
          console.error('Failed to load game state:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          console.log('Game state loaded:', request.result);
          resolve(request.result ? request.result : null);
        };
      } catch (error) {
        console.error('Error in loadGameState:', error);
        reject(error);
      }
    });
  }

  async saveGameHistory(state: GameState): Promise<void> {
    await this.ensureInitialized();

    const history: Omit<GameHistory, 'id'> = {
      timestamp: Date.now(),
      grid: state.grid,
      score: {
        totalPredictions: state.totalPredictions,
        correctPredictions: state.correctPredictions,
        accuracy: state.correctPredictions / state.totalPredictions * 100
      }
    };

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction('gameHistory', 'readwrite');
        const store = transaction.objectStore('gameHistory');
        const request = store.add(history);

        request.onerror = () => {
          console.error('Failed to save game history:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          console.log('Game history saved successfully');
          resolve();
        };
      } catch (error) {
        console.error('Error in saveGameHistory:', error);
        reject(error);
      }
    });
  }

  async getGameHistory(): Promise<GameHistory[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction('gameHistory', 'readonly');
        const store = transaction.objectStore('gameHistory');
        const request = store.getAll();

        request.onerror = () => {
          console.error('Failed to get game history:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          console.log('Game history loaded:', request.result);
          resolve(request.result || []);
        };
      } catch (error) {
        console.error('Error in getGameHistory:', error);
        reject(error);
      }
    });
  }
}

export const storageService = new StorageService();
