/**
 * GOVERNANCE SLIDES - Integrated into game flow
 * 
 * Appears AFTER sandbox completes, using player's reputation to vote on
 * changes that affect the NEXT game run.
 * 
 * Flow:
 * Play game → Earn reputation (reputation_summary) → 
 * Governance intro (governance_intro) →
 * Connect wallet (governance_connect) → 
 * Vote on proposals (governance_voting) → 
 * See results (governance_summary)
 */

// Governance intro: explain voting before wallet connection
SLIDES.push({
    id: "governance_intro",
    onstart: function (self) {

        var o = self.objects;

        // Use Iterated component for central framing animation
        self.add({id:"iterated", type:"Iterated", x:130, y:133});
        o.iterated.dehighlightPayoff();

        // Add Splash character in background
        self.add({ id: "splash", type: "Splash", x: 0, y: 50 });

        // Get player reputation data
        const reputation = getGameReputation();
        const tier = reputation.getReputationTier();
        const votingPower = reputation.getVotingPower();
        const cooperativeRate = reputation.calculateScore();

        self.add({
            id: "tier_display", type: "TextBox",
            x: 200, y: 150, width: 400,
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
            x: 200, y: 180, width: 400, height: 200,
            text: governanceText,
            align: "center",
            size: 11
        });

        // Continue button
        self.add({
            id: "button", type: "Button",
            x: 350, y: 400, size: "short",
            text_id: "governance_intro_btn",
            message: "slideshow/next"
        });

    },
    onend: function (self) {
        self.remove("splash");
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

        // Wallet connection prompt
        var walletText = "<b>Connect Your Bitcoin Wallet</b><br><br>";
        walletText += "Your governance votes will be recorded on-chain using zero-knowledge proofs.<br><br>";
        walletText += "Connect your Bitcoin wallet (Unisat or Leather) to participate in voting.";

        self.add({
            id: "wallet_text", type: "TextBox",
            x: 100, y: 60, width: 760, height: 250,
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

        // Add Iterated component for central framing animation
        self.add({id:"iterated", type:"Iterated", x:130, y:133});
        o.iterated.dehighlightPayoff();

        self.add({
            id: "header", type: "TextBox",
            x: 200, y: 150, width: 400,
            text_id: "governance_header",
            size: 14, color: "#333", align: "center"
        });



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
            
            // Update UI
            o.voted_status.setText(`You voted <b>${vote.toUpperCase()}</b> on Proposal #${proposal.id}`);
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
            }, 800);
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

        // Use Iterated component for central framing animation
        self.add({id:"iterated", type:"Iterated", x:130, y:133});
        o.iterated.dehighlightPayoff();

        // Get governance results
        var governance = getGameGovernance();
        var results = governance.getSummary();

        var summaryText = "<b>Governance Results</b><br><br>";
        summaryText += "Your votes have been recorded and will influence the next round of Bitcoin's game design!<br><br>";

        // Add proposal results
        summaryText += "<b>Proposal Outcomes:</b><br>";
        governance.proposals.forEach((p) => {
            if (p.has_voted) {
                const passedText = p.has_passed ? "✓ PASSED" : "✗ FAILED";
                summaryText += `• Proposal #${p.id}: ${passedText}<br>`;
            }
        });

        self.add({
            id: "text", type: "TextBox",
            x: 100, y: 200, width: 760, height: 200,
            text: summaryText,
            size: 12, align: "center"
        });

        // Continue button
        self.add({
            id: "button", type: "Button", x: 400, y: 420,
            text_id: "governance_summary_btn",
            message: "slideshow/next"
        });

    },
    onend: function (self) {
        self.clear();
    }
});
