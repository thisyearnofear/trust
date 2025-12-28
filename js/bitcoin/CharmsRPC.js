/**
 * CHARMS RPC LAYER
 * 
 * Unified RPC client for all Charms interactions.
 * Single source of truth for configuration and RPC calls.
 * 
 * Used by:
 * - CharmsClient (move validation & reputation anchoring)
 * - CharmsClientAPI (governance queries)
 * - GameGovernance (vote submission)
 */

class CharmsRPC {
  /**
   * Initialize Charms RPC client
   * @param {object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      network: config.network || "testnet",
      rpcUrl: config.rpcUrl || "http://localhost:18332", // Bitcoin RPC
      charmsRpcUrl: config.charmsRpcUrl || "http://localhost:9000", // Charms daemon
      charmsProverUrl: config.charmsProverUrl || "http://localhost:9001", // Charms prover
      timeout: config.timeout || 30000,
      mockMode: config.mockMode || false, // For testing without daemon
      verbose: config.verbose || false,
      ...config
    };

    this.requestId = 0;
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes

    console.log("[CharmsRPC] Initialized", {
      network: this.config.network,
      charmsRpcUrl: this.config.charmsRpcUrl,
      mockMode: this.config.mockMode
    });
  }

  /**
   * Generate unique request ID
   */
  _nextRequestId() {
    return ++this.requestId;
  }

  /**
   * Log debug message if verbose
   */
  _log(msg) {
    if (this.config.verbose) {
      console.log("[CharmsRPC]", msg);
    }
  }

