# Charms Proof Server Setup

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Make sure Charms is installed
```bash
cargo install charms --version=0.10.0
charms --version
```

### 3. Build the Rust app
```bash
cd charm-apps/trust-game
cargo build --release
cd ../..
```

### 4. Start the server
```bash
node server.js
```

Server runs on: `http://localhost:3000`

## How It Works

**Browser** → calls `/api/charms/prove` → **Server** → spawns `charms spell prove` CLI → **zkVM** → generates proof

### Endpoints

**POST /api/charms/prove**
```javascript
{
  gameData: {
    player_address: "tb1q...",
    moves: [0, 0, 1, 0],
    opponent_moves: [0, 1, 1, 0],
    payoffs: [2, 3, -1, 0]
  },
  utxoData: {
    txid: "...",
    vout: 1,
    amount: 50000
  },
  changeAddress: "tb1q...",
  charmsAppBin: "/path/to/trust-game"
}
```

**Response:**
```javascript
{
  commitTxHex: "020000000001...",
  spellTxHex: "020000000001...",
  commitTxid: "abcd1234...",
  spellTxid: "efgh5678...",
  proof: { ... }
}
```

**GET /api/health**
Returns: `{ status: "ok", timestamp: "..." }`

## Two Deployment Models

### Browser (Recommended)
1. Start server: `node server.js`
2. Open `http://localhost:3000`
3. Server auto-detected at startup
4. Play game → submit move → server generates proof

### Node.js (Testing)
1. Use `charmsAppBin` config in Bootstrap.js
2. Server not required
3. CharmsCLIProver spawns `charms spell prove` directly

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Cannot find module 'express'` | Run `npm install` |
| `charms: command not found` | Install Charms CLI |
| `Binary not found` | Build Rust app or fix path |
| `EADDRINUSE` | Port 3000 already in use, kill process or change PORT |

## Environment Variables

```bash
PORT=8000 node server.js  # Custom port
```

## Architecture

```
Browser (index.html)
    ↓
Bootstrap.js (detects localhost)
    ↓
CharmsClient.submitMove()
    ↓
_callServerAPI() if serverUrl set
    ↓
POST /api/charms/prove
    ↓
Server spawns: charms spell prove
    ↓
Returns: { commitTxHex, spellTxHex }
    ↓
Wallet signs both transactions
    ↓
submitpackage broadcast
```

## Next Steps

- [ ] Add wallet signing (Unisat/Leather integration)
- [ ] Implement submitpackage broadcast
- [ ] Production deployment (add auth, rate limiting)
- [ ] Monitor proof generation metrics
