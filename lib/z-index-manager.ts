// Simple global z-index manager
let currentMaxZ = 100;

export const getNewZIndex = (): number => {
    currentMaxZ += 1;
    return currentMaxZ;
};

export const resetZIndex = (): void => {
    currentMaxZ = 100;
};

export const getCurrentMaxZ = (): number => {
    return currentMaxZ;
};