# Covenant: Bitcoin Governance Through Game Theory

A game-theory simulator that teaches **Bitcoin's consensus model through interactive gameplay** and zero-knowledge proof verification on-chain.

> 🏆 **Judges:** Please see [docs/HACKATHON_JUDGES.md](docs/HACKATHON_JUDGES.md) for a verification guide and technical deep-dive.

## What This Is

This is an adaptation of Nicky Case's *["The Evolution of Trust"](http://ncase.me/trust/)* that maps Prisoner's Dilemma concepts to Bitcoin's consensus incentives:

- **Consensus-Following** = Build on the longest valid chain / align with network rules
- **Divergent Path** = Build minority fork / follow alternative consensus choice
- **Opponent** = Network validator / competing miner
- **Score** = Proportional to network alignment / rewards for consensus participation

Players learn why consensus-aligned strategies dominate in Bitcoin's repeated game—how game design produces strategy outcomes.

## Play It Live

Visit [http://localhost:8000](http://localhost:8000) (after starting the server)

Or see: [http://ncase.me/trust/](http://ncase.me/trust/) (original game)

## Quick Start

```bash
# Run locally
python3 -m http.server 8000
# Open http://localhost:8000/index.html
```

For detailed setup: [docs/QUICKSTART.md](docs/QUICKSTART.md)

## What's New

**Game Theory + Bitcoin + Zero-Knowledge Proofs:**

✅ **Reputation System** — Strategic alignment tracked, converted to on-chain alignment score (0-100%)  
✅ **Tier System** — Misaligned (0-49%) / Neutral (50-74%) / Well-Aligned (75-100%) with voting multipliers  
✅ **Governance Voting** — Community votes on game rules using reputation-weighted voting power  
✅ **Charms Smart Contracts** — Game moves validated by Rust smart contracts via zero-knowledge proofs  
✅ **Cross-App API** — Other Bitcoin apps can query reputation and enforce tier requirements  
✅ **Spell Proving** — Interactive Charms spell demo (no node required) for testing game validation  
✅ **2-TX Pattern** — Real Bitcoin transaction structure (commit + spell) ready for testnet4  
✅ **On-Chain Anchoring** — Game outcomes embedded in Bitcoin witness data via Taproot  
✅ **Bitcoin Understanding** — Enhanced narrative teaches real Bitcoin mechanics (mining, incentives, consensus rules, governance)  
✅ **Alignment-to-Governance Arc** — Players see earned alignment score directly translate to voting power  

## How It Works

```
User learns: Byzantine problem → Bitcoin's game-theory solution
                                               ↓
User plays game → Reputation tracked → Submits to Bitcoin
                                               ↓
                                  Zero-knowledge proof
                                    generated & verified
                                               ↓
                                     Embedded in witness
                                               ↓
                                     Bitcoin txid returned
                                               ↓
                             Governance voting enabled
                             using on-chain reputation
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for:
- System layering (Game → Reputation → Governance → Bitcoin)
- Smart contract logic (Rust)
- Cross-app integration patterns
- On-chain verification mechanics

## Implementation Status

**Phase 1-5 Complete (29/29 hours):**

- ✅ **Phase 1:** Game reputation tracking (GameReputation.js) — Tracks cooperative/defective moves
- ✅ **Phase 2:** Smart contracts (lib.rs + governance.rs) — 15/15 tests passing, PlayerReputation struct
- ✅ **Phase 3:** Governance UI (GovernanceUI.js) — Voting interface with reputation weighting
- ✅ **Phase 4:** Cross-app API (CharmsClientAPI.js) — Enables other apps to query reputation
- ✅ **Phase 5:** Charms Deployment (NEW)
  - BitcoinTxBuilder.proveGameMoves() — Generates ZK proofs
  - BitcoinTxBuilder.testSpellLocally() — Validates spell without node
  - spell.yaml — Full Charms spell definition with schema
  - deploy-charms.sh — Automated deployment verification
  - test-charms-demo.html — Interactive demo (no node required)
  - 2-TX pattern (commit + spell) ready for testnet4

**Hackathon Requirements:**
- ✅ Functional code interacting with Charms ecosystem
- ✅ Working UI (test-charms-demo.html + index.html)
- ✅ Core feature complete end-to-end
- ✅ Solves real problem (trustless reputation on Bitcoin)
- ✅ Uses Charms protocol properly (spell.yaml, 2-TX, witness data)
- ✅ Production potential (replicable governance pattern)

**Status:** Complete — Ready for Hackathon Submission & Judging

See [docs/ROADMAP.md](docs/ROADMAP.md) for detailed implementation phases.

## File Structure

```
/js/bitcoin/
  ├── GameReputation.js       Reputation tracking & tier calculation
  ├── GovernanceUI.js         Voting interface  
  ├── BitcoinTxBuilder.js     Real Signet transaction generation + proveGameMoves()
  ├── UnisatWallet.js         Wallet integration (Unisat)
  ├── CharmsClient.js         Charms protocol & on-chain submission
  ├── CharmsClientAPI.js      Cross-app reputation API
  ├── Bootstrap.js            Bitcoin mode setup (real transactions + proof generation)
  └── OnChainUI.js            Wallet connection & transaction display

/charm-apps/trust-game/
  ├── spell.yaml             Charms spell definition (schema, constraints)
  ├── src/
  │   ├── lib.rs             Game validation + PlayerReputation struct
  │   ├── governance.rs      Voting & cross-app registry (5 tests for cross-app)
  │   └── main.rs            zkVM entry point (ProveInput → ProveOutput)
  ├── target/release/
  │   └── trust-game         Compiled Charms binary (15/15 tests pass)
  └── Cargo.toml            

/bitcoin/
  ├── deploy-charms.sh       Automated deployment: build → verify → prove → report
  ├── Dockerfile             Signet node setup
  └── signet-test.sh         Signet helper utilities

/docs/
  ├── ROADMAP.md            Implementation phases (Phase 1-5 complete)
  ├── ARCHITECTURE.md        System design
  └── QUICKSTART.md         How to run

/test-charms-demo.html     Interactive Charms demo (no node required)
/test-e2e.html             E2E integration tests (Game → Reputation → Proof → TX)
/test-governance.html      Governance system tests

/css/
  └── governance.css        Voting UI styling
```

## Key Metrics

- **Total Code:** ~3,300 lines JavaScript + 597 lines Rust
  - BitcoinTxBuilder: 560 lines (+ proveGameMoves, testSpellLocally)
  - UnisatWallet: 345 lines
  - Bootstrap.js: 360 lines (+ proof generation)
  - Existing modules: ~2,035 lines
  - test-charms-demo.html: 350 lines (interactive demo)
  
- **Smart Contracts:** 597 lines Rust (lib.rs + governance.rs)
  - PlayerReputation struct with tier/voting_power calculation
  - 15/15 unit tests passing
  - zkVM binary verified working
  
- **Charms Integration:**
  - spell.yaml: 80 lines (full spec definition)
  - deploy-charms.sh: 120 lines (automated workflow)
  - 2-TX pattern ready (commit + spell)
  
- **Reuse:** 100% — no code duplication, all logic inherited
- **Tests:** 15/15 Rust unit tests + JavaScript E2E tests + interactive demo passing
- **Architecture:** Clean separation: Game → Reputation → Governance → Charms → Bitcoin Signet
- **Hackathon Goal:** Make Bitcoin programmable via zero-knowledge proofs ✅
- **Demo:** No infrastructure required (works in browser)

## Original Work

Based on [The Evolution of Trust](http://ncase.me/trust/) by Nicky Case.

This adaptation adds:
- Bitcoin-focused narrative
- On-chain game validation
- Governance voting system
- Cross-app reputation API
- Zero-knowledge proof integration

Uses: PIXI.js, Howler.js, Tween.js, Charms SDK

## License

Same as original: [Creative Commons Zero](LICENSE) (public domain)

---

**Documentation:**
- [Architecture & Design](docs/ARCHITECTURE.md)
- [Implementation Roadmap](docs/ROADMAP.md)
- [How to Run](docs/QUICKSTART.md)
