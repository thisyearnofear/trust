/**
 * UNISAT WALLET INTEGRATION
 * 
 * Enables Bitcoin Signet wallet connection via Unisat
 * - Connect/disconnect wallet
 * - Get wallet address and balance
 * - Sign transactions
 * - Broadcast transactions
 * 
 * Unisat API: https://docs.unisat.io/dev-guide/unisat-developer-center/overview
 */

class UnisatWalletIntegration {
  /**
   * Initialize Unisat wallet integration
   * @param {string} network - "signet" or "testnet"
   */
  constructor(network = "signet") {
    this.network = network;
    this.connected = false;
    this.address = null;
    this.balance = null;
    this.publicKey = null;
    
    // Check if wallets are available
    this.hasUnisat = typeof window.unisat !== "undefined";
    this.hasLeather = typeof window.LeatherProvider !== "undefined";
    this.hasWallet = this.hasUnisat || this.hasLeather;
    
    console.log("[UnisatWallet]", this.hasUnisat ? "Unisat detected" : "Unisat not detected");
    console.log("[UnisatWallet]", this.hasLeather ? "Leather detected" : "Leather not detected");
  }

  /**
   * Connect to Unisat wallet
   * @returns {Promise<object>} { address, balance, publicKey }
   */
  async connect() {
    try {
      if (!this.hasUnisat) {
        throw new Error("Unisat wallet not installed. Install from https://unisat.io");
      }

      console.log("[UnisatWallet] Connecting to wallet...");

      // Request wallet connection
      const result = await window.unisat.requestAccounts();
      if (!result || result.length === 0) {
        throw new Error("No wallet account selected");
      }

      this.address = result[0];
      this.connected = true;

      // Get public key
      const pubKeyResult = await window.unisat.getPublicKey();
      this.publicKey = pubKeyResult;

      // Get balance
      const balanceResult = await window.unisat.getBalance();
      this.balance = {
        confirmed: balanceResult.confirmed,
        unconfirmed: balanceResult.unconfirmed,
        total: balanceResult.confirmed + balanceResult.unconfirmed
      };

      // Get network
      const network = await window.unisat.getNetwork();
      if (network !== this.network) {
        console.warn(`[UnisatWallet] Network mismatch. Wallet: ${network}, Expected: ${this.network}`);
      }

      console.log("[UnisatWallet] Connected", {
        address: this.address,
        network: network,
        balance: this.balance.total + " sats"
      });

      // Trigger event
      this._dispatch("connected", { address: this.address, balance: this.balance });

      return {
        address: this.address,
        balance: this.balance,
        publicKey: this.publicKey
      };
    } catch (error) {
      console.error("[UnisatWallet] Connection failed:", error);
      this.connected = false;
      this._dispatch("error", { message: error.message });
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect() {
    try {
      console.log("[UnisatWallet] Disconnecting...");
      
      // Note: Unisat doesn't have explicit disconnect, but we clear state
      this.connected = false;
      this.address = null;
      this.balance = null;
      this.publicKey = null;

      this._dispatch("disconnected", {});
      console.log("[UnisatWallet] Disconnected");
    } catch (error) {
      console.error("[UnisatWallet] Disconnect error:", error);
      throw error;
    }
  }

  /**
   * Get current wallet status
   */
  getStatus() {
    return {
      connected: this.connected,
      address: this.address,
      balance: this.balance,
      publicKey: this.publicKey,
      network: this.network
    };
  }

  /**
   * Sign transaction
   * 
   * Takes unsigned txHex and returns signed txHex
   * @param {string} txHex - Unsigned transaction hex
   * @param {object} options - Optional { message, autoFinalize }
   * @returns {Promise<string>} Signed transaction hex
   */
  async signTransaction(txHex, options = {}) {
    try {
      if (!this.connected) {
        throw new Error("Wallet not connected");
      }

      console.log("[UnisatWallet] Signing transaction...");

      // Use Unisat API to sign
      const signResult = await window.unisat.signPsbt(txHex, {
        toSignInputs: options.toSignInputs || [{ index: 0, publicKey: this.publicKey }],
        autoFinalize: options.autoFinalize !== false
      });

      console.log("[UnisatWallet] Transaction signed");
      this._dispatch("signed", { txHex: signResult });

      return signResult;
    } catch (error) {
      console.error("[UnisatWallet] Signing failed:", error);
      this._dispatch("error", { message: "Transaction signing failed: " + error.message });
      throw error;
    }
  }

  /**
   * Sign multiple transactions (batch)
   * Useful for 2-tx pattern (commit + spell)
   * @param {Array<string>} txHexArray - Array of unsigned transaction hexes
   * @returns {Promise<Array<string>>} Signed transaction hexes
   */
  async signBatch(txHexArray, options = {}) {
    try {
      if (!this.connected) {
        throw new Error("Wallet not connected");
      }

      console.log(`[UnisatWallet] Signing ${txHexArray.length} transactions...`);

      const signed = [];
      for (let i = 0; i < txHexArray.length; i++) {
        console.log(`[UnisatWallet] Signing transaction ${i + 1}/${txHexArray.length}`);
        const signedTx = await this.signTransaction(txHexArray[i], options);
        signed.push(signedTx);
      }

      console.log("[UnisatWallet] All transactions signed");
      return signed;
    } catch (error) {
      console.error("[UnisatWallet] Batch signing failed:", error);
      throw error;
    }
  }

  /**
   * Broadcast transaction
   * Sends signed transaction to Signet
   * @param {string} txHex - Signed transaction hex
   * @returns {Promise<string>} Transaction ID (txid)
   */
  async broadcastTransaction(txHex) {
    try {
      if (!this.connected) {
        throw new Error("Wallet not connected");
      }

      console.log("[UnisatWallet] Broadcasting transaction...");

      // Use Unisat API to push tx
      const txid = await window.unisat.pushTx(txHex);

      console.log("[UnisatWallet] Transaction broadcast:", txid);
      this._dispatch("broadcast", { txid: txid });

      return txid;
    } catch (error) {
      console.error("[UnisatWallet] Broadcast failed:", error);
      this._dispatch("error", { message: "Broadcast failed: " + error.message });
      throw error;
    }
  }

  /**
   * Sign & broadcast transaction (combined)
   * @param {string} txHex - Unsigned transaction hex
   * @returns {Promise<string>} Transaction ID
   */
  async signAndBroadcast(txHex, options = {}) {
    try {
      console.log("[UnisatWallet] Signing and broadcasting transaction...");

      const signedTx = await this.signTransaction(txHex, options);
      const txid = await this.broadcastTransaction(signedTx);

      console.log("[UnisatWallet] Transaction confirmed:", txid);
      this._dispatch("broadcast", { txid: txid });

      return txid;
    } catch (error) {
      console.error("[UnisatWallet] Sign & broadcast failed:", error);
      throw error;
    }
  }

  /**
   * Sign multiple transactions and broadcast as atomic package
   * Implements proper 2-tx pattern for Charms (commit + spell)
   * 
   * Per Charms spec: both txs must be submitted together via submitpackage
   * https://docs.charms.dev/guides/charms-apps/cast-spell/
   * 
   * @param {object} txPair - { commitTxHex, spellTxHex }
   * @returns {Promise<object>} { commitTxid, spellTxid, broadcastMode }
   */
  async signAndBroadcast2TxPattern(txPair) {
    try {
      console.log("[UnisatWallet] Signing and broadcasting 2-tx pattern...");

      // Sign both transactions
      console.log("[UnisatWallet] Signing commit transaction...");
      const signedCommit = await this.signTransaction(txPair.commitTxHex, {
        toSignInputs: [{ index: 0, publicKey: this.publicKey }],
        autoFinalize: true
      });

      console.log("[UnisatWallet] Signing spell transaction...");
      const signedSpell = await this.signTransaction(txPair.spellTxHex, {
        toSignInputs: [{ index: 0, publicKey: this.publicKey }],
        autoFinalize: true
      });

      // Try submitpackage first (atomic broadcast)
      let result;
      try {
        result = await this._submitPackage([signedCommit, signedSpell]);
      } catch (error) {
        console.warn("[UnisatWallet] submitpackage not available, falling back to sequential broadcast:", error.message);
        // Fallback: sequential broadcast (less ideal but works)
        result = await this._sequentialBroadcast(signedCommit, signedSpell);
      }

      console.log("[UnisatWallet] 2-tx pattern complete:", result);
      this._dispatch("2tx_broadcast", result);

      return result;
    } catch (error) {
      console.error("[UnisatWallet] 2-tx pattern failed:", error);
      throw error;
    }
  }

  /**
   * Broadcast transaction package atomically via submitpackage
   * @private
   */
  async _submitPackage(txHexArray) {
    try {
      console.log("[UnisatWallet] Broadcasting via submitpackage (atomic)...");
      
      // Try Unisat API first
      if (window.unisat && window.unisat.pushTxs) {
        const result = await window.unisat.pushTxs(txHexArray);
        return {
          commitTxid: result[0],
          spellTxid: result[1],
          broadcastMode: "unisat_submitpackage"
        };
      }

      // Fallback to manual submitpackage via RPC
      if (this._hasRpcAccess()) {
        const txids = await this._rpcSubmitPackage(txHexArray);
        return {
          commitTxid: txids[0],
          spellTxid: txids[1],
          broadcastMode: "rpc_submitpackage"
        };
      }

      throw new Error("submitpackage not available");
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fallback: broadcast transactions sequentially
   * @private
   */
  async _sequentialBroadcast(signedCommit, signedSpell) {
    console.log("[UnisatWallet] Broadcasting commit transaction...");
    const commitTxid = await this.broadcastTransaction(signedCommit);
    
    // Wait for commit to propagate
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log("[UnisatWallet] Broadcasting spell transaction...");
    const spellTxid = await this.broadcastTransaction(signedSpell);

    return {
      commitTxid: commitTxid,
      spellTxid: spellTxid,
      broadcastMode: "sequential"
    };
  }

  /**
   * Check if we have RPC access for submitpackage
   * @private
   */
  _hasRpcAccess() {
    // Would need Bitcoin Core RPC endpoint or Signet node
    // For now, check if available in window
    return typeof window.bitcoinRpc !== 'undefined' || this._getRpcEndpoint();
  }

  /**
   * Get Bitcoin RPC endpoint (if available)
   * @private
   */
  _getRpcEndpoint() {
    // Can be set via config or environment
    return window.BITCOIN_RPC_ENDPOINT || process.env.BITCOIN_RPC_ENDPOINT || null;
  }

  /**
   * Call Bitcoin RPC submitpackage
   * @private
   */
  async _rpcSubmitPackage(txHexArray) {
    const endpoint = this._getRpcEndpoint();
    if (!endpoint) {
      throw new Error("Bitcoin RPC endpoint not configured");
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa('bitcoin:bitcoin') // Default creds
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'submitpackage',
          params: [txHexArray]
        })
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message);
      }

      // Extract txids from result
      return result.result.tx_results.map(r => r.txid);
    } catch (error) {
      throw new Error(`RPC submitpackage failed: ${error.message}`);
    }
  }

