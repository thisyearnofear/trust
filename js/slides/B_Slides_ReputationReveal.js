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
    onstart: function (self) {

        var o = self.objects;
        const reputation = getGameReputation();
        const tier = reputation.getReputationTier();

        // Splash
        self.add({
            id: "splash",
            type: "Splash",
            blush: (tier.label === 'WellAligned')
        });

        // Get dynamic text
        var revealText = Words.get("reputation_reveal");

        // Handle edge case: no games played
        if (reputation.totalMoves === 0) {
            revealText = Words.get("reputation_reveal_no_games");
        } else {
            // Substitute player data
            revealText = revealText.replace("[COOPERATION_COUNT]", reputation.cooperativeMoves);
            revealText = revealText.replace("[DEFECTION_COUNT]", reputation.totalMoves - reputation.cooperativeMoves);
            revealText = revealText.replace("[COOPERATION_RATE]", Math.round(reputation.calculateScore()));
            revealText = revealText.replace("[TIER_CLASS]", tier.cssClass);
            revealText = revealText.replace(/\[TIER_LABEL\]/g, tier.label); // Replace all instances
            revealText = revealText.replace("[TIER_DESCRIPTION]", tier.description);
            revealText = revealText.replace("[VOTING_POWER]", reputation.getVotingPower());
        }

        self.add({
            id: "reveal_text", type: "TextBox",
            x: 100, y: 120, width: 760, height: 300,
            text: revealText,
            size: 14,
            align: "center"
        });

        // Continue button
        self.add({
            id: "button", type: "Button", x: 615, y: 450,
            text_id: "reputation_reveal_btn",
            message: "slideshow/next"
        });

    },
    onend: function (self) {
        self.clear();
    }
});

// What your tier means in Bitcoin
SLIDES.push({
    id: "reputation_meaning",
    onstart: function (self) {

        var o = self.objects;
        const reputation = getGameReputation();
        const tier = reputation.getReputationTier();

        // Splash
        self.add({ id: "splash", type: "Splash" });

        // Get tier-specific explanation
        var meaningText = Words.get("reputation_what_it_means");
        meaningText = meaningText.replace("[TIER_LABEL]", tier.label);

        // Add tier-specific content
        if (tier.label === 'WellAligned') {
            meaningText += "<br><br><b>YOU are a Well-Aligned validator.</b> Your governance votes shape Bitcoin's game design.";
        } else if (tier.label === 'Neutral') {
            meaningText += "<br><br><b>YOU are a Neutral participant.</b> Your votes influence Bitcoin's consensus rules.";
        } else {
            meaningText += "<br><br><b>YOU are a Learning validator.</b> Your participation in game design shapes Bitcoin's future.";
        }

        self.add({
            id: "meaning_text", type: "TextBox",
            x: 100, y: 120, width: 760, height: 300,
            text: meaningText,
            size: 13,
            align: "center"
        });

        self.add({
            id: "button", type: "Button", x: 615, y: 450,
            text_id: "button_understand_vote",
            message: "slideshow/next"
        });

    },
    onend: function (self) {
        self.clear();
    }
});

