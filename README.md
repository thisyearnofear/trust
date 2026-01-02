# Covenant: Bitcoin Governance Through Game Theory

A game-theory simulator that teaches **Bitcoin's consensus model through interactive gameplay** and zero-knowledge proof verification on-chain.

## What This Is

This is an adaptation of Nicky Case's *["The Evolution of Trust"](http://ncase.me/trust/)* that maps Prisoner's Dilemma concepts to Bitcoin:

- **Cooperate** = Follow consensus rules / validate honestly
- **Defect** = Attack network / attempt double-spend
- **Opponent** = Network node / miner
- **Score** = Mining rewards / transaction fees

Players learn why honest strategies dominate in repeated games—exactly why Bitcoin's incentive model works.

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

**Game Theory + Bitcoin + On-Chain Proofs:**

✅ **Reputation System** — Cooperative moves tracked, converted to on-chain reputation score  
✅ **Governance Voting** — Community votes on game rules using reputation-weighted voting power  
✅ **Charms Smart Contracts** — Game moves validated by Rust smart contracts via zero-knowledge proofs  
✅ **Cross-App API** — Other Bitcoin apps can query reputation and enforce tier requirements  
✅ **On-Chain Anchoring** — Game outcomes permanently recorded on Bitcoin via witness data  
✅ **Bitcoin Understanding** — Enhanced narrative teaches real Bitcoin mechanics (mining, attacks, consensus rules, governance)  
✅ **Reputation-to-Governance Arc** — Players see earned reputation directly translate to voting power  

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

**Testnet Ready (25/25 hours):**
- ✅ Game reputation tracking (GameReputation.js)
- ✅ Smart contracts (lib.rs + governance.rs) — 15/15 tests passing
- ✅ Governance UI (GovernanceUI.js)
- ✅ Cross-app API (CharmsClientAPI.js)
- ✅ Real Bitcoin Transactions (BitcoinTxBuilder.js)
- ✅ Wallet Integration (UnisatWallet.js)
- ✅ On-chain anchoring with Signet support
- ✅ E2E tests passing
- ✅ Ready for Signet testnet submission

**Status:** Complete — Ready for Hackathon Judging

See [docs/ROADMAP.md](docs/ROADMAP.md) for full implementation plan.

## File Structure

```
/js/bitcoin/
  ├── GameReputation.js       Reputation tracking
  ├── GovernanceUI.js         Voting interface  
  ├── BitcoinTxBuilder.js     Real Signet transaction generation
  ├── UnisatWallet.js         Wallet integration (Unisat)
  ├── CharmsClient.js         Charms protocol & on-chain submission
  ├── CharmsClientAPI.js      Cross-app reputation API
  ├── Bootstrap.js            Bitcoin mode setup (real transactions)
  └── OnChainUI.js            Wallet connection & transaction display

/charm-apps/trust-game/
  ├── src/
  │   ├── lib.rs             Game validation logic
  │   ├── governance.rs      Voting & cross-app registry
  │   └── main.rs            zkVM entry point
  ├── target/release/
  │   └── trust-game         Compiled Charms binary
  └── Cargo.toml            

/bitcoin/
  └── signet-test.sh         Signet helper script

/docs/
  ├── ARCHITECTURE.md        System design
  ├── ROADMAP.md            Implementation phases
  └── QUICKSTART.md         How to run

/test-e2e.html             E2E integration tests
/test-governance.html      Governance system tests

/css/
  └── governance.css        Voting UI styling
```

## Key Metrics

- **Total Code:** ~2,700 lines JavaScript + 597 lines Rust
  - BitcoinTxBuilder: 392 lines
  - UnisatWallet: 345 lines
  - Existing modules: ~1,963 lines
- **Reuse:** 100% — no code duplication, all logic inherited
- **Tests:** 15/15 Rust unit tests + JavaScript E2E tests passing
- **Architecture:** Clean separation: Game → Reputation → Governance → Charms → Bitcoin Signet
- **Hackathon Goal:** Make Bitcoin programmable via zero-knowledge proofs ✅

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
