/**
 * CHARMS RPC LAYER (LEGACY - For Governance Queries Only)
 * 
 * NOTE: Proof generation moved to CharmsCLIProver.js
 * This layer now handles only governance/contract queries.
 * 
 * DO NOT use this for charm_prove or charm_submit_move - these don't exist in official Charms.
 * Use CharmsCLIProver.generateProof() instead for real ZK proof generation.
 * 
 * Used by:
 * - CharmsClientAPI (governance queries)
 * - GameGovernance (vote submission - if needed)
 */

class CharmsRPC {
  /**
   * Initialize Charms RPC client (governance queries only)
   * @param {object} config - Configuration options
   * @deprecated Proof generation moved to CharmsCLIProver
   */
  constructor(config = {}) {
    this.config = {
      network: config.network || "signet",
      rpcUrl: config.rpcUrl || "http://localhost:18332", // Bitcoin RPC
      timeout: config.timeout || 30000,
      verbose: config.verbose || false,
      ...config
    };

    this.requestId = 0;
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes

    console.log("[CharmsRPC] Initialized (GOVERNANCE QUERIES ONLY)", {
      network: this.config.network,
      note: "Proof generation moved to CharmsCLIProver.js"
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

    // Real RPC call only (no mock mode)
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
            () => reject(new Error("RPC timeout after " + timeout + "ms")),
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
   * DEPRECATED: Use CharmsCLIProver.generateProof() instead
   * This endpoint (charm_prove) does not exist in official Charms spec.
   * 
   * Real proof generation is handled by:
   * - CharmsCLIProver.generateProof() calls `charms spell prove` CLI
   * - Returns actual [commit_tx, spell_tx] from zkVM execution
   */
  async generateProof(appId, input) {
    throw new Error(
      "generateProof moved to CharmsCLIProver. Use initCharmsCLIProver() instead.\n" +
      "CharmsCLIProver.generateProof() calls the official `charms spell prove` CLI."
    );
  }

  /**
   * DEPRECATED: charm_verify RPC does not exist in official Charms
   */
  async verifyProof(proof) {
    throw new Error(
      "Proof verification handled by charms spell check (CLI).\n" +
      "Use CharmsCLIProver for real proof generation."
    );
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
   * Submit vote (RPC wrapper)
   * @param {string} appId - App ID
   * @param {object} payload - Vote payload
   * @returns {Promise<string>} TXID or status
   */
  async submitVote(appId, payload) {
    this._log("Submitting vote via RPC");
    
    return this.call("governance_submit_vote", [
      {
        app_id: appId,
        payload: payload
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
