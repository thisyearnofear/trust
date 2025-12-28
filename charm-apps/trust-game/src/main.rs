/**
 * CHARMS ZKVM ENTRYPOINT
 * 
 * This is the main binary executed by Charms zkVM for proving game moves.
 * The zkVM will:
 * 1. Load game history from witness data
 * 2. Execute this program with that history
 * 3. Generate a cryptographic proof of correct execution
 * 4. Embed proof in witness data on-chain
 * 
 * Usage (via Charms):
 *   charms spell check --app-bins=target/release/trust-game ...
 */

use serde::{Deserialize, Serialize};
use std::io::Read;
use trust_game::PlayerReputation;

/// Input to the zkVM: game history to prove
#[derive(Debug, Serialize, Deserialize)]
pub struct ProveInput {
    /// Player's Bitcoin address
    pub player_address: String,
    /// Sequence of moves made by the player
    pub moves: Vec<u32>, // 0 = Cooperate, 1 = Defect
    /// Opponent's moves (for context)
    pub opponent_moves: Vec<u32>,
    /// Payoff matrix [R, T, S, P]
    pub payoffs: [i32; 4],
}

/// Output from the zkVM: verified reputation
#[derive(Debug, Serialize, Deserialize)]
pub struct ProveOutput {
    /// Player's address
    pub player_address: String,
    /// Total moves
    pub total_moves: u32,
    /// Cooperative moves
    pub cooperative_moves: u32,
    /// Calculated reputation score (0-100)
    pub reputation_score: u32,
    /// Reputation tier (0=Suspicious, 1=Neutral, 2=Trusted)
    pub tier: u8,
    /// Voting power
    pub voting_power: u32,
}

fn main() {
    // Read input from stdin
    let mut input_data = Vec::new();
    std::io::stdin()
        .read_to_end(&mut input_data)
        .expect("Failed to read input");

    // Deserialize input
    let input: ProveInput = serde_json::from_slice(&input_data)
        .expect("Failed to deserialize input");

    // Validate and prove move correctness
    let mut cooperative_count = 0;

    for move_val in &input.moves {
        if *move_val == 0 {
            cooperative_count += 1;
        }
        assert!(
            *move_val == 0 || *move_val == 1,
            "Invalid move: must be 0 (Cooperate) or 1 (Defect)"
        );
    }

    // Validate payoff matrix (typical PD constraints)
    assert!(
        input.payoffs[1] > input.payoffs[0],
        "Temptation (T) must be > Reward (R)"
    );
    assert!(
        input.payoffs[0] > input.payoffs[3],
        "Reward (R) must be > Punishment (P)"
    );
    assert!(
        input.payoffs[3] > input.payoffs[2],
        "Punishment (P) must be > Sucker (S)"
    );

    // Calculate reputation
    let total_moves = input.moves.len() as u32;
    let reputation = PlayerReputation::calculate_from_moves(
        input.player_address.clone(),
        total_moves,
        cooperative_count as u32,
    );

    // Create output
    let output = ProveOutput {
        player_address: input.player_address,
        total_moves,
        cooperative_moves: cooperative_count as u32,
        reputation_score: reputation.reputation_score,
        tier: reputation.tier,
        voting_power: reputation.voting_power,
    };

    // Write output to stdout
    let output_json = serde_json::to_vec(&output).expect("Failed to serialize output");
    std::io::Write::write_all(&mut std::io::stdout(), &output_json)
        .expect("Failed to write output");
}
