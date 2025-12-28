/**
 * CHARMS SMART CONTRACT: Bitcoin Evolution of Trust Game Validator
 * 
 * This contract:
 * 1. Validates game moves (COOPERATE or DEFECT)
 * 2. Checks payoff calculations against the PD matrix
 * 3. Verifies strategy consistency
 * 4. Anchors player reputation to blockchain
 * 5. Enables governance voting using reputation-weighted votes
 * 
 * The contract is proven via zero-knowledge proofs, allowing
 * on-chain verification without revealing all game details.
 */

use serde::{Deserialize, Serialize};

// Governance module for proposal voting
pub mod governance;

/// Represents a player's action in the Prisoner's Dilemma
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Move {
    /// Follow consensus rules / validate honestly
    Cooperate = 0,
    /// Attack network / double-spend attempt
    Defect = 1,
}

/// Game outcome for a single round
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct RoundOutcome {
    /// Player 1's move
    pub move_1: Move,
    /// Player 2's move
    pub move_2: Move,
    /// Payoff for player 1
    pub payoff_1: i32,
    /// Payoff for player 2
    pub payoff_2: i32,
}

/// Player reputation record anchored to blockchain
/// Calculated from game history: reputation = (cooperative_moves / total_moves) * 100
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerReputation {
    /// Bitcoin address of the player
    pub address: String,
    /// Total moves made by this player
    pub total_moves: u32,
    /// Number of cooperative moves
    pub cooperative_moves: u32,
    /// Reputation score (0-100, represents cooperativeness percentage)
    pub reputation_score: u32,
    /// Reputation tier (0=Suspicious, 1=Neutral, 2=Trusted)
    pub tier: u8,
    /// Voting power derived from reputation (affected by tier multiplier)
    pub voting_power: u32,
}

impl PlayerReputation {
    /// Calculate reputation score from game history
    pub fn calculate_from_moves(
        address: String,
        total_moves: u32,
        cooperative_moves: u32,
    ) -> Self {
        // Reputation score: (cooperative_moves / total_moves) * 100
        // If no moves yet, neutral reputation (50)
        let score = if total_moves == 0 {
            50
        } else {
            ((cooperative_moves as f64 / total_moves as f64) * 100.0).round() as u32
        };

        // Determine tier based on score
        let (tier, voting_multiplier) = if score >= 75 {
            (2, 1.5) // Trusted
        } else if score >= 50 {
            (1, 1.0) // Neutral
        } else {
            (0, 0.5) // Suspicious
        };

        // Calculate voting power: score * tier_multiplier
        let voting_power = (score as f64 * voting_multiplier).round() as u32;

        PlayerReputation {
            address,
            total_moves,
            cooperative_moves,
            reputation_score: score,
            tier,
            voting_power,
        }
    }

    /// Get reputation tier label
    pub fn get_tier_label(&self) -> &str {
        match self.tier {
            0 => "Suspicious",
            1 => "Neutral",
            2 => "Trusted",
            _ => "Unknown",
        }
    }
}

/// Payoff matrix for the Prisoner's Dilemma
/// Defaults match "The Evolution of Trust"
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PayoffMatrix {
    /// Mutual cooperation reward
    pub r: i32,
    /// Sucker's payoff (cooperate while opponent defects)
    pub s: i32,
    /// Temptation to defect
    pub t: i32,
    /// Mutual defection punishment
    pub p: i32,
}

impl Default for PayoffMatrix {
    fn default() -> Self {
        PayoffMatrix {
            r: 2,  // Both validate honestly → +2 each
            s: -1, // You validate, they attack → -1 for you
            t: 3,  // You attack, they validate → +3 for you
            p: 0,  // Both attack → 0 each
        }
    }
}

/// Game state for a repeated game
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameState {
    /// Round number (0-indexed)
    pub round: u32,
    /// Total rounds in this game
    pub total_rounds: u32,
    /// Payoff matrix
    pub payoff_matrix: PayoffMatrix,
    /// Player 1's cumulative score
    pub score_1: i32,
    /// Player 2's cumulative score
    pub score_2: i32,
    /// History of player 1's moves
    pub history_1: Vec<Move>,
    /// History of player 2's moves
    pub history_2: Vec<Move>,
}

impl GameState {
    /// Create a new game state
    pub fn new(total_rounds: u32) -> Self {
        GameState {
            round: 0,
            total_rounds,
            payoff_matrix: PayoffMatrix::default(),
            score_1: 0,
            score_2: 0,
            history_1: Vec::new(),
            history_2: Vec::new(),
        }
    }

