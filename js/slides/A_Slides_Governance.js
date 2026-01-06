/**
 * GOVERNANCE SLIDES - Integrated into game flow
 * 
 * Appears AFTER sandbox completes, using player's reputation to vote on
 * changes that affect the NEXT game run.
 * 
 * Flow:
 * Play game → Earn reputation (reputation_summary) → 
 * Set expectations (governance_expectations) →
 * Governance intro (governance_intro) →
 * Connect wallet (governance_connect) → 
 * Vote on proposals (governance_voting) → 
 * See results (governance_summary)
 */

// Set expectations: clarify what's mocked vs real
SLIDES.push({
	id: "governance_expectations",
	onstart: function (self) {

		var o = self.objects;

		// Splash
		self.add({ id: "splash", type: "Splash" });

		// HEADER
		self.add({
			id: "header", type: "TextBox",
			x: 200, y: 70, width: 400,
			text: "<b>What Happens Next</b>",
			size: 20, color: "#333", align: "center"
		});

		// Check wallet connection status
		var walletConnected = window.OnChainUI && window.OnChainUI.enabled;

		// Main explanation
		var expectText = "";
		if (walletConnected) {
			expectText = "<b>Your Bitcoin wallet is connected.</b><br><br>";
			expectText += "Your governance votes will be <b>recorded on-chain</b> via Charms smart contracts.<br><br>";
			expectText += "This proves your participation in Bitcoin's game-theoretic governance and anchors your reputation to the blockchain.";
		} else {
			expectText = "<b>You're in simulation mode.</b><br><br>";
			expectText += "Your votes will be recorded locally in this game session but <b>not on-chain</b>.<br><br>";
			expectText += "You can still participate and explore how governance works. Connect a Bitcoin wallet anytime to anchor your votes to the blockchain.";
		}

		self.add({
			id: "explanation", type: "TextBox",
			x: 80, y: 180, width: 800, height: 180,
			text: expectText,
			size: 13, align: "center"
		});

		// Mode indicator box
		var modeColor = walletConnected ? "#4CAF50" : "#FFC107";
		var modeLabel = walletConnected ? "🔗 ON-CHAIN MODE" : "📋 SIMULATION MODE";
		var modeBg = walletConnected ? "rgba(76, 175, 80, 0.1)" : "rgba(255, 193, 7, 0.1)";

		self.add({
			id: "mode_indicator", type: "TextBox",
			x: 200, y: 380, width: 400,
			text: `<span style="color: ${modeColor}; font-weight: bold; font-size: 15px;">${modeLabel}</span>`,
			size: 12, color: modeColor, align: "center"
		});

		// Set background for mode indicator
		if (o.mode_indicator && o.mode_indicator.dom) {
			o.mode_indicator.dom.style.background = modeBg;
			o.mode_indicator.dom.style.padding = "12px";
			o.mode_indicator.dom.style.borderRadius = "6px";
			o.mode_indicator.dom.style.border = `2px solid ${modeColor}`;
			o.mode_indicator.dom.style.marginTop = "10px";
		}

		// Continue button
		self.add({
			id: "button", type: "Button", x: 400, y: 450,
			text_id: "button_continue",
			message: "slideshow/next"
		});

	},
	onend: function (self) {
		self.clear();
	}
});

// Governance intro: explain voting before wallet connection
SLIDES.push({
    id: "governance_intro",
    onstart: function (self) {

        var o = self.objects;

        // Add Splash character in background
        self.add({ id: "splash", type: "Splash", x: 0, y: 50 });

        // HEADER with pulsing animation
        self.add({
            id: "header", type: "TextBox",
            x: 200, y: 100, width: 400,
            text_id: "chapter_governance_voting", // "Your Vote Matters"
            size: 24, color: "#333", align: "center"
        });

        // Add animated border effect via CSS class
        if (o.header && o.header.dom) {
            o.header.dom.classList.add("governance-voting-title");
        }

        // Get player reputation data
        const reputation = getGameReputation();
        const tier = reputation.getReputationTier();
        const votingPower = reputation.getVotingPower();
        const cooperativeRate = reputation.calculateScore();

        self.add({
            id: "tier_display", type: "TextBox",
            x: 200, y: 200, width: 400,
            align: "center",
            text: `Your Reputation: <span class="${tier.cssClass}">${tier.label}</span>`,
            size: 16, color: "#333"
        });

        // Intro text with dynamic substitution
        var governanceText = Words.get("governance_intro_text");

        // Replace placeholders with actual player data
        governanceText = governanceText.replace("[COOPERATION_RATE]", Math.round(cooperativeRate));
        governanceText = governanceText.replace("[TOTAL_MOVES]", reputation.totalMoves);
        governanceText = governanceText.replace("[TIER_CLASS]", tier.cssClass);
        governanceText = governanceText.replace("[TIER_LABEL]", tier.label);
        governanceText = governanceText.replace("[VOTING_POWER]", votingPower);

        self.add({
            id: "text", type: "TextBox",
            x: 200, y: 230, width: 400, height: 200,
            text: governanceText,
            align: "center",
            size: 11
        });

        // Continue button
        self.add({
            id: "button", type: "Button",
            x: 350, y: 440, size: "short",
            text_id: "governance_intro_btn",
            message: "slideshow/next"
        });

    },
    onend: function (self) {
        self.remove("splash");
        self.remove("header");
        self.remove("tier_display");
        self.remove("text");
        self.remove("button");
    }
});

