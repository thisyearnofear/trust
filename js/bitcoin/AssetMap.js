/**
 * BITCOIN ADAPTATION: Asset Mapping
 * 
 * Remap existing game sprites to Bitcoin network concepts
 * Single source of truth for Bitcoin narrative labels
 * 
 * No new assets created – reuses existing sprites with new semantics
 */

// Map existing peep sprites (frames 0-7) to Bitcoin node types
var BITCOIN_AGENTS = {
  tft: {
    frame: 0,
    color: "#4089DD",
    label: "Honest Node",
    description: "Validates honestly, responds fairly to attacks"
  },
  all_d: {
    frame: 1,
    color: "#52537F",
    label: "51% Attacker",
    description: "Always tries to attack the network"
  },
  all_c: {
    frame: 2,
    color: "#FF75FF",
    label: "Full Node",
    description: "Always follows consensus rules"
  },
  grudge: {
    frame: 3,
    color: "#efc701",
    label: "Chain Validator",
    description: "Validates fairly, but permanently rejects attackers"
  },
  prober: {
    frame: 4,
    color: "#f6b24c",
    label: "Adaptive Node",
    description: "Tests if others follow rules, adapts strategy"
  },
  tf2t: {
    frame: 5,
    color: "#88A8CE",
    label: "Lenient Node",
    description: "Tolerates mistakes, but punishes repeated attacks"
  },
  pavlov: {
    frame: 6,
    color: "#86C448",
    label: "Win-Stay Node",
    description: "Repeats previous action if it was rewarded"
  },
  random: {
    frame: 7,
    color: "#FF5E5E",
    label: "Unpredictable Node",
    description: "Randomly validates or attacks – unreliable"
  }
};

// Bitcoin-specific payoff labels
var BITCOIN_PAYOFFS = {
  R: {
    value: 2,
    label: "Valid Block",
    description: "Both nodes validate honestly – network is secure & rewarded"
  },
  S: {
    value: -1,
    label: "Orphaned Block",
    description: "You validate but get overridden by attacker – mining loss"
  },
  T: {
    value: 3,
    label: "Double-Spend Success",
    description: "You attack while other validates – short-term gain, long-term risk"
  },
  P: {
    value: 0,
    label: "Mutual Attack",
    description: "Both attack – network breaks, nobody profits"
  }
};

// Bitcoin-specific game state labels
var BITCOIN_LABELS = {
  cooperate: "Follow Consensus",
  cheat: "Attack Network",
  you: "Your Node",
  them: "Other Node",
  match: "Interaction",
  round: "Block",
  tournament: "Network Tournament",
  evolution: "Network Evolution",
  score: "Cumulative Reward"
};

/**
 * Helper function to get Bitcoin agent by strategy ID
 */
function getBitcoinAgent(strategyId) {
  return BITCOIN_AGENTS[strategyId] || null;
}

/**
 * Helper function to get Bitcoin payoff label
 */
function getBitcoinPayoff(payoffKey) {
  return BITCOIN_PAYOFFS[payoffKey] || null;
}

/**
 * Export for module systems (if used)
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BITCOIN_AGENTS,
    BITCOIN_PAYOFFS,
    BITCOIN_LABELS,
    getBitcoinAgent,
    getBitcoinPayoff
  };
}
