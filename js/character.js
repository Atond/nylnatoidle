let characterLevel = 1;

export function getCharacterLevel() {
    return characterLevel;
}

export function setCharacterLevel(value) {
    characterLevel = value;
    updateCharacterLevelDisplay();
}


export function updateCharacterLevelDisplay() {
    const levelElement = document.getElementById('character-level');
    if (levelElement) {
        levelElement.innerText = characterLevel;
    } else {
        console.error("Element with ID 'character-level' not found.");
    }
}