import { BaseProfession } from './baseprofession.js';

export class Lumberjack extends BaseProfession {
    constructor(resources) {
        super('lumberjack', resources);
    }
}