/**
 * GAME STATE MANAGER
 * 
 * Clean accessor for global game state instead of directly accessing window.
 * This centralizes all global references and makes them easier to test/debug.
 */

var GameState = {
    
    /**
     * Get or initialize reputation system
     */
    getReputation: function() {
        if (!window.GAME_REPUTATION) {
            window.GAME_REPUTATION = initGameReputation();
        }
        return window.GAME_REPUTATION;
    },
    
    /**
     * Initialize reputation system
     */
    initReputation: function() {
        return initGameReputation();
    },
    
    /**
     * Reset reputation
     */
    resetReputation: function() {
        window.GAME_REPUTATION = null;
        return this.initReputation();
    },
    
    /**
     * Get or initialize governance system
     */
    getGovernance: function() {
        if (!window.GAME_GOVERNANCE) {
            window.GAME_GOVERNANCE = initGameGovernance();
        }
        return window.GAME_GOVERNANCE;
    },
    
    /**
     * Initialize governance system
     */
    initGovernance: function() {
        return initGameGovernance();
    },
    
    /**
     * Reset governance
     */
    resetGovernance: function() {
        window.GAME_GOVERNANCE = null;
        return this.initGovernance();
    },
    
    /**
     * Get PD (Prisoner's Dilemma) game instance
     */
    getPD: function() {
        return window.PD || null;
    },
    
    /**
     * Get current game round/session data
     */
    getCurrentSession: function() {
        return window.CURRENT_SESSION || {};
    },
    
    /**
     * Reset entire game state
     */
    resetAll: function() {
        console.log("[GameState] Resetting all game state");
        window.GAME_REPUTATION = null;
        window.GAME_GOVERNANCE = null;
        window.CURRENT_SESSION = {};
        return {
            reputation: this.initReputation(),
            governance: this.initGovernance()
        };
    },
    
    /**
     * Get game state snapshot (for logging/debugging)
     */
    getSnapshot: function() {
        var rep = window.GAME_REPUTATION;
        var gov = window.GAME_GOVERNANCE;
        
        return {
            reputation: rep ? {
                address: rep.address,
                cooperativeMoves: rep.cooperativeMoves,
                totalMoves: rep.totalMoves,
                score: rep.calculateScore(),
                tier: rep.getReputationTier().label,
                votingPower: rep.getVotingPower()
            } : null,
            governance: gov ? {
                votingRound: gov.votingRound,
                totalProposals: gov.proposals.length,
                executedProposals: gov.executedProposals.length,
                payoffMatrix: gov.currentPayoffMatrix
            } : null
        };
    }
};

// Expose for debugging in console
if (window.console) {
    window._gameState = GameState.getSnapshot;
}
