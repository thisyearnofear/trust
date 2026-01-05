/**
 * CHARMS PROTOCOL INTEGRATION: Client for on-chain game move validation
 * 
 * Follows official Charms spec:
 * - Uses `charms spell prove` CLI for real ZK proof generation
 * - Creates proper 2-transaction pattern (commit + spell)
 * - Embeds reputation proof in witness data
 * - Real Bitcoin Signet transactions only (no mock mode)
 * 
 * Reference: https://docs.charms.dev/guides/charms-apps/cast-spell/
 */

class CharmsGameClient {
  /**
   * Initialize Charms client for PRODUCTION use only
   * 
   * @param {string} appId - Charms app verification key (64 hex chars)
   * @param {string} bitcoinAddress - Player's Bitcoin address
   * @param {object} config - Configuration options
   *   - charmsAppBin: Path to compiled app binary (required for real proofs)
   *   - charmsProver: CharmsCLIProver instance (auto-initialized if not provided)
   *   - txBuilder: BitcoinTxBuilder instance (auto-initialized if not provided)
   */
  constructor(appId, bitcoinAddress, config = {}) {
    this.appId = appId;
    this.bitcoinAddress = bitcoinAddress;

    this.charmsAppBin = config.charmsAppBin;
    this.charmsProver = config.charmsProver || null;
    this.txBuilder = config.txBuilder || getBitcoinTxBuilder();
    this.gameHistory = [];
    this.transactionHistory = [];

    console.log("[CharmsClient] Initialized (PRODUCTION MODE - REAL SIGNET)", {
      appId: appId.substring(0, 16) + "...",
      address: bitcoinAddress,
      charmsAppBin: config.charmsAppBin ? "set" : "not set"
    });
  }

  /**
   * Submit game move as a Charms spell
   * 
   * Flow:
   * 1. Generate zero-knowledge proof via Charms CLI (charms spell prove)
   * 2. Returns both commit and spell transactions (signed unsigned pair)
   * 3. Ready for wallet signing and submitpackage broadcast
   * 
   * @param {object} gameData - Game history for proof
   *   - player_address: Bitcoin address
   *   - moves: Array of moves (0=COOPERATE, 1=DEFECT)
   *   - opponent_moves: Opponent moves (optional)
   *   - payoffs: [R, T, S, P] matrix (optional, defaults to PD)
   * @param {object} utxoData - UTXO for funding the transaction
   *   - txid: Previous transaction ID
   *   - vout: Output index
   *   - amount: Satoshis
   * @param {string} changeAddress - Signet change address (tb1q...)
   * @returns {Promise<object>} { commitTxHex, spellTxHex, commitTxid, spellTxid }
   */
  async submitMove(gameData, utxoData, changeAddress) {
    try {
      console.log("[CharmsClient] Submitting move with real ZK proof");

      // Validate inputs
      if (!gameData.player_address || !gameData.moves) {
        throw new Error("Invalid game data: requires player_address and moves array");
      }
      if (!utxoData || !utxoData.txid || utxoData.vout === undefined || !utxoData.amount) {
        throw new Error("Invalid UTXO data");
      }
      if (!changeAddress || !changeAddress.startsWith('tb1')) {
        throw new Error("Invalid Signet change address");
      }

      // Generate real ZK proof via charms spell prove CLI
      const proofResult = await this._generateProofViaCharms(gameData, utxoData, changeAddress);

      // Build 2-tx pattern from real transaction hex
      const txPattern = this._build2TxPattern(proofResult.commitTxHex, proofResult.spellTxHex);

      // Track transaction
      this.gameHistory.push({
        moves: gameData.moves,
        timestamp: Date.now()
      });

      this.transactionHistory.push({
        type: "move",
        commitTxHex: proofResult.commitTxHex,
        spellTxHex: proofResult.spellTxHex,
        commitTxid: txPattern.commitTxid,
        spellTxid: txPattern.spellTxid,
        proof: proofResult.proof,
        timestamp: Date.now()
      });

      console.log("[CharmsClient] Move proof generated (ready for wallet signing)");

      return {
        type: "move",
        commitTxHex: proofResult.commitTxHex,
        spellTxHex: proofResult.spellTxHex,
        commitTxid: txPattern.commitTxid,
        spellTxid: txPattern.spellTxid
      };
    } catch (error) {
      console.error("[CharmsClient] Move submission failed:", error);
      throw error;
    }
  }

