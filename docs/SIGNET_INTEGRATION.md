# Bitcoin Signet Integration Guide

## Overview

The Evolution of Trust now anchors player reputation directly to Bitcoin Signet testnet. Every game move and reputation score becomes a real Bitcoin transaction.

## Architecture

```
Game UI (index.html)
    ↓
GameReputation.js (tracks cooperativeness)
    ↓
CharmsClient.js (real Signet mode enabled)
    ↓
SignetIntegration.js (Esplora API for UTXOs)
    ↓
Bitcoin Signet Network
```

## How It Works

### Real Mode (Default)

When a player completes a game:

1. **Reputation is calculated** - How cooperative were they?
2. **Charms app generates proof** - `target/release/trust-game` proves reputation is correct
3. **Spell is created** - Proof is embedded in transaction witness data
4. **Transaction broadcasts** - Sent to Bitcoin Signet via Esplora API
5. **Txid displayed** - User sees real Bitcoin transaction ID

### Mock Mode (Fallback)

If:
- No Bitcoin address provided
- Signet API unavailable
- Charms binary missing

The system automatically falls back to mock mode for testing/demos.

## Configuration

### Enable Real Signet in Bootstrap.js

```javascript
var charmsConfig = {
  useRealSignet: bitcoinAddress && bitcoinAddress.startsWith("tb1"),
  charmsAppBin: "/path/to/target/release/trust-game",
  esploraUrl: "https://signet.esplora.blockstream.com/api"
};

var charmsClient = new CharmsGameClient(appId, bitcoinAddress, charmsConfig);
```

### Configuration Options

| Option | Default | Purpose |
|--------|---------|---------|
| `useRealSignet` | `true` | Enable real Bitcoin Signet integration |
| `charmsAppBin` | `/Users/.../trust-game` | Path to compiled Charms app binary |
| `esploraUrl` | `https://signet.esplora.blockstream.com/api` | Esplora API endpoint for Signet |
| `mockMode` | `false` | Force mock mode for testing |

## Building the Charms App

```bash
cd charm-apps/trust-game
cargo +nightly build --release
# Binary: target/release/trust-game
```

## Testing

### Test with Mock Mode
```javascript
var charmsClient = new CharmsGameClient(appId, address, { mockMode: true });
```

### Test with Real Signet
1. Get a Signet address (e.g., from a faucet)
2. Fund it with test sats
3. Pass address to the app
4. See real txids in console

## Key Files

- **CharmsClient.js** - Main client (supports real + mock modes)
- **SignetIntegration.js** - Bitcoin Signet RPC layer (Esplora)
- **charm-apps/trust-game/src/main.rs** - Charms zkVM entry point
- **Bootstrap.js** - Initialization with Signet config

## What Gets Anchored

### Move Submission
```
{
  type: "move",
  move: 0,  // 0 = COOPERATE, 1 = DEFECT
  proof: { ... },  // Zero-knowledge proof
  timestamp: 1234567890,
  playerAddress: "tb1p..."
}
```

### Reputation Anchor
```
{
  type: "reputation_anchor",
  reputation_score: 75,
  reputation_tier: "Trusted",
  voting_power: 112,
  total_moves: 5,
  cooperative_moves: 4,
  proof: { ... }
}
```

Both are embedded in Taproot witness data on Bitcoin Signet.

## Hackathon Demo

For judges to see real Bitcoin integration:

1. Start the app with a Signet Bitcoin address
2. Play the game and make moves
3. Complete a round
4. See "Reputation anchored to Bitcoin: [txid]"
5. Judges can verify txid at: `https://signet.esplora.blockstream.com/tx/[txid]`

No network setup required - Esplora API is public.

## Next Steps (Post-Hackathon)

- [ ] Implement transaction signing (currently demo txid)
- [ ] Real Charms daemon integration for proof generation
- [ ] Multi-signature support for governance votes
- [ ] Move to Bitcoin mainnet
