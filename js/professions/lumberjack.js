import { BaseProfession } from './baseprofession.js';

export class Lumberjack extends BaseProfession {
    constructor(resourceIds) {
        super('lumberjack', resourceIds);
    }
}