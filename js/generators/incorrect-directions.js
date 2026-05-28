class IncorrectDirections {
    findUnused(combinations, correctCoord) {
        let unused = [];
        let permutation = correctCoord.map(d => 0);
        let permutate = (i) => {
            if (i >= permutation.length) {
                if (!arraysEqual(permutation, correctCoord) && 
                    !arraysEqual(permutation, correctCoord.slice(0, 3).map(d => 0)) &&
                    combinations.findIndex(combo => arraysEqual(permutation, combo)) === -1) {
                    unused.push(permutation.slice());
                }
                return;
            }
            for (let direction of [-1, 0, 1]) {
                permutation[i] = direction;
                permutate(i+1);
            }
        }
        permutate(0);
        return unused;
    }

    // Helper: Extract direction from a coord (normalize it)
    getDirection(coord) {
        return normalize(coord);
    }

    // Helper: Get magnitude of a coord (Chebyshev distance)
    getMagnitude(coord) {
        return Math.max(...coord.map(Math.abs));
    }

    // Check if usedCoords contains magnitude info (new system) or just directions (old system)
    hasRealMagnitudes(usedCoords) {
        if (usedCoords.length === 0) return false;
        
        // If elements are objects with { direction, magnitude, scaledCoord }, then magnitudes are tracked
        const firstItem = usedCoords[0];
        return firstItem && typeof firstItem === 'object' && 'magnitude' in firstItem;
    }

    // Extract just the direction part from usedCoords
    extractDirections(usedCoords) {
        if (this.hasRealMagnitudes(usedCoords)) {
            // New system: extract direction field
            return usedCoords.map(item => item.direction);
        } else {
            // Old system: treat entire item as direction
            return usedCoords;
        }
    }

    createIncorrectConclusionCoords(usedCoords, correctCoord, diffCoord, hardModeDimensions) {
        let opposite = correctCoord.map(dir => -dir)
        let isUsingHardMode = hardModeDimensions && hardModeDimensions.length > 0;
        let hasMagnitudes = this.hasRealMagnitudes(usedCoords);
        
        if (usedCoords.length <= 2) {
            return [opposite]; // Few premises == anything that isn't the opposite tends to be easy.
        } else if (usedCoords.length <= 3 && !isUsingHardMode && Math.random() < 0.5) {
            return [opposite];
        } else if (usedCoords.length <= 4 && !isUsingHardMode && Math.random() < 0.23) {
            return [opposite];
        }
        
        // Extract directions (handles both old and new systems)
        const directions = this.extractDirections(usedCoords);
        const dirCoords = removeDuplicateArrays(directions);

        const dimensionPool = correctCoord.map((c, i) => i);
        let bannedDimensionShifts = new Set();
        for (const dimension of dimensionPool) {
            if (dirCoords.every(coord => coord[dimension] === 0)) {
                bannedDimensionShifts.add(dimension);
            }
        }

        const highest = diffCoord.map(x => Math.abs(x)).reduce((a, b) => Math.max(a, b));
        const allShiftedEqually = diffCoord.every(x => Math.abs(x) === highest);
        const shifts = allShiftedEqually ? [-1, 1] : [-2, -1, 1, 2];
        if (isUsingHardMode) {
            bannedDimensionShifts.add.apply(bannedDimensionShifts, dimensionPool.filter(d => !hardModeDimensions.some(h => h === d)));
        } else if (!allShiftedEqually) {
            bannedDimensionShifts.add.apply(bannedDimensionShifts, dimensionPool.filter(d => Math.abs(diffCoord[d]) === highest));
        }

        let combinations = [];
        
        // --- DIRECTION-ONLY ERRORS (always available) ---
        for (const d of dimensionPool) {
            if (bannedDimensionShifts.has(d)) {
                continue;
            }

            for (const shift of shifts) {
                let newCombo = correctCoord.slice();
                newCombo[d] += shift;
                if (newCombo.some(d => Math.abs(d) > 1)) {
                    continue;
                }
                if (newCombo.slice(0, 3).every(d => d === 0)) {
                    continue;
                }
                combinations.push(newCombo);
                if (Math.abs(shift) == 1) {
                    combinations.push(newCombo);
                    combinations.push(newCombo);
                }
            }
        }

        // --- MAGNITUDE-AWARE ERRORS (if magnitudes are being tracked) ---
        if (hasMagnitudes) {
            const correctMagnitude = this.getMagnitude(correctCoord);
            const correctDirection = this.getDirection(correctCoord);
            
            // Error 1: Correct direction, wrong magnitude
            // Example: Correct is "2 steps north" but answer is "1 step north"
            if (correctMagnitude > 1) {
                // Try magnitude-1 (e.g., 2→1)
                const wrongMagCoord = correctDirection.map(d => d * (correctMagnitude - 1));
                if (!arraysEqual(wrongMagCoord, correctCoord) && wrongMagCoord.slice(0, 3).some(c => c !== 0)) {
                    combinations.push(wrongMagCoord);
                    combinations.push(wrongMagCoord);
                    combinations.push(wrongMagCoord);
                }
            } else {
                // Try magnitude+1 (e.g., 1→2)
                const wrongMagCoord = correctDirection.map(d => d * (correctMagnitude + 1));
                if (!arraysEqual(wrongMagCoord, correctCoord) && wrongMagCoord.slice(0, 3).some(c => c !== 0)) {
                    combinations.push(wrongMagCoord);
                    combinations.push(wrongMagCoord);
                    combinations.push(wrongMagCoord);
                }
            }
            
            // Error 2: Hybrid error - wrong direction, correct magnitude
            // Example: Correct is "2 steps north", but answer is "2 steps east"
            for (const otherDir of dirCoords) {
                if (arraysEqual(otherDir, correctDirection)) continue; // Skip if it's the correct direction
                
                const hybridCoord = otherDir.map(d => d * correctMagnitude);
                if (!arraysEqual(hybridCoord, correctCoord) && hybridCoord.slice(0, 3).some(c => c !== 0)) {
                    combinations.push(hybridCoord);
                    combinations.push(hybridCoord); // Weight it twice
                }
            }
            
            // Error 3: Both wrong - different direction AND wrong magnitude
            // Example: Correct is "2 steps north", but answer is "1 step east"
            for (const otherDir of dirCoords) {
                if (arraysEqual(otherDir, correctDirection)) continue;
                
                const altMagnitudes = correctMagnitude > 1 ? [1, correctMagnitude + 1] : [2];
                for (const altMag of altMagnitudes) {
                    const wrongBothCoord = otherDir.map(d => d * altMag);
                    if (!arraysEqual(wrongBothCoord, correctCoord) && wrongBothCoord.slice(0, 3).some(c => c !== 0)) {
                        combinations.push(wrongBothCoord);
                    }
                }
            }
        }

        let backupPool = this.findUnused(combinations, correctCoord);
        backupPool.push(opposite);
        backupPool.push(opposite);
        
        if (combinations.length !== 0 && !oneOutOf(11)) {
            return combinations;
        } else {
            return backupPool;
        }
    }

    chooseIncorrectCoord(usedCoords, correctCoord, diffCoord, hardModeDimensions) {
        const incorrectCoords = this.createIncorrectConclusionCoords(usedCoords, correctCoord, diffCoord, hardModeDimensions);
        const picked = pickRandomItems(incorrectCoords, 1).picked[0];
        return picked;
    }
}
