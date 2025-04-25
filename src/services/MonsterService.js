export class MonsterService {
  constructor() {
    this.monsters = null;
    this.worldMap = null;
  }

  async initialize() {
    try {
      const [worldMapResponse, monstersResponse] = await Promise.all([
        fetch('/data/worldMap.json'),
        fetch('/data/monsters.json')
      ]);
      
      this.worldMap = await worldMapResponse.json();
      this.monsters = await monstersResponse.json();
    } catch (error) {
      console.error('Failed to initialize MonsterService:', error);
      throw error;
    }
  }

  getZoneMonsters(zoneId) {
    const zone = this.worldMap.worlds
      .flatMap(world => world.zones)
      .find(zone => zone.id === zoneId);
      
    return zone?.monsters || [];
  }

  getMonsterData(monsterId) {
    return this.monsters.monsters.find(m => m.id === monsterId);
  }

  getZoneData(zoneId) {
    // Find zone data across all worlds
    for (const world of this.worldMap.worlds) {
      const zone = world.zones.find(z => z.id === zoneId);
      if (zone) {
        return zone;
      }
    }
    return null;
  }

  generateMonsterForZone(zoneId) {
    try {
      // Find the zone data first
      const zone = this.getZoneData(zoneId);
      if (!zone) {
        console.error(`Zone ${zoneId} not found`);
        return null;
      }
      
      // Select a monster from the available monsters in this zone
      if (!zone.monsters || zone.monsters.length === 0) {
        console.error(`No monsters available for zone ${zoneId}`);
        return null;
      }
      
      // Use spawn rates to select a random monster
      const totalSpawnRate = zone.monsters.reduce((sum, monster) => sum + monster.spawnRate, 0);
      let random = Math.random() * totalSpawnRate;
      
      let selectedMonster = null;
      for (const monster of zone.monsters) {
        random -= monster.spawnRate;
        if (random <= 0) {
          selectedMonster = monster;
          break;
        }
      }
      
      if (!selectedMonster) {
        console.error('Failed to select a monster');
        return null;
      }
      
      // Get the full monster data based on the ID
      const monsterTemplate = this.getMonsterData(selectedMonster.id);
      if (!monsterTemplate) {
        console.error(`Monster data for ${selectedMonster.id} not found`);
        return null;
      }
      
      // Calculate level based on monster settings
      const level = monsterTemplate.levelRange ? 
          Math.floor(monsterTemplate.levelRange[0] + Math.random() * (monsterTemplate.levelRange[1] - monsterTemplate.levelRange[0])) : 
          1;
          
      // Calculate scaled stats based on level and zone
      const baseStats = monsterTemplate.baseStats || { hp: 10, attack: 1, defense: 0 };
      const scaledStats = this.scaleMonsterStats(baseStats, level, zone.index || 0);
      
      // Create the final monster instance
      const monsterInstance = {
        ...monsterTemplate,
        level: level,
        maxHp: scaledStats.hp,
        currentHp: scaledStats.hp,
        stats: scaledStats
      };
      
      // Log the monster ID for debugging
      console.log(`Generated monster: ${monsterInstance.id}, defaultName: ${monsterInstance.defaultName}`);
      
      return monsterInstance;
    } catch (error) {
      console.error('Error generating monster:', error);
      return null;
    }
  }

  scaleMonsterStats(baseStats, level, zoneIndex) {
    // Basic scaling factors
    const levelFactor = 1 + (level - 1) * 0.1; 
    const zoneFactor = 1 + zoneIndex * 0.2;
    
    // Apply scaling to each stat
    const scaledStats = {};
    for (const [stat, value] of Object.entries(baseStats)) {
      // HP gets more aggressive scaling than other stats
      if (stat === 'hp') {
        scaledStats[stat] = Math.floor(value * levelFactor * zoneFactor);
      } else {
        scaledStats[stat] = Math.floor(value * Math.sqrt(levelFactor * zoneFactor));
      }
    }
    
    return scaledStats;
  }

  // Méthodes pour calculer les récompenses
  calculateExperience(monster) {
    const baseXP = monster.baseExperience || 10;
    const levelMultiplier = 1 + (monster.level - 1) * 0.2;
    return Math.floor(baseXP * levelMultiplier);
  }

  generateLoot(monster) {
    if (!monster.loot) return [];

    return monster.loot
      .filter(lootEntry => Math.random() < lootEntry.chance)
      .map(lootEntry => ({
        id: lootEntry.resourceId,
        quantity: Math.floor(
          lootEntry.minQuantity + 
          Math.random() * (lootEntry.maxQuantity - lootEntry.minQuantity + 1)
        )
      }));
  }
}

export const monsterService = new MonsterService();