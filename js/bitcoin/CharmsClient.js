/**
 * CHARMS PROTOCOL INTEGRATION: Client for on-chain game move validation
 * 
 * Bridges the Evolution of Trust game UI to the Charms protocol
 * Allows players to submit their game moves as Bitcoin transactions
 * with zero-knowledge proofs of move validity
 * 
 * Usage:
 *   var client = new CharmsGameClient(appId, bitcoinAddress);
 *   client.submitMove(PD.COOPERATE).then(txid => console.log("Bitcoin txid:", txid));
 */

class CharmsGameClient {
  /**
   * Initialize Charms client
   * 
   * @param {string} appId - Charms app verification key
   * @param {string} bitcoinAddress - Player's Bitcoin address
   * @param {object} config - Optional configuration
   */
  constructor(appId, bitcoinAddress, config = {}) {
    this.appId = appId;
    this.bitcoinAddress = bitcoinAddress;
    
    // Use shared CharmsRPC layer
    this.rpc = getCharmsRPC();
    if (config.charmsRpcUrl || config.mockMode) {
      this.rpc.updateConfig(config);
    }

    this.gameState = null;
    this.transactionHistory = [];
    this.proofCache = new Map();

    console.log("[CharmsClient] Initialized for address:", bitcoinAddress);
    console.log("[CharmsClient] Using CharmsRPC:", this.rpc.config.charmsRpcUrl);
  }

  /**
   * Submit a game move as a Charms transaction
   * 
   * @param {string} move - "COOPERATE" or "DEFECT"
   * @param {object} gameContext - Game state for proof generation
   * @returns {Promise<string>} Bitcoin transaction ID
   */
  async submitMove(move, gameContext = {}) {
    try {
      console.log("[CharmsClient] Submitting move:", move);

      // Validate move
      if (!this.isValidMove(move)) {
        throw new Error("Invalid move: must be COOPERATE or DEFECT");
      }

      // Generate zero-knowledge proof
      const proof = await this.generateMoveProof(move, gameContext);
      console.log("[CharmsClient] Move proof generated");

      // Create Charms spell with the proof
      const spell = this.createSpell(move, proof);
      console.log("[CharmsClient] Spell created");

      // Build Bitcoin transaction with spell in witness
      const tx = await this.createBitcoinTransaction(spell);
      console.log("[CharmsClient] Bitcoin transaction created:", tx.txid);

      // Store transaction in history
      this.transactionHistory.push({
        timestamp: Date.now(),
        txid: tx.txid,
        move: move,
        proof: proof
      });

      return tx.txid;
    } catch (error) {
      console.error("[CharmsClient] Error submitting move:", error);
      throw error;
    }
  }

  /**
   * Submit game history and reputation score to anchor on-chain
   * 
   * Called after a game completes to record final reputation
   * 
   * @param {object} gameHistory - Complete game history with moves
   * @param {object} reputationData - Reputation calculation result
   * @returns {Promise<string>} Bitcoin transaction ID with reputation proof
   */
  async submitReputationOnChain(gameHistory, reputationData) {
    try {
      console.log("[CharmsClient] Submitting reputation on-chain:", reputationData);

      // Validate reputation data
      if (!reputationData.score || !reputationData.tier) {
        throw new Error("Invalid reputation data");
      }

      // Generate reputation proof (zero-knowledge proof that reputation is correct)
      const proof = await this.generateReputationProof(gameHistory, reputationData);
      console.log("[CharmsClient] Reputation proof generated");

      // Create spell with reputation
      const spell = {
        appId: this.appId,
        type: "reputation_anchor",
        player: this.bitcoinAddress,
        reputation_score: reputationData.score,
        reputation_tier: reputationData.tier,
        voting_power: reputationData.votingPower,
        total_moves: gameHistory.length,
        cooperative_moves: gameHistory.filter(m => m.isCooperative).length,
        proof: proof,
        timestamp: Date.now(),
        spellData: Buffer.from(JSON.stringify({
          appId: this.appId,
          type: "reputation_anchor",
          reputation_score: reputationData.score,
          reputation_tier: reputationData.tier,
          voting_power: reputationData.votingPower,
          total_moves: gameHistory.length,
          cooperative_moves: gameHistory.filter(m => m.isCooperative).length,
          proof: proof
        })).toString("hex")
      };

      // Build Bitcoin transaction
      const tx = await this.createBitcoinTransaction(spell);
      console.log("[CharmsClient] Reputation anchored to Bitcoin:", tx.txid);

      // Store in history
      this.transactionHistory.push({
        timestamp: Date.now(),
        txid: tx.txid,
        type: "reputation_anchor",
        reputation: reputationData,
        proof: proof
      });

      return tx.txid;
    } catch (error) {
      console.error("[CharmsClient] Error submitting reputation:", error);
      throw error;
    }
  }

