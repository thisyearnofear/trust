/**
 * GAME GOVERNANCE SYSTEM
 * 
 * Manages player-driven governance of game rules through voting.
 * Proposals modify payoff matrices based on community consensus.
 * 
 * Flow:
 * 1. Player completes game round(s), earns reputation
 * 2. Governance proposals are available for voting
 * 3. Player casts vote weighted by reputation tier
 * 4. Proposal tallying happens automatically
 * 5. Winning proposal applies to next game round
 */

function GameGovernance() {
    this.proposals = [];
    this.votes = {}; // { proposalId: { playerId: { vote: 'yes'/'no'/'abstain', power: 120 } } }
    this.currentPayoffMatrix = null;
    this.executedProposals = [];
    this.votingRound = 0;
}

/**
 * Initialize governance with default proposals
 * These proposals modify the payoff matrix for the next game round
 */
GameGovernance.prototype.init = function() {
    this.currentPayoffMatrix = this.getDefaultPayoffMatrix();
    this.createDefaultProposals();
    console.log("[GameGovernance] Initialized with", this.proposals.length, "proposals");
};

/**
 * Get default payoff matrix (from PD.js)
 * Format: { R, T, S, P }
 */
GameGovernance.prototype.getDefaultPayoffMatrix = function() {
    if (window.PD && window.PD.PAYOFFS) {
        return {
            R: window.PD.PAYOFFS.R, // Mutual cooperation
            T: window.PD.PAYOFFS.T, // Temptation to defect
            S: window.PD.PAYOFFS.S, // Sucker's payoff
            P: window.PD.PAYOFFS.P  // Mutual defection
        };
    }
    // Fallback defaults
    return { R: 3, T: 5, S: 0, P: 1 };
};

/**
 * Create default governance proposals
 * Each proposal modifies one aspect of the payoff matrix
 */
GameGovernance.prototype.createDefaultProposals = function() {
    const currentMatrix = this.currentPayoffMatrix;
    
    this.proposals = [
        {
            id: 1,
            title: "Increase Cooperation Reward (R)",
            description: `Increase mutual cooperation payoff from ${currentMatrix.R} to ${currentMatrix.R + 1}. Encourages trust.`,
            type: "payoff_modify",
            target: "R",
            newValue: currentMatrix.R + 1,
            impact: "Cooperation becomes more rewarding. Players encouraged to be trustworthy.",
            voting_open: true,
            yes_voting_power: 0,
            no_voting_power: 0,
            abstain_voting_power: 0,
            has_passed: false,
            executed: false,
            is_voting_open: true
        },
        {
            id: 2,
            title: "Reduce Temptation to Defect (T)",
            description: `Reduce defection advantage from ${currentMatrix.T} to ${currentMatrix.T - 1}. Discourages exploitation.`,
            type: "payoff_modify",
            target: "T",
            newValue: currentMatrix.T - 1,
            impact: "Defection becomes less profitable. Reduces incentive to cheat.",
            voting_open: true,
            yes_voting_power: 0,
            no_voting_power: 0,
            abstain_voting_power: 0,
            has_passed: false,
            executed: false,
            is_voting_open: true
        },
        {
            id: 3,
            title: "Keep Status Quo",
            description: "Maintain current payoff matrix. No changes to game parameters.",
            type: "no_change",
            target: null,
            newValue: null,
            impact: "Game rules remain unchanged.",
            voting_open: true,
            yes_voting_power: 0,
            no_voting_power: 0,
            abstain_voting_power: 0,
            has_passed: false,
            executed: false,
            is_voting_open: true
        }
    ];
};

/**
 * Cast a vote on a proposal
 * @param {number} proposalId - Proposal to vote on
 * @param {string} playerId - Player voting (Bitcoin address or username)
 * @param {string} vote - 'yes', 'no', or 'abstain'
 * @param {number} votingPower - Weighted voting power from reputation
 */
GameGovernance.prototype.castVote = function(proposalId, playerId, vote, votingPower) {
    // Validate
    if (!['yes', 'no', 'abstain'].includes(vote)) {
        throw new Error("Invalid vote: must be 'yes', 'no', or 'abstain'");
    }
    
    const proposal = this.proposals.find(p => p.id === proposalId);
    if (!proposal) {
        throw new Error(`Proposal ${proposalId} not found`);
    }
    
    // Check if voting is open
    if (!proposal.is_voting_open) {
        throw new Error(`Voting closed for proposal ${proposalId}`);
    }
    
    // Check if player already voted
    if (!this.votes[proposalId]) {
        this.votes[proposalId] = {};
    }
    
    if (this.votes[proposalId][playerId]) {
        throw new Error(`Player ${playerId} already voted on proposal ${proposalId}`);
    }
    
    // Record vote
    this.votes[proposalId][playerId] = {
        vote: vote,
        power: votingPower,
        timestamp: Date.now()
    };
    
    // Update proposal tally
    proposal[vote + '_voting_power'] = (proposal[vote + '_voting_power'] || 0) + votingPower;
    
    console.log(`[GameGovernance] Vote recorded: Proposal #${proposalId}, Player ${playerId}, Vote: ${vote}, Power: ${votingPower}`);
    
    // Publish event
    if (window.publish) {
        publish('governance/vote_cast', [{
            proposalId: proposalId,
            playerId: playerId,
            vote: vote,
            votingPower: votingPower
        }]);
    }
};

/**
 * Tally votes and determine if proposal passes
 * Requirement: Yes votes > No votes (simple majority)
 * @param {number} proposalId - Proposal to tally
 */
