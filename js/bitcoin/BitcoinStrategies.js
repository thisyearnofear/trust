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
  "tft": "ResponsiveValidator",       // Copycat → Responsive Validator (validates by rules, mirrors opponent's strategy)
  "all_c": "ConsensusFollower",       // Always Cooperate → Consensus Follower (always aligns with consensus rules)
  "all_d": "DivergentMiner",          // Always Cheat → Divergent Miner (always builds minority forks)
  "grudge": "PenalizingValidator",    // Grudger → Penalizing Validator (validates fairly, permanently reduces peer reputation after divergence)
  "prober": "AdaptiveValidator",      // Detective → Adaptive Validator (tests alignment, then commits to strategy)
  "tf2t": "ForgivingValidator",       // Copykitten → Forgiving Validator (tolerates occasional divergence)
  "pavlov": "ReactiveValidator",      // Simpleton → Reactive Validator (mirrors network success/failure)
  "random": "UnpredictableValidator"  // Random → Unpredictable Validator (follows no consistent strategy)
};

// Get Bitcoin strategy name (or original if not in Bitcoin mode)
function getBitcoinStrategyName(originalId) {
  if (!BITCOIN_MODE || !BITCOIN_STRATEGY_MAP[originalId]) {
    return originalId;
  }
  return BITCOIN_STRATEGY_MAP[originalId];
}

// Get original strategy name from Bitcoin name (reverse mapping)
function getOriginalStrategyName(bitcoinName) {
  if (!BITCOIN_MODE) {
    return bitcoinName;
  }
  // Reverse lookup: find the original ID from the Bitcoin name
  for (var originalId in BITCOIN_STRATEGY_MAP) {
    if (BITCOIN_STRATEGY_MAP[originalId] === bitcoinName) {
      return originalId;
    }
  }
  // If not found in map, return as-is (might already be original name)
  return bitcoinName;
}

/**
 * RESPONSIVE VALIDATOR
 * Validates by rules first, then mirrors opponent's last move
 * Bitcoin context: Reciprocal response to network strategies
 */
function Logic_ResponsiveValidator() {
  // Delegate to existing tit-for-tat logic
  var tftLogic = new Logic_tft();
  
  this.play = tftLogic.play;
  this.remember = tftLogic.remember;
  this.resetLogic = tftLogic.resetLogic;
  
  // Bitcoin metadata
  this.bitcoinName = "Responsive Validator";
  this.bitcoinDescription = "Validates according to rules, mirrors opponent's strategy";
}

/**
 * DIVERGENT MINER
 * Always builds minority forks regardless of consensus
 * Bitcoin context: Pursues divergent path independent of network
 */
function Logic_DivergentMiner() {
  // Delegate to existing always-defect logic
  var adLogic = new Logic_all_d();
  
  this.play = adLogic.play;
  this.remember = adLogic.remember;
  this.resetLogic = adLogic.resetLogic;
  
  // Bitcoin metadata
  this.bitcoinName = "Divergent Miner";
  this.bitcoinDescription = "Always builds minority forks, ignoring consensus alignment";
}

/**
 * CONSENSUS FOLLOWER
 * Always aligns with consensus rules without adaptation
 * Bitcoin context: Deterministic validator with no strategic flexibility
 */
function Logic_ConsensusFollower() {
  // Delegate to existing always-cooperate logic
  var acLogic = new Logic_all_c();
  
  this.play = acLogic.play;
  this.remember = acLogic.remember;
  this.resetLogic = acLogic.resetLogic;
  
  // Bitcoin metadata
  this.bitcoinName = "Consensus Follower";
  this.bitcoinDescription = "Always aligns with consensus rules, regardless of incentives";
}

/**
 * PENALIZING VALIDATOR
 * Validates by rules, but permanently reduces reputation after one divergence
 * Bitcoin context: Peer reputation scoring and block relay de-prioritization
 */
function Logic_PenalizingValidator() {
  // Delegate to existing grudger logic
  var grudgeLogic = new Logic_grudge();
  
  this.play = grudgeLogic.play;
  this.remember = grudgeLogic.remember;
  this.resetLogic = grudgeLogic.resetLogic;
  
  // Bitcoin metadata
  this.bitcoinName = "Penalizing Validator";
  this.bitcoinDescription = "Validates fairly, permanently reduces reputation and disconnects from peers that diverge";
}

