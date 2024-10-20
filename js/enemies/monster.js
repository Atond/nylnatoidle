import { monsterData } from './monsterData.js';

export class Monster {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.maxHp = data.maxHp;
        this.currentHp = data.maxHp;
        this.exp = data.exp;
        this.loot = data.loot;
    }

    takeDamage(amount) {
        this.currentHp = Math.max(0, this.currentHp - amount);
        return this.currentHp === 0;
    }
}

export class MonsterManager {
    constructor() {
        this.currentMonster = null;
        this.currentWorld = null;
        this.currentZone = null;
    }

    setWorld(worldName) {
        this.currentWorld = monsterData.find(world => world.world === worldName);
        this.currentZone = null;
        this.currentMonster = null;
    }

    setZone(zoneName) {
        if (!this.currentWorld) return;
        this.currentZone = this.currentWorld.zones.find(zone => zone.name === zoneName);
        this.currentMonster = null;
    }

    spawnMonster() {
        if (!this.currentZone) return;
        const randomMonster = this.currentZone.monsters[Math.floor(Math.random() * this.currentZone.monsters.length)];
        this.currentMonster = new Monster(randomMonster);
        this.updateMonsterDisplay();
    }

    attackMonster(damage) {
        if (!this.currentMonster) return { expGained: 0, loot: [] };

        const isDefeated = this.currentMonster.takeDamage(damage);
        this.updateMonsterDisplay();

        if (isDefeated) {
            const expGained = this.currentMonster.exp;
            const loot = this.currentMonster.loot;
            this.spawnMonster();
            return { expGained, loot };
        }

        return { expGained: 0, loot: [] };
    }

    updateMonsterDisplay() {
        const monsterElement = document.getElementById('monster');
        if (this.currentMonster) {
            monsterElement.innerHTML = `
                <h3>${this.currentMonster.name}</h3>
                <p>HP: ${this.currentMonster.currentHp} / ${this.currentMonster.maxHp}</p>
            `;
        } else {
            monsterElement.innerHTML = '<p>No monster present</p>';
        }
    }
}