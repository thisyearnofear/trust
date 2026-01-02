# Architecture & Technical Design

## System Overview

**Covenant: Bitcoin Governance Through Game Theory** is a game-theory simulator adapted to teach Bitcoin's consensus model through zero-knowledge proof integration.

```
┌─────────────────────────────────────────────────────────────┐
│ Game Layer: Play Prisoner's Dilemma                         │
│ - 8 strategies (Honest Node, 51% Attacker, etc.)           │
│ - Standard payoff matrix (R=2, S=-1, T=3, P=0)             │
│ - Educational narrative (game teaches Bitcoin principles)  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Reputation Layer: Track Player Behavior                     │
│ - Cooperativeness % (0-100)                                 │
│ - Reputation tiers (Suspicious/Neutral/Trusted)            │
│ - Voting power calculation                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Governance Layer: Community Voting                          │
│ - Propose rule changes (payoff matrix, parameters)         │
│ - Reputation-weighted voting                               │
│ - Proposal execution on-chain                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Charms Layer: Cross-App Integration & On-Chain Anchoring   │
│ - Other apps query reputation via CharmsClientAPI          │
│ - Game moves/reputation anchored to Bitcoin                │
│ - Zero-knowledge proofs verify authenticity                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Bitcoin: Immutable Record & Consensus                       │
│ - Witness data embedded in Taproot transactions            │
│ - Proof verification by any Charms client                  │
│ - No protocol changes to Bitcoin                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Game Layer: Bitcoin Game Theory

### Narrative Mapping

The game teaches Bitcoin through game theory analogy:

| Original Concept | Bitcoin Concept | Example |
|------------------|-----------------|---------|
| **Cooperate** | Follow Consensus | Validate transactions honestly |
| **Defect** | Attack Network | Double-spending attempt |
| **Opponent** | Network Node | Another validator |
| **Score** | Reward | Mining rewards + fees |

### Strategies as Node Types

| Strategy | Bitcoin Node Type | Behavior |
|----------|-------------------|----------|
| Tit-for-Tat | Honest Node | Validates fairly, mirrors behavior |
| Always Defect | 51% Attacker | Always exploits the network |
| Always Cooperate | Full Node | Trusts consensus |
| Grudge | Chain Validator | Remembers attackers permanently |

### Payoff Matrix (Default)

```
                 Opponent Cooperates | Opponent Defects
You Cooperate:        R = +2          |      S = -1
You Defect:           T = +3          |      P = 0
```

**Bitcoin Interpretation:**
- R (Reward): Both validate → network secure, miners rewarded
- S (Sucker): You validate, they attack → your block orphaned
- T (Temptation): You attack, they validate → short-term profit
- P (Punishment): Both attack → network breaks

**Key Insight:** Honest cooperation dominates over time because T only works once, R compounds infinitely.

---

## Reputation Layer

### Calculation

```
Reputation Score = (cooperative_moves / total_moves) * 100
```

### Tiers

| Score | Tier | Voting Multiplier |
|-------|------|-------------------|
| 75-100% | Trusted | 1.5x |
| 50-74% | Neutral | 1.0x |
| 0-49% | Suspicious | 0.5x |

### Implementation

**JavaScript** (`GameReputation.js`):
- Tracks individual moves during gameplay
- Calculates score on-demand
- Determines tier based on score
- Computes voting power

**Rust** (`lib.rs`):
- Identical calculation for on-chain verification
- `PlayerReputation::calculate_from_moves()`
- No duplication: same formula everywhere

---

## Governance Layer

### Proposal System

Players can propose changes to game parameters:

```rust
pub enum ProposalType {
    ChangePayoff,      // Modify R, S, T, P values
    AddStrategy,       // Add new player strategy
    ChangeGovernance,  // Modify voting parameters
}
```

### Voting

```
Vote weight = reputation_score * tier_multiplier

Example:
- Trusted player (score=80): 80 * 1.5 = 120 votes
- Neutral player (score=60): 60 * 1.0 = 60 votes
- Suspicious player (score=30): 30 * 0.5 = 15 votes

Proposal passes if: yes_votes > (total_votes / 2)
```

### Execution

When a proposal passes:
1. On-chain contract updates game parameters
2. Next game uses new rules
3. Governance decision becomes Bitcoin-enforced

---

## Cross-App Integration

### CharmsClientAPI

Other Bitcoin applications can query this governance system:

```javascript
const api = new CharmsClientAPI(appId);

// Query user reputation
const rep = await api.getUserReputation("tb1q...");
// Returns: { score: 80, tier: "Trusted", votingPower: 120 }

// Check proposal status
const proposal = await api.getProposalStatus(1);
// Returns: { id: 1, description: "...", yes_votes: 350, has_passed: true }

