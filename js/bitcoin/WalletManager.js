/**
 * UNIFIED APPLICATION STATE & WALLET MANAGER
 * 
 * Single source of truth for:
 * - Wallet connection and signing
 * - Game reputation and moves
 * - Governance state and voting
 * - On-chain transaction state
 * 
 * Consolidates WalletManager + GameReputation + GameGovernance lifecycle
 */

class WalletManager {
  constructor() {
    // Wallet state
    this.connected = false;
    this.address = null;
    this.walletType = null;
    this.provider = null;
    
    // Game reputation state
    this.reputation = {
      cooperativeMoves: 0,
      totalMoves: 0,
      history: [],
      score: 0,
      tier: null
    };
    
    // Governance state
    this.governance = {
      enabled: false,
      proposalId: null,
      hasVoted: false,
      votingPower: 0
    };
    
    // Transaction state
    this.transactions = [];
    this.lastTxid = null;
    
    // Load persisted state
    this._loadPersistedState();
  }

  /**
   * Detect and connect to available wallet
   */
  async connect() {
    if (this.connected) {
      console.log("[WalletManager] Already connected:", this.address);
      return { address: this.address, type: this.walletType };
    }

    // Try Unisat
    if (typeof window.unisat !== "undefined") {
      try {
        console.log("[WalletManager] Connecting to Unisat...");
        const accounts = await window.unisat.requestAccounts();
        if (accounts && accounts.length > 0) {
          this.address = accounts[0];
          this.walletType = "unisat";
          this.provider = window.unisat;
          this.connected = true;
          console.log("[WalletManager] Unisat connected:", this.address);
          return { address: this.address, type: this.walletType };
        }
      } catch (error) {
        console.warn("[WalletManager] Unisat connection failed:", error);
      }
    }

    // Try Leather
    if (typeof window.LeatherProvider !== "undefined") {
      try {
        console.log("[WalletManager] Connecting to Leather...");
        const response = await window.LeatherProvider.request('getAddresses');
        if (response?.result?.addresses?.length > 0) {
          const btcAddress = response.result.addresses.find(addr => 
            addr.type === 'p2wpkh' || addr.type === 'p2tr'
          );
          if (btcAddress) {
            this.address = btcAddress.address;
            this.walletType = "leather";
            this.provider = window.LeatherProvider;
            this.connected = true;
            console.log("[WalletManager] Leather connected:", this.address);
            return { address: this.address, type: this.walletType };
          }
        }
      } catch (error) {
        console.warn("[WalletManager] Leather connection failed:", error);
      }
    }

    throw new Error("No supported wallet found. Please install Unisat or Leather.");
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.connected = false;
    this.address = null;
    this.walletType = null;
    this.provider = null;
    console.log("[WalletManager] Disconnected");
  }

  /**
   * Get current connection status
   */
  getStatus() {
    return {
      connected: this.connected,
      address: this.address,
      type: this.walletType
    };
  }

  /**
   * Record a game move (cooperative or defective)
   * Updates reputation score and tier
   */
  recordMove(isCooperative) {
    const oldScore = this._calculateReputationScore();
    
    this.reputation.totalMoves++;
    if (isCooperative) {
      this.reputation.cooperativeMoves++;
    }
    
    this.reputation.history.push({
      round: this.reputation.totalMoves - 1,
      cooperative: isCooperative,
      timestamp: Date.now()
    });
    
    this.reputation.score = this._calculateReputationScore();
    this.reputation.tier = this._calculateReputationTier();
    
    this._persistState();
    
    // Publish event for UI feedback
    if (window.publish) {
      publish("reputation/moveRecorded", [{
        cooperative: isCooperative,
        oldScore: oldScore,
        newScore: this.reputation.score,
        totalMoves: this.reputation.totalMoves,
        cooperativeMoves: this.reputation.cooperativeMoves
      }]);
    }
    
    console.log("[WalletManager] Move recorded:", {
      isCooperative,
      score: this.reputation.score,
      tier: this.reputation.tier?.label
    });
  }

