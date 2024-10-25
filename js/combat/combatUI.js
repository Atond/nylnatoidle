import { combatSystem } from './combatSystem.js';
import { globalTranslationManager } from '../translations/translationManager.js';

class CombatUI {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.updateInterval = setInterval(() => this.updateUI(), 100);
    
        if (this.autoCombatButton) {
            this.autoCombatButton.style.display = 'none';
            this.autoCombatButton.classList.add('btn', 'btn-secondary');
        }
        this.combatLog = document.getElementById('combat-log');
        this.progressionLog = document.getElementById('progression-log');
    }

    showAutoCombatButton() {
        if (this.autoCombatButton) {
            this.autoCombatButton.style.display = 'flex'; // Changé à flex pour l'alignement avec l'icône
            this.autoCombatButton.classList.add('button-appear');
        }
    }

    initializeElements() {
        // Player elements
        this.playerHealth = document.getElementById('player-health');
        this.playerHealthText = document.getElementById('player-health-text');
        this.playerAttack = document.getElementById('player-attack');
        this.playerDefense = document.getElementById('player-defense');
        this.playerExp = document.getElementById('player-exp');
        this.playerExpBar = document.getElementById('player-exp-bar');

        // Monster elements
        this.monsterHealth = document.getElementById('monster-health');
        this.monsterHealthText = document.getElementById('monster-health-text');
        this.monsterName = document.getElementById('monster-name');
        this.monsterLevel = document.getElementById('monster-level');
        this.monsterImage = document.getElementById('monster-image');
        this.monsterAttack = document.getElementById('monster-attack');
        this.monsterDefense = document.getElementById('monster-defense');

        // Combat controls
        this.attackButton = document.getElementById('attack-btn');
        this.autoCombatButton = document.getElementById('auto-combat-btn');
        this.combatLog = document.getElementById('combat-log');

        // Zone progress
        this.zoneProgress = document.getElementById('zone-progress');
        this.zoneProgressText = document.getElementById('zone-progress-text');
        this.currentZone = document.getElementById('current-zone');

        // Initialiser les textes des boutons
        if (this.attackButton) {
            this.attackButton.textContent = globalTranslationManager.translate('combat.attack');
        }
        if (this.autoCombatButton) {
            this.autoCombatButton.textContent = globalTranslationManager.translate('ui.autoCombat')
                .replace('{state}', globalTranslationManager.translate('ui.autoCombatOff'));
        }
    }

    bindEvents() {
        if (this.attackButton) {
            this.attackButton.addEventListener('click', () => this.handleAttack());
        }
        if (this.autoCombatButton) {
            this.autoCombatButton.addEventListener('click', () => this.toggleAutoCombat());
        }
    }

    handleAttack() {
        if (!combatSystem.inCombat) {
            combatSystem.startCombat();
        } else {
            combatSystem.attack();
        }
    }

    toggleAutoCombat() {
        combatSystem.toggleAutoCombat();
        const state = combatSystem.autoCombatEnabled ? 
            globalTranslationManager.translate('ui.autoCombatOn') : 
            globalTranslationManager.translate('ui.autoCombatOff');
            
        if (this.autoCombatButton) {
            this.autoCombatButton.innerHTML = `
                <i data-lucide="${combatSystem.autoCombatEnabled ? 'pause' : 'play'}" class="w-4 h-4"></i>
                ${globalTranslationManager.translate('ui.autoCombat').replace('{state}', state)}
            `;
            lucide.createIcons();
        }
    }

    updateUI() {
        this.updatePlayerStats();
        this.updateMonsterStats();
        this.updateZoneProgress();
        this.updateButtons();
    }

    updatePlayerStats() {
        const playerStats = combatSystem.player.getTotalStats();
        const playerHealthPercent = (combatSystem.player.currentHp / combatSystem.player.maxHp) * 100;
        
        if (this.playerHealth) {
            this.playerHealth.style.width = `${playerHealthPercent}%`;
        }
        if (this.playerHealthText) {
            this.playerHealthText.textContent = globalTranslationManager.translate('ui.health')
                .replace('{current}', Math.round(combatSystem.player.currentHp))
                .replace('{max}', combatSystem.player.maxHp);
        }
        if (this.playerAttack) {
            this.playerAttack.textContent = globalTranslationManager.translate('ui.attack_stat')
                .replace('{value}', playerStats.attack);
        }
        if (this.playerDefense) {
            this.playerDefense.textContent = globalTranslationManager.translate('ui.defense_stat')
                .replace('{value}', playerStats.defense);
        }
    }

    updatePlayerExperience(currentExp, maxExp, level) {
        if (this.playerExp) {
            this.playerExp.textContent = `${currentExp}/${maxExp} XP`;
        }
        if (this.playerExpBar) {
            const percentage = (currentExp / maxExp) * 100;
            this.playerExpBar.style.width = `${percentage}%`;
        }
    }

    updateMonsterStats() {
        if (!combatSystem.currentMonster) {
            // Réinitialiser l'affichage du monstre
            if (this.monsterHealth) this.monsterHealth.style.width = '0%';
            if (this.monsterHealthText) this.monsterHealthText.textContent = '???/???';
            if (this.monsterName) this.monsterName.textContent = globalTranslationManager.translate('ui.noMonster');
            if (this.monsterLevel) this.monsterLevel.textContent = '';
            if (this.monsterAttack) this.monsterAttack.textContent = '';
            if (this.monsterDefense) this.monsterDefense.textContent = '';
            if (this.monsterImage) this.monsterImage.style.visibility = 'hidden';
            return;
        }
        
        const monster = combatSystem.currentMonster;
        const monsterHealthPercent = (monster.currentHp / monster.maxHp) * 100;
        
        if (this.monsterHealth) {
            this.monsterHealth.style.width = `${monsterHealthPercent}%`;
        }
        if (this.monsterHealthText) {
            this.monsterHealthText.textContent = globalTranslationManager.translate('ui.health')
                .replace('{current}', Math.round(monster.currentHp))
                .replace('{max}', monster.maxHp);
        }
        if (this.monsterName) {
            this.monsterName.textContent = globalTranslationManager.translate(`monsters.${monster.id}`);
        }
        if (this.monsterLevel) {
            this.monsterLevel.textContent = globalTranslationManager.translate('ui.level')
                .replace('{level}', monster.level);
        }

        if (this.monsterAttack) {
            this.monsterAttack.textContent = globalTranslationManager.translate('ui.monster_attack_stat')
                .replace('{value}', monster.stats.attack);
        }
        if (this.monsterDefense) {
            this.monsterDefense.textContent = globalTranslationManager.translate('ui.monster_defense_stat')
                .replace('{value}', monster.stats.defense);
        }
        if (this.monsterImage) {
            this.monsterImage.style.visibility = 'visible';
            this.monsterImage.src = monster.image || '/api/placeholder/150/150';
        }
    }

    updateZoneProgress() {
        if (!combatSystem.currentZone) return;
    
        const progress = (combatSystem.monstersDefeated / 10) * 100;
        
        if (this.zoneProgress) {
            this.zoneProgress.style.width = `${progress}%`;
        }
        if (this.zoneProgressText) {
            this.zoneProgressText.textContent = globalTranslationManager.translate('ui.progress')
                .replace('{current}', combatSystem.monstersDefeated)
                .replace('{max}', 10);
        }
        if (this.currentZone) {
            this.currentZone.textContent = globalTranslationManager.translate('ui.zone')
                .replace('{name}', globalTranslationManager.translate(`zones.${combatSystem.currentZone.id}`));
        }
    }

    updateButtons() {
        const disabled = !combatSystem.inCombat || combatSystem.player.currentHp <= 0;
        
        if (this.attackButton) {
            this.attackButton.disabled = disabled;
            this.attackButton.classList.toggle('opacity-50', disabled);
            this.attackButton.classList.toggle('cursor-not-allowed', disabled);
        }
        
        const autoCombatDisabled = combatSystem.player.currentHp <= 0;
        if (this.autoCombatButton) {
            this.autoCombatButton.disabled = autoCombatDisabled;
            this.autoCombatButton.classList.toggle('opacity-50', autoCombatDisabled);
            this.autoCombatButton.classList.toggle('cursor-not-allowed', autoCombatDisabled);
        }
    }

    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        // S'assurer que l'auto-combat est arrêté
        if (combatSystem.autoCombatEnabled) {
            combatSystem.toggleAutoCombat();
        }
    }

    addCombatLog(message) {
        if (!this.combatLog) return;
        
        const logEntry = document.createElement('div');
        logEntry.className = 'combat-message';
        logEntry.textContent = message;
        
        this.combatLog.appendChild(logEntry);
        while (this.combatLog.children.length > 50) {
            this.combatLog.removeChild(this.combatLog.firstChild);
        }
        
        this.combatLog.scrollTop = this.combatLog.scrollHeight;
    }

    addProgressionLog(message, type) {
        if (!this.progressionLog) return;
        
        const logEntry = document.createElement('div');
        switch (type) {
            case 'level':
                logEntry.className = 'level-message';
                break;
            case 'experience':
                logEntry.className = 'exp-message';
                break;
            case 'loot':
                logEntry.className = 'loot-message';
                break;
            default:
                logEntry.className = 'combat-message';
        }
        
        logEntry.textContent = message;
        this.progressionLog.appendChild(logEntry);
        this.progressionLog.scrollTop = this.progressionLog.scrollHeight;
    }

    addDamageLog(attacker, defender, amount) {
        // Utiliser addCombatLog pour les messages de dégâts
        let attackerName = attacker === 'Joueur' ? attacker : 
            globalTranslationManager.translate(`monsters.${attacker.id}`);
        let defenderName = defender === 'Joueur' ? defender : 
            globalTranslationManager.translate(`monsters.${defender.id}`);
            
        this.addCombatLog(
            globalTranslationManager.translate('combat.damage')
                .replace('{attacker}', attackerName)
                .replace('{defender}', defenderName)
                .replace('{amount}', amount)
        );
    }

    addVictoryLog(monster) {
        if (!monster || !monster.id) return;
        
        const monsterName = globalTranslationManager.translate(`monsters.${monster.id}`);
        const logEntry = document.createElement('div');
        logEntry.className = 'victory-message';
        logEntry.textContent = globalTranslationManager.translate('combat.victory')
        .replace('{monster}', monsterName);
    
    if (this.combatLog) {
        this.combatLog.appendChild(logEntry);
        this.combatLog.scrollTop = this.combatLog.scrollHeight;
    }
    }

    addLevelUpLog(level, stats) {
        this.addProgressionLog(
            globalTranslationManager.translate('ui.levelUp').replace('{level}', level),
            'level'
        );
        
        // Ajouter les gains de stats
        const statsMessage = Object.entries(stats)
            .map(([stat, gain]) => 
                `${globalTranslationManager.translate(`ui.${stat}`)}: +${gain}`
            ).join(', ');
        this.addProgressionLog(statsMessage, 'level');
    }

    addExperienceLog(amount) {
        this.addProgressionLog(
            globalTranslationManager.translate('combat.experience')
                .replace('{amount}', amount),
            'experience'
        );
    }

    addLootLog(item, quantity) {
        this.addProgressionLog(
            globalTranslationManager.translate('combat.loot')
                .replace('{quantity}', quantity)
                .replace('{item}', item),
            'loot'
        );
    }

    addDefeatLog() {
        this.addCombatLog(globalTranslationManager.translate('ui.defeat'));
    }

    addQuestLog(message) {
        const questLog = document.getElementById('quest-log');
        if (questLog) {
            const logEntry = document.createElement('div');
            logEntry.textContent = message;
            questLog.appendChild(logEntry);
        }
    }
}

export const combatUI = new CombatUI();