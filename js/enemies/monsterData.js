export const monsterData = [
    {
        world: "Forest",
        zones: [
            {
                name: "Dark Woods",
                monsters: [
                    { id: "goblin", name: "Goblin", maxHp: 10, exp: 5, loot: ["wood", "stone"] },
                    { id: "wolf", name: "Wolf", maxHp: 15, exp: 8, loot: ["fur", "meat"] }
                ]
            },
            {
                name: "Enchanted Grove",
                monsters: [
                    { id: "fairy", name: "Mischievous Fairy", maxHp: 8, exp: 7, loot: ["magic dust", "flower"] },
                    { id: "ent", name: "Young Ent", maxHp: 25, exp: 15, loot: ["ancient wood", "leaf"] }
                ]
            }
        ]
    },
    {
        world: "Mountains",
        zones: [
            {
                name: "Rocky Peaks",
                monsters: [
                    { id: "goat", name: "Mountain Goat", maxHp: 12, exp: 6, loot: ["hide", "horn"] },
                    { id: "eagle", name: "Giant Eagle", maxHp: 18, exp: 10, loot: ["feather", "talon"] }
                ]
            },
            {
                name: "Abandoned Mines",
                monsters: [
                    { id: "kobold", name: "Kobold Miner", maxHp: 14, exp: 9, loot: ["ore", "gem"] },
                    { id: "golem", name: "Stone Golem", maxHp: 30, exp: 20, loot: ["crystal", "boulder"] }
                ]
            }
        ]
    }
];