/**
 * GOVERNANCE SLIDE - Integrated into game flow
 * 
 * Appears AFTER tournament results, using player's reputation to vote on
 * changes that affect the NEXT game run.
 * 
 * This creates the feedback loop:
 * Play game → Earn reputation → Vote on rules → Next game uses new rules
 */

// Governance intro: "Your votes shape Bitcoin"
SLIDES.push({
    id: "governance_intro",
    onstart: function(self){
        
        var o = self.objects;
        
        // Use Splash character
        self.add({ id:"splash", type:"Splash", x:0, y:50 });
        
        // Show player's reputation tier prominently
        const reputation = getGameReputation();
        const tier = reputation.getReputationTier();
        
        self.add({
            id:"tier_display", type:"TextBox",
            x:350, y:30, width:450,
            align:"center",
            text: `Your Reputation: <span class="${tier.cssClass}">${tier.label}</span>`,
            size:20, color:"#333"
        });
        
        // Intro text explaining governance
        self.add({
            id:"text", type:"TextBox",
            x:350, y:100, width:450, height:300,
            text_id:"governance_intro_text"
        });
        
        // Continue button
        self.add({
            id:"button", type:"Button",
            x:605, y:485, size:"long",
            text_id:"governance_intro_btn",
            message: "slideshow/next"
        });
        
    },
    onend: function(self){
        self.remove("splash");
        self.remove("tier_display");
        self.remove("text");
        self.remove("button");
    }
});

// Vote on first proposal
SLIDES.push({
    id: "governance_voting",
    onstart: function(self){
        
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
        
        // Title
        self.add({
            id:"header", type:"TextBox",
            x:50, y:20, width:860,
            text: "<b>Community Governance: Vote on Bitcoin Rules</b>",
            size:18, color:"#333"
        });
        
        // Proposal description
        var proposalText = `<b>Proposal #${proposal.id}: ${proposal.title}</b><br><br>`;
        proposalText += proposal.description + "<br><br>";
        proposalText += `<span style="color:#666; font-size:14px;">Impact: ${proposal.impact}</span>`;
        
        self.add({
            id:"proposal", type:"TextBox",
            x:50, y:80, width:860,
            text: proposalText,
            size:14, color:"#333"
        });
        
        // Voting power display
        self.add({
            id:"power", type:"TextBox",
            x:50, y:240, width:860,
            text: `Your voting power: <b>${reputation.getVotingPower()} votes</b> (${tier.label})`,
            size:13, color:"#666"
        });
        
        // Vote buttons
        var handleVote = function(voteChoice) {
            return function() {
                // Cast vote
                var playerId = reputation.address || 'player_' + Math.random().toString(36).substr(2, 9);
                governance.castVote(proposal.id, playerId, voteChoice, reputation.getVotingPower());
                
                // Disable buttons
                o.button_yes.dom.style.opacity = 0.4;
                o.button_no.dom.style.opacity = 0.4;
                o.button_abstain.dom.style.opacity = 0.4;
                o.button_yes.dom.style.pointerEvents = "none";
                o.button_no.dom.style.pointerEvents = "none";
                o.button_abstain.dom.style.pointerEvents = "none";
                
                // Show confirmation
                var confirmText = voteChoice === 'abstain' ? 
                    "✓ You abstained" : 
                    ("✓ You voted " + voteChoice.toUpperCase());
                o.voted_status.setText(confirmText);
                _show(o.voted_status);
                _fadeIn(o.voted_status, 100);
                
                // Move to next slide after delay
                setTimeout(function() {
                    publish("slideshow/next");
                }, 1200);
            };
        };
        
        self.add({
            id:"button_yes", type:"Button",
            x:50, y:300, size:"short",
            text: "Vote YES",
            onclick: handleVote('yes')
        });
        
        self.add({
            id:"button_no", type:"Button",
            x:350, y:300, size:"short",
            text: "Vote NO",
            onclick: handleVote('no')
        });
        
        self.add({
            id:"button_abstain", type:"Button",
            x:650, y:300, size:"short",
            text: "Abstain",
            onclick: handleVote('abstain')
        });
        
        // Confirmation message (hidden initially)
        self.add({
            id:"voted_status", type:"TextBox",
            x:50, y:360, width:860,
            text: "",
            size:16, color:"#4caf50"
        });
        _hide(o.voted_status);
        
    },
    onend: function(self){
        self.clear();
    }
});

// Summary of votes cast
SLIDES.push({
    id: "governance_summary",
    onstart: function(self){
        
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
            id:"text", type:"TextBox",
            x:50, y:80, width:860,
            text: summaryText,
            size:13, color:"#333"
        });
        
        // Execute proposals (update payoff matrix for next game)
        if (window.GovernanceIntegration && window.GovernanceIntegration.executePassedProposals) {
            window.GovernanceIntegration.executePassedProposals();
        }
        
        // Submit votes to Charms (mock)
        if (window.publish) {
            publish("governance/summary", [{
                votes: proposals.length,
                passed: passed.length
            }]);
        }
        
        // Show pending transaction (will be replaced by actual txid)
        var txidText = "<span style='color:#888; font-size:12px;'>Submitting to Bitcoin...</span>";
        
        self.add({
            id:"txid_status", type:"TextBox",
            x:50, y:330, width:860,
            text: txidText,
            size:12, color:"#666"
        });
        
        // Listen for Charms submission event
        var self_ref = self;
        if (window.subscribe) {
            listen(self, "governance/submitted", function(data) {
                if (data && data[0] && data[0].txid) {
                    var statusText = "<span style='color:#4089DD; font-weight: bold;'>✓ Bitcoin Txid: " + data[0].txid.substr(0, 16) + "...</span>";
                    o.txid_status.setText(statusText);
                }
            });
        }
        
        // Button to continue
        self.add({
            id:"button", type:"Button",
            x:605, y:450, size:"long",
            text_id:"governance_summary_btn",
            message: "slideshow/next"
        });
        
    },
    onend: function(self){
        self.clear();
    }
});
