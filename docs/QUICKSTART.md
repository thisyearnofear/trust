# Quick Start Guide

## 30 Second Version

1. **Open the game:** `open index.html` (or `python -m http.server 8000` then visit localhost)
2. **See Bitcoin content:** Title, strategies, narratives all Bitcoin-themed
3. **Play normally:** Same gameplay as original Evolution of Trust game
4. **Optional:** Click "Connect Wallet" (bottom-right) to submit moves to Bitcoin

---

## 5 Minute Setup (Offline Play)

```bash
# Navigate to project
cd /path/to/trust

# Serve locally (Python 3)
python -m http.server 8000

# Or use any HTTP server
# http-server
# npx serve
# etc.

# Open browser
open http://localhost:8000
```

**What you'll see:**
- Bitcoin-themed title & content
- Game plays identically to original
- All AI opponents are labeled as Bitcoin node types
- Payoff matrices teach Bitcoin incentives

---

## 10 Minute Setup (Full On-Chain)

### Step 1: Build Charms Contract

```bash
cd charm-apps/trust-game

# Install Rust if needed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Build
cargo build --release

# Test
cargo test --release

# Generate verification key
cargo run --release -- --generate-vk
```

### Step 2: Deploy Contract

```bash
# Install Charms CLI (requires Rust + Bitcoin)
cargo install charms-cli

# Deploy to testnet
charms deploy \
  --binary charm-apps/trust-game/target/release/libtrust_game.so \
  --name trust-game \
  --network testnet

# Copy the returned app_id
# Looks like: abc123def456...
```

### Step 3: Update Config

In `js/bitcoin/CharmsClient.js`, update:

```javascript
const CHARMS_APP_ID = "your_app_id_here";
```

### Step 4: Run Game

```bash
# From project root
python -m http.server 8000
open http://localhost:8000
```

---

## File Structure (Key Files)

```
trust/
├── index.html                    (updated with Bitcoin scripts)
├── words_bitcoin.html            (Bitcoin narrative)
│
├── js/bitcoin/
│   ├── AssetMap.js              (Sprite labels)
│   ├── BitcoinStrategies.js      (Strategy wrapping)
│   ├── Bootstrap.js             (Init Bitcoin mode)
│   ├── CharmsClient.js          (Wallet + Charms RPC)
│   └── OnChainUI.js             (Transaction UI)
│
├── charm-apps/trust-game/
│   ├── Cargo.toml
│   └── src/lib.rs               (Game validation logic)
│
├── bitcoin/
│   └── Dockerfile               (Contract deployment)
│
├── ROADMAP.md                   (What we built)
├── BITCOIN_ADAPTATION.md        (How Bitcoin concepts map)
├── CHARMS_INTEGRATION.md        (Technical details)
├── SUBMISSION.md                (Full submission)
└── QUICKSTART.md                (This file)
```

---

## Playing the Game

### Offline Mode (No Wallet)

1. Open `index.html`
2. See "Bitcoin: Trust Without Authority" title
3. Click "PLAY →"
4. Play game as normal
5. Learn how Bitcoin consensus works through game theory

### On-Chain Mode (With Wallet)

1. Open `index.html`
2. See "Connect Wallet" button (bottom-right corner)
3. Click it → Connect your Bitcoin wallet (Unisat, XVerse, etc.)
4. See your Bitcoin address displayed
5. Play game as normal
6. After each round, see "Submit to Bitcoin" button (when enabled)
7. Click → Move submitted as Charms transaction
8. See Bitcoin txid in transaction history
9. Click txid → Opens block explorer to verify

---

## Game Content Map

| Game Section | Bitcoin Concept |
|--------------|-----------------|
| **One-Off Game** | Single transaction risk (double-spend) |
| **Iterated Game** | Blockchain rounds (repeated interactions) |
| **Tournament** | Network competition (who gets mined?) |
| **Evolution** | Why honest strategies dominate over time |
| **Distrust Section** | When network attacks happen (selfish mining) |
| **Sandbox** | Design your own Bitcoin incentive rules |

---

## Troubleshooting

