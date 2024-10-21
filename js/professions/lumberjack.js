import { BaseProfession } from './baseprofession.js';

export class Lumberjack extends BaseProfession {
    constructor(resourceIds) {
        super('lumberjack', resourceIds);
    }

    updateDisplay() {
        super.updateExpDisplay();
        super.updateLevelDisplay();
        super.updateResourcesDisplay();

        // Ajoutez ici d'autres éléments spécifiques au bûcheron si nécessaire
    }
}