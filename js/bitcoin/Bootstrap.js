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
  
  // Initialize reputation system
  window.playerReputation = initGameReputation();
  console.log("[Bitcoin Mode] Reputation system initialized");
  
  // Initialize governance system
  window.gameGovernance = initGameGovernance();
  console.log("[Bitcoin Mode] Governance system initialized");
  
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
      }
    }
  }
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
    
    // Track moves for reputation system
    // Only track if this is the user's move (playerA)
    // In interactive games, playerA is the user
    if (window.playerReputation && playerA) {
      var moveA = playerA._lastMove;
      if (moveA) {
        var isCooperative = (moveA === window.PD.COOPERATE);
        window.playerReputation.recordMove(isCooperative);
      }
    }
    
    return result;
  };
  
  console.log("[Bitcoin Mode] Reputation tracking initialized");
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
    if (!window.playerReputation) {
      console.error("[Bitcoin Mode] Reputation system not initialized");
      return Promise.reject(new Error("Reputation system not initialized"));
    }
    
    try {
      // Initialize Charms client (follows official spec)
      // - Uses 2-tx pattern (commit + spell)
      // - Generates proofs locally (no 5-min `charms spell prove` wait for hackathon)
      // - Ready for bitcoin-cli signing + broadcast
      var charmsConfig = {
        charmsAppBin: "/Users/udingethe/Dev/trust/charm-apps/trust-game/target/release/trust-game",
        mockMode: true // For hackathon demo; post-launch: use real spell check
      };
      
      var charmsClient = new CharmsGameClient(appId || "trust_game_v1", bitcoinAddress, charmsConfig);
      
      // Get current reputation summary
      var reputationData = window.playerReputation.getSummary();
      
      // Build game history for proof
      var gameHistory = reputationData.history.map(function(entry) {
        return {
          round: entry.round,
          isCooperative: entry.cooperative,
          timestamp: entry.timestamp
        };
      });
      
      // Submit reputation on-chain
      console.log("[Bitcoin Mode] Submitting reputation to Bitcoin...");
      return charmsClient.submitReputationOnChain(gameHistory, {
        score: reputationData.score,
        tier: reputationData.tier.label,
        votingPower: reputationData.votingPower
      }).then(function(txid) {
        console.log("[Bitcoin Mode] Reputation anchored to Bitcoin:", txid);
        
        // Store Bitcoin address and transaction ID
        window.playerReputation.address = bitcoinAddress;
        window.playerReputation._lastReputationTxid = txid;
        
        // Trigger UI update
        if (window.publish) {
          publish("reputation/anchored", [{
            address: bitcoinAddress,
            score: reputationData.score,
            tier: reputationData.tier.label,
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
      if (window.playerReputation) {
        var rep = window.playerReputation.getSummary();
        
        // Only offer if player has Bitcoin address
        if (window.PLAYER_BITCOIN_ADDRESS) {
          console.log("[Bitcoin Mode] Game complete. Reputation:", rep.score + "%");
          
          // Publish event that game is complete and ready to anchor
          if (window.publish) {
            publish("game/complete", [{
              reputation: rep.score,
              tier: rep.tier.label,
              votingPower: rep.votingPower,
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
    submitGameReputationOnChain: window.submitGameReputationOnChain
  };
}
