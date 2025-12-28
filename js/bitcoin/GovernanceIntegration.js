/**
 * GOVERNANCE INTEGRATION
 * 
 * Bridges the game flow with governance voting.
 * Makes voting feel like a natural continuation of gameplay, not a separate feature.
 * 
 * Flow: Play game → Earn reputation → See your tier → Vote on proposals → See impact
 */

var GovernanceIntegration = {};

/**
 * After each round, show mini reputation feedback
 */
GovernanceIntegration.showRoundFeedback = function() {
    const reputation = getGameReputation();
    const feedback = getReputationFeedback();
    
    feedback.updateLiveMatch();
};

/**
 * After game completes, prepare for governance voting
 * Called by Bootstrap.js when game ends
 */
GovernanceIntegration.prepareGovernancePhase = function() {
    const reputation = getGameReputation();
    const governance = getGameGovernance();
    
    // Ensure default proposals exist
    GovernanceIntegration.ensureProposalsExist();
    
    // Ensure reputation is tracked
    console.log("[GovernanceIntegration] Game complete. Player reputation:", {
        score: reputation.calculateScore(),
        tier: reputation.getReputationTier().label,
        votingPower: reputation.getVotingPower()
    });
};

/**
 * Ensure default proposals exist (uses GameGovernance's built-in proposals)
 */
GovernanceIntegration.ensureProposalsExist = function() {
    const governance = getGameGovernance();
    
    // GameGovernance already creates default proposals in createDefaultProposals()
    // which is called during init(). Just ensure they exist.
    if (governance.proposals.length === 0) {
        governance.createDefaultProposals();
    }
};

/**
 * After voting phase, execute passed proposals
 */
GovernanceIntegration.executePassedProposals = function() {
    const governance = getGameGovernance();
    const proposals = governance.getActiveProposals();
    
    proposals.forEach(proposal => {
        if (!proposal.is_voting_open && proposal.has_passed && !proposal.executed) {
            governance.executeProposal(proposal.id);
            
            // Apply payoff changes to PD.PAYOFFS
            if (proposal.type === 'ChangePayoff') {
                GovernanceIntegration.applyPayoffChange(proposal);
            }
            
            console.log("[GovernanceIntegration] Executed proposal:", proposal.id, proposal.description);
        }
    });
};

/**
 * Apply payoff matrix changes from governance decision
 * Directly updates PD.PAYOFFS so next game uses new rules
 */
GovernanceIntegration.applyPayoffChange = function(proposal) {
    // Use the target and newValue fields set when proposal was created
    if (!proposal.target || proposal.target === null) {
        console.log("[GovernanceIntegration] No payoff change for proposal:", proposal.title);
        return; // No change (Status Quo)
    }
    
    const target = proposal.target; // 'R', 'T', 'S', or 'P'
    const newValue = proposal.newValue;
    
    if (window.PD && window.PD.PAYOFFS) {
        const oldValue = window.PD.PAYOFFS[target];
        window.PD.PAYOFFS[target] = newValue;
        
        // Publish change event for UI updates
        if (window.publish) {
            publish("pd/editPayoffs/" + target, [newValue]);
        }
        
        console.log("[GovernanceIntegration] Applied payoff change:", {
            proposal: proposal.title,
            target: target,
            oldValue: oldValue,
            newValue: newValue
        });
    }
};

/**
 * Display governance results in narrative
 */
GovernanceIntegration.summarizeVoting = function() {
    const governance = getGameGovernance();
    const proposals = governance.getActiveProposals();
    
    const passed = proposals.filter(p => p.has_passed).length;
    const total = proposals.length;
    
    return {
        proposalsVotedOn: total,
        proposalsPassed: passed,
        message: `${passed} out of ${total} proposals passed community vote`
    };
};

/**
 * After voting completes, submit votes to mock Charms
 */
GovernanceIntegration.submitVotesToCharms = function() {
    const reputation = getGameReputation();
    const governance = getGameGovernance();
    const proposals = governance.getActiveProposals();
    
    // Mock Bitcoin transaction submission
    const mockTxid = "0x" + Math.random().toString(16).substr(2, 64);
    const playerAddress = reputation.address || ("player_" + Math.random().toString(36).substr(2, 9));
    
    console.log("[GovernanceIntegration] Submitting votes to Charms...", {
        votes: proposals.length,
        playerAddress: playerAddress,
        reputationTier: reputation.getReputationTier().label,
        votingPower: reputation.getVotingPower(),
        mockTxid: mockTxid
    });
    
    // Publish event for UI
    if (window.publish) {
        publish("governance/submitted", [{
            txid: mockTxid,
            address: playerAddress,
            votes: proposals.length,
            status: "pending" // Would be "confirmed" after block confirmation
        }]);
    }
    
    return mockTxid;
};

/**
 * Connect to Bootstrap to hook into game lifecycle
 */
subscribe("game/complete", function(data) {
    GovernanceIntegration.prepareGovernancePhase();
});

subscribe("governance/summary", function(data) {
    // After voting summary, submit to Charms
    GovernanceIntegration.submitVotesToCharms();
});

subscribe("reputation/moveRecorded", function(data) {
    // Optional: show mini-feedback during gameplay
    // GovernanceIntegration.showRoundFeedback();
});
