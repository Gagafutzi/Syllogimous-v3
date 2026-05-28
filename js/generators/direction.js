function diffCoords(a, b) {
    return b.map((c, i) => c - a[i]);
}

function addCoords(a, b) {
    return a.map((c, i) => c + b[i]);
}

function normalize(a) {
    return a.map(c => c/Math.abs(c) || 0);
}

function inverse(a) {
    return a.map(c => -c);
}

function findDirection(a, b) {
    return normalize(diffCoords(a, b));
}

function getConclusionCoords(wordCoordMap, startWord, endWord) {
    const [start, end] = [wordCoordMap[startWord], wordCoordMap[endWord]];
    const diffCoord = diffCoords(start, end);
    const conclusionCoord = normalize(diffCoord);
    return [diffCoord, conclusionCoord];
}

// Modified coordinate system: [x, y, z, ...] represents actual position
// Direction statements now include both direction AND magnitude

function getDirectionAndDistance(fromCoord, toCoord) {
    const diff = diffCoords(fromCoord, toCoord);
    const direction = normalize(diff);
    const magnitude = Math.max(...diff.map(Math.abs)); // Chebyshev distance for diagonal clarity
    return { direction, magnitude, diff };
}

function taxicabDistance(a, b) {
    return a.map((v,i) => Math.abs(b[i] - v)).reduce((left,right) => left + right)
}

function pickWeightedRandomDirectionWithMagnitude(dirCoords, baseWord, neighbors, wordCoordMap, enableMagnitude = false) {
    const badTargets = (neighbors[baseWord] ?? []).map(word => wordCoordMap[word]);
    const base = wordCoordMap[baseWord];
    let pool = [];
    
    for (const dirCoord of dirCoords) {
        // Consider multiple distances along this direction
        const distances = enableMagnitude ? [1, 2] : [1]; // Allow 1 or 2 steps in a direction
        
        for (const dist of distances) {
            const scaledCoord = dirCoord.map(d => d * dist);
            const endLocation = addCoords(base, scaledCoord);
            
            const distanceToClosest = badTargets
                .map(badTarget => taxicabDistance(badTarget, endLocation))
                .reduce((a, b) => Math.min(a, b), 999);
            
            let weight = 1;
            if (distanceToClosest === 0) weight = 0.5; // Collision - avoid
            else if (distanceToClosest === 1) weight = 3; // Very close - prefer
            else if (distanceToClosest === 2) weight = 5; // Close - very prefer
            else if (distanceToClosest === 3) weight = 4; // Nearby
            else weight = 2; // Far
            
            // Prefer longer distances slightly (to enable overlapping)
            if (dist > 1) weight *= 1.3;
            
            for (let i = 0; i < weight; i++) {
                pool.push({
                    direction: dirCoord,
                    magnitude: dist,
                    scaledCoord: scaledCoord
                });
            }
        }
    }
    
    if (pool.length === 0) {
        // Fallback: just use unit directions
        return {
            direction: dirCoords[Math.floor(Math.random() * dirCoords.length)],
            magnitude: 1,
            scaledCoord: dirCoords[Math.floor(Math.random() * dirCoords.length)]
        };
    }
    
    const chosen = pickRandomItems(pool, 1).picked[0];
    return chosen;
}



class Direction2D {
    constructor(enableHardMode=true, enableAnchor=false) {
        this.enableHardMode = enableHardMode;
        this.enableAnchor = enableAnchor;
    }

    pickDirection(baseWord, neighbors, wordCoordMap) {
        return pickWeightedRandomDirection(dirCoords.slice(), baseWord, neighbors, wordCoordMap);
    }

