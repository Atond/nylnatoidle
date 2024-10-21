import { BaseProfession } from './baseprofession.js';

export class Miner extends BaseProfession {
    constructor(resourceIds) {
        super('miner', resourceIds);
    }
}