import { BaseProfession } from './BaseProfession';
import { gameStore } from '../../store/GameStore';

// Configuration des recettes
const BLACKSMITH_RECIPES = {
  // Armes de base
  weapons: {
    'wooden_sword': {
      materials: { 'oak_wood': 5 },
      level: 1,
      stats: { attack: 2 }
    },
    'copper_sword': {
      materials: { 'copper_ore': 8, 'oak_wood': 2 },
      level: 3,
      stats: { attack: 5 }
    },
    'iron_sword': {
      materials: { 'iron_ore': 10, 'oak_wood': 3 },
      level: 5,
      stats: { attack: 8 }
    }
  },
  // Armures
  armors: {
    'leather_armor': {
      materials: { 'leather': 8 },
      level: 1,
      stats: { defense: 2 }
    },
    'copper_armor': {
      materials: { 'copper_ore': 12 },
      level: 3,
      stats: { defense: 5 }
    },
    'iron_armor': {
      materials: { 'iron_ore': 15 },
      level: 5,
      stats: { defense: 8 }
    }
  }
};

export class Blacksmith extends BaseProfession {
  constructor() {
    super('blacksmith');
  }

  // Override de la méthode de base car le forgeron ne collecte pas
  collect() {
    throw new Error('Blacksmith cannot collect resources directly');
  }

  // Méthodes spécifiques au forgeron
  getAvailableRecipes(characterId) {
    const level = this.getLevel(characterId);
    const allRecipes = [...Object.entries(BLACKSMITH_RECIPES.weapons), ...Object.entries(BLACKSMITH_RECIPES.armors)];
    
    return allRecipes
      .filter(([_, recipe]) => recipe.level <= level)
      .map(([id, recipe]) => ({
        id,
        ...recipe
      }));
  }

  canCraft(characterId, recipeId) {
    const state = gameStore.getState();
    const recipe = this.findRecipe(recipeId);
    if (!recipe) return false;

    // Vérifier le niveau requis
    if (this.getLevel(characterId) < recipe.level) return false;

    // Vérifier les matériaux
    return Object.entries(recipe.materials).every(([itemId, quantity]) => {
      const currentQuantity = state.inventory.items.get(itemId) || 0;
      return currentQuantity >= quantity;
    });
  }

  craft(characterId, recipeId) {
    const recipe = this.findRecipe(recipeId);
    if (!recipe || !this.canCraft(characterId, recipeId)) return false;

    gameStore.dispatch({
      type: 'BLACKSMITH_CRAFT_ITEM',
      paths: ['inventory'],
      reducer: (state) => {
        const newState = structuredClone(state);

        // Consommer les matériaux
        Object.entries(recipe.materials).forEach(([itemId, quantity]) => {
          const currentQuantity = newState.inventory.items.get(itemId) || 0;
          newState.inventory.items.set(itemId, currentQuantity - quantity);
        });

        // Ajouter l'item crafté
        const currentQuantity = newState.inventory.items.get(recipeId) || 0;
        newState.inventory.items.set(recipeId, currentQuantity + 1);

        return newState;
      }
    });

    // Gain d'XP basé sur le niveau de la recette
    const expGain = this.calculateCraftingExp(recipe.level);
    gameStore.dispatch({
      type: 'PROFESSION_GAIN_XP',
      paths: ['professions'],
      reducer: (state) => {
        const newState = structuredClone(state);
        const profLevel = newState.professions.characters[characterId].levels.blacksmith;
        profLevel.exp += expGain;
        return newState;
      }
    });

    // Animer le crafting
    this.triggerAnimation('craft-success');
    return true;
  }

  // Méthodes utilitaires
  findRecipe(recipeId) {
    return BLACKSMITH_RECIPES.weapons[recipeId] || BLACKSMITH_RECIPES.armors[recipeId];
  }

  calculateCraftingExp(recipeLevel) {
    // Base XP multiplié par le niveau de la recette
    return Math.floor(25 * Math.pow(1.2, recipeLevel - 1));
  }

  getCraftingBonus(characterId) {
    const stats = this.getStats(characterId);
    return {
      qualityChance: Math.min(0.3, stats.resourceQuality * 0.05), // 5% par point de qualité, max 30%
      extraItemChance: Math.min(0.2, stats.multiCollect * 0.04), // 4% par point de multi, max 20%
    };
  }

  // Overrides pour les animations
  triggerAnimation(type) {
    const event = new CustomEvent('profession-animation', {
      detail: { 
        profession: 'blacksmith', 
        type,
      }
    });
    window.dispatchEvent(event);
  }

  // Méthode pour obtenir les stats d'un item crafté
  getItemStats(recipeId) {
    const recipe = this.findRecipe(recipeId);
    if (!recipe) return null;
    return recipe.stats;
  }

  // Méthode pour obtenir le coût en matériaux d'une recette
  getRecipeCost(recipeId) {
    const recipe = this.findRecipe(recipeId);
    if (!recipe) return null;
    return recipe.materials;
  }

  // Méthode pour obtenir le niveau requis d'une recette
  getRecipeLevel(recipeId) {
    const recipe = this.findRecipe(recipeId);
    if (!recipe) return null;
    return recipe.level;
  }
}