import { BaseProfession } from './BaseProfession';
import { gameStore } from '../../store/GameStore';

const LUMBERJACK_RESOURCES = {
  TIER_1: [
    { id: 'oak_wood', weight: 60 },
    { id: 'pine_wood', weight: 40 }
  ],
  TIER_2: [
    { id: 'oak_wood', weight: 40 },
    { id: 'pine_wood', weight: 35 },
    { id: 'maple_wood', weight: 25 }
  ],
  TIER_3: [
    { id: 'oak_wood', weight: 30 },
    { id: 'pine_wood', weight: 30 },
    { id: 'maple_wood', weight: 25 },
    { id: 'mahogany_wood', weight: 15 }
  ]
};

export class Lumberjack extends BaseProfession {
  constructor() {
    super('lumberjack');
  }

  getAvailableResources(level) {
    if (level >= 20) return LUMBERJACK_RESOURCES.TIER_3;
    if (level >= 10) return LUMBERJACK_RESOURCES.TIER_2;
    return LUMBERJACK_RESOURCES.TIER_1;
  }

  // Override selectRandomResource pour gérer les poids
  selectRandomResource(resources) {
    if (!resources.length) return null;

    const totalWeight = resources.reduce((sum, res) => sum + res.weight, 0);
    let random = Math.random() * totalWeight;

    for (const resource of resources) {
      random -= resource.weight;
      if (random <= 0) return resource;
    }

    return resources[0];
  }

  // Méthodes spécifiques au bûcheron
  getExtraWoodChance(characterId) {
    const stats = this.getStats(characterId);
    return Math.min(0.6, stats.miningPower * 0.06); // 6% par point, max 60%
  }

  getSpecialWoodChance(characterId) {
    const level = this.getLevel(characterId);
    const baseChance = level * 0.015; // 1.5% par niveau
    const stats = this.getStats(characterId);
    const qualityBonus = (stats.resourceQuality - 1) * 0.07; // 7% par point de qualité
    return Math.min(0.35, baseChance + qualityBonus); // Max 35%
  }

  // Override collect pour ajouter la logique spécifique au bûcheron
  collect(characterId) {
    const extraWoodChance = this.getExtraWoodChance(characterId);
    const specialWoodChance = this.getSpecialWoodChance(characterId);

    // Collection normale
    super.collect(characterId);

    // Chance de bois supplémentaire
    if (Math.random() < extraWoodChance) {
      super.collect(characterId);
      this.triggerAnimation('extra-wood');
    }

    // Chance de bois spécial
    if (Math.random() < specialWoodChance) {
      const level = this.getLevel(characterId);
      const specialResources = level >= 20 ? ['mahogany_wood'] : level >= 10 ? ['maple_wood'] : [];
      
      if (specialResources.length > 0) {
        const specialResource = specialResources[Math.floor(Math.random() * specialResources.length)];
        gameStore.dispatch({
          type: 'INVENTORY_ADD_ITEM',
          paths: ['inventory'],
          reducer: (state) => {
            const newState = structuredClone(state);
            const current = newState.inventory.items.get(specialResource) || 0;
            newState.inventory.items.set(specialResource, current + 1);
            return newState;
          }
        });
        this.triggerAnimation('special-wood');
      }
    }

    // Petite chance de trouver des graines (pour futur métier de jardinier?)
    const seedChance = 0.05; // 5% de chance
    if (Math.random() < seedChance) {
      const seedTypes = ['oak_seed', 'pine_seed', 'maple_seed'];
      const randomSeed = seedTypes[Math.floor(Math.random() * seedTypes.length)];
      
      gameStore.dispatch({
          type: 'INVENTORY_ADD_ITEM',
          paths: ['inventory'],
          reducer: (state) => {
            const newState = structuredClone(state);
            const current = newState.inventory.items.get(randomSeed) || 0;
            newState.inventory.items.set(randomSeed, current + 1);
            return newState;
          }
      });
      this.triggerAnimation('found-seed');
    }
  }

  // Animation feedback
  triggerAnimation(type) {
    const event = new CustomEvent('profession-animation', {
      detail: { profession: 'lumberjack', type }
    });
    window.dispatchEvent(event);
  }
}