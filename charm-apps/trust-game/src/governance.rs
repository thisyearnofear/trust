/**
 * CHARMS GOVERNANCE MODULE
 * 
 * Enables community voting on game parameters using reputation-weighted voting.
 * 
 * Key concepts:
 * - Proposals: Community members suggest rule changes (e.g., "Change R payoff to 3")
 * - Voting: Players vote on proposals, weighted by their reputation score
 * - Execution: Passed proposals update contract state for next game
 */

use serde::{Deserialize, Serialize};

/// Types of governance proposals
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProposalType {
    /// Change a payoff matrix value
    ChangePayoff,
    /// Add a new strategy to the game
    AddStrategy,
    /// Modify voting parameters
    ChangeGovernance,
}

/// Voting choice
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Vote {
    /// Vote for the proposal
    Yes,
    /// Vote against the proposal
    No,
    /// Abstain from voting
    Abstain,
}

/// A governance proposal
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GovernanceProposal {
    /// Unique proposal ID
    pub id: u32,
    /// Type of proposal
    pub proposal_type: ProposalType,
    /// Human-readable description
    pub description: String,
    /// Current voting round number (for voting period)
    pub voting_round: u32,
    /// Total voting rounds available (e.g., 3 = 3 blocks to vote)
    pub total_voting_rounds: u32,
    /// Current vote counts
    pub yes_votes: u32,
    pub no_votes: u32,
    pub abstain_votes: u32,
    /// Total voting power in favor (weight by reputation)
    pub yes_voting_power: u32,
    pub no_voting_power: u32,
    pub abstain_voting_power: u32,
    /// Whether this proposal has been executed
    pub executed: bool,
}

impl GovernanceProposal {
    /// Create a new proposal
    pub fn new(id: u32, proposal_type: ProposalType, description: String) -> Self {
        GovernanceProposal {
            id,
            proposal_type,
            description,
            voting_round: 0,
            total_voting_rounds: 3, // Default: 3 blocks for voting
            yes_votes: 0,
            no_votes: 0,
            abstain_votes: 0,
            yes_voting_power: 0,
            no_voting_power: 0,
            abstain_voting_power: 0,
            executed: false,
        }
    }

    /// Check if voting is still open
    pub fn is_voting_open(&self) -> bool {
        !self.executed && self.voting_round < self.total_voting_rounds
    }

    /// Check if proposal has passed (majority of voting power)
    pub fn has_passed(&self) -> bool {
        let total_voting_power =
            self.yes_voting_power + self.no_voting_power + self.abstain_voting_power;

        if total_voting_power == 0 {
            return false;
        }

        // Proposal passes if yes votes > 50% of total voting power
        self.yes_voting_power > (total_voting_power / 2)
    }

    /// Advance to next voting round
    pub fn advance_round(&mut self) {
        if self.voting_round < self.total_voting_rounds {
            self.voting_round += 1;
        }
    }
}

/// Record of a player's vote on a proposal
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerVote {
    /// Bitcoin address of the voter
    pub address: String,
    /// Which proposal they voted on
    pub proposal_id: u32,
    /// Their vote
    pub vote: Vote,
    /// Their reputation score at time of voting
    pub voter_reputation: u32,
    /// Their voting power (reputation-weighted)
    pub voting_power: u32,
    /// Timestamp of vote
    pub timestamp: u64,
}

/// Voting record for a proposal
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VotingRound {
    /// Proposal ID
    pub proposal_id: u32,
    /// All votes cast in this round
    pub votes: Vec<PlayerVote>,
    /// Addresses that have already voted (prevent double voting)
    pub voted_addresses: Vec<String>,
}

impl VotingRound {
    /// Create a new voting round for a proposal
    pub fn new(proposal_id: u32) -> Self {
        VotingRound {
            proposal_id,
            votes: Vec::new(),
            voted_addresses: Vec::new(),
        }
    }

