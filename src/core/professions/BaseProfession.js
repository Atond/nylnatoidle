import { gameStore } from '../../store/GameStore';
import { professionSelectors } from '../../store/actions/professions';
import { upgradeSelectors } from '../../store/actions/upgrades';
import { gainProfessionExperience } from '../../store/actions/professions';

export class BaseProfession {
  constructor(id) {
    this.id = id;
    this.autoCollectInterval = null;
  }

  // Démarrer la collecte automatique
  startAutoCollect(characterId) {
    if (this.autoCollectInterval) return;
    
    this.autoCollectInterval = setInterval(() => {
      const state = gameStore.getState();
      const stats = upgradeSelectors.getProfessionStats(state, characterId, this.id);
      
      if (stats.autoCollectors > 0) {
        this.collect(characterId);
      }
    }, 1000);
  }

  // Arrêter la collecte automatique
  stopAutoCollect() {
    if (this.autoCollectInterval) {
      clearInterval(this.autoCollectInterval);
      this.autoCollectInterval = null;
    }
  }

  // Obtenir le niveau actuel
  getLevel(characterId) {
    return professionSelectors.getProfessionLevel(gameStore.getState(), characterId, this.id);
  }

  // Obtenir les stats actuelles
  getStats(characterId) {
    return upgradeSelectors.getProfessionStats(gameStore.getState(), characterId, this.id);
  }

  // Collecte de ressources de base
  collect(characterId) {
    const stats = this.getStats(characterId);
    const resources = this.getAvailableResources(this.getLevel(characterId));
    
    // Collecter en fonction du multiCollect
    for (let i = 0; i < stats.multiCollect; i++) {
      const resource = this.selectRandomResource(resources);
      if (resource) {
        const quantity = Math.floor(stats.miningPower * (stats.resourceQuality || 1));
        gameStore.dispatch({
          type: 'INVENTORY_ADD_ITEM',
          paths: ['inventory'],
          reducer: (state) => {
            const newState = structuredClone(state);
            const current = newState.inventory.items.get(resource.id) || 0;
            newState.inventory.items.set(resource.id, current + quantity);
            return newState;
          }
        });

        // Gain d'expérience
        const expGain = this.calculateExpGain(this.getLevel(characterId));
        gameStore.dispatch(gainProfessionExperience(characterId, this.id, expGain));
      }
    }
  }

  // Méthodes à implémenter par les classes filles
  getAvailableResources(level) {
    throw new Error('getAvailableResources must be implemented by child class');
  }

  selectRandomResource(resources) {
    if (!resources.length) return null;
    return resources[Math.floor(Math.random() * resources.length)];
  }

  calculateExpGain(level) {
    return Math.floor(10 * Math.pow(1.1, level - 1));
  }

  // Nettoyage
  cleanup() {
    this.stopAutoCollect();
  }
}