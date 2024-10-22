class ResourceManager {
    constructor() {
        this.resources = new Map();
    }

    addResource(resource) {
        this.resources.set(resource.id, {
            id: resource.id,
            defaultName: resource.defaultName,
            image: resource.image,
            tier: resource.tier
        });
    }

    getResource(id) {
        return this.resources.get(id);
    }

    getResourcesByCategory(category) {
        return Array.from(this.resources.values()).filter(r => r.category === category);
    }
}

export const globalResourceManager = new ResourceManager();