let points = 0;
let characterLevel = 1;

export function updatePointsDisplay() {
    document.getElementById('points').innerText = `Points: ${points}`;
}

export function updateCharacterLevelDisplay() {
    document.getElementById('character-level').innerText = characterLevel;
}

// Function to auto-generate points
export function autoGeneratePoints() {
    points += 1;
    updatePointsDisplay();
}