    // REPLACE Direction2D.createDirectionStatement (lines 149-165)
createDirectionStatement(a, b, dirCoord, magnitude = null) {
    const direction = dirStringFromCoord(dirCoord);
    const reverseDirection = dirStringFromCoord(inverse(dirCoord));
    
    // Include magnitude if available (for quantified statements)
    const magnitudeText = magnitude ? ` ${magnitude} step${magnitude > 1 ? 's' : ''}` : '';
    const reverseMagnitudeText = magnitude ? ` ${magnitude} step${magnitude > 1 ? 's' : ''}` : '';
    
    return {
        start: b,
        end: a,
        relation: `is${magnitudeText} ${direction} of`,
        reverse: `is${reverseMagnitudeText} ${reverseDirection} of`,
        relationMinimal: dirStringMinimal(dirCoord),
        reverseMinimal: dirStringMinimal(inverse(dirCoord)),
    }
}

// ADD to Direction2D (add this new method)
pickDirectionWithMagnitude(baseWord, neighbors, wordCoordMap, enableMagnitude = false) {
    return pickWeightedRandomDirectionWithMagnitude(
        dirCoords.slice(),
        baseWord,
        neighbors,
        wordCoordMap,
        enableMagnitude
    );
}


    initialCoord() {
        return [0, 0];
    }

    getName() {
        if (this.enableAnchor) {
            return "Anchor Space"
        } else {
            return "Space Two D";
        }
    }

    hardModeAllowed() {
        return this.enableHardMode;
    }

    hardModeLevel() {
        return savedata.space2DHardModeLevel;
    }

    getCountdown() {
        if (this.enableAnchor) {
            return savedata.overrideAnchorSpaceTime;
        } else {
            return savedata.overrideDirectionTime;
        }
    }

    shouldUseAnchor() {
        return this.enableAnchor;
    }
}

class Direction3D {
    constructor(enableHardMode=true) {
        this.enableHardMode = enableHardMode;
    }

    pickDirection(baseWord, neighbors, wordCoordMap) {
        return pickWeightedRandomDirection(dirCoords3D, baseWord, neighbors, wordCoordMap);
    }

    createDirectionStatement(a, b, dirCoord, magnitude = null) {
    const direction = dirStringFromCoord(dirCoord);
    const reverseDirection = dirStringFromCoord(inverse(dirCoord));
    const magnitudeText = magnitude ? ` ${magnitude} step${magnitude > 1 ? 's' : ''}` : '';
    const reverseMagnitudeText = magnitude ? ` ${magnitude} step${magnitude > 1 ? 's' : ''}` : '';
    
    return {
        start: b,
        end: a,
        relation: `is${magnitudeText} ${direction} of`,
        reverse: `is${reverseMagnitudeText} ${reverseDirection} of`,
        relationMinimal: dirStringMinimal(dirCoord),
        reverseMinimal: dirStringMinimal(inverse(dirCoord)),
    }
}

// ADD to Direction3D
pickDirectionWithMagnitude(baseWord, neighbors, wordCoordMap, enableMagnitude = false) {
    return pickWeightedRandomDirectionWithMagnitude(
        dirCoords3D,
        baseWord,
        neighbors,
        wordCoordMap,
        enableMagnitude
    );
}

    initialCoord() {
        return [0, 0, 0];
    }

    getName() {
        return "Space Three D";
    }

    hardModeAllowed() {
        return this.enableHardMode;
    }

    hardModeLevel() {
        return savedata.space3DHardModeLevel;
    }

    getCountdown() {
        return savedata.overrideDirection3DTime;
    }

    shouldUseAnchor() {
        return false;
    }
}

class Direction4D {
    constructor(enableHardMode=true) {
        this.enableHardMode = enableHardMode;
    }

    pickDirection(baseWord, neighbors, wordCoordMap) {
        let dirCoord
        do {
            dirCoord = pickWeightedRandomDirection(dirCoords4D, baseWord, neighbors, wordCoordMap);
        } while (dirCoord.slice(0, 3).every(c => c === 0))
        return dirCoord
    }

    // REPLACE Direction4D.createDirectionStatement (lines 260-273)
createDirectionStatement(a, b, dirCoord, magnitude = null) {
    const direction = dirStringFromCoord(dirCoord);
    const reverseDirection = dirStringFromCoord(inverse(dirCoord));
    const timeName = timeMapping[dirCoord[3]];
    const reverseTimeName = reverseTimeNames[timeName];
    const magnitudeText = magnitude ? ` ${magnitude} step${magnitude > 1 ? 's' : ''}` : '';
    const reverseMagnitudeText = magnitude ? ` ${magnitude} step${magnitude > 1 ? 's' : ''}` : '';
    
    return {
        start: b,
        end: a,
        relation: `${timeName}${magnitudeText} ${direction} of`,
        reverse: `${reverseTimeName}${reverseMagnitudeText} ${reverseDirection} of`,
        relationMinimal: dirStringMinimal(dirCoord),
        reverseMinimal: dirStringMinimal(inverse(dirCoord)),
    }
}

// ADD to Direction4D
pickDirectionWithMagnitude(baseWord, neighbors, wordCoordMap, enableMagnitude = false) {
    return pickWeightedRandomDirectionWithMagnitude(
        dirCoords4D,
        baseWord,
        neighbors,
        wordCoordMap,
        enableMagnitude
    );
}

