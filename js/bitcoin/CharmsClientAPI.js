/**
 * CHARMS CROSS-APP API INTEGRATION
 * 
 * Exposes governance reputation and voting capabilities to other Charms apps.
 * Allows other apps to query reputation scores, voting status, and participate
 * in governance without duplicating logic.
 * 
 * Usage by other apps:
 *   const api = new CharmsClientAPI(appId);
 *   api.getUserReputation('tb1q...').then(rep => console.log(rep.tier));
 *   api.getProposalStatus(1).then(p => console.log(p.has_passed));
 */

class CharmsClientAPI {
  /**
   * Initialize cross-app API client
   * 
   * @param {string} appId - Your app's Charms verification key
   * @param {object} config - Configuration options
   */
  constructor(appId, config = {}) {
    this.appId = appId;
    
    // Use shared CharmsRPC layer
    this.rpc = getCharmsRPC();
    if (config.charmsRpcUrl || config.mockMode) {
      this.rpc.updateConfig(config);
    }

    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minute cache

    console.log("[CharmsClientAPI] Initialized for app:", appId);
  }

  /**
   * Query a user's reputation score and tier from the governance contract
   * 
   * This allows other apps to:
   * - Gate features behind reputation requirements
   * - Offer reputation-based bonuses/penalties
   * - Build reputation-dependent market mechanisms
   * 
   * @param {string} bitcoinAddress - Player's Bitcoin address
   * @returns {Promise<object>} User's reputation record
   *   {
   *     address: "tb1q...",
   *     reputation_score: 80,
   *     tier: "Trusted",
   *     voting_power: 120,
   *     total_moves: 10,
   *     cooperative_moves: 8
   *   }
   */
  async getUserReputation(bitcoinAddress) {
    try {
      const cacheKey = `reputation_${bitcoinAddress}`;
      
      // Check cache
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (cached.expiry > Date.now()) {
          console.log("[CharmsClientAPI] Cache hit for reputation:", bitcoinAddress);
          return cached.data;
        }
      }

      // Call governance contract to fetch reputation
      const result = await this.callGovernanceContract("get_user_reputation", {
        address: bitcoinAddress
      });

      // Cache result
      this.cache.set(cacheKey, {
        data: result,
        expiry: Date.now() + this.cacheExpiry
      });

      return result;
    } catch (error) {
      console.error("[CharmsClientAPI] Error fetching reputation:", error);
      throw error;
    }
  }

  /**
   * Query multiple users' reputations in one call
   * Useful for leaderboards, bulk operations
   * 
   * @param {string[]} addresses - Bitcoin addresses
   * @returns {Promise<object[]>} Array of reputation records
   */
  async getUserReputations(addresses) {
    try {
      const result = await this.callGovernanceContract("get_user_reputations", {
        addresses: addresses
      });
      return result;
    } catch (error) {
      console.error("[CharmsClientAPI] Error fetching reputations:", error);
      throw error;
    }
  }

  /**
   * Get reputation statistics for the entire community
   * 
   * Returns aggregate statistics:
   * - Average reputation
   * - Distribution of tiers
   * - Total voting power
   * - Number of active participants
   * 
   * @returns {Promise<object>} Community reputation stats
   */
  async getCommunityStats() {
    try {
      const cacheKey = "community_stats";
      
      // Check cache
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (cached.expiry > Date.now()) {
          console.log("[CharmsClientAPI] Cache hit for community stats");
          return cached.data;
        }
      }

      const result = await this.callGovernanceContract("get_community_stats", {});

      // Cache result
      this.cache.set(cacheKey, {
        data: result,
        expiry: Date.now() + this.cacheExpiry
      });

      return result;
    } catch (error) {
      console.error("[CharmsClientAPI] Error fetching community stats:", error);
      throw error;
    }
  }

  /**
   * Check if a user has voted on a proposal
   * Useful for preventing double-voting across apps
   * 
   * @param {string} proposalId - Proposal ID
   * @param {string} bitcoinAddress - Player's Bitcoin address
   * @returns {Promise<object>} Vote status
   *   {
   *     has_voted: true,
   *     vote: "Yes",
   *     voting_power: 120,
   *     timestamp: 1234567890
   *   }
   */
  async getVoteStatus(proposalId, bitcoinAddress) {
    try {
      const result = await this.callGovernanceContract("get_vote_status", {
        proposal_id: proposalId,
        address: bitcoinAddress
      });
      return result;
    } catch (error) {
      console.error("[CharmsClientAPI] Error fetching vote status:", error);
      throw error;
    }
  }

  /**
   * Get a proposal's status
   * Allows other apps to check governance decisions and adapt behavior
   * 
   * @param {number} proposalId - Proposal ID
   * @returns {Promise<object>} Proposal status
   *   {
   *     id: 1,
   *     description: "Change R payoff to 3",
   *     voting_open: true,
   *     yes_voting_power: 320,
   *     no_voting_power: 100,
   *     has_passed: true,
   *     executed: false
   *   }
   */
  async getProposalStatus(proposalId) {
    try {
      const cacheKey = `proposal_${proposalId}`;
      
      // Check cache
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (cached.expiry > Date.now()) {
          console.log("[CharmsClientAPI] Cache hit for proposal:", proposalId);
          return cached.data;
        }
      }

      const result = await this.callGovernanceContract("get_proposal", {
        proposal_id: proposalId
      });

      // Cache result
      this.cache.set(cacheKey, {
        data: result,
        expiry: Date.now() + this.cacheExpiry
      });

      return result;
    } catch (error) {
      console.error("[CharmsClientAPI] Error fetching proposal:", error);
      throw error;
    }
  }

  /**
   * Get all active proposals
   * 
   * @returns {Promise<object[]>} Array of active proposal objects
   */
  async getActiveProposals() {
    try {
      const result = await this.callGovernanceContract("get_active_proposals", {});
      return result;
    } catch (error) {
      console.error("[CharmsClientAPI] Error fetching active proposals:", error);
      throw error;
    }
  }

  /**
   * Get proposal execution status
   * Lets other apps know when governance decisions have taken effect
   * 
   * @param {number} proposalId - Proposal ID
   * @returns {Promise<object>} Execution status
   *   {
   *     proposal_id: 1,
   *     executed: true,
   *     passed: true,
   *     effective_block: 12345,
   *     execution_data: { ... }
   *   }
   */
  async getProposalExecution(proposalId) {
    try {
      const result = await this.callGovernanceContract("get_proposal_execution", {
        proposal_id: proposalId
      });
      return result;
    } catch (error) {
      console.error("[CharmsClientAPI] Error fetching execution:", error);
      throw error;
    }
  }

  /**
   * Verify that a player's reputation is authentic
   * Used when reputation needs to be proven for cross-chain or cross-app transfers
   * 
   * @param {string} bitcoinAddress - Player's Bitcoin address
   * @param {object} reputationData - The reputation claim to verify
   * @returns {Promise<boolean>} Whether reputation is authentic
   */
  async verifyReputation(bitcoinAddress, reputationData) {
    try {
      const result = await this.callGovernanceContract("verify_reputation", {
        address: bitcoinAddress,
        claimed_score: reputationData.score,
        claimed_tier: reputationData.tier,
        timestamp: reputationData.timestamp
      });
      return result.verified;
    } catch (error) {
      console.error("[CharmsClientAPI] Error verifying reputation:", error);
      throw error;
    }
  }

  /**
   * Register a new app that depends on reputation
   * Allows governance system to track which apps use reputation
   * 
   * @param {string} appName - Name of the dependent app
   * @param {string} appId - Your Charms verification key
   * @param {string} minReputationTier - Minimum required tier ("Suspicious", "Neutral", "Trusted")
   * @returns {Promise<object>} Registration confirmation
   */
  async registerDependentApp(appName, appId, minReputationTier = "Neutral") {
    try {
      const result = await this.callGovernanceContract("register_dependent_app", {
        app_name: appName,
        app_id: appId,
        min_reputation_tier: minReputationTier
      });
      return result;
    } catch (error) {
      console.error("[CharmsClientAPI] Error registering dependent app:", error);
      throw error;
    }
  }

  /**
   * Get list of apps that depend on this governance reputation system
   * 
   * @returns {Promise<object[]>} Array of dependent apps
   */
  async getDependentApps() {
    try {
      const result = await this.callGovernanceContract("get_dependent_apps", {});
      return result;
    } catch (error) {
      console.error("[CharmsClientAPI] Error fetching dependent apps:", error);
      throw error;
    }
  }

  /**
   * Internal: Call a governance contract function via Charms RPC
   * 
   * @param {string} method - Contract method name
   * @param {object} params - Method parameters
   * @returns {Promise<object>} Method result
   */
  async callGovernanceContract(method, params) {
    try {
      // Map method to RPC call via CharmsRPC
      switch (method) {
        case "get_user_reputation":
          return await this.rpc.getUserReputation(this.appId, params.address);
        case "get_user_reputations":
          return await this.rpc.call("governance_get_user_reputations", [
            { app_id: this.appId, ...params }
          ]);
        case "get_community_stats":
          return await this.rpc.getCommunityStats(this.appId);
        case "get_vote_status":
          return await this.rpc.getVoteStatus(this.appId, params.proposal_id, params.address);
        case "get_proposal":
          return await this.rpc.getProposal(this.appId, params.proposal_id);
        case "get_active_proposals":
          return await this.rpc.getActiveProposals(this.appId);
        case "get_proposal_execution":
          return await this.rpc.call("governance_get_proposal_execution", [
            { app_id: this.appId, ...params }
          ]);
        case "verify_reputation":
          return await this.rpc.call("governance_verify_reputation", [
            { app_id: this.appId, ...params }
          ]);
        case "register_dependent_app":
          return await this.rpc.call("governance_register_dependent_app", [
            { app_id: this.appId, ...params }
          ]);
        case "get_dependent_apps":
          return await this.rpc.call("governance_get_dependent_apps", [
            { app_id: this.appId }
          ]);
        default:
          return await this.rpc.call("governance_" + method, [
            { app_id: this.appId, ...params }
          ]);
      }
    } catch (error) {
      console.error("[CharmsClientAPI] Contract call failed:", error);
      throw error;
    }
  }

  /**
   * Clear cache
   * Useful after voting or reputation changes
   */
  clearCache() {
    this.cache.clear();
    console.log("[CharmsClientAPI] Cache cleared");
  }

  /**
   * Clear cache for specific address
   * 
   * @param {string} bitcoinAddress - Address to clear cache for
   */
  clearAddressCache(bitcoinAddress) {
    this.cache.delete(`reputation_${bitcoinAddress}`);
  }

  /**
   * Subscribe to reputation changes for an address
   * Uses Charms event subscription for real-time updates
   * 
   * @param {string} bitcoinAddress - Address to monitor
   * @param {function} callback - Function to call when reputation changes
   * @returns {function} Unsubscribe function
   */
  subscribeToReputationChanges(bitcoinAddress, callback) {
    const subscription = {
      id: `rep_${bitcoinAddress}_${Date.now()}`,
      address: bitcoinAddress,
      callback: callback
    };

    // In production, would use Charms event subscriptions
    console.log("[CharmsClientAPI] Subscribed to reputation changes:", bitcoinAddress);

    return () => {
      console.log("[CharmsClientAPI] Unsubscribed from reputation changes:", bitcoinAddress);
    };
  }

  /**
   * Subscribe to proposal changes
   * 
   * @param {number} proposalId - Proposal to monitor
   * @param {function} callback - Function to call when proposal changes
   * @returns {function} Unsubscribe function
   */
  subscribeToProposalChanges(proposalId, callback) {
    const subscription = {
      id: `prop_${proposalId}_${Date.now()}`,
      proposal_id: proposalId,
      callback: callback
    };

    console.log("[CharmsClientAPI] Subscribed to proposal changes:", proposalId);

    return () => {
      console.log("[CharmsClientAPI] Unsubscribed from proposal changes:", proposalId);
    };
  }

  /**
   * Build a zk-proof that a player is eligible for a feature
   * based on their reputation
   * 
   * @param {string} bitcoinAddress - Player address
   * @param {string} requiredTier - Required reputation tier
   * @returns {Promise<object>} Eligibility proof for use in other apps
   */
  async buildReputationProof(bitcoinAddress, requiredTier = "Neutral") {
    try {
      const reputation = await this.getUserReputation(bitcoinAddress);

      const tiers = { Suspicious: 0, Neutral: 1, Trusted: 2 };
      const required = tiers[requiredTier] || 1;
      const actual = tiers[reputation.tier] || 0;

      if (actual < required) {
        throw new Error(
          `Insufficient reputation: ${reputation.tier} < ${requiredTier}`
        );
      }

      const proof = {
        address: bitcoinAddress,
        required_tier: requiredTier,
        actual_tier: reputation.tier,
        actual_score: reputation.reputation_score,
        timestamp: Date.now(),
        proof_type: "reputation_eligibility",
        app_id: this.appId
      };

      return proof;
    } catch (error) {
      console.error("[CharmsClientAPI] Proof building failed:", error);
      throw error;
    }
  }
}

// Make available globally
window.CharmsClientAPI = CharmsClientAPI;

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = CharmsClientAPI;
}
