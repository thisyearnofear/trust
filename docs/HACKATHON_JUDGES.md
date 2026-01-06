# Covenant: Enchanting UTXO Hackathon Submission

**A Trustless Reputation & Governance Layer for Bitcoin**

## 🏆 For Judges: Exceptuonal Highlights

Covenant transforms the classic "Evolution of Trust" game into a **native Bitcoin application** using **Charms**. It demonstrates how Zero-Knowledge Proofs (ZKPs) can be used to anchor off-chain behavior (gameplay) to on-chain rights (governance voting) without revealing private data or relying on centralized servers.

### The "Enchanting" Factor

We used **Charms** to make standard Bitcoin UTXOs "enchanted" with two specific spells:
1.  **Bit-Reputation**: A ZK-proven spell that certifies a player's cooperative history without revealing their specific game moves.
2.  **Bit-Governance**: A voting spell that weights a user's vote based on their proven reputation, anchored securely in Bitcoin's witness data.

**Why this matters:** It proves that Bitcoin can support complex, application-specific logic (like weighted voting based on behavior) *without* consensus changes, using client-side verification.

---

## 🕹️ How to Test & Verify

We offer three ways to verify our submission, ranging from "Instant Click" to "Full Node Integration".

### Option 1: The Interactive "No-Node" Demo (Fastest)
*Best for quickly seeing the Charms integration logic without setting up a wallet or node.*

1.  Open `test-charms-demo.html` in your browser.
2.  Click **"Generate Mock Game Data"** to simulate a game session.
3.  Click **"Prove Moves (Charms)"** to witness the ZK proof generation logic (simulated in browser for speed).
4.  See the resulting **Commit Transaction** and **Spell Transaction** hexes generated in real-time.

### Option 2: The Full "On-Chain" Experience (Recommended)
*See the actual ZK proofs generated and settled on Bitcoin Signet.*

**Prerequisites:**
- Node.js installed
- Rust/Cargo installed (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- Charms CLI installed (`cargo install charms --version=0.10.0`)
- UniSat or Leather Wallet (connected to Bitcoin Signet)

**Steps:**
1.  **Start the Proof Server** (bridges browser to Charms CLI):
    ```bash
    node server.js
    ```
2.  **Launch the Game**:
    ```bash
    # In a new terminal
    python3 -m http.server 8000
    # Open http://localhost:8000
    ```
3.  **Play**: Complete the first "Game" sequence.
4.  **Vote**: Proceed to the "Governance" slides. Connect your wallet.
5.  **Experience the Magic**: Cast a vote. Watch as the system:
    - Generates a real ZK proof of your gameplay (~2-5 mins).
    - Anchors it to a Bitcoin transaction.
    - Prompts your wallet to sign the "Commit" and "Spell" transactions.
    - Broadcasts to Signet.

### Option 3: Code Audit
*Inspect the core integration points.*

- **The Spell (`charm-apps/trust-game/spell.yaml`)**: Defines the schema for our reputation and voting spells.
- **The ZK Logic (`charm-apps/trust-game/src/lib.rs`)**: The Rust code that runs inside the zkVM to verify game moves.
- **The Bridge (`js/bitcoin/CharmsClient.js`)**: The Javascript client that orchestrates the 2-transaction "Commit + Spell" pattern.

---

## 🏗️ Technical Architecture

The architecture follows the **Charms "App" Model**:

1.  **Off-Chain Game**: Users play the game in the browser (JS).
2.  **Proof Generation**: 
    - The browser sends game history to a local `node` server.
    - The server invokes the `charms spell prove` CLI.
    - The CLI runs our compiled Rust app (`trust-game`) to generate a ZK proof.
    - **Result**: A cryptographic proof that "This user cooperated 80% of the time".
3.  **On-Chain Settlement**:
    - `CharmsClient.js` constructs two transactions:
        - **Tx1 (Commit)**: Commits to the spell.
        - **Tx2 (Spell)**: Publicly reveals the spell data (vote) in the witness, linked to the proof.
4.  **Verification**: Any node can verify the vote's weight is legitimate by checking the ZK proof against the app's verification key.

## 🚀 Future Roadmap

- **Mainnet Deployment**: Move from Signet to Bitcoin Mainnet.
- **Validator Network**: Allow "Trusted" tier players (75%+ reputation) to become federation members for L2 bridges.
- **Universal Reputation**: Standardize the `PlayerReputation` struct so other Bitcoin apps/games can reuse the same trust score.

**Thank you for judging Covenant!**