    initialCoord() {
        return [0, 0, 0, 0];
    }

    getName() {
        return "Space Time";
    }

    hardModeAllowed() {
        return this.enableHardMode;
    }

    hardModeLevel() {
        return savedata.space4DHardModeLevel;
    }

    getCountdown() {
        return savedata.overrideDirection4DTime;
    }

    shouldUseAnchor() {
        return false;
    }
}

function pickBaseWord(neighbors, branchesAllowed, bannedFromBranching=[]) {
    if (savedata.enableConnectionBranching === false) {
        branchesAllowed = false;
    }
    if (Object.values(neighbors).filter(list => list.length == 3).length >= 2) {
        branchesAllowed = false;
    }
    const options = Object.keys(neighbors);
    const neighborLimit = (!branchesAllowed || options.length <= 3) ? 1 : 2;
    let pool = [];
    for (const word of options) {
        if (neighbors[word] && neighbors[word].length > neighborLimit) {
            continue;
        }

        if (bannedFromBranching.includes(word) && neighbors[word].length > 1) {
            continue;
        }

        pool.push(word);
        pool.push(word);
        pool.push(word);
        if (neighbors[word] && neighbors[word].length == 1) {
            pool.push(word);
            pool.push(word);
            if (options.length >= 6) {
                pool.push(word);
                pool.push(word);
                pool.push(word);
                pool.push(word);
                pool.push(word);
            }
        }
    }
    const baseWord = pickRandomItems(pool, 1).picked[0];
    return baseWord;
}

class DirectionQuestion {
    constructor(directionGenerator) {
        this.generator = directionGenerator;
        this.pairChooser = new DirectionPairChooser();
        this.incorrectDirections = new IncorrectDirections();
    }

    create(length) {
        let startWord;
        let endWord;

        let conclusion;
        let conclusionCoord;
        let diffCoord;
        let [wordCoordMap, neighbors, premises, usedDirCoords] = [];
        let [numInterleaved, numTransforms] = this.getNumTransformsSplit(length);
        const branchesAllowed = Math.random() < 0.75;
        while (true) {
            if (this.generator.shouldUseAnchor()) {
                [wordCoordMap, neighbors, premises, usedDirCoords] = this.createWordMapAnchor(length, branchesAllowed);
            } else if (numInterleaved > 0) {
                [wordCoordMap, neighbors, premises, usedDirCoords] = this.createWordMapInterleaved(length);
            } else {
                [wordCoordMap, neighbors, premises, usedDirCoords] = this.createWordMap(length, branchesAllowed);
            }
            [startWord, endWord] = this.pairChooser.pickTwoDistantWords(neighbors);
            [diffCoord, conclusionCoord] = getConclusionCoords(wordCoordMap, startWord, endWord);
            if (conclusionCoord.slice(0, 3).some(c => c !== 0)) {
                break;
            }
        }

        let operations;
        let hardModeDimensions;
        if (numTransforms > 0) {
            [wordCoordMap, operations, hardModeDimensions] = new SpaceHardMode(numTransforms).basicHardMode(wordCoordMap, startWord, endWord, conclusionCoord);
            [diffCoord, conclusionCoord] = getConclusionCoords(wordCoordMap, startWord, endWord);
            if (numInterleaved > 0) {
                premises.push(...operations);
                operations = [];
                hardModeDimensions = conclusionCoord.map((d,i) => i);
            }
        }

        let isValid;
        if (coinFlip()) { // correct
            isValid = true;
            conclusion = this.generator.createDirectionStatement(startWord, endWord, conclusionCoord);
        }
        else {            // wrong
            isValid = false;
            const incorrectCoord = this.incorrectDirections.chooseIncorrectCoord(usedDirCoords, conclusionCoord, diffCoord, hardModeDimensions);
            conclusion = this.generator.createDirectionStatement(startWord, endWord, incorrectCoord);
        }

        if (numInterleaved === 0) {
            premises = scramble(premises);
        }
        premises = premises.map(p => createPremiseHTML(p));
        conclusion = createBasicPremiseHTML(conclusion);
        const countdown = this.generator.getCountdown();
        const totalTransforms = this.getNumTransformsSplit(length).reduce((a, b) => a + b, 0);
        let modifiers = [];
        if (totalTransforms > 0) {
            modifiers.push(`op${totalTransforms}`);
        }
        if (numInterleaved > 0) {
            modifiers.push(`interleave`);
        }
        return {
            category: this.generator.getName(),
            type: normalizeString(this.generator.getName()),
            ...((totalTransforms > 0 || savedata.widePremises) && { plen: length }),
            modifiers,
            startedAt: new Date().getTime(),
            wordCoordMap,
            isValid,
            premises,
            operations,
            conclusion,
            ...(countdown && { countdown }),
        }
    }

