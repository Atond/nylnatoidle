import { globalResourceManager } from './resourceManager.js';

class CombatSystem {
    constructor(player) {
        this.player = player;
        this.currentZone = null;
        this.currentEnemy = null;
    }

    setCurrentZone(zoneId) {
        this.currentZone = zoneId;
    }

    generateEncounter() {
        if (!this.currentZone) {
            console.error("No current zone set");
            return null;
        }

        const monstersInZone = globalResourceManager.getMonstersInZone(this.currentZone);
        if (!monstersInZone || monstersInZone.length === 0) {
            console.error("No monsters in current zone");
            return null;
        }

        // Sélectionner un monstre aléatoire en fonction de son taux d'apparition
        const randomValue = Math.random();
        let cumulativeProb = 0;
        for (const monster of monstersInZone) {
            cumulativeProb += monster.spawnRate;
            if (randomValue <= cumulativeProb) {
                this.currentEnemy = this.createEnemyInstance(monster);
                return this.currentEnemy;
            }
        }
    }

    createEnemyInstance(monsterTemplate) {
        // Créer une instance de monstre avec des stats ajustées en fonction du niveau
        const level = this.getRandomLevel(monsterTemplate.levelRange);
        const stats = this.scaleStats(monsterTemplate.baseStats, level);
        return {
            id: monsterTemplate.id,
            name: monsterTemplate.defaultName,
            level: level,
            ...stats
        };
    }

    getRandomLevel(levelRange) {
        return Math.floor(Math.random() * (levelRange[1] - levelRange[0] + 1)) + levelRange[0];
    }

    scaleStats(baseStats, level) {
        // Exemple simple de mise à l'échelle des stats en fonction du niveau
        const scaleFactor = 1 + (level - 1) * 0.1;
        return Object.entries(baseStats).reduce((acc, [stat, value]) => {
            acc[stat] = Math.round(value * scaleFactor);
            return acc;
        }, {});
    }

    attack() {
        if (!this.currentEnemy) {
            console.error("No current enemy to attack");
            return;
        }

        // Logique d'attaque simplifiée
        const damage = this.player.calculateDamage();
        this.currentEnemy.hp -= damage;

        console.log(`Player dealt ${damage} damage to ${this.currentEnemy.name}`);

        if (this.currentEnemy.hp <= 0) {
            console.log(`${this.currentEnemy.name} defeated!`);
            this.handleEnemyDefeat();
        } else {
            this.enemyAttack();
        }
    }

    enemyAttack() {
        const damage = this.currentEnemy.attack - this.player.defense;
        this.player.hp -= Math.max(0, damage);

        console.log(`${this.currentEnemy.name} dealt ${damage} damage to player`);

        if (this.player.hp <= 0) {
            console.log("Player defeated!");
            // Gérer la défaite du joueur
        }
    }

    handleEnemyDefeat() {
        const loot = this.generateLoot();
        const exp = this.calculateExperience();
        this.player.addExperience(exp);
        this.player.addLoot(loot);
        this.currentEnemy = null;
    }

    generateLoot() {
        const possibleLoot = globalResourceManager.getMonsterLoot(this.currentEnemy.id);
        return possibleLoot.filter(item => Math.random() < item.chance)
                           .map(item => ({
                               id: item.id,
                               quantity: Math.floor(Math.random() * (item.maxQuantity - item.minQuantity + 1)) + item.minQuantity
                           }));
    }

    calculateExperience() {
        // Logique pour calculer l'expérience gagnée
        return this.currentEnemy.baseExperience * this.currentEnemy.level;
    }
}

// Utilisation du système de combat
const player = {
    hp: 100,
    attack: 10,
    defense: 5,
    calculateDamage() {
        return this.attack;
    },
    addExperience(exp) {
        console.log(`Player gained ${exp} experience`);
    },
    addLoot(loot) {
        console.log(`Player received loot:`, loot);
    }
};

const combatSystem = new CombatSystem(player);

function exploreZone(zoneId) {
    combatSystem.setCurrentZone(zoneId);
    const enemy = combatSystem.generateEncounter();
    if (enemy) {
        console.log(`Encountered a level ${enemy.level} ${enemy.name}!`);
        // Commencer le combat
        while (enemy.hp > 0 && player.hp > 0) {
            combatSystem.attack();
        }
    }
}