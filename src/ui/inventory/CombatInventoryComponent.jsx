import React, { useEffect, useRef, useState } from 'react';
import { inventoryUI } from './InventoryUI';
import { gameStore } from '../../store/state/GameStore';
import { inventorySelectors } from '../../store/actions/inventory';
import './inventory.css';

const CombatInventoryComponent = () => {
  const [items, setItems] = useState([]);
  const inventoryContainerRef = useRef(null);

  useEffect(() => {
    // Function to update the items display
    const updateItems = () => {
      const state = gameStore.getState();
      const allItems = inventorySelectors.getAllItems(state);
      setItems(allItems);
    };

    // Initial update
    updateItems();

    // Subscribe to inventory changes
    const unsubscribe = gameStore.subscribe('inventory', updateItems);

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  const renderItem = (itemData) => {
    if (!itemData) return null;
    
    const [itemId, quantity] = itemData;
    const item = inventoryUI.getItemData(itemId);
    
    return (
      <div key={itemId} className="inventory-slot-compact">
        <img src={`/${item.image}`} alt={item.name} />
        <div className="item-count">{quantity}</div>
        <div className="tooltip-compact">{inventoryUI.getItemName(itemId)}</div>
      </div>
    );
  };

  return (
    <div className="combat-inventory-container">
      <h3 className="text-lg font-medium mb-2">Combat Resources</h3>
      <div className="combat-inventory-grid" ref={inventoryContainerRef}>
        {items.length > 0 ? (
          items.map(item => renderItem(item))
        ) : (
          <div className="text-gray-500 text-sm">No resources yet</div>
        )}
      </div>
    </div>
  );
};

export default CombatInventoryComponent;