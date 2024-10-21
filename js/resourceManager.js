class ResourceManager {
    constructor() {
        this.resources = new Map();
    }

    addResource(id, category, defaultName, image) {
        this.resources.set(id, { id, category, defaultName, image });
    }

    getResource(id) {
        return this.resources.get(id);
    }

    getResourcesByCategory(category) {
        return Array.from(this.resources.values()).filter(r => r.category === category);
    }
}

export const globalResourceManager = new ResourceManager();