// Build eligibility proof
const proof = await api.buildReputationProof("tb1q...", "Neutral");
// Other apps can require min reputation tier
```

### Use Cases

1. **NFT Minting:** Require Trusted tier to mint
2. **DeFi Lending:** Higher rates for Neutral, lower for Trusted
3. **Governance Participation:** Only Neutral+ can vote
4. **Community Access:** Suspicious players require higher deposits

---

## On-Chain Anchoring

### Reputation Submission

After a game completes:

```javascript
// Player calls:
submitGameReputationOnChain(bitcoinAddress, appId)

// This:
// 1. Generates zero-knowledge proof of game history
// 2. Embeds proof + reputation in Bitcoin transaction
// 3. Returns Bitcoin txid
// 4. Reputation now permanently recorded
```

### Charms Spell Structure

```json
{
  "appId": "trust_game_v1",
  "type": "reputation_anchor",
  "player": "tb1q...",
  "reputation_score": 80,
  "reputation_tier": "Trusted",
  "voting_power": 120,
  "total_moves": 15,
  "cooperative_moves": 12,
  "proof": { ... zk proof ... }
}
```

### Witness Encoding

Spells embedded in Bitcoin Taproot witness:

```
OP_FALSE OP_IF <spell_data> OP_ENDIF
```

This allows ~10KB of proof data per transaction input without changing Bitcoin consensus rules.

---

## Smart Contract Layer

### Game Validation (`lib.rs`)

```rust
pub fn validate_move(
    state: &GameState,
    move_1: Move,
    move_2: Move,
    claimed_payoff_1: i32,
    claimed_payoff_2: i32,
) -> bool {
    // Verify round in bounds
    // Calculate correct payoffs
    // Verify claims match calculated values
    // Verify payoff matrix is reasonable
}
```

### Governance Module (`governance.rs`)

```rust
pub struct GovernanceState {
    pub proposals: Vec<GovernanceProposal>,
    pub voting_rounds: Vec<VotingRound>,
    pub dependent_apps: Vec<DependentApp>,  // Cross-app registry
}

// Key methods:
impl GovernanceState {
    pub fn create_proposal(...) -> u32          // Submit proposal
    pub fn vote(...) -> Result<(), String>      // Cast reputation-weighted vote
    pub fn execute_proposal(...) -> Result<bool> // Execute passed proposal
    pub fn register_dependent_app(...)          // Other apps declare dependency
}
```

---

## File Organization

```
/trust/
├── index.html                 Entry point
├── words_bitcoin.html         Bitcoin-themed narrative (enhanced)
├── js/
│   ├── bitcoin/
│   │   ├── GameReputation.js        Reputation tracking
│   │   ├── GovernanceUI.js          Voting interface
│   │   ├── CharmsClient.js          Move submission
│   │   ├── CharmsClientAPI.js       Cross-app API
│   │   ├── Bootstrap.js             Bitcoin mode initialization
│   │   └── OnChainUI.js             Transaction display
│   ├── core/                        Original game logic (untouched)
│   ├── slides/
│   │   ├── 0-7, 9_Slides_*.js      Original game slides
│   │   ├── 8_Slides_Conclusion.js   Tier-specific endings
│   │   ├── B_Slides_ReputationReveal.js  Reputation reveal (NEW)
│   │   └── A_Slides_Governance.js   Voting with dynamic data injection
│   └── sims/                        Game simulations (untouched)
├── charm-apps/
│   └── trust-game/
│       ├── src/
│       │   ├── lib.rs              Game validation
│       │   └── governance.rs       Governance + voting
│       ├── tests/
│       └── Cargo.toml
├── css/
│   └── governance.css             Voting UI styling
└── docs/
    ├── ARCHITECTURE.md            This file
    ├── ROADMAP.md                 Implementation phases
    └── QUICKSTART.md              How to run
```

---

## Data Flow: Game → Reputation → Governance → Bitcoin

```
1. PLAY GAME
   User plays rounds, making COOPERATE/DEFECT choices
   ↓
2. TRACK REPUTATION
   Each move recorded in GameReputation.js
   Reputation calculated: cooperative_moves / total_moves * 100
   ↓
3. GAME COMPLETES
   Bootstrap.js detects game end
   Publishes "game/complete" event
   ↓
4. SUBMIT REPUTATION
   submitGameReputationOnChain() called
   CharmsClient.js generates zk proof
   Reputation embedded in Bitcoin transaction witness
   Txid returned
   ↓
5. ACCESS GOVERNANCE
   GovernanceUI displays active proposals
   User's voting power = rep_score * tier_multiplier
   User can vote (weighted by reputation)
   ↓
