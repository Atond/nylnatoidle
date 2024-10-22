class ResourceManager {
    constructor() {
        this.resources = new Map();
    }

    addResource(resource, category) {
        const resourceData = {
            id: resource.id,
            defaultName: resource.defaultName,
            image: resource.image,
            tier: resource.tier,
            category: category
        };
        this.resources.set(resource.id, resourceData);
    }

    getResource(id) {
        return this.resources.get(id);
    }

    getResourceName(id) {
        const resource = this.getResource(id);
        if (!resource) return id;
        return resource.defaultName;
    }

    getResourcesByCategory(category) {
        return Array.from(this.resources.values())
            .filter(r => r.category === category);
    }
}

export const globalResourceManager = new ResourceManager();