    createAnalogy(length) {
        let isValid;
        let isValidSame;
        let [wordCoordMap, neighbors, premises, usedDirCoords, operations] = [];
        let [a, b, c, d] = [];
        let [numInterleaved, numTransforms] = this.getNumTransformsSplit(length);
        const branchesAllowed = Math.random() > 0.2;
        const flip = coinFlip();
        while (flip !== isValidSame) {
            if (this.generator.shouldUseAnchor()) {
                [wordCoordMap, neighbors, premises, usedDirCoords] = this.createWordMapAnchor(length, branchesAllowed);
            } else if (numInterleaved > 0) {
                [wordCoordMap, neighbors, premises, usedDirCoords] = this.createWordMapInterleaved(length);
            } else {
                [wordCoordMap, neighbors, premises, usedDirCoords] = this.createWordMap(length, branchesAllowed);
            }
            [a, b, c, d] = pickRandomItems(Object.keys(wordCoordMap), 4).picked;
            if (numTransforms > 0) {
                const [startWord, endWord] = pickRandomItems([a, b, c, d], 2).picked;
                const [diffCoord, conclusionCoord] = getConclusionCoords(wordCoordMap, startWord, endWord);
                let _x;
                [wordCoordMap, operations, _x] = new SpaceHardMode(numTransforms).basicHardMode(wordCoordMap, startWord, endWord, conclusionCoord);
                if (numInterleaved > 0) {
                    premises.push(...operations);
                    operations = [];
                }
            }
            isValidSame = arraysEqual(findDirection(wordCoordMap[a], wordCoordMap[b]), findDirection(wordCoordMap[c], wordCoordMap[d]));
        }
        let conclusion = analogyTo(a, b);
        if (coinFlip()) {
            conclusion += pickAnalogyStatementSame();
            isValid = isValidSame;
        } else {
            conclusion += pickAnalogyStatementDifferent();
            isValid = !isValidSame;
        }
        conclusion += analogyTo(c, d);

        premises = premises.map(p => createPremiseHTML(p));
        const countdown = this.generator.getCountdown();
        const totalTransforms = this.getNumTransformsSplit(length).reduce((a, b) => a + b, 0);
        let modifiers = [];
        if (totalTransforms > 0) {
            modifiers.push(`op${totalTransforms}`);
        }
        if (numInterleaved > 0) {
            modifiers.push(`interleave`);
        }
        return {
            category: 'Analogy: ' + this.generator.getName(),
            type: normalizeString(this.generator.getName()),
            modifiers,
            startedAt: new Date().getTime(),
            wordCoordMap,
            isValid,
            premises,
            ...(savedata.widePremises && { plen: length }),
            operations,
            conclusion,
            ...(countdown && { countdown }),
        }
    }

    getNumTransformsSplit(numPremises) {
        const totalTransforms = this.generator.hardModeLevel();
        if (!this.generator.hardModeAllowed() || totalTransforms === 0) {
            return [0, 0];
        }

        if (!savedata.enableTransformInterleave) {
            return [0, totalTransforms];
        }
        let interleaveCount = Math.max(0, Math.min(totalTransforms - 1, numPremises - 1));
        return [interleaveCount, totalTransforms - interleaveCount];
    }