    /// Create a new game with custom payoff matrix
    pub fn new_with_payoffs(total_rounds: u32, payoff_matrix: PayoffMatrix) -> Self {
        GameState {
            round: 0,
            total_rounds,
            payoff_matrix,
            score_1: 0,
            score_2: 0,
            history_1: Vec::new(),
            history_2: Vec::new(),
        }
    }
}

/// Calculate payoffs for a single round
pub fn get_payoffs(move_1: Move, move_2: Move, payoff_matrix: &PayoffMatrix) -> (i32, i32) {
    match (move_1, move_2) {
        // Both cooperate
        (Move::Cooperate, Move::Cooperate) => (payoff_matrix.r, payoff_matrix.r),
        // Player 1 cooperates, Player 2 defects
        (Move::Cooperate, Move::Defect) => (payoff_matrix.s, payoff_matrix.t),
        // Player 1 defects, Player 2 cooperates
        (Move::Defect, Move::Cooperate) => (payoff_matrix.t, payoff_matrix.s),
        // Both defect
        (Move::Defect, Move::Defect) => (payoff_matrix.p, payoff_matrix.p),
    }
}

/// Validate a move in the context of game state
/// 
/// Requirements:
/// 1. Move must be valid (Cooperate or Defect)
/// 2. Payoff calculation must be correct
/// 3. Game state must be consistent
pub fn validate_move(
    state: &GameState,
    move_1: Move,
    move_2: Move,
    claimed_payoff_1: i32,
    claimed_payoff_2: i32,
) -> bool {
    // Verify round is within bounds
    if state.round >= state.total_rounds {
        return false;
    }

    // Calculate actual payoffs
    let (actual_payoff_1, actual_payoff_2) =
        get_payoffs(move_1, move_2, &state.payoff_matrix);

    // Verify payoffs match
    if claimed_payoff_1 != actual_payoff_1 || claimed_payoff_2 != actual_payoff_2 {
        return false;
    }

    // Verify payoff matrix is reasonable (for Bitcoin context)
    // Mutual cooperation should be better than mutual defection
    if state.payoff_matrix.r <= state.payoff_matrix.p {
        return false;
    }

    true
}

/// Validate strategy consistency for Tit-for-Tat
/// (copies opponent's previous move)
pub fn validate_tft_strategy(
    state: &GameState,
    proposed_move: Move,
) -> bool {
    if state.round == 0 {
        // First round should be cooperate
        return proposed_move == Move::Cooperate;
    }

    if state.history_2.is_empty() {
        return false;
    }

    // Proposed move should match opponent's last move
    let last_opponent_move = state.history_2[state.history_2.len() - 1];
    proposed_move == last_opponent_move
}

/// Validate strategy consistency for Always Defect
pub fn validate_always_defect_strategy(proposed_move: Move) -> bool {
    proposed_move == Move::Defect
}

/// Validate strategy consistency for Always Cooperate
pub fn validate_always_cooperate_strategy(proposed_move: Move) -> bool {
    proposed_move == Move::Cooperate
}

/// Validate strategy consistency for Grudge (never forgive)
pub fn validate_grudge_strategy(
    state: &GameState,
    proposed_move: Move,
) -> bool {
    // Check if opponent has ever defected
    for opponent_move in &state.history_2 {
        if *opponent_move == Move::Defect {
            // Once opponent defects, always defect
            return proposed_move == Move::Defect;
        }
    }

    // No defection seen, cooperate
    proposed_move == Move::Cooperate
}

/// Validate a complete game round
pub struct RoundValidator {
    pub state: GameState,
}

impl RoundValidator {
    pub fn new(state: GameState) -> Self {
        RoundValidator { state }
    }

    /// Execute and validate a round
    pub fn play_round(
        &mut self,
        move_1: Move,
        move_2: Move,
    ) -> Result<RoundOutcome, String> {
        // Check round bounds
        if self.state.round >= self.state.total_rounds {
            return Err("Game already finished".to_string());
        }

        // Calculate payoffs
        let (payoff_1, payoff_2) = get_payoffs(move_1, move_2, &self.state.payoff_matrix);

        // Update state
        self.state.history_1.push(move_1);
        self.state.history_2.push(move_2);
        self.state.score_1 += payoff_1;
        self.state.score_2 += payoff_2;
        self.state.round += 1;

        Ok(RoundOutcome {
            move_1,
            move_2,
            payoff_1,
            payoff_2,
        })
    }

