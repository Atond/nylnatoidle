export class ResourceManager {
    constructor() {
        this.resources = new Map();
    }

    addResource(resource) {
        this.resources.set(resource.id, resource);
    }

    getResource(resourceId) {
        return this.resources.get(resourceId);
    }

    getAllResources() {
        return Array.from(this.resources.values());
    }
}

// Créer une instance globale
export const globalResourceManager = new ResourceManager();