import { BaseProfession } from './BaseProfession';
import { gameStore } from '../../store/GameStore';

const MINER_RESOURCES = {
  TIER_1: [
    { id: 'iron_ore', weight: 70 },
    { id: 'copper_ore', weight: 30 }
  ],
  TIER_2: [
    { id: 'iron_ore', weight: 50 },
    { id: 'copper_ore', weight: 30 },
    { id: 'gold_ore', weight: 20 }
  ],
  TIER_3: [
    { id: 'iron_ore', weight: 40 },
    { id: 'copper_ore', weight: 30 },
    { id: 'gold_ore', weight: 20 },
    { id: 'diamond', weight: 10 }
  ]
};

export class Miner extends BaseProfession {
  constructor() {
    super('miner');
  }

  getAvailableResources(level) {
    if (level >= 20) return MINER_RESOURCES.TIER_3;
    if (level >= 10) return MINER_RESOURCES.TIER_2;
    return MINER_RESOURCES.TIER_1;
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

  // Override calculateExpGain pour spécialiser l'XP du mineur
  calculateExpGain(level) {
    // Bonus d'XP pour les minerais rares
    const stats = this.getStats();
    const baseExp = super.calculateExpGain(level);
    return Math.floor(baseExp * (stats.resourceQuality || 1));
  }

  // Méthodes spécifiques au mineur
  getExtraOreChance(characterId) {
    const stats = this.getStats(characterId);
    return Math.min(0.5, stats.miningPower * 0.05); // 5% par point de mining power, max 50%
  }

  getRareOreChance(characterId) {
    const level = this.getLevel(characterId);
    const baseChance = level * 0.01; // 1% par niveau
    const stats = this.getStats(characterId);
    const qualityBonus = (stats.resourceQuality - 1) * 0.05; // 5% par point de qualité au-dessus de 1
    return Math.min(0.3, baseChance + qualityBonus); // Max 30%
  }

  // Override collect pour ajouter la logique spécifique au mineur
  collect(characterId) {
    const extraOreChance = this.getExtraOreChance(characterId);
    const rareOreChance = this.getRareOreChance(characterId);

    // Collection normale
    super.collect(characterId);

    // Chance de minerai supplémentaire
    if (Math.random() < extraOreChance) {
      super.collect(characterId);
      this.triggerAnimation('extra-ore');
    }

    // Chance de minerai rare
    if (Math.random() < rareOreChance) {
      const level = this.getLevel(characterId);
      const rareResources = level >= 20 ? ['diamond'] : level >= 10 ? ['gold_ore'] : [];
      
      if (rareResources.length > 0) {
        const rareResource = rareResources[Math.floor(Math.random() * rareResources.length)];
        gameStore.dispatch({
          type: 'INVENTORY_ADD_ITEM',
          paths: ['inventory'],
          reducer: (state) => {
            const newState = structuredClone(state);
            const current = newState.inventory.items.get(rareResource) || 0;
            newState.inventory.items.set(rareResource, current + 1);
            return newState;
          }
        });
        this.triggerAnimation('rare-ore');
      }
    }
  }

  // Animation feedback
  triggerAnimation(type) {
    // À implémenter avec l'UI
    const event = new CustomEvent('profession-animation', {
      detail: { profession: 'miner', type }
    });
    window.dispatchEvent(event);
  }
}