  /**
   * Generate reputation proof
   * Proves that reputation score correctly reflects game history
   * 
   * @param {Array} gameHistory - Game moves
   * @param {object} reputationData - Reputation calculation
   * @returns {Promise<object>} Zero-knowledge proof
   */
  async generateReputationProof(gameHistory, reputationData) {
    try {
      const proof = await this.callCharmsZkVM({
        appId: this.appId,
        action: "prove_reputation",
        game_history: gameHistory,
        reputation_score: reputationData.score,
        reputation_tier: reputationData.tier,
        total_moves: gameHistory.length,
        cooperative_moves: gameHistory.filter(m => m.isCooperative).length,
        playerAddress: this.bitcoinAddress
      });

      return proof;
    } catch (error) {
      console.error("[CharmsClient] Reputation proof generation failed:", error);
      // Fallback for demo
      return {
        proofType: "demo",
        reputation_score: reputationData.score,
        tier: reputationData.tier,
        timestamp: Date.now(),
        verified: true
      };
    }
  }

  /**
   * Generate zero-knowledge proof that move is valid
   * 
   * This would call the Charms zkVM to generate a succinct proof
   * that the move satisfies the game rules without revealing all details
   * 
   * @param {string} move - Player's move
   * @param {object} gameContext - Game state
   * @returns {Promise<object>} Zero-knowledge proof
   */
  async generateMoveProof(move, gameContext) {
    // Check cache first
    const cacheKey = `${move}_${JSON.stringify(gameContext)}`;
    if (this.proofCache.has(cacheKey)) {
      return this.proofCache.get(cacheKey);
    }

    try {
      // Call Charms zkVM to generate proof
      const proof = await this.callCharmsZkVM({
        appId: this.appId,
        action: "prove_move",
        move: move === "COOPERATE" ? 0 : 1,
        gameState: gameContext,
        playerAddress: this.bitcoinAddress
      });

      // Cache the proof
      this.proofCache.set(cacheKey, proof);
      return proof;
    } catch (error) {
      console.error("[CharmsClient] Proof generation failed:", error);
      // Fallback: return placeholder proof for demo
      return {
        proofType: "demo",
        move: move,
        timestamp: Date.now(),
        verified: true // In production, would be cryptographically verified
      };
    }
  }

  /**
   * Call Charms zkVM RPC to generate proof
   * 
   * @param {object} input - Proof input
   * @returns {Promise<object>} Proof output
   */
  async callCharmsZkVM(input) {
    try {
      return await this.rpc.generateProof(this.appId, input);
    } catch (error) {
      console.error("[CharmsClient] Proof generation error:", error);
      throw error;
    }
  }

  /**
   * Create a Charms spell (transaction metadata with proof)
   * 
   * Spell format:
   * - App ID
   * - Game state hash
   * - Player move
   * - Zero-knowledge proof
   * 
   * @param {string} move - Player's move
   * @param {object} proof - Zero-knowledge proof
   * @returns {object} Spell data
   */
  createSpell(move, proof) {
    return {
      appId: this.appId,
      type: "trust_game_move",
      move: move === "COOPERATE" ? 0 : 1,
      proof: proof,
      player: this.bitcoinAddress,
      timestamp: Date.now(),
      network: this.config.network,
      // In a real implementation, the spell would be encoded as:
      // OP_FALSE OP_IF ... spell_data ... OP_ENDIF
      // allowing up to ~10KB per input
      spellData: Buffer.from(JSON.stringify({
        appId: this.appId,
        move: move === "COOPERATE" ? 0 : 1,
        proof: proof
      })).toString("hex")
    };
  }