6. EXECUTE PROPOSAL
   If proposal passes (yes_votes > 50%)
   governance.rs executes on-chain
   Next game uses updated rules
   ↓
7. CROSS-APP QUERY
   Other Charms apps call CharmsClientAPI
   Query user's reputation tier
   Gate features or adjust behavior
   ↓
8. IMMUTABLE RECORD
   All moves/reputation/votes recorded on Bitcoin
   Proofs verify authenticity
   Anyone can audit complete history
```

---

## Core Principles

### Enhancement, Not Fork
- No new assets (reuses existing sprites, sounds)
- No code duplication (strategies inherit)
- Conditional narrative (single codebase, two modes)
- Original game plays unchanged

### Single Source of Truth
- Game payoffs defined once in config
- Reputation formula identical in JS and Rust
- Strategy validation reused from original
- No reimplementation

### Modular Architecture
- Game works offline (no blockchain needed)
- Reputation works without governance
- Governance works without moves
- Cross-app API works independently

### Zero-Knowledge Verification
- Proofs don't reveal game details
- Anyone can verify without replaying
- Recursive proofs compress history
- Stateless client verification

---

## Testing

All governance code tested (16/16 tests passing):

**Reputation Tests:**
- Score calculation (Trusted, Neutral, Suspicious)
- Tier determination
- Voting power calculation
- No-move cases (neutral starting reputation)

**Voting Tests:**
- Proposal creation
- Vote casting
- Double-vote prevention
- Vote tallying
- Proposal execution
- Passing/failing logic

**Cross-App Tests:**
- App registration
- Duplicate app detection
- Tier eligibility checking
- Dependent app querying

---

## Narrative & User Experience (v2 Improvements)

### Story Arc Enhancement

The narrative now creates a cohesive journey: **problem framing → game mechanics → earned reputation → governance power → shaped Bitcoin.**

**Key improvements:**

1. **Problem & Solution Framing**
   - Intro explains the Byzantine Generals Problem (how to reach consensus without a trusted authority)
   - Shows why previous approaches (signatures, hashing) failed
   - Frames Bitcoin's breakthrough: game theory + distributed ledger = solved without central authority
   - Sets up the game as the actual mechanism Bitcoin uses

2. **Bitcoin Context Throughout**
   - Game mechanics explicitly frame players as miners/nodes
   - Payoffs explained as actual Bitcoin rewards (block rewards, rejected blocks, attack costs)
   - Character strategies mapped to real network behaviors (Honest Node, 51% Attacker, Full Node, etc.)

3. **Real Bitcoin History**
   - Tournament evolution references 2010 overflow exploit, 2013-2015 pool attacks, 2017 Bitcoin Cash fork
   - Sandbox explains Bitcoin's actual rule structure (6.25 BTC R, 51% cost T, network rejection P)
   - Governance section references Segregated Witness, Taproot, fee market proposals

4. **Reputation Reveal Arc**
   - New slides (B_Slides_ReputationReveal.js) bridge game completion to governance voting
   - Dynamic substitution: "You cooperated [80]% → Trusted status → [120 votes]"
   - Tier-specific explanations show what reputation means in actual Bitcoin governance

5. **Governance as Real Consequence**
   - governance_intro slide now injects player's actual stats (cooperation rate, voting power)
   - Voting phase explained as participating in how Bitcoin rules actually evolve
   - Vote results show cause-effect: "Your vote passed. Future players inherit these rules."

### Learning Objectives Now Met

Users leave understanding:
- ✅ Bitcoin's security comes from game theory, not central authority
- ✅ Repeated games make honesty the dominant strategy
- ✅ Their cooperation behavior creates real governance power
- ✅ Consensus rules shape which strategies win
- ✅ Voting power should flow to trustworthy participants (the mechanism)

---

## Production Readiness

### MVP Complete (19/19 hours)
- ✅ Game → Reputation tracking
- ✅ Smart contracts for validation
- ✅ Governance voting UI
- ✅ Cross-app API
- ✅ On-chain anchoring
- ✅ All tests passing

### Phase 5: Testnet Deployment
- Deploy to Bitcoin Signet
- Verify proof generation
- Test wallet integration
- Create deployment documentation

### Future (Post-Hackathon)
- Mainnet deployment
- Real wallet integration
- Multi-player network
- Advanced governance (treasury, DAO)

---

## Resources

- **Original Game:** [Evolution of Trust](http://ncase.me/trust/)
- **Bitcoin:** [bitcoinos.build](https://bitcoinos.build/)
- **Charms:** [docs.charms.dev](https://docs.charms.dev/)
- **Game Theory:** [Prisoner's Dilemma](https://en.wikipedia.org/wiki/Prisoner%27s_dilemma)
- **Bitcoin UTXO:** [BIP 141 - Segregated Witness](https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki)