### Game Won't Load
- Check browser console (F12) for errors
- Ensure `index.html` is served over HTTP (not file://)
- Check all script tags in index.html are loading

### Bitcoin Title Doesn't Appear
- Check `BITCOIN_MODE` is enabled in Browser console
- Verify `Bootstrap.js` loaded (check Network tab)
- Check `words_bitcoin.html` is available

### Wallet Connection Fails
- Ensure browser wallet extension is installed (Unisat, XVerse)
- Try demo mode (address will be auto-generated)
- Check Charms daemon is running (if on-chain mode)

### On-Chain Move Submission Fails
- Check Charms app is deployed (`CHARMS_APP_ID` is set)
- Verify Bitcoin testnet connection
- Check Charms RPC daemon is running (`localhost:9000`)
- See browser console for detailed error

### Contract Won't Compile
- Ensure Rust is installed (`rustup --version`)
- Check Rust is updated (`rustup update`)
- Run `cargo clean` then `cargo build --release`
- Check `Cargo.toml` dependencies are correct

---

## Testing Moves

### Test 1: Play One Round
```javascript
// In browser console
var gameState = {round: 0, total_rounds: 5};
validate_move(gameState, 0, 0, 2, 2)  // Should be true
```

### Test 2: Validate Payoff
```javascript
// In browser console
var client = new CharmsGameClient("test-app", "tb1qtest");
client.isValidMove("COOPERATE")  // Should be true
```

### Test 3: View Transaction History
```javascript
// In browser console
OnChainUI.getTransactionHistory()  // Returns array of txs
```

---

## Browser Requirements

- Modern browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- (Optional) Bitcoin wallet extension for on-chain mode

---

## Network Requirements

### For Offline Play
- No network needed (game is entirely client-side)

### For On-Chain Play
- Bitcoin testnet access (public API or local node)
- Charms daemon running (or public RPC)
- Bitcoin wallet (Unisat, XVerse, or similar)

---

## Next Steps

1. **Play offline first** - Understand the game theory
2. **Read the docs** - See BITCOIN_ADAPTATION.md for concept mappings
3. **Build the contract** - Follow Rust build steps
4. **Deploy to testnet** - Use Charms CLI
5. **Connect wallet** - Test on-chain mode
6. **Submit moves** - See proofs on Bitcoin!

---

## Key Files to Read

| File | Purpose |
|------|---------|
| `SUBMISSION.md` | Full project overview |
| `BITCOIN_ADAPTATION.md` | How game theory maps to Bitcoin |
| `CHARMS_INTEGRATION.md` | Technical architecture |
| `ROADMAP.md` | Implementation timeline |
| `charm-apps/trust-game/src/lib.rs` | Smart contract logic |
| `js/bitcoin/CharmsClient.js` | Client implementation |

---

## Commands Cheat Sheet

```bash
# Build contract
cd charm-apps/trust-game && cargo build --release

# Test contract
cargo test --release

# Serve game locally
python -m http.server 8000

# Deploy to Charms
charms deploy --binary target/release/libtrust_game.so --name trust-game

# View transaction
# https://blockstream.info/testnet/tx/<txid>
```

---

## Common Questions

**Q: Do I need to play on-chain?**  
A: No! Game works perfectly offline. On-chain is optional.

**Q: Is my Bitcoin address private?**  
A: Connected addresses are visible in UI. Use fresh address for testing.

**Q: Can I modify the game?**  
A: Yes! Edit `words_bitcoin.html` for content or `js/sims/PD.js` for payoffs.

**Q: What's the point of on-chain moves?**  
A: Proves game moves are valid via zero-knowledge proofs on Bitcoin.

**Q: Can I use mainnet?**  
A: Yes, but testnet is recommended for development. See CharmsClient config.

---

## Getting Help

1. **Read the docs** - ROADMAP.md, BITCOIN_ADAPTATION.md, CHARMS_INTEGRATION.md
2. **Check browser console** - F12 for errors/logs
3. **Review source code** - Well-commented, should be clear
4. **Test incrementally** - Start offline, then add on-chain

---

**Ready to play? Open `index.html` and start learning Bitcoin!**