    createWordMapCommands(length) {
        const words = createStimuli(length + 1);
        let commands = words.map(w => ['move', w]);
        let [interleaveCount, _] = this.getNumTransformsSplit(length);
        if (interleaveCount === 0) {
            return [words, commands];
        }

        let transformCommands = []
        for (let i = 0; i < interleaveCount; i++) {
            transformCommands.push(['transform']);
        }
        let tailCommands = commands.slice(1, commands.length);
        let merged = frontHeavyIntervalMerge(tailCommands, transformCommands);
        merged.unshift(commands[0]);

        return [words, merged];
    }

    createWordMapInterleaved(length) {
        let [words, commands] = this.createWordMapCommands(length);
        const initialCoord = this.generator.initialCoord();
        let wordCoordMap = {[words[0]]: initialCoord };
        let neighbors = {[words[0]]: []};
        let premiseChunks = [[]];
        let operations = [];
        let usedDirCoords = [];

        let lastWord = words[0];
        let dimensionPool = repeatArrayUntil(shuffle(initialCoord.map((d, i) => i)), commands.length * 2);
        let dimensionIndex = 0;
        for (let i = 1; i < commands.length; i++) {
            let command = commands[i];
            let action = command[0];
            if (action === 'transform') {
                if (premiseChunks[premiseChunks.length - 1].length !== 0) {
                    premiseChunks.push([]);
                }
                let [newWordMap, operation] = new SpaceHardMode(0).oneTransform(wordCoordMap, lastWord, dimensionPool[dimensionIndex], dimensionPool[dimensionIndex+1]);
                dimensionIndex++;
                wordCoordMap = newWordMap;
                operations.push(operation);
            } else {
                const baseWord = lastWord;
                const nextWord = command[1];
                const dirCoord = this.generator.pickDirection(baseWord, neighbors, wordCoordMap);
                wordCoordMap[nextWord] = addCoords(wordCoordMap[baseWord], dirCoord);
                const premise = this.generator.createDirectionStatement(baseWord, nextWord, dirCoord);
                premiseChunks[premiseChunks.length - 1].push(premise);
                usedDirCoords.push(dirCoord);
                neighbors[baseWord] = neighbors[baseWord] ?? [];
                neighbors[baseWord].push(nextWord);
                neighbors[nextWord] = neighbors[nextWord] ?? [];
                neighbors[nextWord].push(baseWord);
                lastWord = nextWord;
            }
        }

        if (premiseChunks[premiseChunks.length - 1].length === 0) {
            premiseChunks.pop();
        }

        let divisions = words.length - 2;
        let unbreakableDivisions = Math.round((100 - savedata.scrambleFactor) * divisions / 100);
        premiseChunks = premiseChunks.map(chunk => {
            let chosenDivisions = Math.min(unbreakableDivisions, chunk.length - 1);
            unbreakableDivisions -= chosenDivisions;
            return scrambleWithLimit(chunk, chosenDivisions);
        });

        let merged = interleaveArrays(premiseChunks, operations);
        let premises = merged.flatMap(p => {
            if (Array.isArray(p)) {
                return p;
            } else {
                return [p];
            }
        });

        return [wordCoordMap, neighbors, premises, usedDirCoords];
    }

    createWordMap(length, branchesAllowed) {
        const baseWords = createStimuli(length + 1);
        const start = baseWords[0];
        const words = baseWords.slice(1, baseWords.length);
        let wordCoordMap = {[start]: this.generator.initialCoord() };
        let neighbors = {[start]: []};
        return this.buildOntoWordMap(words, wordCoordMap, neighbors, branchesAllowed);
    }

