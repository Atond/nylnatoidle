import { BaseProfession } from './baseprofession.js';

export class Miner extends BaseProfession {
    constructor(resources) {
        super('miner', resources);
    }
}