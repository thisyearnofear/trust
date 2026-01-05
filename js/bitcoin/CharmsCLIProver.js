/**
 * CHARMS CLI PROVER - Real ZK Proof Generation
 * 
 * Directly invokes `charms spell prove` to generate real zero-knowledge proofs.
 * Follows official Charms workflow: https://docs.charms.dev/guides/charms-apps/cast-spell/
 * 
 * Flow:
 * 1. Prepare spell.yaml and input JSON
 * 2. Run: charms spell prove --app-bins=binary --prev-txs=... --funding-utxo=... --change-address=...
 * 3. Parse JSON array output: [commit_tx_hex, spell_tx_hex]
 * 4. Return both unsigned transactions
 * 
 * Requirements:
 * - Charms CLI installed: cargo install charms --version=0.10.0
 * - Rust app binary compiled: charm-apps/trust-game/target/release/trust-game
 * - Node.js can spawn child processes
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class CharmsCLIProver {
  /**
   * Initialize CLI prover
   * @param {object} config - Configuration
   *   - charmsAppBin: Path to compiled Charms binary (required)
   *   - spellYamlPath: Path to spell.yaml (auto-detected if not provided)
   *   - network: "signet" or "testnet" (default: signet)
   *   - timeout: Proof generation timeout in ms (default: 600000 = 10 min)
   */
  constructor(config = {}) {
    this.config = {
      charmsAppBin: config.charmsAppBin || null,
      spellYamlPath: config.spellYamlPath || path.join(__dirname, '../../charm-apps/trust-game/spell.yaml'),
      network: config.network || 'signet',
      timeout: config.timeout || 600000, // 10 minutes for zkVM proof generation
      verbose: config.verbose || false,
      ...config
    };

    if (!this.config.charmsAppBin) {
      throw new Error("charmsAppBin is required. Provide path to compiled trust-game binary.");
    }

    if (!fs.existsSync(this.config.charmsAppBin)) {
      throw new Error(`Charms app binary not found: ${this.config.charmsAppBin}`);
    }

    if (!fs.existsSync(this.config.spellYamlPath)) {
      throw new Error(`spell.yaml not found: ${this.config.spellYamlPath}`);
    }

    console.log("[CharmsCLIProver] Initialized", {
      binary: this.config.charmsAppBin,
      spellYaml: this.config.spellYamlPath,
      network: this.config.network,
      timeout: this.config.timeout + "ms"
    });
  }

  /**
   * Generate real ZK proof via charms spell prove CLI
   * 
   * @param {object} gameData - Game history to prove
   *   - player_address: Bitcoin address
   *   - moves: Array of moves (0=Cooperate, 1=Defect)
   *   - opponent_moves: Opponent's moves (for context)
   *   - payoffs: [R, T, S, P] payoff matrix
   * @param {object} utxoData - UTXO for funding the commit transaction
   *   - txid: Previous transaction ID
   *   - vout: Output index
   *   - amount: Satoshis
   * @param {string} changeAddress - Change address (tb1q...)
   * @returns {Promise<object>} { commitTxHex, spellTxHex, commitTxid, spellTxid, proof }
   */
  async generateProof(gameData, utxoData, changeAddress) {
    return new Promise((resolve, reject) => {
      try {
        // Validate inputs
        if (!gameData.player_address || !gameData.moves) {
          throw new Error("Invalid game data: requires player_address and moves");
        }
        if (!utxoData || !utxoData.txid || utxoData.vout === undefined || !utxoData.amount) {
          throw new Error("Invalid UTXO data");
        }
        if (!changeAddress || !changeAddress.startsWith('tb1')) {
          throw new Error("Invalid change address (must be Signet tb1q...)");
        }

        this._log(`Generating proof for ${gameData.player_address}...`);

        // Step 1: Prepare input JSON for zkVM
        const zkVmInput = {
          player_address: gameData.player_address,
          moves: gameData.moves,
          opponent_moves: gameData.opponent_moves || [],
          payoffs: gameData.payoffs || [2, 3, -1, 0] // Default PD payoffs
        };

        const inputJson = JSON.stringify(zkVmInput);
        this._log(`zkVM input: ${inputJson}`);

        // Step 2: Build charms spell prove command
        // Syntax: charms spell prove --app-bins=BINARY --prev-txs=JSON --funding-utxo=TXID:VOUT --funding-utxo-value=AMOUNT --change-address=ADDR
        
        const prevTxs = ""; // Empty for initial game move proof (will be provided for subsequent moves)
        const fundingUtxo = `${utxoData.txid}:${utxoData.vout}`;

        const args = [
          'spell',
          'prove',
          `--app-bins=${this.config.charmsAppBin}`,
          `--prev-txs=${prevTxs}`, // Empty for game moves
          `--funding-utxo=${fundingUtxo}`,
          `--funding-utxo-value=${utxoData.amount}`,
          `--change-address=${changeAddress}`
        ];

        this._log(`Running: charms ${args.join(' ')}`);

        // Step 3: Spawn charms process with stdin
        const charms = spawn('charms', args, {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';
        let timedOut = false;

        // Timeout handler
        const timeoutHandle = setTimeout(() => {
          timedOut = true;
          charms.kill();
          reject(new Error(`Charms proof generation timeout after ${this.config.timeout}ms`));
        }, this.config.timeout);

        // Capture output
        charms.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        charms.stderr.on('data', (data) => {
          stderr += data.toString();
          this._log(`[stderr] ${data}`);
        });

        // Pipe input to stdin
        charms.stdin.write(inputJson);
        charms.stdin.end();

        // Handle process completion
        charms.on('close', (code) => {
          clearTimeout(timeoutHandle);

          if (timedOut) {
            return; // Already rejected
          }

          if (code !== 0) {
            return reject(new Error(`Charms proof generation failed: ${stderr}`));
          }

          try {
            // Parse output: should be JSON array [commit_tx_hex, spell_tx_hex]
            const output = stdout.trim();
            this._log(`Charms output (first 200 chars): ${output.substring(0, 200)}`);

            // Look for JSON array in output
            const jsonMatch = output.match(/\[\s*\{[^]*?\}\s*,\s*\{[^]*?\}\s*\]/);
            if (!jsonMatch) {
              // Try to extract from complex output
              const txMatch = output.match(/"bitcoin"\s*:\s*"([a-f0-9]+)"/g);
              if (!txMatch || txMatch.length < 2) {
                throw new Error(`Failed to parse charms output. Got: ${output.substring(0, 500)}`);
              }

              const txes = txMatch.map(m => {
                const hex = m.match(/"bitcoin"\s*:\s*"([a-f0-9]+)"/)[1];
                return { bitcoin: hex };
              });

              return resolve({
                commitTxHex: txes[0].bitcoin,
                spellTxHex: txes[1].bitcoin,
                commitTxid: this._calculateTxid(txes[0].bitcoin),
                spellTxid: this._calculateTxid(txes[1].bitcoin),
                proof: zkVmInput // Include original input as proof data
              });
            }

            const parsed = JSON.parse(jsonMatch[0]);
            if (!Array.isArray(parsed) || parsed.length < 2) {
              throw new Error("Expected array with [commit_tx, spell_tx]");
            }

            const commitTx = parsed[0].bitcoin || parsed[0];
            const spellTx = parsed[1].bitcoin || parsed[1];

            if (typeof commitTx !== 'string' || typeof spellTx !== 'string') {
              throw new Error("Transactions must be hex strings");
            }

            this._log(`Proofs generated successfully`);
            this._log(`Commit TX: ${commitTx.substring(0, 50)}...`);
            this._log(`Spell TX: ${spellTx.substring(0, 50)}...`);

            resolve({
              commitTxHex: commitTx,
              spellTxHex: spellTx,
              commitTxid: this._calculateTxid(commitTx),
              spellTxid: this._calculateTxid(spellTx),
              proof: zkVmInput // Include proof input data
            });
          } catch (error) {
            reject(new Error(`Failed to parse charms output: ${error.message}`));
          }
        });

        charms.on('error', (error) => {
          clearTimeout(timeoutHandle);
          reject(new Error(`Failed to spawn charms process: ${error.message}`));
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Calculate Bitcoin transaction ID (double SHA256 of serialized tx)
   * @private
   */
  _calculateTxid(txHex) {
    // For real transactions, would need proper txid calculation
    // For now, return a placeholder (actual implementation would use crypto library)
    const crypto = require('crypto');
    const buf = Buffer.from(txHex, 'hex');
    const hash1 = crypto.createHash('sha256').update(buf).digest();
    const hash2 = crypto.createHash('sha256').update(hash1).digest();
    return hash2.reverse().toString('hex');
  }

  /**
   * Log if verbose
   * @private
   */
  _log(msg) {
    if (this.config.verbose) {
      console.log("[CharmsCLIProver]", msg);
    }
  }
}

// Global singleton
var CHARMS_CLI_PROVER = null;

/**
 * Initialize or get CharmsCLIProver instance
 */
function initCharmsCLIProver(config) {
  if (!CHARMS_CLI_PROVER) {
    CHARMS_CLI_PROVER = new CharmsCLIProver(config);
  } else if (config) {
    // Update config if provided
    CHARMS_CLI_PROVER.config = { ...CHARMS_CLI_PROVER.config, ...config };
  }
  return CHARMS_CLI_PROVER;
}

/**
 * Get CharmsCLIProver instance
 */
function getCharmsCLIProver() {
  if (!CHARMS_CLI_PROVER) {
    throw new Error("CharmsCLIProver not initialized. Call initCharmsCLIProver() first.");
  }
  return CHARMS_CLI_PROVER;
}

// Make available globally
if (typeof window !== 'undefined') {
  window.CharmsCLIProver = CharmsCLIProver;
  window.initCharmsCLIProver = initCharmsCLIProver;
  window.getCharmsCLIProver = getCharmsCLIProver;
}

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    CharmsCLIProver,
    initCharmsCLIProver,
    getCharmsCLIProver
  };
}
