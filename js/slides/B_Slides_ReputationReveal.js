/**
 * REPUTATION REVEAL SLIDE
 * 
 * Appears after the game completes and tier celebration.
 * Shows the player what their reputation means in Bitcoin context.
 * Bridges game mechanics to governance voting power.
 */

// Reputation breakdown: what did you do?
SLIDES.push({
    id: "reputation_reveal",
    onstart: function(self){
        
        var o = self.objects;
        const reputation = getGameReputation();
        const tier = reputation.getReputationTier();
        
        // Splash
        self.add({ 
            id:"splash", 
            type:"Splash", 
            blush: (tier.label === 'Trusted')
        });
        
        // Get dynamic text
        var revealText = Words.get("reputation_reveal");
        
        // Substitute player data
        revealText = revealText.replace("[COOPERATION_COUNT]", reputation.cooperativeMoves);
        revealText = revealText.replace("[DEFECTION_COUNT]", reputation.totalMoves - reputation.cooperativeMoves);
        revealText = revealText.replace("[COOPERATION_RATE]", Math.round(reputation.calculateScore()));
        revealText = revealText.replace("[TIER_CLASS]", tier.cssClass);
        revealText = revealText.replace("[TIER_LABEL]", tier.label);
        revealText = revealText.replace("[TIER_DESCRIPTION]", tier.description);
        revealText = revealText.replace("[VOTING_POWER]", reputation.getVotingPower());
        
        self.add({
            id:"reveal_text", type:"TextBox",
            x:100, y:40, width:760, height:300,
            text: revealText,
            size:14
        });
        
        // Continue button
        self.add({
            id:"button", type:"Button", x:615, y:450, 
            text_id:"reputation_reveal_btn",
            message:"slideshow/next"
        });
        
    },
    onend: function(self){
        self.clear();
    }
});

// What your tier means in Bitcoin
SLIDES.push({
    id: "reputation_meaning",
    onstart: function(self){
        
        var o = self.objects;
        const reputation = getGameReputation();
        const tier = reputation.getReputationTier();
        
        // Splash
        self.add({ id:"splash", type:"Splash" });
        
        // Get tier-specific explanation
        var meaningText = Words.get("reputation_what_it_means");
        meaningText = meaningText.replace("[TIER_LABEL]", tier.label);
        
        // Add tier-specific content
        if (tier.label === 'Trusted') {
            meaningText += "<br><br><b>YOU are a Trusted node.</b> Your governance voice shapes Bitcoin's future.";
        } else if (tier.label === 'Neutral') {
            meaningText += "<br><br><b>YOU are a Neutral node.</b> Your participation matters in consensus.";
        } else {
            meaningText += "<br><br><b>YOU are a Learning node.</b> This is your chance to shape Bitcoin's next chapter.";
        }
        
        self.add({
            id:"meaning_text", type:"TextBox",
            x:100, y:40, width:760, height:300,
            text: meaningText,
            size:13
        });
        
        // Continue button
        self.add({
            id:"button", type:"Button", x:615, y:450, 
            text: "I understand. Let me vote.",
            message:"slideshow/next"
        });
        
    },
    onend: function(self){
        self.clear();
    }
});
