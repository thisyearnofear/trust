/**
 * BITCOIN ADAPTATION: Narrative Mode Bootstrap
 * 
 * Initializes Bitcoin context before slides load:
 * 1. Injects Bitcoin terminology globally
 * 2. Initializes reputation tracking system
 * 3. Hooks into game logic to track cooperative/defective moves
 * 
 * This file sets the narrative mode and loads asset mappings
 * Must run BEFORE slide files are loaded
 */

// Set global narrative mode
var NARRATIVE_MODE = "bitcoin";

// Initialize Bitcoin context immediately
(function() {
  
  // Flag that we're running in Bitcoin mode
  window.BITCOIN_MODE = true;
  
  // WalletManager is now the unified state container
  // It's already initialized as a global singleton in WalletManager.js
  if (!window.walletManager) {
    throw new Error("[Bitcoin Mode] WalletManager not initialized. Check script loading order.");
  }
  console.log("[Bitcoin Mode] WalletManager initialized as unified state container");
  
  // Initialize on-chain UI (wallet display, transaction history)
  if (typeof OnChainUI !== 'undefined') {
    OnChainUI.init();
    console.log("[Bitcoin Mode] On-chain UI initialized");
  }
  
  // Override peep metadata with Bitcoin labels
  if (window.PEEP_METADATA) {
    var originalMetadata = PEEP_METADATA;
    PEEP_METADATA = {};
    
    for (var key in originalMetadata) {
      if (originalMetadata.hasOwnProperty(key)) {
        PEEP_METADATA[key] = originalMetadata[key];
        
        // Add Bitcoin context if available
        var bitcoinAgent = getBitcoinAgent(key);
        if (bitcoinAgent) {
          PEEP_METADATA[key].bitcoinLabel = bitcoinAgent.label;
          PEEP_METADATA[key].bitcoinDescription = bitcoinAgent.description;
        }
      }
    }
  }
  
  // Override payoff descriptions with Bitcoin context
  if (window.PD && window.PD.PAYOFFS) {
    window.PD.PAYOFFS_BITCOIN = {
      P: getBitcoinPayoff('P'),
      S: getBitcoinPayoff('S'),
      R: getBitcoinPayoff('R'),
      T: getBitcoinPayoff('T')
    };
    
    // Also update the default payoff values to match Bitcoin economics
    window.PD.PAYOFFS_DEFAULT = {
      P: 0, // punishment: neither of you get anything
      S: -1, // sucker: you put in coin, other didn't.
      R: 2, // reward: you both put 1 coin in, both got 3 back
      T: 3 // temptation: you put no coin, got 3 coins anyway
    };
    
    // Apply Bitcoin payoff values
    window.PD.PAYOFFS = JSON.parse(JSON.stringify(window.PD.PAYOFFS_DEFAULT));
  }
  
  // Helper to conditionally use Bitcoin or original text
  window.getLabel = function(labelId, isBitcoin) {
    if (isBitcoin === undefined) isBitcoin = NARRATIVE_MODE === "bitcoin";
    // This will be overridden by slide-specific logic
    return labelId;
  };
  
  // Log that Bitcoin mode is initialized
  console.log("[Bitcoin Mode] Narrative mode: " + NARRATIVE_MODE);
  console.log("[Bitcoin Mode] Asset mapping loaded");
  console.log("[Bitcoin Mode] Strategy wrapping ready");
  
  // Apply Bitcoin payoff labels immediately
  updateBitcoinPayoffLabels();
  
})();

/**
 * Helper function to load Bitcoin narrative file
 * Called by Loader system instead of words.html
 */
function loadBitcoinNarrative() {
  if (NARRATIVE_MODE !== "bitcoin") {
    console.warn("[Bitcoin Mode] Not in Bitcoin mode, skipping Bitcoin narrative load");
    return;
  }
  
  // Load words_bitcoin.html instead of words.html
  var loader = window.Loader;
  if (loader && loader.get) {
    // This will be called by the existing loader system
    console.log("[Bitcoin Mode] Loading Bitcoin narrative file...");
    // The actual loading is handled by the Loader.js system
    // which will fetch words_bitcoin.html when NARRATIVE_MODE is "bitcoin"
  }
}

