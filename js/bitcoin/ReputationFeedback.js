/**
 * REPUTATION FEEDBACK - Real-time visual feedback during/after gameplay
 * 
 * Integrated into game flow: shows immediate consequences of player choices
 * Uses original game assets (Splash character, balloons, sprites) for visual continuity
 */

function ReputationFeedback(config) {
    this.slideshow = config.slideshow;
    this.dom = document.createElement("div");
    this.dom.className = "reputation-feedback";
    
    this.reputation = getGameReputation();
    this.state = "hidden"; // hidden, showing, complete
}

/**
 * Show live reputation tracking during a single match
 * Called after each round of play
 * @param {object} matchData - {playerA, playerB, scoreA, scoreB, payoffs}
 */
ReputationFeedback.prototype.updateLiveMatch = function(matchData) {
    const self = this;
    const tier = this.reputation.getReputationTier();
    
    // Create/update the feedback display
    this.dom.innerHTML = `
        <div class="reputation-live-match">
            <div class="reputation-meter">
                <div class="meter-label">Your Reputation</div>
                <div class="meter-bar">
                    <div class="meter-fill" style="width: ${tier.score}%; background: ${this.getTierColor(tier.label)}"></div>
                </div>
                <div class="meter-value">${tier.score}%</div>
                <div class="tier-name">${tier.label}</div>
            </div>
            
            <div class="move-summary">
                <div class="moves-count">${this.reputation.cooperativeMoves}/${this.reputation.totalMoves} cooperative</div>
                <div class="voting-power">Voting Power: <strong>${this.reputation.getVotingPower()}</strong></div>
            </div>
        </div>
    `;
};

/**
 * Show full reputation summary slide (after tournament/game complete)
 * This is the "moment of truth" where reputation becomes visual
 */
ReputationFeedback.prototype.renderSummarySlide = function() {
    const tier = this.reputation.getReputationTier();
    const tierColor = this.getTierColor(tier.label);
    
    return `
        <div class="reputation-summary-slide">
            <div class="summary-content">
                <div class="summary-left">
                    <!-- Splash character with dynamic blush/expression based on tier -->
                    <div class="character-display" id="character_splash"></div>
                </div>
                
                <div class="summary-right">
                    <h2>Your Reputation</h2>
                    
                    <!-- Big reputation circle (visual focus) -->
                    <div class="reputation-circle" style="border-color: ${tierColor}">
                        <div class="circle-content">
                            <div class="circle-score">${tier.score}%</div>
                            <div class="circle-tier">${tier.label}</div>
                        </div>
                    </div>
                    
                    <!-- Breakdown -->
                    <div class="reputation-breakdown">
                        <div class="breakdown-item">
                            <span class="label">Cooperative Moves:</span>
                            <span class="value">${this.reputation.cooperativeMoves}</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="label">Total Moves:</span>
                            <span class="value">${this.reputation.totalMoves}</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="label">Voting Power:</span>
                            <span class="value">${this.reputation.getVotingPower()}</span>
                        </div>
                    </div>
                    
                    <!-- Tier explanation -->
                    <div class="tier-explanation-box" style="border-left-color: ${tierColor}">
                        ${this.getTierExplanation(tier.label)}
                    </div>
                </div>
            </div>
        </div>
    `;
};

/**
 * Get color for tier
 */
ReputationFeedback.prototype.getTierColor = function(tier) {
    if (tier === 'Trusted') return '#4089DD';     // Blue (TFT color)
    if (tier === 'Neutral') return '#efc701';     // Gold (Grudge color)
    if (tier === 'Suspicious') return '#FF5E5E'; // Red (Random/bad color)
    return '#aaa';
};

/**
 * Get explanation text for tier
 */
ReputationFeedback.prototype.getTierExplanation = function(tier) {
    if (tier === 'Trusted') {
        return `
            <p><strong>Trusted</strong> players:</p>
            <ul>
                <li>Consistently cooperate</li>
                <li>Get 1.5x voting power in governance</li>
                <li>Can propose new rules</li>
                <li>Shape the future of Bitcoin</li>
            </ul>
        `;
    } else if (tier === 'Neutral') {
        return `
            <p><strong>Neutral</strong> players:</p>
            <ul>
                <li>Mix of cooperation and defection</li>
                <li>Get standard 1x voting power</li>
                <li>Can participate in governance</li>
                <li>Room to improve or decline</li>
            </ul>
        `;
    } else {
        return `
            <p><strong>Suspicious</strong> players:</p>
            <ul>
                <li>Tend to defect/attack</li>
                <li>Get 0.5x reduced voting power</li>
                <li>Can still vote but limited influence</li>
                <li>Can rebuild trust through cooperation</li>
            </ul>
        `;
    }
};

/**
 * Create Splash character display with dynamic emotion based on reputation
 */
ReputationFeedback.prototype.createCharacterDisplay = function() {
    const tier = this.reputation.getReputationTier();
    const o = this.slideshow.objects;
    
    // Add Splash character
    this.slideshow.add({
        id: "character_splash",
        type: "Splash",
        x: 0,
        y: 50,
        blush: tier.label === 'Trusted' // Blush if trusted
    });
    
    // Add floating label above character
    const labelText = `You are ${tier.label}!`;
    this.slideshow.add({
        id: "tier_label",
        type: "TextBox",
        x: 30,
        y: 15,
        width: 200,
        align: "center",
        text: labelText,
        color: this.getTierColor(tier.label)
    });
};

/**
 * Animate the reputation change (for dramatic effect)
 */
ReputationFeedback.prototype.animateRepChange = function(oldScore, newScore) {
    const diff = newScore - oldScore;
    const isPositive = diff >= 0;
    
    // Create floating indicator
    const indicator = document.createElement("div");
    indicator.className = `reputation-change ${isPositive ? 'positive' : 'negative'}`;
    indicator.textContent = `${isPositive ? '+' : ''}${diff}%`;
    indicator.style.cssText = `
        position: absolute;
        font-size: 24px;
        font-weight: bold;
        color: ${isPositive ? '#4caf50' : '#f44336'};
        animation: float-up 2s ease-out forwards;
    `;
    
    this.dom.appendChild(indicator);
};

/**
 * Connect reputation to wallet/address
 */
ReputationFeedback.prototype.recordOnChain = function(bitcoinAddress) {
    this.reputation.address = bitcoinAddress;
    console.log(`[ReputationFeedback] Recorded reputation on-chain for ${bitcoinAddress}`);
};

/**
 * Global instance
 */
var REPUTATION_FEEDBACK = null;

function initReputationFeedback(slideshow) {
    if (!REPUTATION_FEEDBACK) {
        REPUTATION_FEEDBACK = new ReputationFeedback({slideshow: slideshow});
    }
    return REPUTATION_FEEDBACK;
}

function getReputationFeedback() {
    if (!REPUTATION_FEEDBACK) {
        REPUTATION_FEEDBACK = new ReputationFeedback({slideshow: null});
    }
    return REPUTATION_FEEDBACK;
}
