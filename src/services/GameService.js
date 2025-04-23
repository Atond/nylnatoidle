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
      localStorage.setItem('idleRPGSave', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }

  loadSave() {
    try {
      const savedState = localStorage.getItem('idleRPGSave');
      if (savedState) {
        let state = JSON.parse(savedState);
        
        // Ensure required properties exist by merging with initial state
        gameStore.dispatch({
          type: 'LOAD_SAVE',
          paths: ['*'],
          reducer: (currentState) => {
            // Deep merge the saved state with the initial state to ensure all required properties exist
            const mergeState = (initialObj, savedObj) => {
              if (!savedObj) return initialObj;
              
              const result = structuredClone(initialObj);
              
              // Copy over all saved properties, but ensure required structures exist
              for (const key in savedObj) {
                if (typeof savedObj[key] === 'object' && savedObj[key] !== null && 
                    !Array.isArray(savedObj[key]) && !(savedObj[key] instanceof Map) && 
                    !(savedObj[key] instanceof Set)) {
                  // For nested objects, recursively merge
                  result[key] = mergeState(result[key] || {}, savedObj[key]);
                } else {
                  // For primitive values, Maps, Sets, or Arrays, use the saved value
                  result[key] = savedObj[key];
                }
              }
              return result;
            };
            
            return mergeState(currentState, state);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load save:', error);
    }
  }

  resetGame() {
    localStorage.removeItem('idleRPGSave');
    window.location.reload();
  }
}

export const gameService = new GameService();