import { initialState } from './initialState';

class GameStore {
  constructor() {
    this.state = structuredClone(initialState);
    this.listeners = new Map();
    this.lastActionTimestamp = Date.now();
    this.actionHistory = [];  // Pour le debugging et potentiellement "undo"
    this.middlewares = [];    // Pour des actions comme la sauvegarde auto, analytics, etc.
  }

  // Ajouter un middleware
  addMiddleware(middleware) {
    this.middlewares.push(middleware);
  }

  // S'abonner aux changements
  subscribe(path, callback) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    this.listeners.get(path).add(callback);
    return () => this.listeners.get(path).delete(callback);
  }

  // Obtenir un état immutable
  getState() {
    return structuredClone(this.state);
  }

  // Obtenir une partie spécifique de l'état
  select(selector) {
    return selector(this.getState());
  }

  // Dispatch avec middleware
  async dispatch(action) {
    const timestamp = Date.now();
    const actionWithMeta = {
      ...action,
      timestamp,
      id: crypto.randomUUID()
    };

    // Exécuter les middlewares "before"
    for (const middleware of this.middlewares) {
      if (middleware.before) {
        await middleware.before(actionWithMeta, this.state);
      }
    }

    try {
      // Appliquer l'action
      const prevState = this.getState();
      const nextState = action.reducer(prevState);
      this.state = nextState;

      // Enregistrer l'action pour debug
      this.actionHistory.push({
        ...actionWithMeta,
        prevState,
        nextState
      });

      // Notifier les listeners
      this.notifyListeners(action.paths || ['*']);

      // Exécuter les middlewares "after"
      for (const middleware of this.middlewares) {
        if (middleware.after) {
          await middleware.after(actionWithMeta, prevState, nextState);
        }
      }

    } catch (error) {
      console.error('Error dispatching action:', action, error);
      // Exécuter les middlewares "error"
      for (const middleware of this.middlewares) {
        if (middleware.error) {
          await middleware.error(error, actionWithMeta);
        }
      }
    }
  }

  // Notifier les listeners
  notifyListeners(paths) {
    for (const [listenerPath, listeners] of this.listeners) {
      if (paths.includes('*') || paths.includes(listenerPath)) {
        for (const listener of listeners) {
          listener(this.getState());
        }
      }
    }
  }

  // Gérer les sauvegardes
  async save(slot = 'auto') {
    try {
      const saveData = {
        state: this.state,
        timestamp: Date.now(),
        version: '1.0.0',
        slot
      };

      // Support de plusieurs slots de sauvegarde
      const saves = JSON.parse(localStorage.getItem('gameSaves') || '{}');
      saves[slot] = saveData;
      localStorage.setItem('gameSaves', JSON.stringify(saves));

      console.log(`Game saved in slot: ${slot}`);
      return true;
    } catch (error) {
      console.error('Error saving game:', error);
      return false;
    }
  }

  // Charger une sauvegarde
  async load(slot = 'auto') {
    try {
      const saves = JSON.parse(localStorage.getItem('gameSaves') || '{}');
      const saveData = saves[slot];

      if (!saveData) {
        console.log(`No save found in slot: ${slot}`);
        return false;
      }

      // Migration des données si nécessaire
      const migratedState = await this.migrateState(saveData.state, saveData.version);
      this.state = migratedState;

      // Notifier tous les listeners
      this.notifyListeners(['*']);
      console.log(`Game loaded from slot: ${slot}`);
      return true;
    } catch (error) {
      console.error('Error loading game:', error);
      return false;
    }
  }

  // Migration des données entre versions
  async migrateState(state, fromVersion) {
    // À implémenter selon les besoins de migration entre versions
    return state;
  }

  // Debug : obtenir l'historique des actions
  getActionHistory() {
    return this.actionHistory;
  }

  // Reset du store
  reset() {
    this.state = structuredClone(initialState);
    this.notifyListeners(['*']);
  }
}

// Middlewares par défaut
const autoSaveMiddleware = {
  after: async (action, prevState, nextState) => {
    if (nextState.settings.autoSave) {
      await gameStore.save('auto');
    }
  }
};

const loggerMiddleware = {
  before: (action) => {
    console.log(`[Action Start] ${action.type}`, action);
  },
  after: (action, prevState, nextState) => {
    console.log(`[Action Complete] ${action.type}`, {
      prevState,
      nextState,
      action
    });
  },
  error: (error, action) => {
    console.error(`[Action Error] ${action.type}`, error);
  }
};

// Création et export du store
export const gameStore = new GameStore();

// Ajout des middlewares par défaut
gameStore.addMiddleware(autoSaveMiddleware);
if (process.env.NODE_ENV === 'development') {
  gameStore.addMiddleware(loggerMiddleware);
}