  /**
   * Submit reputation to Bitcoin as a Charms spell
   * 
   * This anchors player reputation on-chain after a game completes.
   * Uses real Bitcoin transactions on Signet with actual ZK proofs.
   * 
   * @param {object} gameData - Game history for proof
   *   - player_address: Bitcoin address
   *   - moves: Array of moves (0=COOPERATE, 1=DEFECT)
   *   - opponent_moves: Opponent moves (optional)
   *   - payoffs: [R, T, S, P] matrix (optional)
   * @param {object} utxoData - UTXO for funding the transaction
   *   - txid: Previous transaction ID
   *   - vout: Output index
   *   - amount: Satoshis
   * @param {string} changeAddress - Signet change address (tb1q...)
   * @returns {Promise<object>} { commitTxHex, spellTxHex, commitTxid, spellTxid }
   */
  async submitReputationOnChain(gameData, utxoData, changeAddress) {
    try {
      console.log("[CharmsClient] Anchoring reputation to Bitcoin with real ZK proof");

      // Validate inputs
      if (!gameData.player_address || !gameData.moves) {
        throw new Error("Invalid game data: requires player_address and moves array");
      }
      if (!utxoData || !utxoData.txid || utxoData.vout === undefined || !utxoData.amount) {
        throw new Error("UTXO required for transaction generation");
      }
      if (!changeAddress || !changeAddress.startsWith('tb1')) {
        throw new Error("Invalid Signet change address");
      }

      // Generate real ZK proof via charms spell prove CLI
      const proofResult = await this._generateProofViaCharms(gameData, utxoData, changeAddress);

      // Build 2-tx pattern from real transaction hex
      const txPattern = this._build2TxPattern(proofResult.commitTxHex, proofResult.spellTxHex);

      // Track transaction
      this.transactionHistory.push({
        type: "reputation",
        commitTxHex: proofResult.commitTxHex,
        spellTxHex: proofResult.spellTxHex,
        commitTxid: txPattern.commitTxid,
        spellTxid: txPattern.spellTxid,
        proof: proofResult.proof,
        timestamp: Date.now()
      });

      console.log("[CharmsClient] Reputation anchored (ready for wallet signing):", {
        commitTxid: txPattern.commitTxid.substring(0, 16) + "...",
        spellTxid: txPattern.spellTxid.substring(0, 16) + "..."
      });

      return {
        type: "reputation",
        commitTxHex: proofResult.commitTxHex,
        spellTxHex: proofResult.spellTxHex,
        commitTxid: txPattern.commitTxid,
        spellTxid: txPattern.spellTxid
      };
    } catch (error) {
      console.error("[CharmsClient] Reputation submission failed:", error);
      throw error;
    }
  }

  /**
   * Build the official Charms 2-transaction pattern
   * 
   * According to docs.charms.dev:
   * 1. Commit transaction: Creates output committing to spell + proof
   * 2. Spell transaction: Spends commit output, includes spell in witness
   * 
   * Uses real txHex from charms spell prove CLI
   * @private
   */
  _build2TxPattern(commitTxHex, spellTxHex) {
    // Calculate txids from hex
    const commitTxid = this._calculateTxid(commitTxHex);
    const spellTxid = this._calculateTxid(spellTxHex);

    return {
      commitTxHex: commitTxHex,
      spellTxHex: spellTxHex,
      commitTxid: commitTxid,
      spellTxid: spellTxid
    };
  }

  /**
   * Generate zero-knowledge proof via Charms CLI
   * Calls actual charms spell prove to generate real ZK proofs
   * @private
   */
  async _generateProofViaCharms(gameData, utxoData, changeAddress) {
    // Initialize prover if not already done
    if (!this.charmsProver && this.charmsAppBin) {
      const { initCharmsCLIProver } = require('./CharmsCLIProver.js');
      this.charmsProver = initCharmsCLIProver({
        charmsAppBin: this.charmsAppBin
      });
    }

    if (!this.charmsProver) {
      throw new Error("Charms prover not initialized. Provide charmsAppBin in config.");
    }

    // Call real charms spell prove
    return await this.charmsProver.generateProof(gameData, utxoData, changeAddress);
  }