/**
 * Override game payoff labels for Bitcoin context
 */
function updateBitcoinPayoffLabels() {
  if (!BITCOIN_PAYOFFS) {
    console.warn("[Bitcoin Mode] BITCOIN_PAYOFFS not available yet");
    return;
  }
  
  // This updates the UI labels dynamically
  if (window.PD && window.PD.PAYOFFS) {
    // Keep original payoff values but update descriptions
    for (var key in BITCOIN_PAYOFFS) {
      if (BITCOIN_PAYOFFS.hasOwnProperty(key)) {
        window.PD.PAYOFFS_DESCRIPTION = window.PD.PAYOFFS_DESCRIPTION || {};
        window.PD.PAYOFFS_DESCRIPTION[key] = BITCOIN_PAYOFFS[key];
        
        // Also update the Words.text for UI labels if available
        if (window.Words && window.Words.text) {
          var labelId = 'label_' + key.toLowerCase();
          if (window.Words.text[labelId]) {
            window.Words.text[labelId] = BITCOIN_PAYOFFS[key].label;
          }
        }
      }
    }
  }
  
  // Update the cooperate/attack labels to Bitcoin terminology
  if (window.Words && window.Words.text) {
    if (window.Words.text['label_cooperate']) {
      window.Words.text['label_cooperate'] = 'Validate & Relay';
    }
    if (window.Words.text['label_attack']) {
      window.Words.text['label_attack'] = 'Attack Network';
    }
    if (window.Words.text['label_cheat']) {
      window.Words.text['label_cheat'] = 'Attack Network';
    }
  }
  
  // Add tooltips to payoff labels in the UI
  addBitcoinPayoffTooltips();
  
  // Add consensus rules explanations
  addBitcoinConsensusExplanations();
}

/**
 * Add consensus rules explanations to the UI
 */
function addBitcoinConsensusExplanations() {
  if (!BITCOIN_LABELS || !document.body) {
    console.warn("[Bitcoin Mode] BITCOIN_LABELS or DOM not ready for consensus explanations");
    return;
  }
  
  // Update any elements that might contain consensus-related text
  var textElements = document.querySelectorAll('*');
  textElements.forEach(function(element) {
    if (element.textContent && element.textContent.includes('consensus')) {
      element.setAttribute('data-bitcoin-tooltip', BITCOIN_LABELS.consensus_rules);
      element.classList.add('bitcoin-consensus-explanation');
    }
  });
  
  console.log("[Bitcoin Mode] Consensus rules explanations added");
}

/**
 * Add tooltip elements to payoff labels for Bitcoin explanations
 */
function addBitcoinPayoffTooltips() {
  if (!BITCOIN_PAYOFFS || !document.body) {
    console.warn("[Bitcoin Mode] BITCOIN_PAYOFFS or DOM not ready for tooltips");
    return;
  }
  
  // Find all payoff label elements and add tooltips using CSS
  var payoffKeys = ['R', 'S', 'T', 'P'];
  payoffKeys.forEach(function(key) {
    var payoffData = BITCOIN_PAYOFFS[key];
    if (payoffData && payoffData.tooltip) {
      // Find elements that might contain this payoff label
      var textElements = document.querySelectorAll('*');
      textElements.forEach(function(element) {
        if (element.textContent && element.textContent.includes(payoffData.label)) {
          element.setAttribute('data-bitcoin-tooltip', payoffData.tooltip);
          element.setAttribute('data-payoff-key', key);
          element.classList.add('bitcoin-payoff-label');
        }
      });
    }
  });
  
  console.log("[Bitcoin Mode] Tooltips added to payoff labels");
}

/**
 * Update strategy labels for Bitcoin context
 */