// Wallet connection (required for voting)
SLIDES.push({
    id: "governance_connect",
    onstart: function (self) {
        
        var o = self.objects;

        // Splash
        self.add({ id: "splash", type: "Splash" });

        // HEADER with pulsing animation
        self.add({
            id: "header", type: "TextBox",
            x: 100, y: 40, width: 760,
            text: "<b>Connect Your Bitcoin Wallet</b>",
            size: 20, color: "#333", align: "center"
        });
        
        // Add animated border effect via CSS class
        if (o.header && o.header.dom) {
            o.header.dom.classList.add("governance-voting-title");
        }

        // Wallet connection prompt
        var walletText = "Your governance votes will be recorded on-chain using zero-knowledge proofs.<br><br>";
        walletText += "Connect your Bitcoin wallet (Unisat or Leather) to participate in voting.";

        self.add({
            id: "wallet_text", type: "TextBox",
            x: 100, y: 140, width: 760, height: 150,
            text: walletText,
            align: "center",
            size: 14
        });

        // Wallet status display
        var statusText = "Wallet: Disconnected";
        if (window.OnChainUI && window.OnChainUI.getSlideStatus) {
            var status = OnChainUI.getSlideStatus();
            if (status.connected) {
                statusText = `Wallet: Connected ✓`;
            }
        }

        self.add({
            id: "wallet_status_display", type: "TextBox",
            x: 100, y: 320, width: 760,
            text: statusText,
            size: 12, color: "#666",
            align: "center"
        });

        // Connect wallet button
        var handleConnectWallet = function () {
            if (window.OnChainUI) {
                // Show connecting status
                o.wallet_status_display.setText("Wallet: Connecting...");

                // Attempt connection
                OnChainUI.connectWallet();

                // Check status after a moment
                setTimeout(function () {
                    var status = OnChainUI.getSlideStatus();
                    if (status.connected) {
                        o.wallet_status_display.setText(`Wallet: Connected ✓<br><span style="font-size:11px;">${status.address.substring(0, 16)}...${status.address.substring(status.address.length - 6)}</span>`);
                        o.button_continue.setText("Continue to Voting");
                    } else {
                        o.wallet_status_display.setText("Wallet: Connection failed. Try installing Unisat or Leather.");
                    }
                }, 1500);
            }
        };

        self.add({
            id: "button_connect", type: "Button", x: 225, y: 370, size: "short",
            text_id: "button_connect_wallet",
            onclick: handleConnectWallet
        });

        // Continue button (enabled only after connection)
        self.add({
            id: "button_continue", type: "Button", x: 605, y: 370, size: "short",
            text_id: "button_continue_voting",
            message: "slideshow/next"
        });

    },
    onend: function (self) {
        self.clear();
    }
});

