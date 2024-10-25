import { combatSystem } from './combatSystem.js';
import { globalTranslationManager } from '../translations/translationManager.js';

class CombatUI {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.updateInterval = setInterval(() => this.updateUI(), 100);

        // Cacher initialement le bouton d'auto-combat
        if (this.autoCombatButton) {
            this.autoCombatButton.style.display = 'none';
        }
    }

    showAutoCombatButton() {
        if (this.autoCombatButton) {
            // Afficher le bouton avec une animation
            this.autoCombatButton.style.display = 'block';
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
        //this.attackButton = document.getElementById('attack-btn');
        //this.autoCombatButton = document.getElementById('auto-combat-btn');
        this.combatLog = document.getElementById('combat-log');

        // Zone progress
        this.zoneProgress = document.getElementById('zone-progress');
        this.zoneProgressText = document.getElementById('zone-progress-text');
        this.currentZone = document.getElementById('current-zone');

        // Initialiser les textes des boutons
        if (this.attackButton) {
            this.attackButton.textContent = globalTranslationManager.translate('ui.attack');
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
            
        this.autoCombatButton.textContent = globalTranslationManager.translate('ui.autoCombat')
            .replace('{state}', state);
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
            if (this.monsterImage) this.monsterImage.style.visibility = 'hidden';
            if (this.monsterAttack) this.monsterAttack.textContent = '';
            if (this.monsterDefense) this.monsterDefense.textContent = '';
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
            this.monsterAttack.textContent = `Attack: ${monster.stats.attack}`;
        }
        if (this.monsterDefense) {
            this.monsterDefense.textContent = `Defense: ${monster.stats.defense}`;
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
        if (this.attackButton) {
            const disabled = !combatSystem.inCombat || combatSystem.player.currentHp <= 0;
            this.attackButton.disabled = disabled;
            if (disabled) {
                this.attackButton.title = globalTranslationManager.translate('ui.buttonDisabled');
            } else {
                this.attackButton.title = '';
            }
        }
        if (this.autoCombatButton) {
            const disabled = combatSystem.player.currentHp <= 0;
            this.autoCombatButton.disabled = disabled;
            if (disabled) {
                this.autoCombatButton.title = globalTranslationManager.translate('ui.buttonDisabled');
            } else {
                this.autoCombatButton.title = '';
            }
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
        const logEntry = document.createElement('p');
        logEntry.textContent = message;
        this.combatLog.appendChild(logEntry);
    
        // Limiter à 50 messages
        while (this.combatLog.children.length > 50) {
            this.combatLog.removeChild(this.combatLog.firstChild);
        }
    
        this.combatLog.scrollTop = this.combatLog.scrollHeight;
    }

    // Nouvelles méthodes pour les messages de combat
    addDamageLog(attacker, defender, amount) {
        const attackerName = attacker === 'Joueur' ? attacker : 
            globalTranslationManager.translate(`monsters.${attacker.id}`);
        const defenderName = defender === 'Joueur' ? defender : 
            globalTranslationManager.translate(`monsters.${defender.id}`);
            
        this.addCombatLog(
            globalTranslationManager.translate('combat.damage')
                .replace('{attacker}', attackerName)
                .replace('{defender}', defenderName)
                .replace('{amount}', amount)
        );
    }

    addVictoryLog(monster) {
        const monsterName = globalTranslationManager.translate(`monsters.${monster.id}`);
        this.addCombatLog(
            globalTranslationManager.translate('combat.victory')
                .replace('{monster}', monsterName)
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