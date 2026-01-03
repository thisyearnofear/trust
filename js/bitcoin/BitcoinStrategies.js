/**
 * BITCOIN ADAPTATION: Strategy Wrapping
 * 
 * Maps original game theory strategies to Bitcoin node types.
 * Used when BITCOIN_MODE is enabled to rename/relabel players.
 * 
 * Example: tft → HonestNode (same logic, Bitcoin terminology)
 */

// STRATEGY MAPPING: Original game theory name → Bitcoin node type
var BITCOIN_STRATEGY_MAP = {
  "tft": "HonestNode",           // Copycat → Honest Node (validates fairly, mirrors opponent)
  "all_c": "FullNode",           // Always Cooperate → Full Node (always follows consensus)
  "all_d": "Attacker51",         // Always Cheat → 51% Attacker (always attacks)
  "grudge": "ChainValidator",    // Grudger → Chain Validator (fair but remembers attackers)
  "prober": "AdaptiveNode",      // Detective → Adaptive Node (probes then adapts)
  "tf2t": "ForgivingNode",       // Copykitten → Forgiving Node (more forgiving of mistakes)
  "pavlov": "SimplexNode",       // Simpleton → Simplex Node (win-stay, lose-shift)
  "random": "UnpredictableNode"  // Random → Unpredictable Node
};

// Get Bitcoin strategy name (or original if not in Bitcoin mode)
function getBitcoinStrategyName(originalId) {
  if (!BITCOIN_MODE || !BITCOIN_STRATEGY_MAP[originalId]) {
    return originalId;
  }
  return BITCOIN_STRATEGY_MAP[originalId];
}

/**
 * HONEST NODE
 * Validates correctly first, then mirrors opponent's last move
 * Bitcoin context: Tit-for-tat on consensus rules
 */
function Logic_HonestNode() {
  // Delegate to existing tit-for-tat logic
  var tftLogic = new Logic_tft();
  
  this.play = tftLogic.play;
  this.remember = tftLogic.remember;
  this.resetLogic = tftLogic.resetLogic;
  
  // Bitcoin metadata
  this.bitcoinName = "Honest Node";
  this.bitcoinDescription = "Validates correctly, copies opponent's last move";
}

/**
 * 51% ATTACKER
 * Always attacks – tries to exploit the network
 * Bitcoin context: Always attempts double-spending or block withholding
 */
function Logic_51Attacker() {
  // Delegate to existing always-defect logic
  var adLogic = new Logic_all_d();
  
  this.play = adLogic.play;
  this.remember = adLogic.remember;
  this.resetLogic = adLogic.resetLogic;
  
  // Bitcoin metadata
  this.bitcoinName = "51% Attacker";
  this.bitcoinDescription = "Always attempts to attack the network for profit";
}

/**
 * FULL NODE
 * Always follows consensus rules
 * Bitcoin context: Naive validator that trusts the majority
 */
function Logic_FullNode() {
  // Delegate to existing always-cooperate logic
  var acLogic = new Logic_all_c();
  
  this.play = acLogic.play;
  this.remember = acLogic.remember;
  this.resetLogic = acLogic.resetLogic;
  
  // Bitcoin metadata
  this.bitcoinName = "Full Node";
  this.bitcoinDescription = "Always follows consensus rules, trusts the network";
}

/**
 * CHAIN VALIDATOR
 * Validates fairly, but permanently rejects attackers
 * Bitcoin context: Hardening against specific malicious nodes
 */
function Logic_ChainValidator() {
  // Delegate to existing grudger logic
  var grudgeLogic = new Logic_grudge();
  
  this.play = grudgeLogic.play;
  this.remember = grudgeLogic.remember;
  this.resetLogic = grudgeLogic.resetLogic;
  
  // Bitcoin metadata
  this.bitcoinName = "Chain Validator";
  this.bitcoinDescription = "Validates fairly, but permanently blacklists attackers";
}

/**
 * ADAPTIVE NODE
 * Tests opponent's trustworthiness, then adapts strategy
 * Bitcoin context: Performs consensus validation tests before committing
 */
function Logic_AdaptiveNode() {
  // Delegate to existing prober logic
  var proberLogic = new Logic_prober();
  
  this.play = proberLogic.play;
  this.remember = proberLogic.remember;
  this.resetLogic = proberLogic.resetLogic;
  
  // Bitcoin metadata
  this.bitcoinName = "Adaptive Node";
  this.bitcoinDescription = "Tests rules compliance, then adapts strategy";
}