/**
 * ADAPTIVE VALIDATOR
 * Tests opponent's alignment, then commits to matching strategy
 * Bitcoin context: Probes consensus compliance before deciding response
 */
function Logic_AdaptiveValidator() {
  // Delegate to existing prober logic
  var proberLogic = new Logic_prober();
  
  this.play = proberLogic.play;
  this.remember = proberLogic.remember;
  this.resetLogic = proberLogic.resetLogic;
  
  // Bitcoin metadata
  this.bitcoinName = "Adaptive Validator";
  this.bitcoinDescription = "Tests alignment strategy, then commits to matching response";
}

/**
 * FORGIVING VALIDATOR
 * Tolerates occasional divergence, but punishes persistent divergence
 * Bitcoin context: Allows for network delays and brief rule deviations
 */
function Logic_ForgivingValidator() {
  // Delegate to existing "two-tit-for-tat" logic
  var tf2tLogic = new Logic_tf2t();
  
  this.play = tf2tLogic.play;
  this.remember = tf2tLogic.remember;
  this.resetLogic = tf2tLogic.resetLogic;
  
  // Bitcoin metadata
  this.bitcoinName = "Forgiving Validator";
  this.bitcoinDescription = "Tolerates occasional divergence, rejects persistent divergence";
}

/**
 * REACTIVE VALIDATOR
 * Repeats actions that increased payoff, changes actions that decreased payoff
 * Bitcoin context: Adjusts validation/relay strategy based on network rewards
 */
function Logic_ReactiveValidator() {
  // Delegate to existing Pavlov logic
  var pavlovLogic = new Logic_pavlov();
  
  this.play = pavlovLogic.play;
  this.remember = pavlovLogic.remember;
  this.resetLogic = pavlovLogic.resetLogic;
  
  // Bitcoin metadata
  this.bitcoinName = "Reactive Validator";
  this.bitcoinDescription = "Repeats profitable actions, changes unprofitable ones";
}

/**
 * UNPREDICTABLE VALIDATOR
 * Randomly validates or diverges with no pattern
 * Bitcoin context: Unreliable node with unstable consensus adherence
 */
function Logic_UnpredictableValidator() {
  // Delegate to existing random logic
  var randomLogic = new Logic_random();
  
  this.play = randomLogic.play;
  this.remember = randomLogic.remember;
  this.resetLogic = randomLogic.resetLogic;
  
  // Bitcoin metadata
  this.bitcoinName = "Unpredictable Validator";
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
    case 'tft': return new Logic_ResponsiveValidator();
    case 'all_d': return new Logic_DivergentMiner();
    case 'all_c': return new Logic_ConsensusFollower();
    case 'grudge': return new Logic_PenalizingValidator();
    case 'prober': return new Logic_AdaptiveValidator();
    case 'tf2t': return new Logic_ForgivingValidator();
    case 'pavlov': return new Logic_ReactiveValidator();
    case 'random': return new Logic_UnpredictableValidator();
    default: return new Logic_tft(); // fallback to original
  }
}

/**
 * Create window aliases for Bitcoin strategy names
 * So other code can find Logic_ResponsiveValidator, etc.
 */
if (typeof window !== 'undefined') {
  // Alias Bitcoin strategy names to their implementations
  window.Logic_ResponsiveValidator = Logic_ResponsiveValidator;
  window.Logic_DivergentMiner = Logic_DivergentMiner;
  window.Logic_ConsensusFollower = Logic_ConsensusFollower;
  window.Logic_PenalizingValidator = Logic_PenalizingValidator;
  window.Logic_AdaptiveValidator = Logic_AdaptiveValidator;
  window.Logic_ForgivingValidator = Logic_ForgivingValidator;
  window.Logic_ReactiveValidator = Logic_ReactiveValidator;
  window.Logic_UnpredictableValidator = Logic_UnpredictableValidator;
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
    getOriginalStrategyName,
    createBitcoinStrategy
  };
}
