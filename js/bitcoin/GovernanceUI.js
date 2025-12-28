/**
 * GOVERNANCE UI MODULE
 * 
 * Displays and manages community governance voting interface.
 * 
 * Features:
 * - Display active proposals
 * - Show user's voting power (based on reputation)
 * - Allow casting votes
 * - Show proposal status and results
 * - Display executed proposals
 */

function GovernanceUI() {
    this.enabled = false;
    this.container = null;
    this.proposals = [];
    this.votes = {};
    this.currentTab = 'active';
}

/**
 * Initialize governance UI
 * @param {string} containerId - ID of container element
 * @returns {GovernanceUI}
 */
GovernanceUI.prototype.init = function(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
        console.warn("[GovernanceUI] Container not found:", containerId);
        return this;
    }
    
    this.enabled = true;
    this.render();
    return this;
};

/**
 * Render governance UI
 */
GovernanceUI.prototype.render = function() {
    if (!this.enabled || !this.container) return;
    
    this.container.innerHTML = `
        <div class="governance-container">
            <div class="governance-header">
                <h2>Community Governance</h2>
                <p>Decide the future of the game using your reputation-weighted vote</p>
            </div>
            
            <div class="governance-tabs">
                <button class="tab-button active" data-tab="active">Active Proposals</button>
                <button class="tab-button" data-tab="voting-power">Your Voting Power</button>
                <button class="tab-button" data-tab="executed">Executed Proposals</button>
            </div>
            
            <div class="governance-content">
                ${this.renderActiveProposals()}
                ${this.renderVotingPower()}
                ${this.renderExecutedProposals()}
            </div>
        </div>
    `;
    
    // Attach event listeners
    this.attachEventListeners();
};

/**
 * Render active proposals tab
 */
GovernanceUI.prototype.renderActiveProposals = function() {
    if (this.proposals.length === 0) {
        return `
            <div class="tab-content" data-tab="active">
                <p class="no-proposals">No active proposals yet. Check back soon!</p>
            </div>
        `;
    }
    
    const activeProposals = this.proposals.filter(p => !p.executed);
    
    if (activeProposals.length === 0) {
        return `
            <div class="tab-content" data-tab="active">
                <p class="no-proposals">No active proposals at this time.</p>
            </div>
        `;
    }
    
    const proposalsList = activeProposals.map(proposal => this.renderProposal(proposal)).join('');
    
    return `
        <div class="tab-content active" data-tab="active">
            <div class="proposals-list">
                ${proposalsList}
            </div>
        </div>
    `;
};

/**
 * Render a single proposal
 */