  /**
   * Submit a governance vote to Bitcoin via Charms
   * Follows 2-transaction pattern (commit + spell)
   * Requires wallet for signing and broadcasting
   * 
   * @param {object} voteData - { proposalId, vote, votingPower }
   * @param {object} walletConfig - Wallet integration { wallet, address, utxo }
   * @returns {Promise<object>} { commitTxid, spellTxid, proposalId, vote }
   */
  async submitVote(voteData, walletConfig = {}) {
    try {
      console.log("[CharmsClient] Submitting governance vote to Bitcoin:", voteData);

      // Validate wallet configuration
      if (!walletConfig.wallet) {
        throw new Error("Wallet required for vote submission");
      }

      // Create spell for vote
      const spell = {
        appId: this.appId,
        type: "governance_vote",
        player: this.bitcoinAddress,
        proposal_id: voteData.proposalId,
        vote: voteData.vote,
        voting_power: voteData.votingPower,
        timestamp: Date.now()
      };

      const wallet = walletConfig.wallet;
      const address = walletConfig.address || this.bitcoinAddress;
      const utxo = walletConfig.utxo;

      if (!utxo || !utxo.txid) {
        throw new Error("UTXO required for vote transaction generation");
      }

      console.log("[CharmsClient] Building 2-tx vote pattern...");
      
      // Build 2-tx pattern with BitcoinTxBuilder
      const txPattern = this.txBuilder.build2TxPattern(spell, address, utxo);
      
      console.log("[CharmsClient] Sending unsigned txs to wallet for signing...");
      
      // Sign and broadcast via wallet
      const broadcastResult = await wallet.signAndBroadcast2TxPattern({
        commitTxHex: txPattern.commitTxHex,
        spellTxHex: txPattern.spellTxHex
      });
      
      const result = {
        type: "vote",
        commitTxid: broadcastResult.commitTxid,
        spellTxid: broadcastResult.spellTxid,
        proposalId: voteData.proposalId,
        vote: voteData.vote,
        spell: spell
      };
      
      this.transactionHistory.push({
        type: "vote",
        spell: spell,
        result: result,
        timestamp: Date.now()
      });

      console.log("[CharmsClient] Vote broadcast:", {
        commitTxid: result.commitTxid.substring(0, 16) + "...",
        spellTxid: result.spellTxid.substring(0, 16) + "..."
      });
      
      return result;
    } catch (error) {
      console.error("[CharmsClient] Vote submission failed:", error);
      throw error;
    }
  }

  /**
   * Get all transactions ready for broadcast
   * These can be signed with bitcoin-cli and broadcast to testnet
   */
  getTransactionHistory() {
    return this.transactionHistory;
  }

  /**
   * Get game history
   */
  getGameHistory() {
    return this.gameHistory;
  }

  /**
   * Export for Bitcoin broadcasting
   * Returns array of { commitTxHex, spellTxHex, commitTxid, spellTxid } ready for wallet signing + submitpackage
   */
  getReadyForBroadcast() {
    return this.transactionHistory.map(entry => ({
      type: entry.type,
      commitTxHex: entry.commitTxHex,
      spellTxHex: entry.spellTxHex,
      commitTxid: entry.commitTxid,
      spellTxid: entry.spellTxid,
      note: "Sign both with wallet, broadcast via bitcoin submitpackage [commit_tx, spell_tx]"
    }));
  }

  /**
   * Calculate Bitcoin transaction ID from hex
   * Double SHA256 of serialized transaction
   * @private
   */
  _calculateTxid(txHex) {
    const crypto = require('crypto');
    const buf = Buffer.from(txHex, 'hex');
    const hash1 = crypto.createHash('sha256').update(buf).digest();
    const hash2 = crypto.createHash('sha256').update(hash1).digest();
    return hash2.reverse().toString('hex');
  }
}

// Global singleton
var CHARMS_CLIENT = null;

function initCharmsClient(appId, address, config) {
  if (!CHARMS_CLIENT) {
    CHARMS_CLIENT = new CharmsGameClient(appId, address, config);
  }
  return CHARMS_CLIENT;
}

function getCharmsClient() {
  if (!CHARMS_CLIENT) {
    CHARMS_CLIENT = new CharmsGameClient("trust_game_v1", "");
  }
  return CHARMS_CLIENT;
}

// Make available globally
window.CharmsGameClient = CharmsGameClient;
window.initCharmsClient = initCharmsClient;
window.getCharmsClient = getCharmsClient;

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    CharmsGameClient,
    initCharmsClient,
    getCharmsClient
  };
}