    /// Check if a player has already voted
    pub fn has_voted(&self, address: &str) -> bool {
        self.voted_addresses.contains(&address.to_string())
    }

    /// Record a vote (prevents double voting)
    pub fn cast_vote(
        &mut self,
        address: String,
        vote: Vote,
        voter_reputation: u32,
        voting_power: u32,
        timestamp: u64,
    ) -> Result<(), String> {
        // Check if already voted
        if self.has_voted(&address) {
            return Err(format!("Player {} has already voted", address));
        }

        // Record the vote
        self.votes.push(PlayerVote {
            address: address.clone(),
            proposal_id: self.proposal_id,
            vote,
            voter_reputation,
            voting_power,
            timestamp,
        });

        // Add to voted addresses
        self.voted_addresses.push(address);

        Ok(())
    }

    /// Tally votes and update proposal
    pub fn tally(&self, proposal: &mut GovernanceProposal) -> Result<(), String> {
        if proposal.executed {
            return Err("Proposal already executed".to_string());
        }

        // Reset vote counts
        proposal.yes_votes = 0;
        proposal.no_votes = 0;
        proposal.abstain_votes = 0;
        proposal.yes_voting_power = 0;
        proposal.no_voting_power = 0;
        proposal.abstain_voting_power = 0;

        // Tally votes
        for player_vote in &self.votes {
            match player_vote.vote {
                Vote::Yes => {
                    proposal.yes_votes += 1;
                    proposal.yes_voting_power += player_vote.voting_power;
                }
                Vote::No => {
                    proposal.no_votes += 1;
                    proposal.no_voting_power += player_vote.voting_power;
                }
                Vote::Abstain => {
                    proposal.abstain_votes += 1;
                    proposal.abstain_voting_power += player_vote.voting_power;
                }
            }
        }

        Ok(())
    }
}

/// Cross-app dependency registration
/// Allows other Charms apps to declare they depend on this governance system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependentApp {
    /// Charms app ID (verification key)
    pub app_id: String,
    /// Human-readable name
    pub app_name: String,
    /// Minimum reputation tier required to use this app
    /// 0=Suspicious, 1=Neutral, 2=Trusted
    pub min_reputation_tier: u8,
    /// Timestamp when registered
    pub registered_at: u64,
}

/// Governance state for the game
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GovernanceState {
    /// Next proposal ID
    pub next_proposal_id: u32,
    /// Active proposals
    pub proposals: Vec<GovernanceProposal>,
    /// Voting records for each proposal
    pub voting_rounds: Vec<VotingRound>,
    /// Apps that depend on this reputation system
    pub dependent_apps: Vec<DependentApp>,
}

impl GovernanceState {
    /// Create new governance state
    pub fn new() -> Self {
        GovernanceState {
            next_proposal_id: 1,
            proposals: Vec::new(),
            voting_rounds: Vec::new(),
            dependent_apps: Vec::new(),
        }
    }

    /// Create a new proposal
    pub fn create_proposal(
        &mut self,
        proposal_type: ProposalType,
        description: String,
    ) -> u32 {
        let id = self.next_proposal_id;
        self.next_proposal_id += 1;

        let proposal = GovernanceProposal::new(id, proposal_type, description);
        let voting_round = VotingRound::new(id);

        self.proposals.push(proposal);
        self.voting_rounds.push(voting_round);

        id
    }

    /// Get a proposal by ID
    pub fn get_proposal(&self, id: u32) -> Option<&GovernanceProposal> {
        self.proposals.iter().find(|p| p.id == id)
    }

    /// Get a mutable proposal by ID
    pub fn get_proposal_mut(&mut self, id: u32) -> Option<&mut GovernanceProposal> {
        self.proposals.iter_mut().find(|p| p.id == id)
    }

    /// Get voting round for a proposal
    pub fn get_voting_round_mut(&mut self, proposal_id: u32) -> Option<&mut VotingRound> {
        self.voting_rounds
            .iter_mut()
            .find(|vr| vr.proposal_id == proposal_id)
    }