function updateBitcoinStrategyLabels() {
  if (!BITCOIN_AGENTS) {
    console.warn("[Bitcoin Mode] BITCOIN_AGENTS not available yet");
    return;
  }
  
  // Update character labels in slides
  for (var strategyId in BITCOIN_AGENTS) {
    if (BITCOIN_AGENTS.hasOwnProperty(strategyId)) {
      var agent = BITCOIN_AGENTS[strategyId];
      
      // Find and update corresponding character div
      var charDiv = document.getElementById("character_" + strategyId);
      if (charDiv) {
        // Update the label
        var boldTag = charDiv.querySelector("b");
        if (boldTag) {
          boldTag.textContent = agent.label.toUpperCase();
        }
        
        // Update the description if available
        var descElements = charDiv.querySelectorAll(".desc");
        if (descElements.length > 0 && agent.bitcoin_explanation) {
          descElements[0].textContent = agent.bitcoin_explanation;
        }
      }
    }
  }
}

/**
 * Conditional rendering helper
 * Used by slides to show Bitcoin-specific content
 */
window.showBitcoinContent = function(elementId) {
  if (NARRATIVE_MODE !== "bitcoin") return;
  
  var elem = document.getElementById(elementId);
  if (elem) {
    elem.style.display = "block";
  }
};

window.hideBitcoinContent = function(elementId) {
  var elem = document.getElementById(elementId);
  if (elem) {
    elem.style.display = "none";
  }
};

/**
 * Hook into game logic to track moves
 * Called after PD.js is loaded
 */
function initReputationTracking() {
  if (!window.PD || !window.PD.playOneGame) {
    console.warn("[Bitcoin Mode] PD.playOneGame not available yet");
    return;
  }
  
  // Wrap the original playOneGame to track player moves
  var originalPlayOneGame = window.PD.playOneGame;
  
  window.PD.playOneGame = function(playerA, playerB) {
    // Call original game logic
    var result = originalPlayOneGame.call(this, playerA, playerB);
    
    // Track moves via WalletManager (unified state)
    // Only track if this is the user's move (playerA)
    // In interactive games, playerA is the user
    if (window.walletManager && playerA) {
      var moveA = playerA._lastMove;
      if (moveA) {
        var isCooperative = (moveA === window.PD.COOPERATE);
        window.walletManager.recordMove(isCooperative);
      }
    }
    
    return result;
  };
  
  console.log("[Bitcoin Mode] Reputation tracking initialized (via WalletManager)");
}

/**
 * Initialize on-chain reputation anchoring
 * Allows games to submit final reputation scores to Bitcoin
 */
