/**
 * SANDBOX REPUTATION METER
 * 
 * Injects live reputation display into the Sandbox UI.
 * Shows real-time reputation growing as player runs tournaments.
 */

function SandboxReputation(config) {
    this.slideshow = config.slideshow;
    this.dom = null;
    this.visible = false;
}

/**
 * Create and inject reputation meter into sandbox
 */
SandboxReputation.prototype.init = function() {
    const reputation = getGameReputation();
    
    // Create meter DOM
    this.dom = document.createElement("div");
    this.dom.className = "sandbox-reputation-meter";
    this.dom.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 8px;
        padding: 16px 20px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
        font-family: Arial, sans-serif;
        z-index: 50;
        min-width: 280px;
    `;
    
    document.body.appendChild(this.dom);
    this.visible = true;
    this.update();
};

/**
 * Update meter with current reputation
 */
SandboxReputation.prototype.update = function() {
    if (!this.dom) return;
    
    const reputation = getGameReputation();
    const tier = reputation.getReputationTier();
    const tierColor = this.getTierColor(tier.label);
    
    this.dom.innerHTML = `
        <div style="font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
            Your Reputation
        </div>
        <div style="width: 100%; height: 20px; background: #e0e0e0; border-radius: 10px; overflow: hidden; margin-bottom: 8px; border: 1px solid #ccc;">
            <div style="width: ${tier.score}%; height: 100%; background: ${tierColor}; border-radius: 10px; transition: width 0.4s ease;"></div>
        </div>
        <div style="font-size: 14px; font-weight: 700; color: #333; text-align: center;">
            ${tier.score}%
        </div>
        <div style="font-size: 11px; text-align: center; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;">
            ${tier.label}
        </div>
        <div style="border-top: 1px solid #ddd; padding-top: 12px; margin-top: 12px;">
            <div style="font-size: 12px; color: #666; margin-bottom: 6px;">
                ${reputation.cooperativeMoves}/${reputation.totalMoves} cooperative
            </div>
            <div style="font-size: 13px; color: #333; font-weight: 500;">
                Voting Power: <span style="color: #4089DD; font-size: 14px; font-weight: 700;">${reputation.getVotingPower()}</span>
            </div>
        </div>
    `;
};

/**
 * Get color for tier
 */
SandboxReputation.prototype.getTierColor = function(tier) {
    if (tier === 'Trusted') return '#4089DD';     // Blue
    if (tier === 'Neutral') return '#efc701';     // Gold
    if (tier === 'Suspicious') return '#FF5E5E'; // Red
    return '#aaa';
};

/**
 * Remove from DOM
 */
SandboxReputation.prototype.destroy = function() {
    if (this.dom && this.dom.parentNode) {
        this.dom.parentNode.removeChild(this.dom);
    }
    this.dom = null;
    this.visible = false;
};

/**
 * Global instance
 */
var SANDBOX_REPUTATION = null;

function initSandboxReputation(slideshow) {
    if (!SANDBOX_REPUTATION) {
        SANDBOX_REPUTATION = new SandboxReputation({slideshow: slideshow});
        SANDBOX_REPUTATION.init();
    }
    return SANDBOX_REPUTATION;
}

function getSandboxReputation() {
    if (!SANDBOX_REPUTATION) {
        SANDBOX_REPUTATION = new SandboxReputation({slideshow: null});
        if (document.body) {
            SANDBOX_REPUTATION.init();
        }
    }
    return SANDBOX_REPUTATION;
}

/**
 * Hook: Update meter whenever reputation changes
 */
if (window.subscribe) {
    subscribe("reputation/moveRecorded", function(data) {
        if (SANDBOX_REPUTATION && SANDBOX_REPUTATION.visible) {
            SANDBOX_REPUTATION.update();
        }
    });
}
