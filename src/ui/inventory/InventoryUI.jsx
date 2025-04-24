import { gameStore } from '../../store/state/GameStore';
import { inventorySelectors } from '../../store/actions/inventory';
import { globalTranslationManager } from '../../translations/translationManager';

export class InventoryUI {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.rowSize = 5;
        this.resourceData = {
            monster: null,
            profession: null
        };
        this.initializeElements();
        this.loadResourceData();
        this.setupStoreSubscriptions();
    }

    initializeElements() {
        this.elements = {
            container: document.getElementById('profession-inventory'),
            pagination: document.getElementById('pagination'),
            tabs: {
                profession: document.getElementById('profession-resources'),
                combat: document.getElementById('combat-resources')
            }
        };

        // Créer la grille si elle n'existe pas
        if (this.elements.container) {
            this.elements.grid = document.createElement('div');
            this.elements.grid.className = 'inventory-grid';
            this.elements.grid.style.display = 'grid';
            this.elements.grid.style.gridTemplateColumns = `repeat(${this.rowSize}, 1fr)`;
            this.elements.grid.style.gap = '10px';
            this.elements.container.appendChild(this.elements.grid);
        }
    }

    async loadResourceData() {
        try {
            // Load monster resources data
            const monsterResponse = await fetch('/data/monsterResources.json');
            const monsterData = await monsterResponse.json();
            this.resourceData.monster = monsterData.resources.reduce((acc, resource) => {
                acc[resource.id] = resource;
                return acc;
            }, {});

            // Load profession resources data
            const professionResponse = await fetch('/data/professionResources.json');
            const professionData = await professionResponse.json();
            
            // Flatten profession resources into a single object
            this.resourceData.profession = {};
            for (const profession in professionData) {
                professionData[profession].forEach(resource => {
                    this.resourceData.profession[resource.id] = resource;
                });
            }

            // Update display after data is loaded
            this.updateDisplay();
        } catch (error) {
            console.error('Error loading resource data:', error);
        }
    }

    setupStoreSubscriptions() {
        // Update the display whenever the inventory changes
        gameStore.subscribe(['inventory'], () => this.updateDisplay());
    }

    updateDisplay() {
        if (!this.elements.grid) return;

        const state = gameStore.getState();
        const allItems = inventorySelectors.getAllItems(state);
        const totalItems = allItems.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / this.itemsPerPage));

        // Ensure current page is within valid range
        if (this.currentPage > totalPages) {
            this.currentPage = 1;
        }

        // Clear the grid
        this.elements.grid.innerHTML = '';

        // Calculate items for the current page
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, totalItems);
        const itemsToDisplay = allItems.slice(startIndex, endIndex);

        // Create inventory slots
        for (let i = 0; i < this.itemsPerPage; i++) {
            const slot = this.createInventorySlot(i < itemsToDisplay.length ? itemsToDisplay[i] : null);
            this.elements.grid.appendChild(slot);
        }

        // Update pagination
        this.updatePagination(totalPages);

        // Setup tab event listeners
        this.setupTabListeners();
    }

    setupTabListeners() {
        if (this.elements.tabs?.profession && !this.professionTabInitialized) {
            this.elements.tabs.profession.addEventListener('click', () => {
                // Filter profession resources
                this.updateDisplay();
            });
            this.professionTabInitialized = true;
        }

        if (this.elements.tabs?.combat && !this.combatTabInitialized) {
            this.elements.tabs.combat.addEventListener('click', () => {
                // Filter combat resources
                this.updateDisplay();
            });
            this.combatTabInitialized = true;
        }
    }

    createInventorySlot(itemData) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';

        if (itemData) {
            const [itemId, quantity] = itemData;
            const item = this.getItemData(itemId);
            if (item) {
                slot.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" width="32" height="32" />
                    <div class="item-count">${quantity}</div>
                    <div class="tooltip">${this.getItemName(itemId)}</div>
                `;
                
                // Add hover events
                slot.addEventListener('mouseenter', () => this.showItemTooltip(slot, item));
                slot.addEventListener('mouseleave', () => this.hideItemTooltip(slot));
            }
        } else {
            slot.innerHTML = '<div class="empty-slot"></div>';
        }

        return slot;
    }

    getItemName(itemId) {
        // Determine item category
        if (itemId.includes('ore') || itemId.includes('wood')) {
            const professionType = itemId.includes('ore') ? 'miner' : 'lumberjack';
            return globalTranslationManager.translate(`resources.professions.${professionType}.${itemId}`);
        } else {
            return globalTranslationManager.translate(`resources.monsters.${itemId}`) || itemId;
        }
    }

    getItemData(itemId) {
        // Check if resource data has been loaded
        if (!this.resourceData.monster && !this.resourceData.profession) {
            return {
                image: '/api/placeholder/64/64',
                name: this.getItemName(itemId),
                rarity: 'common'
            };
        }

        // Check monster resources
        if (this.resourceData.monster && this.resourceData.monster[itemId]) {
            const resource = this.resourceData.monster[itemId];
            return {
                image: resource.image,
                name: resource.defaultName,
                rarity: resource.rarity || 'common'
            };
        }
        
        // Check profession resources
        if (this.resourceData.profession && this.resourceData.profession[itemId]) {
            const resource = this.resourceData.profession[itemId];
            return {
                image: resource.image,
                name: resource.defaultName,
                rarity: 'common',
                tier: resource.tier
            };
        }

        // Fallback for resources not found
        return {
            image: '/api/placeholder/64/64',
            name: this.getItemName(itemId),
            rarity: 'common'
        };
    }

    showItemTooltip(slot, item) {
        const tooltip = slot.querySelector('.tooltip');
        if (tooltip) {
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1';
        }
    }

    hideItemTooltip(slot) {
        const tooltip = slot.querySelector('.tooltip');
        if (tooltip) {
            tooltip.style.visibility = 'hidden';
            tooltip.style.opacity = '0';
        }
    }

    updatePagination(totalPages) {
        if (!this.elements.pagination) return;

        this.elements.pagination.innerHTML = '';
        
        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('button');
            button.innerText = i;
            button.className = i === this.currentPage ? 'current-page' : '';
            button.addEventListener('click', () => {
                this.currentPage = i;
                this.updateDisplay();
            });
            this.elements.pagination.appendChild(button);
        }
    }
}

export const inventoryUI = new InventoryUI();