    createWordMapAnchor(length, branchesAllowed) {
        const star = '[svg]0[/svg]';
        const circle = '[svg]1[/svg]';
        const triangle = '[svg]2[/svg]';
        const heart = '[svg]3[/svg]';

        let result;
        for (let i = 0; i < 10; i++) {
            const words = createStimuli(length, [star, circle, triangle, heart]);
            let wordCoordMap = {
                [star]: [0, 1],
                [circle]: [1, 0],
                [triangle]: [-1, 0],
                [heart]: [0, -1],
            };

            let starters = [star, circle, triangle, heart];
            shuffle(starters);
            const bannedFromBranching = [starters[1], starters[2], starters[3]];
            let neighbors;
            if (branchesAllowed) {
                neighbors = {
                    [starters[0]]: [starters[1], starters[2], starters[3]],
                    [starters[1]]: [starters[0]],
                    [starters[2]]: [starters[0]],
                    [starters[3]]: [starters[0]],
                };
            } else {
                neighbors = {
                    [starters[0]]: [starters[1], starters[2]],
                    [starters[1]]: [starters[0], starters[3]],
                    [starters[2]]: [starters[0]],
                    [starters[3]]: [starters[0], starters[1]],
                };
            }

            result = this.buildOntoWordMap(words, wordCoordMap, neighbors, branchesAllowed, bannedFromBranching);
            const anchorConnections = starters.map(s => neighbors[s].length).reduce((a, b) => a + b, 0);
            if (anchorConnections >= 8) {
                break;
            }
        }
        return result;
    }

buildOntoWordMap(words, wordCoordMap, neighbors, branchesAllowed, bannedFromBranching=[], enableMagnitude=false) {
    let premiseMap = {};
    let usedDirCoords = [];

    for (const nextWord of words) {
        const baseWord = pickBaseWord(neighbors, branchesAllowed, bannedFromBranching);
        
        // Get direction with optional magnitude
        const chosen = enableMagnitude 
            ? this.generator.pickDirectionWithMagnitude(baseWord, neighbors, wordCoordMap, true)
            : { 
                direction: this.generator.pickDirection(baseWord, neighbors, wordCoordMap),
                magnitude: null,
                scaledCoord: this.generator.pickDirection(baseWord, neighbors, wordCoordMap)
              };
        
        wordCoordMap[nextWord] = addCoords(wordCoordMap[baseWord], chosen.scaledCoord);
        
        premiseMap[premiseKey(baseWord, nextWord)] = this.generator.createDirectionStatement(
            baseWord, 
            nextWord, 
            chosen.direction,
            chosen.magnitude
        );
        
        usedDirCoords.push({
            direction: chosen.direction,
            magnitude: chosen.magnitude,
            scaledCoord: chosen.scaledCoord
        });
        
        neighbors[baseWord] = neighbors[baseWord] ?? [];
        neighbors[baseWord].push(nextWord);
        neighbors[nextWord] = neighbors[nextWord] ?? [];
        neighbors[nextWord].push(baseWord);
    }

    let premises = orderPremises(premiseMap, neighbors);
    if (savedata.widePremises) {
        premises = createWidePremises(premises, premiseMap);
    }

    return [wordCoordMap, neighbors, premises, usedDirCoords];
}

function createDirectionGenerator(length) {
    return {
        question: new DirectionQuestion(new Direction2D()),
        premiseCount: getPremisesFor('overrideDirectionPremises', length),
        weight: savedata.overrideDirectionWeight,
        enableMagnitude: savedata.enableDistanceMagnitude ?? false, // New setting
    };
}

function createDirection3DGenerator(length) {
    return {
        question: new DirectionQuestion(new Direction3D()),
        premiseCount: getPremisesFor('overrideDirection3DPremises', length),
        weight: savedata.overrideDirection3DWeight,
        enableMagnitude: savedata.enableDistanceMagnitude ?? false, // New setting
    };
}

function createDirection4DGenerator(length) {
    return {
        question: new DirectionQuestion(new Direction4D()),
        premiseCount: getPremisesFor('overrideDirection4DPremises', length),
        weight: savedata.overrideDirection4DWeight,
        enableMagnitude: savedata.enableDistanceMagnitude ?? false, // New setting
    };
}

function createAnchorSpaceGenerator(length) {
    return {
        question: new DirectionQuestion(new Direction2D(false, true)),
        premiseCount: getPremisesFor('overrideAnchorSpacePremises', length),
        weight: savedata.overrideAnchorSpaceWeight,
        enableMagnitude: savedata.enableDistanceMagnitude ?? false, // New setting
    };
}
