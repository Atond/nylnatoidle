import { BaseProfession } from './baseprofession.js';

export class Miner extends BaseProfession {
    constructor(resources) {
        super('miner', resources);
    }

    // Vous pouvez ajouter des méthodes spécifiques au mineur ici si nécessaire
}