    /// Cast a vote on a proposal
    pub fn vote(
        &mut self,
        proposal_id: u32,
        address: String,
        vote: Vote,
        voter_reputation: u32,
        voting_power: u32,
        timestamp: u64,
    ) -> Result<(), String> {
        // Check if proposal exists and voting is open
        let is_voting_open = self
            .get_proposal(proposal_id)
            .map(|p| p.is_voting_open())
            .ok_or("Proposal not found".to_string())?;

        if !is_voting_open {
            return Err("Voting period has ended".to_string());
        }

        // Cast vote in voting round
        if let Some(voting_round) = self.get_voting_round_mut(proposal_id) {
            voting_round.cast_vote(
                address,
                vote,
                voter_reputation,
                voting_power,
                timestamp,
            )?;
        }

        // Tally votes - get copy of votes first to avoid borrow issues
        if let Some(vr) = self.voting_rounds.iter().find(|v| v.proposal_id == proposal_id) {
            let votes_copy = vr.votes.clone();
            if let Some(proposal) = self.get_proposal_mut(proposal_id) {
                // Manually tally
                proposal.yes_votes = 0;
                proposal.no_votes = 0;
                proposal.abstain_votes = 0;
                proposal.yes_voting_power = 0;
                proposal.no_voting_power = 0;
                proposal.abstain_voting_power = 0;

                for pv in &votes_copy {
                    match pv.vote {
                        Vote::Yes => {
                            proposal.yes_votes += 1;
                            proposal.yes_voting_power += pv.voting_power;
                        }
                        Vote::No => {
                            proposal.no_votes += 1;
                            proposal.no_voting_power += pv.voting_power;
                        }
                        Vote::Abstain => {
                            proposal.abstain_votes += 1;
                            proposal.abstain_voting_power += pv.voting_power;
                        }
                    }
                }
            }
        }

        Ok(())
    }

    /// Execute a proposal (mark as executed)
    pub fn execute_proposal(&mut self, proposal_id: u32) -> Result<bool, String> {
        let proposal = self
            .get_proposal_mut(proposal_id)
            .ok_or("Proposal not found".to_string())?;

        if proposal.executed {
            return Err("Proposal already executed".to_string());
        }

        let passed = proposal.has_passed();

        if passed {
            proposal.executed = true;
        }

        Ok(passed)
    }

    /// Get all active proposals
    pub fn get_active_proposals(&self) -> Vec<&GovernanceProposal> {
        self.proposals
            .iter()
            .filter(|p| p.is_voting_open())
            .collect()
    }

    /// Get all executed proposals
    pub fn get_executed_proposals(&self) -> Vec<&GovernanceProposal> {
        self.proposals.iter().filter(|p| p.executed).collect()
    }

    /// Register a dependent app that uses this governance system
    pub fn register_dependent_app(
        &mut self,
        app_id: String,
        app_name: String,
        min_reputation_tier: u8,
    ) -> Result<(), String> {
        // Check if app already registered
        if self
            .dependent_apps
            .iter()
            .any(|app| app.app_id == app_id)
        {
            return Err(format!("App {} already registered", app_id));
        }

        // Add to dependent apps
        self.dependent_apps.push(DependentApp {
            app_id,
            app_name,
            min_reputation_tier,
            registered_at: 0, // Would be block height in real implementation
        });

        Ok(())
    }

    /// Get all dependent apps
    pub fn get_dependent_apps(&self) -> Vec<&DependentApp> {
        self.dependent_apps.iter().collect()
    }

