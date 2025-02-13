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
        const state = JSON.parse(savedState);
        // Restaurer l'état dans le store
        gameStore.dispatch({
          type: 'LOAD_SAVE',
          paths: ['*'],
          reducer: () => state
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