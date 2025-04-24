import { gameStore } from '../store/state/GameStore';
import { monsterService } from './MonsterService';
import { translationService } from './TranslationService';
import { initialState } from '../store/state/initialState';

export class GameService {
  constructor() {
    this.initialized = false;
    this.saveInterval = null;
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
      if (this.saveInterval) clearInterval(this.saveInterval);
      this.saveInterval = setInterval(() => this.saveGame(), 30000);
      
      // Save immediately when closing the page
      window.addEventListener('beforeunload', () => {
        this.saveGame();
      });

      this.initialized = true;
      console.log("GameService initialized successfully!");
    } catch (error) {
      console.error('Failed to initialize game:', error);
      throw error;
    }
  }

  saveGame() {
    try {
      const state = gameStore.getState();
      
      // Step 1: First save just the inventory data as a separate item for redundancy
      if (state.inventory && state.inventory.items) {
        const inventoryData = {
          items: Array.from(state.inventory.items.entries()),
          capacity: state.inventory.capacity || 100
        };
        localStorage.setItem('idleRPG_inventory', JSON.stringify(inventoryData));
        console.log('Inventory saved separately, items count:', inventoryData.items.length);
      }
      
      // Step 2: Save the complete state
      const serializedState = this.serializeState(state);
      localStorage.setItem('idleRPGSave', JSON.stringify({
        state: serializedState,
        timestamp: Date.now(),
        version: '1.0.1'
      }));
      
      console.log('Game saved successfully at', new Date().toLocaleTimeString());
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  loadSave() {
    try {
      // First prepare a base state from initial state
      const baseState = structuredClone(initialState);
      let finalState = baseState;
      let inventoryLoaded = false;
      
      // Try to load the main save data first
      const savedData = localStorage.getItem('idleRPGSave');
      if (savedData) {
        try {
          const { state: savedState } = JSON.parse(savedData);
          const deserializedState = this.deserializeState(savedState);
          finalState = this.mergeStates(baseState, deserializedState);
          console.log('Main game save loaded successfully');
          
          // Check if inventory exists in the loaded state
          if (finalState.inventory && finalState.inventory.items && finalState.inventory.items.size > 0) {
            inventoryLoaded = true;
            console.log('Inventory loaded from main save, items count:', finalState.inventory.items.size);
          }
        } catch (e) {
          console.error('Error processing main save:', e);
        }
      }
      
      // If the inventory wasn't in the main save or there was an error, try to load just the inventory
      if (!inventoryLoaded) {
        const inventorySave = localStorage.getItem('idleRPG_inventory');
        if (inventorySave) {
          try {
            const inventory = JSON.parse(inventorySave);
            // Create a new Map from the array of entries
            finalState.inventory = {
              items: new Map(inventory.items),
              capacity: inventory.capacity || 100
            };
            inventoryLoaded = true;
            console.log('Inventory loaded from backup, items count:', finalState.inventory.items.size);
          } catch (e) {
            console.error('Error loading inventory backup:', e);
          }
        }
      }
      
      // Initialize empty inventory if nothing was loaded
      if (!inventoryLoaded) {
        finalState.inventory = {
          items: new Map(),
          capacity: 100
        };
        console.log('No saved inventory found, initialized empty inventory');
      }
      
      // Dispatch the merged state to the store
      gameStore.dispatch({
        type: 'LOAD_SAVE',
        paths: ['*'],
        reducer: () => finalState
      });
      
      console.log('Game loaded successfully');
      
      // Verify the loaded state especially the inventory
      setTimeout(() => {
        const loadedState = gameStore.getState();
        console.log('Verification - Current inventory size:', 
          loadedState?.inventory?.items?.size || 0);
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Failed to load save:', error);
      // Fall back to initial state with empty inventory
      const newState = structuredClone(initialState);
      newState.inventory = {
        items: new Map(),
        capacity: 100
      };
      
      gameStore.dispatch({
        type: 'RESET',
        paths: ['*'],
        reducer: () => newState
      });
      
      return false;
    }
  }
  
  // Helper to merge states while preserving Maps and Sets
  mergeStates(baseState, savedState) {
    const result = structuredClone(baseState);
    
    for (const key in savedState) {
      if (!savedState[key]) continue;
      
      if (savedState[key] instanceof Map) {
        result[key] = savedState[key];
      } else if (savedState[key] instanceof Set) {
        result[key] = savedState[key];
      } else if (typeof savedState[key] === 'object') {
        if (key === 'inventory' && savedState[key].items instanceof Map) {
          // Special handling for inventory
          result.inventory = {
            items: savedState[key].items,
            capacity: savedState[key].capacity || 100
          };
        } else if (typeof result[key] === 'object' && result[key] !== null) {
          // For regular objects, recursively merge
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
      
      if (!value) {
        result[key] = value;
        continue;
      }
      
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
      
      if (!value) {
        result[key] = value;
        continue;
      }
      
      if (value && typeof value === 'object') {
        if (value.__type === 'Map') {
          // Convert array back to Map
          try {
            result[key] = new Map(value.entries);
          } catch (e) {
            console.error('Error converting to Map:', e);
            result[key] = new Map();
          }
        } else if (value.__type === 'Set') {
          // Convert array back to Set
          try {
            result[key] = new Set(value.values);
          } catch (e) {
            console.error('Error converting to Set:', e);
            result[key] = new Set();
          }
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

  // Force save immediately - useful for debugging
  forceSave() {
    console.log("Forcing immediate save...");
    return this.saveGame();
  }
  
  // Force load from storage - useful for debugging
  forceLoad() {
    console.log("Forcing immediate load...");
    return this.loadSave();
  }

  resetGame() {
    console.log("Resetting game...");
    localStorage.removeItem('idleRPGSave');
    localStorage.removeItem('idleRPG_inventory');
    window.location.reload();
  }
  
  // Debug method to check localStorage contents
  debugStorage() {
    try {
      const mainSave = localStorage.getItem('idleRPGSave');
      const inventorySave = localStorage.getItem('idleRPG_inventory');
      
      console.log("--- LocalStorage Debug Info ---");
      console.log("Main save exists:", !!mainSave);
      console.log("Inventory save exists:", !!inventorySave);
      
      if (inventorySave) {
        const inventory = JSON.parse(inventorySave);
        console.log("Inventory items count:", inventory.items?.length || 0);
        console.log("Inventory first 5 items:", inventory.items?.slice(0, 5));
      }
      
      if (mainSave) {
        const save = JSON.parse(mainSave);
        console.log("Save timestamp:", new Date(save.timestamp).toLocaleString());
        console.log("Save version:", save.version);
      }
      
      return {
        mainSaveExists: !!mainSave,
        inventorySaveExists: !!inventorySave,
        storageSize: this.getLocalStorageSize()
      };
    } catch (e) {
      console.error("Error in debugStorage:", e);
      return { error: e.message };
    }
  }
  
  // Check localStorage size
  getLocalStorageSize() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length * 2; // UTF-16 uses 2 bytes per character
      }
    }
    return (total / 1024).toFixed(2) + " KB"; // Convert to KB
  }
}

export const gameService = new GameService();