    /// Check if an address meets minimum reputation for an app
    pub fn check_app_eligibility(
        &self,
        app_id: &str,
        user_tier: u8,
    ) -> Result<bool, String> {
        let app = self
            .dependent_apps
            .iter()
            .find(|a| a.app_id == app_id)
            .ok_or_else(|| format!("App {} not found", app_id))?;

        Ok(user_tier >= app.min_reputation_tier)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_proposal_creation() {
        let mut gov = GovernanceState::new();
        let id = gov.create_proposal(ProposalType::ChangePayoff, "Change R to 3".to_string());

        assert_eq!(id, 1);
        assert_eq!(gov.proposals.len(), 1);
        assert!(gov.get_proposal(1).is_some());
    }

    #[test]
    fn test_voting() {
        let mut gov = GovernanceState::new();
        let id = gov.create_proposal(ProposalType::ChangePayoff, "Change R to 3".to_string());

        // Cast votes
        gov.vote(
            id,
            "alice".to_string(),
            Vote::Yes,
            75,
            112, // 75 * 1.5 (Trusted multiplier)
            1000,
        )
        .unwrap();

        gov.vote(
            id,
            "bob".to_string(),
            Vote::No,
            40,
            20, // 40 * 0.5 (Suspicious multiplier)
            1001,
        )
        .unwrap();

        // Check proposal state
        let proposal = gov.get_proposal(id).unwrap();
        assert_eq!(proposal.yes_votes, 1);
        assert_eq!(proposal.no_votes, 1);
        assert!(proposal.has_passed()); // 112 > (112+20)/2
    }

    #[test]
    fn test_double_vote_prevention() {
        let mut gov = GovernanceState::new();
        let id = gov.create_proposal(ProposalType::ChangePayoff, "Change R to 3".to_string());

        // First vote succeeds
        assert!(gov
            .vote(
                id,
                "alice".to_string(),
                Vote::Yes,
                75,
                112,
                1000,
            )
            .is_ok());

        // Second vote from same address fails
        assert!(gov
            .vote(
                id,
                "alice".to_string(),
                Vote::No,
                75,
                112,
                1001,
            )
            .is_err());
    }

    #[test]
    fn test_register_dependent_app() {
        let mut gov = GovernanceState::new();

        // Register an app
        let result = gov.register_dependent_app(
            "nft_mint_app".to_string(),
            "NFT Minting".to_string(),
            1, // Requires Neutral or better
        );

        assert!(result.is_ok());
        assert_eq!(gov.dependent_apps.len(), 1);
    }

    #[test]
    fn test_duplicate_app_registration() {
        let mut gov = GovernanceState::new();

        // Register app
        gov.register_dependent_app(
            "nft_app".to_string(),
            "NFT".to_string(),
            1,
        )
        .unwrap();

        // Try to register again
        let result = gov.register_dependent_app(
            "nft_app".to_string(),
            "NFT".to_string(),
            1,
        );

        assert!(result.is_err());
    }

    #[test]
    fn test_app_eligibility() {
        let mut gov = GovernanceState::new();
        gov.register_dependent_app(
            "nft_app".to_string(),
            "NFT".to_string(),
            2, // Requires Trusted
        )
        .unwrap();

        // Trusted player (tier 2) is eligible
        assert!(gov
            .check_app_eligibility("nft_app", 2)
            .unwrap());

        // Neutral player (tier 1) is not eligible
        assert!(!gov
            .check_app_eligibility("nft_app", 1)
            .unwrap());

        // Suspicious player (tier 0) is not eligible
        assert!(!gov
            .check_app_eligibility("nft_app", 0)
            .unwrap());
    }

    #[test]
    fn test_get_dependent_apps() {
        let mut gov = GovernanceState::new();

        gov.register_dependent_app(
            "nft_app".to_string(),
            "NFT".to_string(),
            1,
        )
        .unwrap();

        gov.register_dependent_app(
            "defi_app".to_string(),
            "DeFi".to_string(),
            2,
        )
        .unwrap();

        let apps = gov.get_dependent_apps();
        assert_eq!(apps.len(), 2);
        assert_eq!(apps[0].app_name, "NFT");
        assert_eq!(apps[1].app_name, "DeFi");
    }
}
