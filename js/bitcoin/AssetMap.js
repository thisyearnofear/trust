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
    description: "Validates honestly, responds fairly to attacks",
    bitcoin_explanation: "Follows Nakamoto consensus: validates blocks, relays transactions, and extends the longest valid chain. Responds to attacks by rejecting invalid blocks."
  },
  all_d: {
    frame: 1,
    color: "#52537F",
    label: "51% Attacker",
    description: "Always tries to attack the network",
    bitcoin_explanation: "Attempts double-spending attacks by creating secret chain forks. Requires controlling >50% of network hashrate to succeed long-term."
  },
  all_c: {
    frame: 2,
    color: "#FF75FF",
    label: "Full Node",
    description: "Always follows consensus rules",
    bitcoin_explanation: "Strictly validates all blocks and transactions against consensus rules. Never creates invalid blocks or accepts rule violations."
  },
  grudge: {
    frame: 3,
    color: "#efc701",
    label: "Chain Validator",
    description: "Validates fairly, but permanently rejects attackers",
    bitcoin_explanation: "Validates blocks normally but permanently bans nodes that send invalid blocks. Maintains a blacklist of malicious peers."
  },
  prober: {
    frame: 4,
    color: "#f6b24c",
    label: "Adaptive Node",
    description: "Tests if others follow rules, adapts strategy",
    bitcoin_explanation: "Tests network compliance by occasionally sending invalid transactions. If peers reject them (good), continues honest validation. If peers accept them (bad), switches to attack mode."
  },
  tf2t: {
    frame: 5,
    color: "#88A8CE",
    label: "Lenient Node",
    description: "Tolerates mistakes, but punishes repeated attacks",
    bitcoin_explanation: "Tolerates occasional invalid blocks (network noise), but permanently rejects nodes that repeatedly violate consensus rules."
  },
  pavlov: {
    frame: 6,
    color: "#86C448",
    label: "Win-Stay Node",
    description: "Repeats previous action if it was rewarded",
    bitcoin_explanation: "Uses a simple reinforcement learning strategy: if previous action was rewarded (block accepted), repeats it; if punished (block rejected), switches strategy."
  },
  random: {
    frame: 7,
    color: "#FF5E5E",
    label: "Unpredictable Node",
    description: "Randomly validates or attacks – unreliable",
    bitcoin_explanation: "Unreliable node that randomly validates or attacks. Could represent buggy software, compromised nodes, or experimental clients."
  }
};

// Bitcoin-specific payoff labels
var BITCOIN_PAYOFFS = {
  R: {
    value: 2,
    label: "Valid Block Accepted",
    description: "Both nodes validate honestly – network secure, miners earn 6.25 BTC block reward + fees",
    tooltip: "When both nodes follow consensus rules, the network remains secure and both miners earn the full block reward (currently 6.25 BTC) plus transaction fees. This is the optimal outcome for network health."
  },
  S: {
    value: -1,
    label: "Block Orphaned",
    description: "You validate honestly but attacker's invalid block gets accepted – you lose mining reward",
    tooltip: "When you follow consensus rules but the other node attacks (e.g., withholds blocks or double-spends), your honestly mined block may get orphaned. You lose the block reward and transaction fees, resulting in a net loss."
  },
  T: {
    value: 3,
    label: "Double-Spend Success",
    description: "You attack while other validates – short-term profit, but reputation damage",
    tooltip: "When you attack the network (e.g., attempt a double-spend or withhold blocks) while the other node validates honestly, you may temporarily profit. However, this comes with long-term reputation damage and risk of being banned from the network."
  },
  P: {
    value: 0,
    label: "Mutual Attack",
    description: "Both nodes attack – network breaks down, nobody earns rewards",
    tooltip: "When both nodes attack the network (e.g., both attempt to double-spend or withhold blocks), the network becomes unstable. No blocks get confirmed, no rewards are earned, and the entire system suffers."
  }
};

// Bitcoin-specific game state labels
var BITCOIN_LABELS = {
  cooperate: "Validate & Relay",
  cheat: "Attack Network",
  you: "Your Node",
  them: "Other Node",
  match: "Block Validation",
  round: "Block",
  tournament: "Network Tournament",
  evolution: "Network Evolution",
  score: "Cumulative Reward",
  cooperate_description: "Validate blocks and relay transactions according to consensus rules",
  cheat_description: "Attempt to attack the network (double-spend, withhold blocks, etc.)",
  consensus_rules: "Nakamoto Consensus: longest valid chain wins, 10-minute block time, difficulty adjustment"
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
