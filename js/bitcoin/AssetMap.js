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
    label: "Consensus Follower",
    description: "Follows the network consensus, responds to others",
    bitcoin_explanation: "Builds on the longest valid chain that other miners support. If others attempt a fork, responds by building on the majority chain. This is the strategy that Bitcoin's Nakamoto consensus rewards."
  },
  all_d: {
    frame: 1,
    color: "#52537F",
    label: "Fork Insister",
    description: "Always builds on own fork regardless of consensus",
    bitcoin_explanation: "Refuses to follow the majority consensus chain and instead mines on a minority fork (like BCH vs BTC disputes). Their blocks receive less network support, reducing profitability. Can succeed only if they gain significant hashrate majority."
  },
  all_c: {
    frame: 2,
    color: "#FF75FF",
    label: "Rule Validator",
    description: "Always strictly follows consensus rules",
    bitcoin_explanation: "Validates every block against Bitcoin's consensus rules without exception. Never participates in forks or rule changes. Represents the 'full node' that enforces consensus layer discipline."
  },
  grudge: {
    frame: 3,
    color: "#efc701",
    label: "Memory Keeper",
    description: "Follows consensus but remembers rule breakers",
    bitcoin_explanation: "Normally follows consensus, but if another miner breaks consensus rules, permanently treats them as an adversary. Models how nodes might coordinate to punish persistent rule violators by ignoring their blocks."
  },
  prober: {
    frame: 4,
    color: "#f6b24c",
    label: "Rule Tester",
    description: "Tests consensus commitment, then commits",
    bitcoin_explanation: "Initially tests whether other miners will respect consensus rules by sending a small challenge. If others maintain consensus (reject invalid blocks), commits to consensus. If others exploit rules, switches to fork strategy."
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
    label: "Both Follow Consensus",
    description: "Both miners build on the same chain – network secure, both earn full rewards",
    tooltip: "When both miners follow the consensus chain, their blocks are accepted by the entire network. Both earn the full block reward (currently 6.25 BTC) plus transaction fees. This coordination is what makes Bitcoin work."
  },
  S: {
    value: -1,
    label: "Minority Fork Orphaned",
    description: "You follow consensus, other builds minority fork – your blocks accepted, theirs orphaned",
    tooltip: "When you follow the consensus chain but another miner builds on a minority fork, the network rejects their blocks. You earn full rewards, they earn reduced rewards. This incentivizes consensus."
  },
  T: {
    value: 3,
    label: "Minority Fork Profit",
    description: "You build minority fork, other follows consensus – short-term profit but reduced acceptance",
    tooltip: "When you build a minority fork while others follow consensus, some nodes might follow you, but most follow the majority chain. Your blocks have reduced acceptance rate and lower long-term profitability than consensus."
  },
  P: {
    value: 0,
    label: "Network Split",
    description: "Both miners build different forks – network splits, both chains weaker, low rewards",
    tooltip: "When miners split into different consensus chains, the network divides its hashrate and validation power. Both forks become weaker, less secure, and less profitable. This is the worst outcome for everyone."
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