  /**
   * Event dispatcher (simple pub/sub)
   * @private
   */
  _dispatch(event, data) {
    if (window.publish) {
      window.publish(`wallet/${event}`, [data]);
    }
    
    // Also trigger standard DOM event
    const evt = new CustomEvent(`unisat-${event}`, { detail: data });
    document.dispatchEvent(evt);
  }

  /**
   * Check if wallet is available (for UI)
   */
  static isAvailable() {
    return typeof window.unisat !== "undefined";
  }

  /**
   * Get Unisat extension download URL
   */
  static getDownloadUrl() {
    return "https://unisat.io";
  }
}

// Global singleton
var UNISAT_WALLET = null;

function initUnisatWallet(network = "signet") {
  if (!UNISAT_WALLET) {
    UNISAT_WALLET = new UnisatWalletIntegration(network);
  }
  return UNISAT_WALLET;
}

function getUnisatWallet() {
  if (!UNISAT_WALLET) {
    UNISAT_WALLET = new UnisatWalletIntegration("signet");
  }
  return UNISAT_WALLET;
}

// Global access
window.UnisatWalletIntegration = UnisatWalletIntegration;
window.initUnisatWallet = initUnisatWallet;
window.getUnisatWallet = getUnisatWallet;

// Export for modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    UnisatWalletIntegration,
    initUnisatWallet,
    getUnisatWallet
  };
}
