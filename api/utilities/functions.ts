export const getRandomNumberBetween = (min: number, max: number): number => {
    // Ensure min is less than or equal to max
    if (min > max) {
        [min, max] = [max, min]; // Swap min and max
    }
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}