GameGovernance.prototype.tallyVotes = function(proposalId) {
    const proposal = this.proposals.find(p => p.id === proposalId);
    if (!proposal) {
        throw new Error(`Proposal ${proposalId} not found`);
    }
    
    // Close voting
    proposal.is_voting_open = false;
    proposal.voting_open = false;
    
    // Determine if passed (yes > no)
    const yesVotes = proposal.yes_voting_power || 0;
    const noVotes = proposal.no_voting_power || 0;
    
    proposal.has_passed = yesVotes > noVotes;
    
    console.log(`[GameGovernance] Proposal #${proposalId} tallied: ${yesVotes} yes vs ${noVotes} no → ${proposal.has_passed ? 'PASSED' : 'REJECTED'}`);
    
    return proposal.has_passed;
};

/**
 * Execute a passed proposal (modify payoff matrix)
 * @param {number} proposalId - Proposal to execute
 */
GameGovernance.prototype.executeProposal = function(proposalId) {
    const proposal = this.proposals.find(p => p.id === proposalId);
    if (!proposal) {
        throw new Error(`Proposal ${proposalId} not found`);
    }
    
    if (!proposal.has_passed) {
        throw new Error(`Proposal ${proposalId} did not pass, cannot execute`);
    }
    
    if (proposal.type === 'payoff_modify') {
        // Apply payoff change
        this.currentPayoffMatrix[proposal.target] = proposal.newValue;
        
        // Update game state if available
        if (window.PD && window.PD.PAYOFFS) {
            window.PD.PAYOFFS[proposal.target] = proposal.newValue;
        }
        
        console.log(`[GameGovernance] Proposal #${proposalId} executed: ${proposal.target} = ${proposal.newValue}`);
    }
    
    proposal.executed = true;
    this.executedProposals.push(proposal);
    
    // Publish event
    if (window.publish) {
        publish('governance/proposal_executed', [{
            proposalId: proposalId,
            proposal: proposal,
            newPayoffMatrix: this.currentPayoffMatrix
        }]);
    }
};

/**
 * Get all active proposals
 */
GameGovernance.prototype.getActiveProposals = function() {
    return this.proposals.filter(p => !p.executed);
};

/**
 * Get proposal by ID
 */
GameGovernance.prototype.getProposal = function(proposalId) {
    return this.proposals.find(p => p.id === proposalId);
};

/**
 * Get player's vote on a proposal
 */
GameGovernance.prototype.getPlayerVote = function(proposalId, playerId) {
    if (!this.votes[proposalId]) {
        return null;
    }
    return this.votes[proposalId][playerId] || null;
};

/**
 * Close voting and tally all proposals
 * Only one proposal can pass (the one with most yes votes)
 */
GameGovernance.prototype.closeVotingRound = function() {
    let winningProposal = null;
    let maxYesVotes = 0;
    
    // Tally all proposals
    for (const proposal of this.proposals) {
        if (proposal.executed) continue; // Skip already executed
        
        this.tallyVotes(proposal.id);
        
        // Track which has most yes votes
        if (proposal.has_passed && proposal.yes_voting_power > maxYesVotes) {
            maxYesVotes = proposal.yes_voting_power;
            winningProposal = proposal;
        }
    }
    
    // Execute winning proposal if one exists
    if (winningProposal) {
        this.executeProposal(winningProposal.id);
    }
    
    this.votingRound++;
    
    console.log(`[GameGovernance] Voting round ${this.votingRound} closed. Winner:`, winningProposal?.id);
    
    return winningProposal;
};

/**
 * Get current payoff matrix
 */
GameGovernance.prototype.getPayoffMatrix = function() {
    return this.currentPayoffMatrix;
};

/**
 * Reset for next voting round (but keep executed proposals)
 * Create new proposals based on current payoff matrix
 */
GameGovernance.prototype.nextRound = function() {
    this.proposals = this.proposals.filter(p => !p.executed);
    
    // Reset voting data for remaining proposals
    for (const proposal of this.proposals) {
        proposal.yes_voting_power = 0;
        proposal.no_voting_power = 0;
        proposal.abstain_voting_power = 0;
        proposal.is_voting_open = true;
        proposal.voting_open = true;
    }
    
    this.votes = {};
    
    console.log(`[GameGovernance] Next voting round started`);
};

/**
 * Get governance summary for display
 */
GameGovernance.prototype.getSummary = function() {
    return {
        votingRound: this.votingRound,
        activeProposals: this.getActiveProposals(),
        executedProposals: this.executedProposals,
        currentPayoffMatrix: this.currentPayoffMatrix,
        votes: this.votes
    };
};

// Global singleton instance
var GAME_GOVERNANCE = null;

/**
 * Initialize or get the governance system
 */
function initGameGovernance() {
    if (!GAME_GOVERNANCE) {
        GAME_GOVERNANCE = new GameGovernance();
        GAME_GOVERNANCE.init();
    }
    return GAME_GOVERNANCE;
}

/**
 * Get current governance instance
 */
function getGameGovernance() {
    if (!GAME_GOVERNANCE) {
        GAME_GOVERNANCE = initGameGovernance();
    }
    return GAME_GOVERNANCE;
}

// Make available globally
window.GameGovernance = GameGovernance;
window.initGameGovernance = initGameGovernance;
window.getGameGovernance = getGameGovernance;

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        GameGovernance,
        initGameGovernance,
        getGameGovernance
    };
}