GovernanceUI.prototype.renderProposal = function(proposal) {
    const totalVotingPower = proposal.yes_voting_power + proposal.no_voting_power + proposal.abstain_voting_power;
    const yesPercentage = totalVotingPower > 0 ? (proposal.yes_voting_power / totalVotingPower * 100).toFixed(1) : 0;
    const hasVoted = this.votes[proposal.id] !== undefined;
    
    return `
        <div class="proposal-card">
            <div class="proposal-header">
                <h3>Proposal #${proposal.id}</h3>
                <span class="proposal-status ${proposal.is_voting_open ? 'voting-open' : 'voting-closed'}">
                    ${proposal.is_voting_open ? 'Voting Open' : 'Voting Closed'}
                </span>
            </div>
            
            <p class="proposal-description">${proposal.description}</p>
            
            <div class="proposal-voting">
                <div class="voting-stats">
                    <div class="vote-stat">
                        <span class="vote-label">Yes:</span>
                        <span class="vote-value">${proposal.yes_voting_power} votes (${yesPercentage}%)</span>
                    </div>
                    <div class="vote-stat">
                        <span class="vote-label">No:</span>
                        <span class="vote-value">${proposal.no_voting_power} votes</span>
                    </div>
                    <div class="vote-stat">
                        <span class="vote-label">Abstain:</span>
                        <span class="vote-value">${proposal.abstain_voting_power} votes</span>
                    </div>
                </div>
                
                <div class="voting-progress">
                    <div class="progress-bar">
                        <div class="progress-fill yes" style="width: ${yesPercentage}%"></div>
                    </div>
                </div>
                
                ${proposal.is_voting_open && !hasVoted ? `
                    <div class="voting-buttons">
                        <button class="vote-btn yes" data-proposal-id="${proposal.id}" data-vote="yes">
                            Vote Yes
                        </button>
                        <button class="vote-btn no" data-proposal-id="${proposal.id}" data-vote="no">
                            Vote No
                        </button>
                        <button class="vote-btn abstain" data-proposal-id="${proposal.id}" data-vote="abstain">
                            Abstain
                        </button>
                    </div>
                ` : (hasVoted ? `
                    <div class="voted-indicator">
                        ✓ You voted: <strong>${this.votes[proposal.id]}</strong>
                    </div>
                ` : `
                    <div class="voting-closed-indicator">
                        Voting has closed for this proposal
                    </div>
                `)}
            </div>
            
            ${!proposal.is_voting_open ? `
                <div class="proposal-result">
                    <p class="result-text">
                        Result: <strong>${proposal.has_passed ? 'PASSED' : 'REJECTED'}</strong>
                    </p>
                    ${proposal.executed && proposal.has_passed ? `
                        <p class="result-status">✓ Executed successfully</p>
                    ` : ''}
                </div>
            ` : ''}
        </div>
    `;
};

/**
 * Render voting power tab
 */
GovernanceUI.prototype.renderVotingPower = function() {
    const reputation = getGameReputation();
    const tier = reputation.getReputationTier();
    const votingPower = reputation.getVotingPower();
    
    return `
        <div class="tab-content" data-tab="voting-power">
            <div class="voting-power-card">
                <h3>Your Reputation & Voting Power</h3>
                
                <div class="power-stat">
                    <label>Reputation Score:</label>
                    <div class="reputation-display">
                        <div class="reputation-bar">
                            <div class="reputation-fill" style="width: ${tier.score}%"></div>
                        </div>
                        <span class="reputation-value">${tier.score}%</span>
                    </div>
                </div>
                
                <div class="power-stat">
                    <label>Reputation Tier:</label>
                    <span class="tier-badge ${tier.cssClass}">${tier.label}</span>
                </div>
                
                <div class="power-stat">
                    <label>Voting Power:</label>
                    <span class="voting-power-value">${votingPower} votes</span>
                </div>
                
                <div class="tier-explanation">
                    <p><strong>How it works:</strong></p>
                    <ul>
                        <li><strong>Trusted (75%+):</strong> 1.5x voting multiplier</li>
                        <li><strong>Neutral (50-74%):</strong> 1x voting multiplier</li>
                        <li><strong>Suspicious (&lt;50%):</strong> 0.5x voting multiplier</li>
                    </ul>
                </div>
                
                ${reputation.totalMoves > 0 ? `
                    <div class="history-summary">
                        <p>Game History:</p>
                        <p>${reputation.cooperativeMoves} cooperative moves out of ${reputation.totalMoves} total</p>
                    </div>
                ` : `
                    <div class="history-summary">
                        <p>Play a game to establish your reputation and earn voting power.</p>
                    </div>
                `}
            </div>
        </div>
    `;
};

/**
 * Render executed proposals tab
 */
