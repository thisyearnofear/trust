/**
 * CHARMS INTEGRATION: On-Chain UI Components
 * 
 * Displays Bitcoin transaction information and wallet connection
 * Allows players to optionally submit game moves to Bitcoin blockchain
 * 
 * This is an optional enhancement – game works fine without it
 */

var OnChainUI = {
  enabled: false,
  charmsClient: null,
  playerAddress: null,
  recentTransactions: [],
  container: null,

  /**
   * Initialize on-chain UI components
   */
  init: function() {
    if (!window.BITCOIN_MODE) {
      console.log("[OnChainUI] Bitcoin mode not enabled, skipping on-chain UI");
      return;
    }

    console.log("[OnChainUI] Initializing on-chain UI components");

    // Create container for on-chain UI
    this.container = document.createElement("div");
    this.container.id = "onchain-ui";
    this.container.className = "onchain-ui-container";
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      background: #1a1a2e;
      border: 2px solid #16c784;
      border-radius: 8px;
      padding: 15px;
      font-family: monospace;
      font-size: 12px;
      color: #00ff00;
      z-index: 9999;
      max-height: 400px;
      overflow-y: auto;
      box-shadow: 0 0 20px rgba(22, 199, 132, 0.3);
    `;

    // Add styles
    this.addStyles();

    // Create UI sections
    this.createWalletSection();
    this.createTransactionSection();
    this.createSettingsSection();

    // Add container to page
    document.body.appendChild(this.container);

    // Listen for game events
    subscribe("iterated/round/end", (payoffs) => {
      this.onGameRoundEnd(payoffs);
    });

    console.log("[OnChainUI] On-chain UI initialized");
  },

  /**
   * Add CSS styles for on-chain UI
   */
  addStyles: function() {
    const style = document.createElement("style");
    style.textContent = `
      .onchain-ui-container {
        font-family: 'Courier New', monospace;
      }

      .onchain-section {
        margin-bottom: 15px;
        border-bottom: 1px solid #16c784;
        padding-bottom: 10px;
      }

      .onchain-section:last-child {
        border-bottom: none;
      }

      .onchain-title {
        color: #16c784;
        font-weight: bold;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .onchain-field {
        margin: 5px 0;
        word-break: break-all;
      }

      .onchain-label {
        color: #888;
        display: inline-block;
        width: 80px;
      }

      .onchain-value {
        color: #00ff00;
        font-weight: bold;
      }

      .onchain-button {
        display: inline-block;
        margin: 5px 5px 5px 0;
        padding: 5px 10px;
        background: #16c784;
        color: #000;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-family: monospace;
        font-size: 11px;
        font-weight: bold;
        transition: all 0.3s ease;
      }

      .onchain-button:hover {
        background: #20ff8d;
        box-shadow: 0 0 10px rgba(22, 199, 132, 0.5);
      }

      .onchain-button:disabled {
        background: #666;
        color: #999;
        cursor: not-allowed;
      }

      .onchain-tx-item {
        background: #0a0a14;
        padding: 8px;
        margin: 5px 0;
        border-left: 3px solid #16c784;
      }

      .onchain-success {
        color: #16c784;
      }

      .onchain-error {
        color: #ff6b6b;
      }

      .onchain-status {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 5px;
      }

      .onchain-status.active {
        background: #16c784;
        animation: pulse 2s infinite;
      }

      .onchain-status.inactive {
        background: #666;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .onchain-link {
        color: #00ff00;
        text-decoration: none;
        cursor: pointer;
      }

      .onchain-link:hover {
        text-decoration: underline;
      }
    `;
    document.head.appendChild(style);
  },

  /**
   * Create wallet connection section
   */
  createWalletSection: function() {
    const section = document.createElement("div");
    section.className = "onchain-section";
    section.innerHTML = `
      <div class="onchain-title">🔗 Bitcoin Wallet</div>
      <div class="onchain-field">
        <span class="onchain-label">Status:</span>
        <span class="onchain-status inactive" id="wallet-status"></span>
        <span id="wallet-status-text">Disconnected</span>
      </div>
      <div class="onchain-field" id="wallet-address-container" style="display:none;">
        <span class="onchain-label">Address:</span>
        <span class="onchain-value" id="wallet-address"></span>
      </div>
      <div>
        <button class="onchain-button" id="connect-wallet">Connect Wallet</button>
        <button class="onchain-button" id="disconnect-wallet" style="display:none;">Disconnect</button>
      </div>
    `;

    section.querySelector("#connect-wallet").onclick = () => this.connectWallet();
    section.querySelector("#disconnect-wallet").onclick = () => this.disconnectWallet();

    this.container.appendChild(section);
  },

  /**
   * Create transaction history section
   */
  createTransactionSection: function() {
    const section = document.createElement("div");
    section.className = "onchain-section";
    section.innerHTML = `
      <div class="onchain-title">📝 Recent Moves</div>
      <div id="transaction-list">
        <div style="color: #888;">No moves submitted yet</div>
      </div>
      <div style="margin-top: 10px;">
        <button class="onchain-button" id="clear-history">Clear History</button>
        <button class="onchain-button" id="export-history">Export JSON</button>
      </div>
    `;

    section.querySelector("#clear-history").onclick = () => this.clearHistory();
    section.querySelector("#export-history").onclick = () => this.exportHistory();

    this.container.appendChild(section);
  },

  /**
   * Create settings section
   */
  createSettingsSection: function() {
    const section = document.createElement("div");
    section.className = "onchain-section";
    section.innerHTML = `
      <div class="onchain-title">⚙️ Settings</div>
      <label style="display: block; margin: 5px 0; cursor: pointer;">
        <input type="checkbox" id="auto-submit" />
        Auto-submit moves to Bitcoin
      </label>
      <div class="onchain-field" style="margin-top: 10px;">
        <span class="onchain-label">Network:</span>
        <span class="onchain-value">Bitcoin Testnet</span>
      </div>
    `;

    this.container.appendChild(section);
  },

  /**
   * Connect to Bitcoin wallet
   */
  connectWallet: function() {
    console.log("[OnChainUI] Attempting to connect wallet...");

    // Try to connect to browser wallet (e.g., Unisat)
    if (window.unisat) {
      window.unisat.requestAccounts()
        .then(accounts => {
          this.playerAddress = accounts[0];
          this.onWalletConnected();
        })
        .catch(err => {
          console.error("[OnChainUI] Wallet connection failed:", err);
          this.showError("Failed to connect wallet: " + err.message);
        });
    } else if (window.bitcoin) {
      // Alternative: XVerse or other wallets
      window.bitcoin.request({ method: "getAddress" })
        .then(result => {
          this.playerAddress = result.address;
          this.onWalletConnected();
        })
        .catch(err => {
          console.error("[OnChainUI] Wallet connection failed:", err);
          this.showError("Failed to connect wallet: " + err.message);
        });
    } else {
      // Mock wallet for demo
      console.log("[OnChainUI] No browser wallet detected, using demo address");
      this.playerAddress = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"; // Testnet address
      this.onWalletConnected();
    }
  },

  /**
   * Handle successful wallet connection
   */
  onWalletConnected: function() {
    console.log("[OnChainUI] Wallet connected:", this.playerAddress);

    this.enabled = true;

    // Initialize Charms client
    this.charmsClient = new CharmsGameClient(
      "trust-game-v1", // App ID
      this.playerAddress,
      {
        network: "testnet",
        rpcUrl: "http://localhost:18332",
        charmsRpcUrl: "http://localhost:9000"
      }
    );

    // Update UI
    document.getElementById("wallet-status").className = "onchain-status active";
    document.getElementById("wallet-status-text").textContent = "Connected";
    document.getElementById("wallet-address").textContent = this.playerAddress;
    document.getElementById("wallet-address-container").style.display = "block";
    document.getElementById("connect-wallet").style.display = "none";
    document.getElementById("disconnect-wallet").style.display = "inline-block";

    this.showSuccess("Wallet connected! Moves can now be submitted to Bitcoin.");
  },

  /**
   * Disconnect wallet
   */
  disconnectWallet: function() {
    console.log("[OnChainUI] Wallet disconnected");

    this.enabled = false;
    this.playerAddress = null;
    this.charmsClient = null;

    // Update UI
    document.getElementById("wallet-status").className = "onchain-status inactive";
    document.getElementById("wallet-status-text").textContent = "Disconnected";
    document.getElementById("wallet-address-container").style.display = "none";
    document.getElementById("connect-wallet").style.display = "inline-block";
    document.getElementById("disconnect-wallet").style.display = "none";
  },

  /**
   * Handle game round end event
   */
  onGameRoundEnd: function(payoffs) {
    if (!this.enabled || !this.charmsClient) {
      return;
    }

    // Optionally auto-submit if enabled
    const autoSubmit = document.getElementById("auto-submit");
    if (autoSubmit && autoSubmit.checked) {
      // Get last move from game state (this would be set by the game)
      // This is a hook point for future integration
      console.log("[OnChainUI] Auto-submit enabled, but requires game state integration");
    }
  },

  /**
   * Submit a move to Bitcoin blockchain
   */
  submitMove: function(move) {
    if (!this.enabled || !this.charmsClient) {
      this.showError("Wallet not connected");
      return;
    }

    console.log("[OnChainUI] Submitting move to Bitcoin:", move);

    this.charmsClient.submitMove(move)
      .then(txid => {
        this.addTransaction(move, txid);
        this.showSuccess("Move submitted! Txid: " + txid.substring(0, 16) + "...");
      })
      .catch(err => {
        console.error("[OnChainUI] Move submission failed:", err);
        this.showError("Failed to submit move: " + err.message);
      });
  },

  /**
   * Add transaction to history display
   */
  addTransaction: function(move, txid) {
    this.recentTransactions.unshift({
      move: move,
      txid: txid,
      timestamp: new Date().toLocaleTimeString()
    });

    // Keep only last 5 transactions
    if (this.recentTransactions.length > 5) {
      this.recentTransactions.pop();
    }

    this.updateTransactionDisplay();
  },

  /**
   * Update transaction list display
   */
  updateTransactionDisplay: function() {
    const listEl = document.getElementById("transaction-list");
    if (!listEl) return;

    if (this.recentTransactions.length === 0) {
      listEl.innerHTML = '<div style="color: #888;">No moves submitted yet</div>';
      return;
    }

    listEl.innerHTML = this.recentTransactions.map(tx => `
      <div class="onchain-tx-item">
        <div style="margin-bottom: 5px;">
          <span style="color: #16c784;">●</span>
          <strong>${tx.move}</strong>
          <span style="color: #888; float: right; font-size: 10px;">${tx.timestamp}</span>
        </div>
        <div style="word-break: break-all; color: #00aa00;">
          <a class="onchain-link" href="https://blockstream.info/testnet/tx/${tx.txid}" target="_blank">
            ${tx.txid.substring(0, 32)}...
          </a>
        </div>
      </div>
    `).join("");
  },

  /**
   * Clear transaction history
   */
  clearHistory: function() {
    this.recentTransactions = [];
    if (this.charmsClient) {
      this.charmsClient.clearHistory();
    }
    this.updateTransactionDisplay();
    this.showSuccess("History cleared");
  },

  /**
   * Export transaction history as JSON
   */
  exportHistory: function() {
    const data = {
      address: this.playerAddress,
      transactions: this.recentTransactions,
      exported: new Date().toISOString()
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bitcoin-trust-game-history.json";
    a.click();

    this.showSuccess("History exported");
  },

  /**
   * Show success message
   */
  showSuccess: function(message) {
    console.log("[OnChainUI] ✓", message);
    this.showMessage(message, "success");
  },

  /**
   * Show error message
   */
  showError: function(message) {
    console.error("[OnChainUI] ✗", message);
    this.showMessage(message, "error");
  },

  /**
   * Show temporary message
   */
  showMessage: function(message, type = "info") {
    // Create toast-like message
    const toast = document.createElement("div");
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === "error" ? "#ff6b6b" : "#16c784"};
      color: #000;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;

    // Add animation
    const style = document.createElement("style");
    if (!document.getElementById("onchain-toast-styles")) {
      style.id = "onchain-toast-styles";
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Remove after 4 seconds
    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  /**
   * Show governance voting panel
   * Triggered after game completion when player has voting power
   */
  showGovernancePanel: function() {
    if (!window.GOVERNANCE_UI) {
      console.warn("[OnChainUI] GovernanceUI not initialized");
      return;
    }

    const gov = getGameGovernance();
    const reputation = getGameReputation();
    const rep = reputation.getSummary();

    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.id = "governance-modal-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create modal panel
    const panel = document.createElement("div");
    panel.id = "governance-modal-panel";
    panel.style.cssText = `
      background: #1a1a2e;
      border: 2px solid #16c784;
      border-radius: 12px;
      padding: 30px;
      width: 90%;
      max-width: 700px;
      max-height: 80vh;
      overflow-y: auto;
      font-family: 'Courier New', monospace;
      color: #00ff00;
      box-shadow: 0 0 30px rgba(22, 199, 132, 0.4);
    `;

    // Build proposals HTML
    let proposalsHtml = "<h2 style='color: #16c784; margin-top: 0;'>Community Governance</h2>";
    proposalsHtml += `<p>Your voting power: <strong>${rep.votingPower}</strong> (Tier: ${rep.tier.label})</p>`;
    proposalsHtml += "<hr style='border-color: #16c784;'>";

    const activeProposals = gov.getActiveProposals();
    if (activeProposals.length === 0) {
      proposalsHtml += "<p>No active proposals.</p>";
    } else {
      for (const proposal of activeProposals) {
        const totalVotes = proposal.yes_voting_power + proposal.no_voting_power + proposal.abstain_voting_power;
        const yesPercent = totalVotes > 0 ? (proposal.yes_voting_power / totalVotes * 100).toFixed(0) : 0;

        proposalsHtml += `
          <div style="margin-bottom: 20px; padding: 15px; background: #0a0a14; border-left: 3px solid #16c784; border-radius: 4px;">
            <h3 style="color: #16c784; margin-top: 0;">#${proposal.id}: ${proposal.title}</h3>
            <p>${proposal.description}</p>
            <p style="color: #888; font-size: 12px;">${proposal.impact}</p>
            <div style="margin: 10px 0;">
              <div style="display: flex; gap: 10px; margin-bottom: 8px;">
                <button class="gov-vote-btn" data-proposal="${proposal.id}" data-vote="yes" style="flex: 1; padding: 8px; background: #16c784; color: #000; border: none; cursor: pointer; font-weight: bold; border-radius: 4px;">Yes (${proposal.yes_voting_power})</button>
                <button class="gov-vote-btn" data-proposal="${proposal.id}" data-vote="no" style="flex: 1; padding: 8px; background: #ff6b6b; color: #fff; border: none; cursor: pointer; font-weight: bold; border-radius: 4px;">No (${proposal.no_voting_power})</button>
                <button class="gov-vote-btn" data-proposal="${proposal.id}" data-vote="abstain" style="flex: 1; padding: 8px; background: #efc701; color: #000; border: none; cursor: pointer; font-weight: bold; border-radius: 4px;">Abstain (${proposal.abstain_voting_power})</button>
              </div>
            </div>
          </div>
        `;
      }
    }

    proposalsHtml += `
      <div style="margin-top: 20px; text-align: right;">
        <button id="close-governance-btn" style="padding: 10px 20px; background: #666; color: #fff; border: none; cursor: pointer; border-radius: 4px; font-family: monospace;">Close</button>
      </div>
    `;

    panel.innerHTML = proposalsHtml;

    // Attach vote handlers
    const voteButtons = panel.querySelectorAll(".gov-vote-btn");
    voteButtons.forEach(btn => {
      btn.addEventListener("click", function() {
        const proposalId = parseInt(this.getAttribute("data-proposal"));
        const vote = this.getAttribute("data-vote");

        try {
          gov.castVote(proposalId, reputation.address || "anonymous", vote, rep.votingPower);
          overlay.remove();
          OnChainUI.showSuccess(`Vote cast on proposal #${proposalId}!`);
          // Refresh proposals
          OnChainUI.showGovernancePanel();
        } catch (error) {
          OnChainUI.showError("Error: " + error.message);
        }
      });
    });

    // Attach close handler
    const closeBtn = panel.querySelector("#close-governance-btn");
    closeBtn.addEventListener("click", function() {
      overlay.remove();
    });

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    console.log("[OnChainUI] Governance panel shown");
  }
};

// Initialize when Bitcoin mode is enabled
if (window.BITCOIN_MODE) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => OnChainUI.init());
  } else {
    OnChainUI.init();
  }
}

// Make available globally
window.OnChainUI = OnChainUI;

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = OnChainUI;
}