  /**
   * Make generic RPC call to Charms daemon
   * @param {string} method - RPC method name
   * @param {array} params - Method parameters
   * @param {object} opts - Options (timeout, useCache, etc.)
   * @returns {Promise<any>}
   */
  async call(method, params = [], opts = {}) {
    const timeout = opts.timeout || this.config.timeout;
    const useCache = opts.useCache !== false; // Cache by default
    const cacheKey = `${method}:${JSON.stringify(params)}`;

    // Check cache
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached.expiry > Date.now()) {
        this._log(`Cache hit: ${method}`);
        return cached.data;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    // Mock mode
    if (this.config.mockMode) {
      return this._mockCall(method, params);
    }

    // Real RPC call
    try {
      this._log(`Calling ${method}(${JSON.stringify(params).substring(0, 50)}...)`);

      const response = await Promise.race([
        fetch(this.config.charmsRpcUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: this._nextRequestId(),
            method: method,
            params: params
          })
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("RPC timeout")),
            timeout
          )
        )
      ]);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`RPC error: ${data.error.message}`);
      }

      // Cache result
      if (useCache) {
        this.cache.set(cacheKey, {
          data: data.result,
          expiry: Date.now() + this.cacheTTL
        });
      }

      return data.result;
    } catch (error) {
      console.error("[CharmsRPC] Call failed:", method, error);
      throw error;
    }
  }

  /**
   * Generate zero-knowledge proof for a statement
   * Used for move validation and reputation anchoring
   * @param {string} appId - Charms app ID
   * @param {object} input - Proof input
   * @returns {Promise<object>} Zero-knowledge proof
   */
  async generateProof(appId, input) {
    this._log(`Generating proof for app ${appId}`);

    return this.call("charm_prove", [
      {
        app_id: appId,
        ...input
      }
    ], { useCache: false }); // Don't cache proofs
  }

  /**
   * Verify a zero-knowledge proof
   * @param {object} proof - The proof to verify
   * @returns {Promise<boolean>} Whether proof is valid
   */
  async verifyProof(proof) {
    this._log("Verifying proof");

    return this.call("charm_verify", [proof]);
  }

  /**
   * Call a smart contract method
   * @param {string} contractId - Contract identifier
   * @param {string} method - Contract method name
   * @param {object} args - Method arguments
   * @returns {Promise<any>} Contract method result
   */
  async callContract(contractId, method, args) {
    this._log(`Contract call: ${contractId}.${method}()`);

    return this.call(`contract_${method}`, [
      {
        contract_id: contractId,
        ...args
      }
    ]);
  }

  /**
   * Submit a move to the contract
   * @param {string} appId - App ID
   * @param {object} moveData - Move information
   * @param {object} proof - Zero-knowledge proof of validity
   * @returns {Promise<string>} Transaction ID
   */
  async submitMove(appId, moveData, proof) {
    this._log(`Submitting move for app ${appId}`);

    return this.call("charm_submit_move", [
      {
        app_id: appId,
        move: moveData.move,
        game_state: moveData.gameState,
        proof: proof
      }
    ], { useCache: false });
  }

  /**
   * Submit reputation data to contract
   * @param {string} appId - App ID
   * @param {object} reputationData - Reputation information
   * @param {object} proof - Zero-knowledge proof of reputation
   * @returns {Promise<string>} Transaction ID
   */
  async submitReputation(appId, reputationData, proof) {
    this._log(`Submitting reputation for app ${appId}`);

    return this.call("charm_submit_reputation", [
      {
        app_id: appId,
        address: reputationData.address,
        score: reputationData.score,
        tier: reputationData.tier,
        voting_power: reputationData.votingPower,
        proof: proof
      }
    ], { useCache: false });
  }

  /**
   * Submit a governance vote to contract
   * @param {string} appId - App ID
   * @param {object} voteData - Vote information
   * @param {object} proof - Zero-knowledge proof (optional)
   * @returns {Promise<string>} Transaction ID
   */
  async submitVote(appId, voteData, proof = null) {
    this._log(`Submitting vote for app ${appId}, proposal ${voteData.proposalId}`);

    return this.call("charm_submit_vote", [
      {
        app_id: appId,
        proposal_id: voteData.proposalId,
        voter: voteData.voter,
        vote: voteData.vote,
        voting_power: voteData.votingPower,
        proof: proof
      }
    ], { useCache: false });
  }

  /**
   * Query user reputation from contract
   * @param {string} appId - App ID
   * @param {string} address - Bitcoin address
   * @returns {Promise<object>} User reputation
   */
  async getUserReputation(appId, address) {
    this._log(`Querying reputation for ${address}`);

    return this.call("governance_get_user_reputation", [
      {
        app_id: appId,
        address: address
      }
    ]);
  }

  /**
   * Query proposal status from contract
   * @param {string} appId - App ID
   * @param {number} proposalId - Proposal ID
   * @returns {Promise<object>} Proposal status
   */
  async getProposal(appId, proposalId) {
    this._log(`Querying proposal ${proposalId}`);

    return this.call("governance_get_proposal", [
      {
        app_id: appId,
        proposal_id: proposalId
      }
    ]);
  }

  /**
   * Query all active proposals from contract
   * @param {string} appId - App ID
   * @returns {Promise<array>} Active proposals
   */
  async getActiveProposals(appId) {
    this._log("Querying active proposals");

    return this.call("governance_get_active_proposals", [
      {
        app_id: appId
      }
    ]);
  }

  /**
   * Check if user voted on proposal
   * @param {string} appId - App ID
   * @param {number} proposalId - Proposal ID
   * @param {string} address - Bitcoin address
   * @returns {Promise<object>} Vote status
   */
  async getVoteStatus(appId, proposalId, address) {
    this._log(`Checking vote status for ${address} on proposal ${proposalId}`);

    return this.call("governance_get_vote_status", [
      {
        app_id: appId,
        proposal_id: proposalId,
        address: address
      }
    ]);
  }

  /**
   * Get community governance statistics
   * @param {string} appId - App ID
   * @returns {Promise<object>} Community stats
   */
  async getCommunityStats(appId) {
    this._log("Querying community stats");

    return this.call("governance_get_community_stats", [
      {
        app_id: appId
      }
    ]);
  }

  /**
   * Mock RPC call for testing without daemon
   */
  async _mockCall(method, params) {
    this._log(`[MOCK] ${method}`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

    // Return mock data based on method
    if (method.includes("prove")) {
      return {
        proofType: "mock",
        timestamp: Date.now(),
        verified: true
      };
    }

    if (method.includes("submit")) {
      return "0x" + Math.random().toString(16).substring(2, 66).padEnd(64, "0");
    }

    if (method.includes("reputation")) {
      return {
        address: params[0]?.address || "tb1q...",
        reputation_score: 75,
        tier: "Neutral",
        voting_power: 75,
        total_moves: 10,
        cooperative_moves: 8
      };
    }

    if (method.includes("proposal")) {
      return {
        id: params[0]?.proposal_id || 1,
        title: "Mock Proposal",
        description: "Mock proposal for testing",
        yes_voting_power: 100,
        no_voting_power: 50,
        abstain_voting_power: 30,
        has_passed: true,
        is_voting_open: false
      };
    }

    if (method.includes("vote")) {
      return {
        proposal_id: params[0]?.proposal_id || 1,
        voter: params[0]?.voter || "anonymous",
        vote: params[0]?.vote || "yes",
        timestamp: Date.now()
      };
    }

    if (method.includes("stats")) {
      return {
        total_players: 42,
        avg_reputation: 65,
        active_proposals: 3,
        total_voting_power: 2500
      };
    }

    return { mock: true };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this._log("Cache cleared");
  }

  /**
   * Clear specific cache entry
   */
  clearCacheEntry(key) {
    this.cache.delete(key);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this._log("Configuration updated");
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
}

// Global singleton
var CHARMS_RPC = null;

/**
 * Initialize or get CharmsRPC instance
 */
function initCharmsRPC(config) {
  if (!CHARMS_RPC) {
    CHARMS_RPC = new CharmsRPC(config);
  } else if (config) {
    CHARMS_RPC.updateConfig(config);
  }
  return CHARMS_RPC;
}

/**
 * Get CharmsRPC instance
 */
function getCharmsRPC() {
  if (!CHARMS_RPC) {
    CHARMS_RPC = new CharmsRPC();
  }
  return CHARMS_RPC;
}

// Make available globally
window.CharmsRPC = CharmsRPC;
window.initCharmsRPC = initCharmsRPC;
window.getCharmsRPC = getCharmsRPC;

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    CharmsRPC,
    initCharmsRPC,
    getCharmsRPC
  };
}
