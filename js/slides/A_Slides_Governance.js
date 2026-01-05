/**
 * GOVERNANCE SLIDE - Integrated into game flow
 * 
 * Appears AFTER tournament results, using player's reputation to vote on
 * changes that affect the NEXT game run.
 * 
 * This creates the feedback loop:
 * Play game → Earn reputation → Connect wallet → Vote on rules → Next game uses new rules
 */

// Wallet connection (required for voting)
SLIDES.push({
    id: "wallet_connect",
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
                statusText = `Wallet: Connected ✓<br><span style="font-size:11px;">${status.address.substring(0, 16)}...${status.address.substring(status.address.length - 6)}</span>`;
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

// Governance intro: "Your votes shape Bitcoin"
SLIDES.push({
    id: "governance_intro",
    onstart: function (self) {

        var o = self.objects;

        // Use Splash character
        self.add({ id: "splash", type: "Splash", x: 0, y: 50 });

        // Get player reputation data
        const reputation = getGameReputation();
        const tier = reputation.getReputationTier();
        const votingPower = reputation.getVotingPower();
        const cooperativeRate = reputation.calculateScore();

        self.add({
            id: "tier_display", type: "TextBox",
            x: 350, y: 30, width: 450,
            align: "center",
            text: `Your Reputation: <span class="${tier.cssClass}">${tier.label}</span>`,
            size: 20, color: "#333"
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
            x: 100, y: 120, width: 760, height: 300,
            text: governanceText,
            align: "center",
            size: 13
        });

        // Continue button
        self.add({
            id: "button", type: "Button",
            x: 605, y: 485, size: "long",
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

        self.add({
            id: "header", type: "TextBox",
            x: 50, y: 20, width: 860,
            text_id: "governance_header",
            size: 18, color: "#333"
        });



        // Proposal description
        var proposalText = `<b>Proposal #${proposal.id}: ${proposal.title}</b><br><br>`;
        proposalText += proposal.description + "<br><br>";
        proposalText += `<span style="color:#666; font-size:14px;">Impact: ${proposal.impact}</span>`;

        self.add({
            id: "proposal", type: "TextBox",
            x: 50, y: 70, width: 860,
            text: proposalText,
            size: 14, color: "#333"
        });

        // Voting power display
        self.add({
            id: "power", type: "TextBox",
            x: 50, y: 220, width: 860,
            text: `Your voting power: <b>${reputation.getVotingPower()} votes</b> (${tier.label})`,
            size: 13, color: "#666"
        });

        // Vote buttons - show preview modal before submission
        var handleVote = function (voteChoice) {
            return function () {
                // Show transaction preview modal
                _showVotePreviewModal(voteChoice, proposal, reputation, tier, self, o);
            };
        };

        // Helper: Show vote preview modal before submission
        var _showVotePreviewModal = function (voteChoice, proposal, reputation, tier, self, o) {
            // Create overlay
            var overlay = document.createElement("div");
            overlay.style.cssText = `
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.7);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            // Create modal panel
            var modal = document.createElement("div");
            modal.style.cssText = `
                background: white;
                border-radius: 8px;
                padding: 30px;
                width: 90%;
                max-width: 550px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                font-family: 'FuturaHandwritten', sans-serif;
            `;

            // Build preview content
            var voteLabel = voteChoice === 'yes' ? '✓ YES' : (voteChoice === 'no' ? '✗ NO' : '— ABSTAIN');
            var voteColor = voteChoice === 'yes' ? '#4caf50' : (voteChoice === 'no' ? '#f44336' : '#ffc107');

            var previewHtml = `
                <h2 style="margin-top:0; color:#333; text-align:center;">Review Your Vote</h2>
                
                <div style="background:#f5f5f5; padding:15px; border-radius:4px; margin:20px 0;">
                    <p style="margin:0 0 10px 0; color:#666; font-size:13px;">PROPOSAL</p>
                    <p style="margin:0; color:#333; font-weight:bold;">Proposal #${proposal.id}: ${proposal.title}</p>
                </div>
                
                <div style="background:#f5f5f5; padding:15px; border-radius:4px; margin:20px 0;">
                    <p style="margin:0 0 10px 0; color:#666; font-size:13px;">YOUR VOTE</p>
                    <p style="margin:0; color:${voteColor}; font-weight:bold; font-size:16px;">${voteLabel}</p>
                </div>
                
                <div style="background:#f5f5f5; padding:15px; border-radius:4px; margin:20px 0;">
                    <p style="margin:0 0 10px 0; color:#666; font-size:13px;">YOUR REPUTATION</p>
                    <p style="margin:0; color:#333;"><b>${reputation.cooperativeMoves}</b> cooperative moves out of <b>${reputation.totalMoves}</b></p>
                    <p style="margin:8px 0 0 0; color:#666; font-size:12px;">Tier: <span style="color:${tier.label === 'Trusted' ? '#4caf50' : (tier.label === 'Neutral' ? '#ffc107' : '#f44336')}; font-weight:bold;">${tier.label}</span></p>
                </div>
                
                <div style="background:#f5f5f5; padding:15px; border-radius:4px; margin:20px 0;">
                    <p style="margin:0 0 10px 0; color:#666; font-size:13px;">VOTING POWER</p>
                    <p style="margin:0; color:#333; font-weight:bold;">${reputation.getVotingPower()} votes</p>
                </div>
                
                <p style="color:#888; font-size:12px; margin:20px 0; text-align:center;">
                    This vote will be recorded on Bitcoin via Charms protocol.
                </p>
            `;

            modal.innerHTML = previewHtml;

            // Create button container
            var buttonContainer = document.createElement("div");
            buttonContainer.style.cssText = `
                display: flex;
                gap: 10px;
                margin-top: 25px;
            `;

            // Confirm button
            var confirmBtn = document.createElement("button");
            confirmBtn.textContent = "Review & Sign";
            confirmBtn.style.cssText = `
                flex: 1;
                padding: 12px 20px;
                background: #4089DD;
                color: white;
                border: none;
                border-radius: 6px;
                font-family: 'FuturaHandwritten', sans-serif;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            confirmBtn.onmouseover = function () { this.style.background = '#5099EE'; };
            confirmBtn.onmouseout = function () { this.style.background = '#4089DD'; };

            confirmBtn.onclick = function () {
                // Remove overlay
                document.body.removeChild(overlay);

                // Proceed with vote submission
                _submitVoteAfterPreview(voteChoice, proposal, reputation, self, o);
            };

            // Cancel button
            var cancelBtn = document.createElement("button");
            cancelBtn.textContent = "Cancel";
            cancelBtn.style.cssText = `
                flex: 1;
                padding: 12px 20px;
                background: #ddd;
                color: #333;
                border: none;
                border-radius: 6px;
                font-family: 'FuturaHandwritten', sans-serif;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            cancelBtn.onmouseover = function () { this.style.background = '#ccc'; };
            cancelBtn.onmouseout = function () { this.style.background = '#ddd'; };

            cancelBtn.onclick = function () {
                document.body.removeChild(overlay);
            };

            buttonContainer.appendChild(confirmBtn);
            buttonContainer.appendChild(cancelBtn);
            modal.appendChild(buttonContainer);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
        };

        // Helper: Submit vote after preview confirmation
        var _submitVoteAfterPreview = function (voteChoice, proposal, reputation, self, o) {
            // Disable buttons immediately
            o.button_yes.dom.style.opacity = 0.4;
            o.button_no.dom.style.opacity = 0.4;
            o.button_abstain.dom.style.opacity = 0.4;
            o.button_yes.dom.style.pointerEvents = "none";
            o.button_no.dom.style.pointerEvents = "none";
            o.button_abstain.dom.style.pointerEvents = "none";

            // Show submitting status
            o.voted_status.setText("⟳ Submitting vote...");
            _show(o.voted_status);
            _fadeIn(o.voted_status, 100);

            // Prepare vote data
            var voteData = {
                proposalId: proposal.id,
                vote: voteChoice
            };

            // Try to submit via OnChainUI (real wallet) if available
            if (window.OnChainUI && window.OnChainUI.submitGovernanceVote) {
                OnChainUI.submitGovernanceVote(voteData)
                    .then(function (spellTxid) {
                        // Success - show txid
                        var confirmText = voteChoice === 'abstain' ?
                            "✓ You abstained" :
                            ("✓ You voted " + voteChoice.toUpperCase());
                        confirmText += `<br><span style="color:#4089DD; font-size:12px;">On-chain: ${spellTxid.substring(0, 16)}...</span>`;
                        o.voted_status.setText(confirmText);

                        // Move to next slide after delay
                        setTimeout(function () {
                            publish("slideshow/next");
                        }, 1500);
                    })
                    .catch(function (err) {
                        // Error - show message and retry option
                        o.voted_status.setText(`✗ ${err.message}<br><span style="font-size:12px;">Please connect wallet or try again</span>`);
                        o.voted_status.dom.style.color = "#FF5E5E";

                        // Re-enable buttons
                        setTimeout(function () {
                            o.button_yes.dom.style.opacity = 1;
                            o.button_no.dom.style.opacity = 1;
                            o.button_abstain.dom.style.opacity = 1;
                            o.button_yes.dom.style.pointerEvents = "auto";
                            o.button_no.dom.style.pointerEvents = "auto";
                            o.button_abstain.dom.style.pointerEvents = "auto";
                        }, 2000);
                    });
            } else {
                // Fallback: cast vote locally without wallet
                var playerId = reputation.address || 'player_' + Math.random().toString(36).substr(2, 9);
                governance.castVote(proposal.id, playerId, voteChoice, reputation.getVotingPower());

                // Show confirmation
                var confirmText = voteChoice === 'abstain' ?
                    "✓ You abstained" :
                    ("✓ You voted " + voteChoice.toUpperCase());
                o.voted_status.setText(confirmText);
                o.voted_status.dom.style.color = "#4caf50";

                // Move to next slide after delay
                setTimeout(function () {
                    publish("slideshow/next");
                }, 1200);
            }
        };

        self.add({
            id: "button_yes", type: "Button",
            x: 50, y: 310, size: "short",
            text_id: "button_vote_yes",
            onclick: handleVote('yes')
        });

        self.add({
            id: "button_no", type: "Button",
            x: 350, y: 310, size: "short",
            text_id: "button_vote_no",
            onclick: handleVote('no')
        });

        self.add({
            id: "button_abstain", type: "Button",
            x: 650, y: 310, size: "short",
            text_id: "button_abstain",
            onclick: handleVote('abstain')
        });

        // Confirmation/status message (hidden initially)
        self.add({
            id: "voted_status", type: "TextBox",
            x: 50, y: 370, width: 860,
            text: "",
            size: 14, color: "#4caf50"
        });
        _hide(o.voted_status);

    },
    onend: function (self) {
        self.clear();
    }
});

// Summary of votes cast
SLIDES.push({
    id: "governance_summary",
    onstart: function (self) {

        var o = self.objects;
        var governance = getGameGovernance();
        var reputation = getGameReputation();

        // Tally votes for all proposals first
        var proposals = governance.getActiveProposals();
        proposals.forEach(p => {
            if (p.is_voting_open) {
                governance.tallyVotes(p.id);
            }
        });

        // Show vote results
        var summaryText = "<b>Your Governance Vote is Complete!</b><br><br>";
        summaryText += "Your reputation gave you <b>" + reputation.getVotingPower() + " votes</b> in this round.<br><br>";

        // Show which proposals passed (after tallying)
        var passed = proposals.filter(p => p.has_passed && !p.is_voting_open);
        var failed = proposals.filter(p => !p.has_passed && p.is_voting_open === false);

        if (passed.length > 0) {
            summaryText += "<span style='color:#4caf50;'><b>✓ Proposals Passed:</b></span><br>";
            passed.forEach(p => {
                summaryText += "  • " + p.title + "<br>";
            });
            summaryText += "<br>";
        }

        summaryText += "<i>Your vote will be recorded on Bitcoin.</i>";

        self.add({
            id: "text", type: "TextBox",
            x: 50, y: 80, width: 860,
            text: summaryText,
            size: 13, color: "#333"
        });

        // Execute proposals (update payoff matrix for next game)
        if (window.GovernanceIntegration && window.GovernanceIntegration.executePassedProposals) {
            window.GovernanceIntegration.executePassedProposals();
        }

        // Submit votes to Charms
        if (window.publish) {
            publish("governance/summary", [{
                votes: proposals.length,
                passed: passed.length
            }]);
        }

        // Show transaction status (will be updated by governance/submitted event)
        var txidText = "<span style='color:#888; font-size:12px;'>Submitting to Bitcoin...</span>";

        self.add({
            id: "txid_status", type: "TextBox",
            x: 50, y: 330, width: 860,
            text: txidText,
            size: 12, color: "#666"
        });

        // Listen for Charms submission event (from OnChainUI.submitGovernanceVote)
        var self_ref = self;
        if (window.subscribe) {
            listen(self, "governance/submitted", function (data) {
                if (data && data[0] && data[0].spellTxid) {
                    var statusText = "<span style='color:#4089DD; font-weight: bold;'>✓ Bitcoin Spell Txid: " + data[0].spellTxid.substr(0, 16) + "...</span>";
                    if (data[0].mode && data[0].mode.includes("real")) {
                        statusText += "<br><span style='color:#16c784; font-size:11px;'>Signed with Unisat wallet ✓</span>";
                    }
                    o.txid_status.setText(statusText);
                }
            });
        }

        // Button to continue
        self.add({
            id: "button", type: "Button",
            x: 605, y: 450, size: "long",
            text_id: "governance_summary_btn",
            message: "slideshow/next"
        });

    },
    onend: function (self) {
        self.clear();
    }
});

// Voting confirmation: Show the loop closed (reputation→votes→rules changed)
SLIDES.push({
    id: "governance_confirmation",
    onstart: function (self) {

        var o = self.objects;
        const reputation = getGameReputation();
        const governance = getGameGovernance();
        const tier = reputation.getReputationTier();

        // Splash
        self.add({ id: "splash", type: "Splash" });

        // Build confirmation text showing the full loop
        var confirmText = `
			<b>THE LOOP IS CLOSED.</b><br><br>
			You played the game. Your <b>${reputation.cooperativeMoves} cooperative moves</b> earned you a <span style="color: ${tier.label === 'Trusted' ? '#4089DD' : (tier.label === 'Neutral' ? '#efc701' : '#FF5E5E')}">${tier.label}</span> reputation.<br><br>
			That reputation gave you <b>${reputation.getVotingPower()} governance votes.</b><br><br>
			Those votes <b>changed the rules</b> that future players will face.<br><br>
			<i>Your behavior shaped Bitcoin's future.</i>
		`;

        self.add({
            id: "text", type: "TextBox",
            x: 130, y: 60, width: 700, height: 350, align: "center",
            text: confirmText,
            size: 14
        });

        self.add({
            id: "button", type: "Button", x: 304, y: 466, size: "long",
            text_id: "button_how_it_works",
            message: "slideshow/next"
        });

        _hide(o.text); _fadeIn(o.text, 200);
        _hide(o.button); _fadeIn(o.button, 700);

    },
    onend: function (self) {
        self.clear();
    }
});

// Charms Explanation Slide 1: What you just experienced (moved from early position)
SLIDES.push({
    id: "charms_intro",
    onstart: function (self) {

        var o = self.objects;

        // Splash in background
        self.add({ id: "splash", type: "Splash" });

        // Charms explanation text
        self.add({
            id: "charms_text", type: "TextBox",
            x: 130, y: 60, width: 700, height: 350, align: "center",
            text_id: "charms_intro"
        });

        // Button
        self.add({
            id: "charms_button", type: "Button", x: 304, y: 466, size: "long",
            text_id: "charms_button",
            message: "slideshow/scratch"
        });

        _hide(o.charms_text); _fadeIn(o.charms_text, 200);
        _hide(o.charms_button); _fadeIn(o.charms_button, 700);

    },
    onend: function (self) {
        self.clear();
    }

});

// Charms Explanation Slide 2: The broader possibilities
SLIDES.push({
    id: "charms_what",
    onstart: function (self) {

        var o = self.objects;

        // Splash in background
        self.add({ id: "splash", type: "Splash", blush: true });

        // Explanation of mechanics
        self.add({
            id: "what_text", type: "TextBox",
            x: 130, y: 60, width: 700, height: 350, align: "center",
            text_id: "charms_what"
        });

        // Button to continue to credits
        self.add({
            id: "what_button", type: "Button", x: 304, y: 466, size: "long",
            text_id: "charms_what_btn",
            message: "slideshow/scratch"
        });

        _hide(o.what_text); _fadeIn(o.what_text, 200);
        _hide(o.what_button); _fadeIn(o.what_button, 700);

    },
    onend: function (self) {
        self.clear();
    }

});
