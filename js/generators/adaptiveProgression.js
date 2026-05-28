// Add to direction.js or new file: adaptiveProgression.js

class AdaptiveModProgression {
    constructor() {
        this.modeUnlocks = {
            'Space2D': { minAccuracy: 0, minSession: 0 },
            'Space3D': { minAccuracy: 85, minSession: 50 },
            'SpaceTime': { minAccuracy: 90, minSession: 100 },
            'Space2D-Transforms': { minAccuracy: 80, minSession: 30 },
            'Space3D-Transforms': { minAccuracy: 85, minSession: 60 },
        };
    }

    getAvailableModes(stats) {
        const sessionQuestions = stats.sessionCount;
        const accuracy = stats.correctCount / Math.max(1, stats.sessionCount);
        
        return Object.entries(this.modeUnlocks)
            .filter(([mode, requirements]) => 
                accuracy >= requirements.minAccuracy &&
                sessionQuestions >= requirements.minSession
            )
            .map(([mode]) => mode);
    }

    getNextChallenge(stats) {
        // Suggest mode to unlock next
        const allModes = Object.keys(this.modeUnlocks);
        const available = this.getAvailableModes(stats);
        const locked = allModes.filter(m => !available.includes(m));
        
        if (locked.length === 0) return null;
        
        // Return the easiest locked mode
        return locked.reduce((a, b) => 
            this.modeUnlocks[a].minAccuracy < this.modeUnlocks[b].minAccuracy ? a : b
        );
    }
}
