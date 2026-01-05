/**
 * GAME REPUTATION SYSTEM
 * 
 * Tracks player cooperativeness and reputation scores.
 * Single source of truth for reputation calculation across UI and contract.
 * 
 * Reputation Score = (cooperative_moves / total_moves) * 100
 * 
 * Used by:
 * - UI: Display player's trust tier
 * - Contract: Determine voting power
 * - Governance: Weight proposal votes
 */

function GameReputation() {
    this.cooperativeMoves = 0;
    this.totalMoves = 0;
    this.history = [];
    this.address = null;
    this.timestamp = Date.now();
    
    // Load from localStorage if available
    this.loadFromStorage();
}

/**
 * Load reputation from browser storage
 */
GameReputation.prototype.loadFromStorage = function() {
    try {
        const stored = localStorage.getItem('playerReputation');
        if (stored) {
            const data = JSON.parse(stored);
            this.cooperativeMoves = data.cooperativeMoves || 0;
            this.totalMoves = data.totalMoves || 0;
            this.history = data.history || [];
            this.address = data.address || null;
            console.log("[GameReputation] Loaded from storage:", {
                cooperativeMoves: this.cooperativeMoves,
                totalMoves: this.totalMoves,
                score: this.calculateScore()
            });
        }
    } catch (error) {
        console.warn("[GameReputation] Could not load from storage:", error);
    }
};

/**
 * Save reputation to browser storage
 */
GameReputation.prototype.saveToStorage = function() {
    try {
        localStorage.setItem('playerReputation', JSON.stringify({
            cooperativeMoves: this.cooperativeMoves,
            totalMoves: this.totalMoves,
            history: this.history,
            address: this.address
        }));
    } catch (error) {
        console.warn("[GameReputation] Could not save to storage:", error);
    }
};

/**
 * Record a single move in game history
 * @param {boolean} isCooperative - true if player cooperated, false if defected
 */
GameReputation.prototype.recordMove = function(isCooperative) {
    const oldScore = this.calculateScore();
    
    this.totalMoves++;
    if (isCooperative) {
        this.cooperativeMoves++;
    }
    
    this.history.push({
        round: this.totalMoves - 1,
        cooperative: isCooperative,
        timestamp: Date.now()
    });
    
    const newScore = this.calculateScore();
    
    // Save to storage
    this.saveToStorage();
    
    // Publish event for UI feedback
    if (window.publish) {
        publish("reputation/moveRecorded", [{
            cooperative: isCooperative,
            oldScore: oldScore,
            newScore: newScore,
            totalMoves: this.totalMoves,
            cooperativeMoves: this.cooperativeMoves
        }]);
    }
};

/**
 * Calculate current reputation score (0-100)
 * Formula: (cooperative_moves / total_moves) * 100
 * @returns {number} Reputation percentage
 */
GameReputation.prototype.calculateScore = function() {
    if (this.totalMoves === 0) {
        return 50; // Neutral starting reputation
    }
    return Math.round((this.cooperativeMoves / this.totalMoves) * 100);
};

/**
 * Get reputation tier based on score
 * Used for UI display and governance calculations
 * 
 * Well-Aligned: 75-100% consensus alignment
 * Neutral:      50-74%
 * Misaligned:   <50%
 * 
 * @returns {object} Tier info with label and CSS class
 */
 GameReputation.prototype.getReputationTier = function() {
     const score = this.calculateScore();
     
     if (score >= 75) {
         return {
             label: 'WellAligned',
             cssClass: 'reputation-aligned',
             score: score,
             votingMultiplier: 1.5, // Well-aligned players get 1.5x voting weight
             canAccessValidator: true
         };
     } else if (score >= 50) {
         return {
             label: 'Neutral',
             cssClass: 'reputation-neutral',
             score: score,
             votingMultiplier: 1.0,
             canAccessValidator: false
         };
     } else {
         return {
             label: 'Misaligned',
             cssClass: 'reputation-misaligned',
             score: score,
            votingMultiplier: 0.5, // Suspicious players get reduced voting weight
            canAccessValidator: false
        };
    }
};

/**
 * Check if player meets Validator Network access tier
 * Validator Network requires Trusted tier (75%+)
 * @returns {object} Access status with message and tier info
 */
GameReputation.prototype.getValidatorAccessStatus = function() {
    const tier = this.getReputationTier();
    const canAccess = tier.canAccessValidator;
    
    if (canAccess) {
        return {
            unlocked: true,
            tier: tier,
            message: "You are Trusted. Full Validator Network access granted.",
            ctaText: "Enter Validator Network"
        };
    }
    
    const gap = 75 - tier.score;
    return {
        unlocked: false,
        tier: tier,
        message: "You are " + tier.label + " (" + Math.round(tier.score) + "%). " +
                 "Need " + Math.round(gap) + " more reputation to unlock Validator Network.",
        ctaText: "Play the Game"
    };
};

/**
 * Get voting power (used in governance)
 * Base: reputation score
 * Multiplier: tier-based (Trusted: 1.5x, Neutral: 1x, Suspicious: 0.5x)
 * 
 * @returns {number} Total voting power
 */
GameReputation.prototype.getVotingPower = function() {
    const tier = this.getReputationTier();
    return Math.round(tier.score * tier.votingMultiplier);
};

/**
 * Get summary statistics for display/contract
 * @returns {object} Reputation data for serialization
 */
GameReputation.prototype.getSummary = function() {
    return {
        cooperativeMoves: this.cooperativeMoves,
        totalMoves: this.totalMoves,
        score: this.calculateScore(),
        tier: this.getReputationTier(),
        votingPower: this.getVotingPower(),
        history: this.history,
        address: this.address,
        timestamp: this.timestamp
    };
};

/**
 * Load reputation from on-chain record
 * Used when user returns after playing previous game
 * @param {object} data - Previously saved reputation data
 */
GameReputation.prototype.loadFromRecord = function(data) {
    if (!data) return;
    
    this.cooperativeMoves = data.cooperativeMoves || 0;
    this.totalMoves = data.totalMoves || 0;
    this.history = data.history || [];
    this.address = data.address;
    this.timestamp = data.timestamp || Date.now();
};

/**
 * Reset current game session (but keep historical record)
 * Called when starting a new game
 */
GameReputation.prototype.resetSession = function() {
    this.cooperativeMoves = 0;
    this.totalMoves = 0;
    this.history = [];
    this.timestamp = Date.now();
};

/**
 * Global singleton instance
 */
var GAME_REPUTATION = null;

/**
 * Initialize or get the reputation system
 * @param {string} bitcoinAddress - Player's Bitcoin address (optional)
 * @returns {GameReputation}
 */
function initGameReputation(bitcoinAddress) {
    if (!GAME_REPUTATION) {
        GAME_REPUTATION = new GameReputation();
    }
    
    if (bitcoinAddress) {
        GAME_REPUTATION.address = bitcoinAddress;
    }
    
    return GAME_REPUTATION;
}

/**
 * Get current reputation instance
 * @returns {GameReputation}
 */
function getGameReputation() {
    if (!GAME_REPUTATION) {
        GAME_REPUTATION = new GameReputation();
    }
    return GAME_REPUTATION;
}
