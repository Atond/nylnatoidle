import { gameStore } from '../../store/state/GameStore';
import { inventorySelectors } from '../../store/actions/inventory';
import { globalTranslationManager } from '../../translations/translationManager';

export class InventoryUI {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.rowSize = 5;
        this.initializeElements();
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

    setupStoreSubscriptions() {
        gameStore.subscribe('inventory', () => this.updateDisplay());
    }

    updateDisplay() {
        if (!this.elements.grid) return;

        const state = gameStore.getState();
        const allItems = inventorySelectors.getAllItems(state);
        const totalItems = allItems.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);

        // Vider la grille
        this.elements.grid.innerHTML = '';

        // Calculer les items pour la page actuelle
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, totalItems);
        const itemsToDisplay = allItems.slice(startIndex, endIndex);

        // Créer les slots d'inventaire
        for (let i = 0; i < this.itemsPerPage; i++) {
            const slot = this.createInventorySlot(itemsToDisplay[i]);
            this.elements.grid.appendChild(slot);
        }

        // Mettre à jour la pagination
        this.updatePagination(totalPages);
    }

    createInventorySlot(itemData) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';

        if (itemData) {
            const [itemId, quantity] = itemData;
            const item = this.getItemData(itemId);
            if (item) {
                slot.innerHTML = `
                    <img src="/${item.image}" alt="${item.name}" />
                    <div class="item-count">${quantity}</div>
                    <div class="tooltip">${this.getItemName(itemId)}</div>
                `;
                
                // Ajouter les événements de survol
                slot.addEventListener('mouseenter', () => this.showItemTooltip(slot, item));
                slot.addEventListener('mouseleave', () => this.hideItemTooltip(slot));
            }
        } else {
            slot.innerHTML = '<div class="empty-slot"></div>';
        }

        return slot;
    }

    getItemName(itemId) {
        // Déterminer la catégorie de l'item
        if (itemId.includes('ore') || itemId.includes('wood')) {
            const professionType = itemId.includes('ore') ? 'miner' : 'lumberjack';
            return globalTranslationManager.translate(`resources.professions.${professionType}.${itemId}`);
        } else {
            return globalTranslationManager.translate(`resources.monsters.${itemId}`);
        }
    }

    getItemData(itemId) {
        const state = gameStore.getState();
        // Logique pour récupérer les données de l'item (image, rareté, etc.)
        // À implémenter selon votre structure de données
        return {
            image: '/api/placeholder/64/64', // Image par défaut
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