import { type FishingGameState } from '../../api/types/types.js';

export const censorFishingTiles = (gameState: FishingGameState) => {
    const censoredTiles = gameState['tiles'].map((tile: any) => {
        return tile.map((t: any) => {
            return t.isDiscovered ? t.content : 'undiscovered'
        });
    });
    return censoredTiles;
}