GovernanceUI.prototype.renderExecutedProposals = function() {
    const executedProposals = this.proposals.filter(p => p.executed);
    
    if (executedProposals.length === 0) {
        return `
            <div class="tab-content" data-tab="executed">
                <p class="no-proposals">No proposals have been executed yet.</p>
            </div>
        `;
    }
    
    const proposalsList = executedProposals.map(proposal => `
        <div class="executed-proposal">
            <h4>Proposal #${proposal.id}: ${proposal.description}</h4>
            <p class="execution-status">
                Status: <strong>${proposal.has_passed ? '✓ PASSED' : '✗ REJECTED'}</strong>
            </p>
            <p class="execution-results">
                Final Vote: ${proposal.yes_voting_power} yes, ${proposal.no_voting_power} no, ${proposal.abstain_voting_power} abstain
            </p>
        </div>
    `).join('');
    
    return `
        <div class="tab-content" data-tab="executed">
            <div class="executed-proposals-list">
                ${proposalsList}
            </div>
        </div>
    `;
};

/**
 * Attach event listeners
 */
GovernanceUI.prototype.attachEventListeners = function() {
    const self = this;
    
    // Tab switching
    const tabButtons = this.container.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            self.switchTab(tab);
        });
    });
    
    // Vote buttons
    const voteButtons = this.container.querySelectorAll('.vote-btn');
    voteButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const proposalId = parseInt(this.getAttribute('data-proposal-id'));
            const vote = this.getAttribute('data-vote');
            self.castVote(proposalId, vote);
        });
    });
};

/**
 * Switch active tab
 */
GovernanceUI.prototype.switchTab = function(tab) {
    // Update buttons
    const buttons = this.container.querySelectorAll('.tab-button');
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });
    
    // Update content
    const contents = this.container.querySelectorAll('.tab-content');
    contents.forEach(content => {
        content.classList.toggle('active', content.getAttribute('data-tab') === tab);
    });
    
    this.currentTab = tab;
};

/**
 * Cast a vote
 */
GovernanceUI.prototype.castVote = function(proposalId, voteChoice) {
    const reputation = getGameReputation();
    const votingPower = reputation.getVotingPower();
    
    if (votingPower === 0) {
        alert('You need to play a game first to earn voting power.');
        return;
    }
    
    if (this.votes[proposalId]) {
        alert('You have already voted on this proposal.');
        return;
    }
    
    // Record the vote
    this.votes[proposalId] = voteChoice;
    
    // Update UI
    this.render();
    
    // Show confirmation
    const proposal = this.proposals.find(p => p.id === proposalId);
    if (proposal) {
        const tier = reputation.getReputationTier();
        console.log(`[GovernanceUI] Vote cast on Proposal #${proposalId}:`, {
            vote: voteChoice,
            votingPower: votingPower,
            reputation: tier.label
        });
        
        // TODO: Submit to Charms contract via CharmsClient
        publish('governance/vote', [{
            proposalId: proposalId,
            vote: voteChoice,
            reputation: tier.score,
            votingPower: votingPower
        }]);
    }
};

/**
 * Add a proposal to the list
 */
GovernanceUI.prototype.addProposal = function(proposal) {
    // Check if proposal already exists
    if (!this.proposals.find(p => p.id === proposal.id)) {
        this.proposals.push(proposal);
        this.render();
    }
};

/**
 * Update proposal status
 */
GovernanceUI.prototype.updateProposal = function(proposalId, updates) {
    const proposal = this.proposals.find(p => p.id === proposalId);
    if (proposal) {
        Object.assign(proposal, updates);
        this.render();
    }
};

/**
 * Global singleton instance
 */
var GOVERNANCE_UI = null;

/**
 * Initialize or get governance UI
 * @param {string} containerId - ID of container element
 * @returns {GovernanceUI}
 */
function initGovernanceUI(containerId) {
    if (!GOVERNANCE_UI) {
        GOVERNANCE_UI = new GovernanceUI();
    }
    
    if (containerId) {
        GOVERNANCE_UI.init(containerId);
    }
    
    return GOVERNANCE_UI;
}

/**
 * Get current governance UI instance
 * @returns {GovernanceUI}
 */
function getGovernanceUI() {
    if (!GOVERNANCE_UI) {
        GOVERNANCE_UI = new GovernanceUI();
    }
    return GOVERNANCE_UI;
}