// Vote on first proposal
SLIDES.push({
	id: "governance_voting",
	onstart: function (self) {

		var o = self.objects;
		var governance = getGameGovernance();
		var reputation = getGameReputation();
		var tier = reputation.getReputationTier();
		var proposals = governance.getActiveProposals().filter(p => p.is_voting_open);

		// If no proposals, skip to results
		if (proposals.length === 0) {
			publish("slideshow/next");
			return;
		}

		// Get first unvoted proposal
		var proposal = proposals[0];
		window._currentProposalIndex = 0;

		// Splash
		self.add({ id: "splash", type: "Splash" });

		// NO Iterated component - just clean centered text with border animation
		self.add({
			id: "header", type: "TextBox",
			x: 200, y: 120, width: 400,
			text_id: "governance_header",
			size: 16, color: "#333", align: "center"
		});
		
		// Add animated border effect via CSS class
		if (o.header && o.header.dom) {
			o.header.dom.classList.add("governance-voting-title");
		}



        // Proposal description
        var proposalText = `<b>Proposal #${proposal.id}: ${proposal.title}</b><br><br>`;
        proposalText += proposal.description;

        self.add({
            id: "proposal", type: "TextBox",
            x: 100, y: 200, width: 760, height: 100,
            text: proposalText,
            size: 12, align: "left"
        });

        // Voting power display
        var votingPower = reputation.getVotingPower();
        self.add({
            id: "power", type: "TextBox",
            x: 100, y: 305, width: 760, height: 30,
            text: `<b>Your voting power: ${votingPower} votes</b>`,
            size: 11, align: "center"
        });

        // Voting buttons
        var handleVote = function (vote) {
            governance.castVote(proposal.id, reputation.address || "anonymous", vote, votingPower);
            
            // Play feedback sound and show success
            if (window.UXFeedback) {
                UXFeedback.voteSubmitted(vote);
            }
            
            // Update UI with colored checkmark
            var voteEmoji = vote === "yes" ? "✓" : (vote === "no" ? "✗" : "∘");
            var voteText = vote === "yes" ? "YES (APPROVED)" : (vote === "no" ? "NO (REJECTED)" : "ABSTAIN");
            o.voted_status.setText(`${voteEmoji} You voted <b>${voteText}</b>`);
            
            // Disable buttons with visual feedback
            o.button_yes.dom.classList.add("disabled");
            o.button_no.dom.classList.add("disabled");
            o.button_abstain.dom.classList.add("disabled");
            o.button_yes.setEnabled(false);
            o.button_no.setEnabled(false);
            o.button_abstain.setEnabled(false);

            // Move to next proposal after a moment
            setTimeout(function () {
                window._currentProposalIndex++;
                var remainingProposals = governance.getActiveProposals().filter(p => p.is_voting_open && !governance.getProposal(p.id).userHasVoted);
                if (remainingProposals.length > 0) {
                    publish("slideshow/next");
                } else {
                    // All proposals voted on, move to results
                    governance.closeVotingRound();
                    publish("slideshow/next");
                }
            }, 1200);
        };

        self.add({
            id: "button_yes", type: "Button",
            x: 200, y: 355, size: "short",
            text_id: "button_vote_yes",
            onclick: function () { handleVote("yes"); }
        });

        self.add({
            id: "button_no", type: "Button",
            x: 400, y: 355, size: "short",
            text_id: "button_vote_no",
            onclick: function () { handleVote("no"); }
        });

        self.add({
            id: "button_abstain", type: "Button",
            x: 600, y: 355, size: "short",
            text_id: "button_abstain",
            onclick: function () { handleVote("abstain"); }
        });

        // Vote confirmation message (hidden initially)
        self.add({
            id: "voted_status", type: "TextBox",
            x: 100, y: 410, width: 760, height: 40,
            text: "",
            size: 12, color: "#4CAF50", align: "center"
        });

    },
    onend: function (self) {
        self.clear();
    }
});

// Governance voting summary
SLIDES.push({
	id: "governance_summary",
	onstart: function (self) {

		var o = self.objects;

		// Splash
		self.add({ id: "splash", type: "Splash" });

		// HEADER with pulsing animation
		self.add({
			id: "header", type: "TextBox",
			x: 200, y: 50, width: 400,
			text: "<b>Governance Results</b>",
			size: 20, color: "#333", align: "center"
		});
		
		// Add animated border effect via CSS class
		if (o.header && o.header.dom) {
			o.header.dom.classList.add("governance-voting-title");
		}

        // Get governance results
        var governance = getGameGovernance();
        var results = governance.getSummary();

        var summaryText = "Your votes have been recorded on-chain. You've helped shape the next round of Bitcoin's game design!<br><br>";

        // Add proposal results
        summaryText += "<b>Proposal Outcomes:</b><br>";
        var hasVoted = false;
        governance.proposals.forEach((p) => {
            if (p.has_voted) {
                hasVoted = true;
                const passedText = p.has_passed ? "✓ PASSED" : "✗ FAILED";
                const myVote = p.my_vote ? `(You voted: ${p.my_vote.toUpperCase()})` : "";
                summaryText += `• Proposal #${p.id}: ${passedText} ${myVote}<br>`;
            }
        });
        
        if (!hasVoted) {
            summaryText += "No votes cast (Anonymous/Abstained).<br>";
        }
        
        summaryText += "<br><b>What's Next?</b><br>";
        summaryText += "In Bitcoin, the game never ends. Rules evolve, but the core principle remains: " +
                      "honesty dominates when the protocol enforces it.";

        self.add({
            id: "text", type: "TextBox",
            x: 100, y: 160, width: 760, height: 250,
            text: summaryText,
            size: 13, align: "center"
        });

        // Continue button
        self.add({
            id: "button", type: "Button", x: 400, y: 440,
            text: "View Credits", // Explicit action
            message: "slideshow/next"
        });

    },
    onend: function (self) {
        self.clear();
    }
});
