/**
 * Covenant: Charms Proof Generation Server
 * 
 * Minimal backend for `charms spell prove` CLI integration.
 * Browser can't spawn processes, so this lightweight service handles it.
 * 
 * Usage:
 *   npm install express cors
 *   node server.js
 * 
 * Endpoints:
 *   POST /api/charms/prove
 *     Body: { gameData, utxoData, changeAddress, charmsAppBin }
 *     Returns: { commitTxHex, spellTxHex, commitTxid, spellTxid }
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files (frontend)
app.use(express.static('./'));

// ============================================================================
// Charms Proof Generation Endpoint
// ============================================================================

app.post('/api/charms/prove', async (req, res) => {
  try {
    const { gameData, utxoData, changeAddress, charmsAppBin } = req.body;

    // Validate required fields
    if (!gameData || !utxoData || !changeAddress) {
      return res.status(400).json({
        error: 'Missing required fields: gameData, utxoData, changeAddress'
      });
    }

    if (!charmsAppBin) {
      return res.status(400).json({
        error: 'charmsAppBin required. Set in config: /path/to/target/release/trust-game'
      });
    }

    console.log('[Server] Generating proof for:', gameData.player_address);

    // Dynamically load and initialize CharmsCLIProver
    const { initCharmsCLIProver } = require('./js/bitcoin/CharmsCLIProver.js');
    const prover = initCharmsCLIProver({
      charmsAppBin: charmsAppBin,
      verbose: true
    });

    // Generate proof (takes ~5 minutes)
    const result = await prover.generateProof(gameData, utxoData, changeAddress);

    console.log('[Server] Proof generated:', result.commitTxid.substring(0, 16));
    return res.json(result);
  } catch (error) {
    console.error('[Server] Error:', error.message);
    return res.status(500).json({
      error: error.message,
      hint: error.message.includes('charms: command not found')
        ? 'Install Charms CLI: cargo install charms --version=0.10.0'
        : error.message.includes('not found')
        ? 'Check charmsAppBin path'
        : 'See server logs for details'
    });
  }
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// Server Start
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         Covenant: Charms Proof Generation Server               ║
╠════════════════════════════════════════════════════════════════╣
║ Running on:      http://localhost:${PORT}                      ║
║ Frontend:        http://localhost:${PORT}                      ║
║ Proof API:       POST /api/charms/prove                        ║
║ Health Check:    GET /api/health                               ║
╠════════════════════════════════════════════════════════════════╣
║ Requirements:                                                   ║
║  ✓ Charms CLI installed                                        ║
║  ✓ Rust app built: charm-apps/trust-game/target/release/trust-game ║
║                                                                 ║
║ Configuration:                                                  ║
║  - Set charmsAppBin in frontend config                         ║
║  - Pass in /api/charms/prove request body                      ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Server shutting down...');
  process.exit(0);
});
