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
}

/**
 * Record a single move in game history
 * @param {boolean} isCooperative - true if player cooperated, false if defected
 */
GameReputation.prototype.recordMove = function(isCooperative) {
    this.totalMoves++;
    if (isCooperative) {
        this.cooperativeMoves++;
    }
    
    this.history.push({
        round: this.totalMoves - 1,
        cooperative: isCooperative,
        timestamp: Date.now()
    });
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
 * Trusted:   75-100% cooperativeness
 * Neutral:   50-74%
 * Suspicious: <50%
 * 
 * @returns {object} Tier info with label and CSS class
 */
GameReputation.prototype.getReputationTier = function() {
    const score = this.calculateScore();
    
    if (score >= 75) {
        return {
            label: 'Trusted',
            cssClass: 'reputation-trusted',
            score: score,
            votingMultiplier: 1.5 // Trusted players get 1.5x voting weight
        };
    } else if (score >= 50) {
        return {
            label: 'Neutral',
            cssClass: 'reputation-neutral',
            score: score,
            votingMultiplier: 1.0
        };
    } else {
        return {
            label: 'Suspicious',
            cssClass: 'reputation-suspicious',
            score: score,
            votingMultiplier: 0.5 // Suspicious players get reduced voting weight
        };
    }
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