/**
 * LENIENT NODE
 * Tolerates one attack, but punishes repeated attacks
 * Bitcoin context: Allows for honest mistakes/network delays
 */
function Logic_LenientNode() {
  // Delegate to existing "two-tit-for-tat" logic
  var tf2tLogic = new Logic_tf2t();
  
  this.play = tf2tLogic.play;
  this.remember = tf2tLogic.remember;
  this.resetLogic = tf2tLogic.resetLogic;
  
  // Bitcoin metadata
  this.bitcoinName = "Lenient Node";
  this.bitcoinDescription = "Tolerates mistakes, retaliates after 2 attacks";
}

/**
 * WIN-STAY NODE
 * Repeats actions that were rewarded, changes if punished
 * Bitcoin context: Adjusts block propagation strategy based on rewards
 */
function Logic_WinStayNode() {
  // Delegate to existing Pavlov logic
  var pavlovLogic = new Logic_pavlov();
  
  this.play = pavlovLogic.play;
  this.remember = pavlovLogic.remember;
  this.resetLogic = pavlovLogic.resetLogic;
  
  // Bitcoin metadata
  this.bitcoinName = "Win-Stay Node";
  this.bitcoinDescription = "Repeats rewarded actions, changes when punished";
}

/**
 * UNPREDICTABLE NODE
 * Randomly validates or attacks
 * Bitcoin context: Unreliable node with unstable consensus rules
 */
function Logic_UnpredictableNode() {
  // Delegate to existing random logic
  var randomLogic = new Logic_random();
  
  this.play = randomLogic.play;
  this.remember = randomLogic.remember;
  this.resetLogic = randomLogic.resetLogic;
  
  // Bitcoin metadata
  this.bitcoinName = "Unpredictable Node";
  this.bitcoinDescription = "Randomly validates or attacks – unreliable network participant";
}

/**
 * Mapping from original strategy names to Bitcoin strategy names
 * Used by UI to determine which strategy class to instantiate
 */
var STRATEGY_BITCOIN_MAPPING = {
  'tft': 'HonestNode',
  'all_d': '51Attacker',
  'all_c': 'FullNode',
  'grudge': 'ChainValidator',
  'prober': 'AdaptiveNode',
  'tf2t': 'LenientNode',
  'pavlov': 'WinStayNode',
  'random': 'UnpredictableNode'
};

/**
 * Factory function to get Bitcoin strategy by name
 */
function createBitcoinStrategy(strategyId) {
  switch(strategyId) {
    case 'tft': return new Logic_HonestNode();
    case 'all_d': return new Logic_51Attacker();
    case 'all_c': return new Logic_FullNode();
    case 'grudge': return new Logic_ChainValidator();
    case 'prober': return new Logic_AdaptiveNode();
    case 'tf2t': return new Logic_LenientNode();
    case 'pavlov': return new Logic_WinStayNode();
    case 'random': return new Logic_UnpredictableNode();
    default: return new Logic_tft(); // fallback to original
  }
}

/**
 * Create window aliases for Bitcoin strategy names
 * So Iterated.js can find Logic_HonestNode, Logic_51Attacker, etc.
 */
if (typeof window !== 'undefined') {
  // Alias Bitcoin strategy names to their implementations
  window.Logic_HonestNode = Logic_HonestNode;
  window.Logic_Attacker51 = Logic_51Attacker;
  window.Logic_FullNode = Logic_FullNode;
  window.Logic_ChainValidator = Logic_ChainValidator;
  window.Logic_AdaptiveNode = Logic_AdaptiveNode;
  window.Logic_ForgivingNode = Logic_LenientNode;
  window.Logic_SimplexNode = Logic_WinStayNode;
  window.Logic_UnpredictableNode = Logic_UnpredictableNode;
}

/**
 * Export for module systems
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Logic_HonestNode,
    Logic_51Attacker,
    Logic_FullNode,
    Logic_ChainValidator,
    Logic_AdaptiveNode,
    Logic_LenientNode,
    Logic_WinStayNode,
    Logic_UnpredictableNode,
    BITCOIN_STRATEGY_MAP,
    getBitcoinStrategyName,
    createBitcoinStrategy
  };
}
