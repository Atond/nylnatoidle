let points = 0;
let characterLevel = 1;

export function getPoints() {
    return points;
}

export function setPoints(value) {
    points = value;
    // updatePointsDisplay(); // Commented out since points are no longer displayed
}

export function getCharacterLevel() {
    return characterLevel;
}

export function setCharacterLevel(value) {
    characterLevel = value;
    updateCharacterLevelDisplay();
}

// Commented out since points are no longer displayed
// export function updatePointsDisplay() {
//     const pointsElement = document.getElementById('points');
//     if (pointsElement) {
//         pointsElement.innerText = `Points: ${points}`;
//     } else {
//         console.error("Element with ID 'points' not found.");
//     }
// }

export function updateCharacterLevelDisplay() {
    const levelElement = document.getElementById('character-level');
    if (levelElement) {
        levelElement.innerText = characterLevel;
    } else {
        console.error("Element with ID 'character-level' not found.");
    }
}

// Function to auto-generate points
// Commented out since points are no longer displayed
// export function autoGeneratePoints() {
//     points += 1;
//     updatePointsDisplay();
// }