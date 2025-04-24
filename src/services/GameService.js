import { gameStore } from '../store/state/GameStore';
import { monsterService } from './MonsterService';
import { translationService } from './TranslationService';
import { initialState } from '../store/state/initialState';

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
        
        // Start with a fresh copy of initialState to ensure proper structure
        const baseState = structuredClone(initialState);
        
        // Deserialize the saved state
        const deserializedState = this.deserializeState(savedState);
        
        // Merge the deserialized state with initial state to ensure all required properties exist
        const mergedState = this.mergeStates(baseState, deserializedState);
        
        // Dispatch the merged state to the store
        gameStore.dispatch({
          type: 'LOAD_SAVE',
          paths: ['*'],
          reducer: () => mergedState
        });
        
        console.log('Game loaded successfully');
      } else {
        console.log('No saved game found, starting new game');
      }
    } catch (error) {
      console.error('Failed to load save:', error);
      // Fall back to initial state
      gameStore.dispatch({
        type: 'RESET',
        paths: ['*'],
        reducer: () => structuredClone(initialState)
      });
    }
  }
  
  // Helper to merge states while preserving Maps and Sets
  mergeStates(baseState, savedState) {
    const result = structuredClone(baseState);
    
    for (const key in savedState) {
      if (savedState[key] === null || savedState[key] === undefined) continue;
      
      if (savedState[key] instanceof Map) {
        // Use the saved Map
        if (result[key] instanceof Map) {
          result[key] = savedState[key];
        }
      } else if (savedState[key] instanceof Set) {
        // Use the saved Set
        if (result[key] instanceof Set) {
          result[key] = savedState[key];
        }
      } else if (typeof savedState[key] === 'object') {
        // For objects, recursively merge
        if (typeof result[key] === 'object' && result[key] !== null) {
          result[key] = this.mergeStates(result[key], savedState[key]);
        } else {
          // If base doesn't have this property as an object, use saved value
          result[key] = savedState[key];
        }
      } else {
        // For primitives, use saved value
        result[key] = savedState[key];
      }
    }
    
    return result;
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