  /**
   * Calculate reputation score: (cooperative / total) * 100
   */
  _calculateReputationScore() {
    if (this.reputation.totalMoves === 0) return 50; // Neutral
    return Math.round((this.reputation.cooperativeMoves / this.reputation.totalMoves) * 100);
  }

  /**
   * Calculate reputation tier based on score
   */
  _calculateReputationTier() {
    const score = this.reputation.score;
    
    if (score >= 75) {
      return {
        label: 'WellAligned',
        cssClass: 'reputation-aligned',
        votingMultiplier: 1.5
      };
    } else if (score >= 50) {
      return {
        label: 'Neutral',
        cssClass: 'reputation-neutral',
        votingMultiplier: 1.0
      };
    } else {
      return {
        label: 'Misaligned',
        cssClass: 'reputation-misaligned',
        votingMultiplier: 0.5
      };
    }
  }

  /**
   * Get voting power based on reputation tier
   */
  getVotingPower() {
    if (!this.reputation.tier) return 0;
    return Math.round(this.reputation.score * this.reputation.tier.votingMultiplier);
  }

  /**
   * Enable governance (after game completion)
   */
  enableGovernance() {
    this.governance.enabled = true;
    this.governance.votingPower = this.getVotingPower();
    this._persistState();
    console.log("[WalletManager] Governance enabled with voting power:", this.governance.votingPower);
  }

  /**
   * Record a governance vote
   */
  recordVote(proposalId, vote) {
    this.governance.proposalId = proposalId;
    this.governance.hasVoted = true;
    this._persistState();
    
    if (window.publish) {
      publish("governance/voteRecorded", [{
        proposalId,
        vote,
        votingPower: this.governance.votingPower
      }]);
    }
    
    console.log("[WalletManager] Vote recorded:", { proposalId, vote });
  }

  /**
   * Record transaction
   */
  recordTransaction(txid, type = "game") {
    this.lastTxid = txid;
    this.transactions.push({
      txid,
      type,
      timestamp: Date.now(),
      address: this.address
    });
    this._persistState();
    
    if (window.publish) {
      publish("transaction/broadcast", [{ txid, type }]);
    }
    
    console.log("[WalletManager] Transaction recorded:", { txid, type });
  }

  /**
   * Get complete state summary
   */
  getState() {
    return {
      wallet: {
        connected: this.connected,
        address: this.address,
        type: this.walletType
      },
      reputation: this.reputation,
      governance: this.governance,
      transactions: this.transactions
    };
  }

  /**
   * Reset game session (new game, keep on-chain records)
   */
  resetGameSession() {
    this.reputation = {
      cooperativeMoves: 0,
      totalMoves: 0,
      history: [],
      score: 0,
      tier: null
    };
    this._persistState();
    console.log("[WalletManager] Game session reset");
  }

  /**
   * Persist state to localStorage
   */
  _persistState() {
    try {
      localStorage.setItem('walletManagerState', JSON.stringify({
        reputation: this.reputation,
        governance: this.governance,
        address: this.address,
        transactions: this.transactions
      }));
    } catch (error) {
      console.warn("[WalletManager] Could not persist state:", error);
    }
  }

  /**
   * Load persisted state from localStorage
   */
  _loadPersistedState() {
    try {
      const stored = localStorage.getItem('walletManagerState');
      if (stored) {
        const data = JSON.parse(stored);
        this.reputation = data.reputation || this.reputation;
        this.governance = data.governance || this.governance;
        this.address = data.address || null;
        this.transactions = data.transactions || [];
        console.log("[WalletManager] Loaded persisted state");
      }
    } catch (error) {
      console.warn("[WalletManager] Could not load persisted state:", error);
    }
  }
}

// Global singleton instance
window.walletManager = new WalletManager();
