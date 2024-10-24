import { BaseProfession } from './baseprofession.js';
import { globalInventory } from '../inventory.js';
import { globalResourceManager } from '../resourceManager.js';

export class Blacksmith extends BaseProfession {
    constructor() {
        super('blacksmith');
        this.recipes = new Map();
        this.unlockedRecipes = new Set();
        this.loadRecipes();
    }

    async loadRecipes() {
        try {
            const response = await fetch('/data/blacksmithRecipes.json');
            const recipesData = await response.json();
            
            recipesData.recipes.forEach(recipe => {
                this.recipes.set(recipe.id, recipe);
                // Débloquer les recettes de base
                if (recipe.unlocked) {
                    this.unlockedRecipes.add(recipe.id);
                }
            });
        } catch (error) {
            console.error('Failed to load blacksmith recipes:', error);
        }
    }

    canCraft(recipeId) {
        const recipe = this.recipes.get(recipeId);
        if (!recipe || !this.unlockedRecipes.has(recipeId)) return false;

        // Vérifier si on a assez de ressources
        return Object.entries(recipe.materials).every(([materialId, quantity]) => 
            globalInventory.getItemQuantity(materialId) >= quantity
        );
    }

    craft(recipeId) {
        if (!this.canCraft(recipeId)) return false;

        const recipe = this.recipes.get(recipeId);
        
        // Consommer les matériaux
        Object.entries(recipe.materials).forEach(([materialId, quantity]) => {
            globalInventory.removeItem(materialId, quantity);
        });

        // Ajouter l'objet crafté à l'inventaire
        globalInventory.addItem(recipe.result.id, recipe.result.quantity);

        // Gagner de l'expérience
        this.addExperience(recipe.experience);

        return true;
    }

    unlockRecipe(recipeId) {
        const recipe = this.recipes.get(recipeId);
        if (recipe) {
            this.unlockedRecipes.add(recipeId);
            return true;
        }
        return false;
    }

    getAvailableRecipes() {
        return Array.from(this.unlockedRecipes)
            .map(id => this.recipes.get(id))
            .filter(recipe => recipe !== undefined);
    }

    updateDisplay() {
        super.updateExpDisplay();
        super.updateLevelDisplay();
        
        const recipesContainer = document.getElementById('blacksmith-recipes');
        if (!recipesContainer) return;

        recipesContainer.innerHTML = '';
        
        this.getAvailableRecipes().forEach(recipe => {
            const recipeElement = document.createElement('div');
            recipeElement.className = 'recipe';
            
            const canCraft = this.canCraft(recipe.id);
            
            recipeElement.innerHTML = `
                <h4>${recipe.name}</h4>
                <div class="materials">
                    ${Object.entries(recipe.materials).map(([id, quantity]) => {
                        const current = globalInventory.getItemQuantity(id);
                        const resourceName = globalResourceManager.getResourceName(id);
                        return `<div class="${current >= quantity ? 'has-materials' : 'missing-materials'}">
                            ${resourceName}: ${current}/${quantity}
                        </div>`;
                    }).join('')}
                </div>
                <button class="craft-button" ${!canCraft ? 'disabled' : ''}>
                    ${globalTranslationManager.translate('ui.craft')}
                </button>
            `;
            
            const craftButton = recipeElement.querySelector('.craft-button');
            craftButton.addEventListener('click', () => {
                if (this.craft(recipe.id)) {
                    this.updateDisplay();
                    // Mettre à jour l'inventaire
                    updateInventoryDisplay();
                }
            });
            
            recipesContainer.appendChild(recipeElement);
        });
    }
}