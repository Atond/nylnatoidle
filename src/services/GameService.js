import { gameStore } from '../store/state/GameStore';
import { monsterService } from './MonsterService';
import { translationService } from './TranslationService';

export class GameService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialiser tous les services nécessaires
      await Promise.all([
        monsterService.initialize(),
        translationService.initialize()
      ]);

      // Charger la sauvegarde
      this.loadSave();

      // Activer l'auto-save
      setInterval(() => this.saveGame(), 30000);

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize game:', error);
      throw error;
    }
  }

  saveGame() {
    try {
      const state = gameStore.getState();
      
      // Convert Maps and Sets to arrays for serialization
      const serializedState = this.serializeState(state);
      
      localStorage.setItem('idleRPGSave', JSON.stringify({
        state: serializedState,
        timestamp: Date.now(),
        version: '1.0.0'
      }));
      
      console.log('Game saved successfully');
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }

  loadSave() {
    try {
      const savedData = localStorage.getItem('idleRPGSave');
      if (savedData) {
        const { state: savedState } = JSON.parse(savedData);
        
        // Deserialize the state, converting arrays back to Maps and Sets
        const deserializedState = this.deserializeState(savedState);
        
        gameStore.dispatch({
          type: 'LOAD_SAVE',
          paths: ['*'],
          reducer: () => deserializedState
        });
        
        console.log('Game loaded successfully');
      } else {
        console.log('No saved game found, starting new game');
      }
    } catch (error) {
      console.error('Failed to load save:', error);
    }
  }
  
  // Helper to convert Maps and Sets to serializable arrays
  serializeState(state) {
    const result = {};
    
    for (const key in state) {
      const value = state[key];
      
      if (value instanceof Map) {
        // Convert Map to array of entries
        result[key] = {
          __type: 'Map',
          entries: Array.from(value.entries())
        };
      } else if (value instanceof Set) {
        // Convert Set to array
        result[key] = {
          __type: 'Set',
          values: Array.from(value)
        };
      } else if (typeof value === 'object' && value !== null) {
        // Recursively handle nested objects
        result[key] = this.serializeState(value);
      } else {
        // Handle primitive values
        result[key] = value;
      }
    }
    
    return result;
  }
  
  // Helper to convert serialized arrays back to Maps and Sets
  deserializeState(state) {
    const result = {};
    
    for (const key in state) {
      const value = state[key];
      
      if (value && typeof value === 'object') {
        if (value.__type === 'Map') {
          // Convert array back to Map
          result[key] = new Map(value.entries);
        } else if (value.__type === 'Set') {
          // Convert array back to Set
          result[key] = new Set(value.values);
        } else {
          // Recursively handle nested objects
          result[key] = this.deserializeState(value);
        }
      } else {
        // Handle primitive values
        result[key] = value;
      }
    }
    
    return result;
  }

  resetGame() {
    localStorage.removeItem('idleRPGSave');
    window.location.reload();
  }
}

export const gameService = new GameService();