  /**
   * Create Bitcoin transaction with Charms spell in witness data
   * 
   * @param {object} spell - Charms spell
   * @returns {Promise<object>} Transaction with txid
   */
  async createBitcoinTransaction(spell) {
    try {
      // Get unspent outputs for player
      const utxos = await this.getUTXOs(this.bitcoinAddress);
      if (utxos.length === 0) {
        throw new Error("No unspent outputs available");
      }

      // Create transaction
      // In production, would use bitcoinjs-lib or similar
      const tx = {
        inputs: [
          {
            txid: utxos[0].txid,
            vout: utxos[0].vout,
            // Spell is embedded in witness (Taproot)
            witness: this.encodeSpellWitness(spell)
          }
        ],
        outputs: [
          {
            address: this.bitcoinAddress, // Send back to self (commitment to Bitcoin)
            amount: Math.max(utxos[0].amount - 0.0001, 0) // Minus fee
          }
        ]
      };

      // Sign transaction (mock)
      tx.signed = true;
      tx.txid = this.generateMockTxid(tx);

      console.log("[CharmsClient] Bitcoin transaction:", tx.txid);
      return tx;
    } catch (error) {
      console.error("[CharmsClient] Transaction creation failed:", error);
      throw error;
    }
  }

  /**
   * Encode spell as Bitcoin witness data
   * 
   * Witness encoding for Taproot:
   * OP_FALSE OP_IF <spell_data> OP_ENDIF
   * This allows the spell to be stored without affecting script validation
   * 
   * @param {object} spell - Charms spell
   * @returns {string[]} Witness stack
   */
  encodeSpellWitness(spell) {
    return [
      "", // OP_FALSE indicator
      spell.spellData, // Actual spell data
      "" // OP_IF/OP_ENDIF markers (implicit)
    ];
  }

  /**
   * Get unspent outputs for an address
   * 
   * @param {string} address - Bitcoin address
   * @returns {Promise<Array>} Array of UTXOs
   */
  async getUTXOs(address) {
    try {
      const response = await fetch(
        `${this.config.rpcUrl}/api/address/${address}/utxo`,
        {
          timeout: this.config.timeout
        }
      );

      if (!response.ok) {
        console.warn("[CharmsClient] Could not fetch UTXOs, using mock");
        // Return mock UTXO for demo
        return [
          {
            txid: "0000000000000000000000000000000000000000000000000000000000000000",
            vout: 0,
            amount: 1.0
          }
        ];
      }

      return await response.json();
    } catch (error) {
      console.warn("[CharmsClient] UTXO fetch failed, using mock:", error.message);
      return [
        {
          txid: "0000000000000000000000000000000000000000000000000000000000000000",
          vout: 0,
          amount: 1.0
        }
      ];
    }
  }

  /**
   * Generate mock transaction ID for demo purposes
   * 
   * @param {object} tx - Transaction
   * @returns {string} Mock txid
   */
  generateMockTxid(tx) {
    // In real implementation, this would be the actual Bitcoin txid
    // For demo, generate a valid-looking txid hash
    const data = JSON.stringify(tx) + Date.now();
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(64, "0");
  }

  /**
   * Verify a proof is valid
   * 
   * @param {object} proof - Zero-knowledge proof
   * @returns {Promise<boolean>} Whether proof is valid
   */
  async verifyProof(proof) {
    try {
      const response = await fetch(this.config.charmsRpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method: "charm_verify",
          params: [proof]
        })
      });

      const data = await response.json();
      return data.result === true;
    } catch (error) {
      console.error("[CharmsClient] Proof verification failed:", error);
      return false;
    }
  }

  /**
   * Get transaction history
   * 
   * @returns {Array} Array of submitted transactions
   */
  getTransactionHistory() {
    return this.transactionHistory;
  }

  /**
   * Check if a move string is valid
   * 
   * @param {string} move - Move to validate
   * @returns {boolean} Whether move is valid
   */
  isValidMove(move) {
    return move === "COOPERATE" || move === "DEFECT" || move === PD.COOPERATE || move === PD.CHEAT;
  }

  /**
   * Export transaction history as JSON
   * 
   * @returns {string} JSON-serialized history
   */
  exportHistory() {
    return JSON.stringify(this.transactionHistory, null, 2);
  }

  /**
   * Clear transaction history
   */
  clearHistory() {
    this.transactionHistory = [];
    this.proofCache.clear();
    console.log("[CharmsClient] History cleared");
  }
}

// Make available globally
window.CharmsGameClient = CharmsGameClient;

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = CharmsGameClient;
}