function initOnChainReputation() {
  if (!window.CharmsGameClient) {
    console.warn("[Bitcoin Mode] CharmsGameClient not available yet");
    return;
  }
  
  // Create global function to submit reputation
  window.submitGameReputationOnChain = function(bitcoinAddress, appId) {
    if (!window.walletManager) {
      console.error("[Bitcoin Mode] WalletManager not initialized");
      return Promise.reject(new Error("WalletManager not initialized"));
    }
    
    if (!bitcoinAddress) {
      console.error("[Bitcoin Mode] Bitcoin address not provided");
      return Promise.reject(new Error("Bitcoin address required"));
    }
    
    try {
      // Initialize Charms client (follows official spec)
      // - Uses 2-tx pattern (commit + spell)
      // - Generates REAL Bitcoin transactions on Signet
      // - Ready for Unisat wallet signing + broadcast
      // Supports two modes:
      //   1. serverUrl - calls backend /api/charms/prove (browser)
      //   2. charmsAppBin - calls CLI directly (Node.js only)
      var charmsConfig = {
        // Option 1: If backend server is running, use it
        serverUrl: typeof window !== 'undefined' && window.location.hostname === 'localhost'
          ? "http://localhost:3000"
          : null,
        // Option 2: Fallback to local CLI (for Node.js environments)
        charmsAppBin: "/Users/udingethe/Dev/covenant/charm-apps/trust-game/target/release/trust-game"
      };
      
      var charmsClient = new CharmsGameClient(appId || "trust_game_v1", bitcoinAddress, charmsConfig);
      
      // Get current reputation summary from unified state
      var reputationData = window.walletManager.reputation;
      var tier = window.walletManager.reputation.tier;
      
      // Build game history for proof
      var gameHistory = reputationData.history.map(function(entry) {
        return {
          round: entry.round,
          isCooperative: entry.cooperative,
          timestamp: entry.timestamp
        };
      });
      
      // Prove game moves via Charms zkVM (generates ZK proof)
      var builder = getBitcoinTxBuilder();
      var proofPromise = builder.proveGameMoves({
        moves: gameHistory.map(function(h) { return h.isCooperative ? 0 : 1; }),
        opponentMoves: [], // Would need to track opponent moves
        totalMoves: reputationData.totalMoves,
        cooperativeMoves: reputationData.cooperativeMoves
      }, bitcoinAddress);

      // Submit reputation on-chain
      console.log("[Bitcoin Mode] Submitting reputation to Bitcoin...");
      return proofPromise.then(function(proof) {
        return charmsClient.submitReputationOnChain(gameHistory, {
          score: reputationData.score,
          tier: tier ? tier.label : "Neutral",
          votingPower: window.walletManager.getVotingPower(),
          proof: proof.proofHex
        });
      }).then(function(txid) {
        console.log("[Bitcoin Mode] Reputation anchored to Bitcoin:", txid);
        
        // Record transaction in unified state
        window.walletManager.address = bitcoinAddress;
        window.walletManager.recordTransaction(txid, "reputation");
        
        // Enable governance after reputation submission
        window.walletManager.enableGovernance();
        
        // Trigger UI update
        if (window.publish) {
          publish("reputation/anchored", [{
            address: bitcoinAddress,
            score: reputationData.score,
            tier: tier ? tier.label : "Neutral",
            txid: txid
          }]);
        }
        
        return txid;
      });
    } catch (error) {
      console.error("[Bitcoin Mode] Error submitting reputation:", error);
      return Promise.reject(error);
    }
  };
  
  // Hook to show governance voting after sandbox completes
  if (window.subscribe) {
    // Listen for sandbox completion
    subscribe("slideshow/slideChange", function(slideId) {
      // After sandbox slide completes, jump to governance
      if (slideId === "governance_intro") {
        // Prepare governance for voting
        if (window.GovernanceIntegration) {
          window.GovernanceIntegration.prepareGovernancePhase();
        }
        console.log("[Bitcoin Mode] Governance voting phase starting...");
      }
    });
  }
  
  // Hook into game completion to offer reputation submission
  if (window.PD && window.PD.publishGameResults) {
    var originalPublishGameResults = window.PD.publishGameResults;
    
    window.PD.publishGameResults = function() {
      // Call original
      originalPublishGameResults.apply(this, arguments);
      
      // After game results published, offer to save reputation on-chain
      if (window.walletManager) {
        var rep = window.walletManager.reputation;
        var tier = rep.tier || { label: "Neutral" };
        
        // Only offer if player has Bitcoin address
        if (window.PLAYER_BITCOIN_ADDRESS) {
          console.log("[Bitcoin Mode] Game complete. Reputation:", rep.score + "%");
          
          // Publish event that game is complete and ready to anchor
          if (window.publish) {
            publish("game/complete", [{
              reputation: rep.score,
              tier: tier.label,
              votingPower: window.walletManager.getVotingPower(),
              totalMoves: rep.totalMoves,
              cooperativeMoves: rep.cooperativeMoves
            }]);
          }
        }
      }
    };
  }
  
  console.log("[Bitcoin Mode] On-chain reputation anchoring ready");
}

// Run initialization on document ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    updateBitcoinPayoffLabels();
    updateBitcoinStrategyLabels();
    initReputationTracking();
    initOnChainReputation();
  });
} else {
  // DOM already loaded
  updateBitcoinPayoffLabels();
  updateBitcoinStrategyLabels();
  initReputationTracking();
  initOnChainReputation();
}

/**
 * Export for module systems
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NARRATIVE_MODE,
    loadBitcoinNarrative,
    updateBitcoinPayoffLabels,
    updateBitcoinStrategyLabels,
    initReputationTracking,
    initOnChainReputation,
    submitGameReputationOnChain: window.submitGameReputationOnChain,
    getWalletManager: function() { return window.walletManager; }
  };
}