    /// Get current game state
    pub fn get_state(&self) -> &GameState {
        &self.state
    }

    /// Check if game is finished
    pub fn is_finished(&self) -> bool {
        self.state.round >= self.state.total_rounds
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_payoff_calculation() {
        let matrix = PayoffMatrix::default();

        // Both cooperate
        assert_eq!(get_payoffs(Move::Cooperate, Move::Cooperate, &matrix), (2, 2));

        // One defects
        assert_eq!(
            get_payoffs(Move::Cooperate, Move::Defect, &matrix),
            (-1, 3)
        );

        // Both defect
        assert_eq!(
            get_payoffs(Move::Defect, Move::Defect, &matrix),
            (0, 0)
        );
    }

    #[test]
    fn test_validate_move() {
        let state = GameState::new(10);

        // Valid move with correct payoffs
        assert!(validate_move(
            &state,
            Move::Cooperate,
            Move::Cooperate,
            2,
            2
        ));

        // Invalid: wrong payoff
        assert!(!validate_move(
            &state,
            Move::Cooperate,
            Move::Cooperate,
            3,
            3
        ));
    }

    #[test]
    fn test_tft_strategy() {
        let mut state = GameState::new(5);

        // First move should be cooperate
        assert!(validate_tft_strategy(&state, Move::Cooperate));
        assert!(!validate_tft_strategy(&state, Move::Defect));

        // Move to round 1
        state.round = 1;
        
        // After opponent cooperates, should cooperate
        state.history_2.push(Move::Cooperate);
        assert!(validate_tft_strategy(&state, Move::Cooperate));

        // Move to round 2
        state.round = 2;
        
        // After opponent defects, should defect
        state.history_2.push(Move::Defect);
        assert!(validate_tft_strategy(&state, Move::Defect));
    }

    #[test]
    fn test_round_validator() {
        let mut validator = RoundValidator::new(GameState::new(3));

        // Play round 1
        let outcome = validator.play_round(Move::Cooperate, Move::Cooperate);
        assert!(outcome.is_ok());
        let outcome = outcome.unwrap();
        assert_eq!(outcome.payoff_1, 2);
        assert_eq!(outcome.payoff_2, 2);

        // Play round 2
        let outcome = validator.play_round(Move::Defect, Move::Cooperate);
        assert!(outcome.is_ok());

        // Check state
        assert_eq!(validator.state.round, 2);
        assert_eq!(validator.state.score_1, 2 + 3); // 2 from coop + 3 from defect
        assert!(!validator.is_finished());
    }

    #[test]
    fn test_reputation_calculation_trusted() {
        // 80% cooperative = Trusted tier
        let rep = PlayerReputation::calculate_from_moves("tb1q...".to_string(), 10, 8);

        assert_eq!(rep.reputation_score, 80);
        assert_eq!(rep.tier, 2); // Trusted
        assert_eq!(rep.voting_power, 120); // 80 * 1.5
        assert_eq!(rep.get_tier_label(), "Trusted");
    }

    #[test]
    fn test_reputation_calculation_neutral() {
        // 60% cooperative = Neutral tier
        let rep = PlayerReputation::calculate_from_moves("tb1q...".to_string(), 10, 6);

        assert_eq!(rep.reputation_score, 60);
        assert_eq!(rep.tier, 1); // Neutral
        assert_eq!(rep.voting_power, 60); // 60 * 1.0
        assert_eq!(rep.get_tier_label(), "Neutral");
    }

    #[test]
    fn test_reputation_calculation_suspicious() {
        // 30% cooperative = Suspicious tier
        let rep = PlayerReputation::calculate_from_moves("tb1q...".to_string(), 10, 3);

        assert_eq!(rep.reputation_score, 30);
        assert_eq!(rep.tier, 0); // Suspicious
        assert_eq!(rep.voting_power, 15); // 30 * 0.5
        assert_eq!(rep.get_tier_label(), "Suspicious");
    }

    #[test]
    fn test_reputation_no_moves() {
        // No moves = Neutral (50%)
        let rep = PlayerReputation::calculate_from_moves("tb1q...".to_string(), 0, 0);

        assert_eq!(rep.reputation_score, 50);
        assert_eq!(rep.tier, 1); // Neutral
        assert_eq!(rep.voting_power, 50);
    }
}
