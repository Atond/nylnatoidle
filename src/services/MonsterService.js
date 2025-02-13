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

  generateMonsterForZone(zoneId) {
    const zoneMonsters = this.getZoneMonsters(zoneId);
    if (!zoneMonsters.length) return null;

    // Sélection basée sur le spawnRate
    const totalSpawnRate = zoneMonsters.reduce((sum, m) => sum + m.spawnRate, 0);
    let random = Math.random() * totalSpawnRate;
    let selectedMonsterRef = null;

    for (const monsterRef of zoneMonsters) {
      random -= monsterRef.spawnRate;
      if (random <= 0) {
        selectedMonsterRef = monsterRef;
        break;
      }
    }

    if (!selectedMonsterRef) {
      selectedMonsterRef = zoneMonsters[0];
    }

    const monsterData = this.getMonsterData(selectedMonsterRef.id);
    if (!monsterData) return null;

    // Calcul du niveau
    const level = selectedMonsterRef.levelRange 
      ? Math.floor(selectedMonsterRef.levelRange[0] + Math.random() * (selectedMonsterRef.levelRange[1] - selectedMonsterRef.levelRange[0] + 1))
      : 1;

    // Application du scaling
    const scalingFactor = 1 + (level - 1) * 0.1;
    const stats = {
      ...monsterData.baseStats,
      hp: Math.floor(monsterData.baseStats.hp * scalingFactor),
      attack: Math.floor(monsterData.baseStats.attack * scalingFactor),
      defense: Math.floor(monsterData.baseStats.defense * scalingFactor)
    };

    return {
      ...monsterData,
      level,
      currentHp: stats.hp,
      maxHp: stats.hp,
      stats
    };
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