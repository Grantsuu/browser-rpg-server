import type { FishingGameState, FishingGameTile } from '../../api/types/types.js';
import { getRandomNumberBetween } from '../../api/utilities/functions.js';

export const censorFishingTiles = (gameState: FishingGameState) => {
    const censoredTiles = gameState['tiles'].map((tile: any) => {
        return tile.map((t: any) => {
            return t.isDiscovered ? t.content : 'undiscovered'
        });
    });
    return censoredTiles;
}

export const generateFishingTiles = (rows: number, columns: number, fish: number, bountiful_fish: number) => {
    const tiles: FishingGameTile[][] = Array.from({ length: rows }, () => Array(columns).fill({ isDiscovered: false, content: 'undiscovered' } as FishingGameTile));
    let fishCount = 0;
    let bountifulFishCount = 0;

    // Add fish to random tiles
    while (fishCount < fish) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * columns);
        if (tiles[row][col].content === 'undiscovered') {
            tiles[row][col] = { isDiscovered: false, content: 'fish' };
            fishCount++;
        }
    }

    // Add bountiful fish to random tiles
    while (bountifulFishCount < bountiful_fish) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * columns);
        if (tiles[row][col].content === 'undiscovered') {
            tiles[row][col] = { isDiscovered: false, content: 'bountiful' };
            bountifulFishCount++;
        }
    }

    // Iterate through the tiles and set the content to the number of adjacent fish
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            if (tiles[i][j].content === 'undiscovered') {
                let adjacentFish = 0;
                for (let x = -1; x <= 1; x++) {
                    for (let y = -1; y <= 1; y++) {
                        if (x === 0 && y === 0) continue;
                        const newRow = i + x;
                        const newCol = j + y;
                        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < columns) {
                            if (tiles[newRow][newCol].content === 'fish' || tiles[newRow][newCol].content === 'bountiful') {
                                adjacentFish++;
                            }
                        }
                    }
                }
                tiles[i][j] = { isDiscovered: false, content: adjacentFish };
            }
        }
    }
    return tiles;
}

export const rollDamage = (power: number, toughness: number) => {
    let damage = 0;
    for (let i = 0; i < power; i++) {
        damage += getRandomNumberBetween(1, 4);
    }
    damage -= toughness;
    return damage > 0 ? damage : 0;
}

export const assignDamage = (health: number, damage: number) => {
    health -= damage;
    return health > 0 ? health : 0;
}

export const assignHealing = (health: number, maxHealth: number, healing: number) => {
    health += healing;
    return health > maxHealth ? maxHealth : health;
}

export const checkIsDead = (health: number) => {
    return health <= 0;
}